// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./Bridge.sol";
import "./WrappedTokenFactory.sol";

contract Relayer is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    Bridge public bridge;
    WrappedTokenFactory public tokenFactory;
    
    struct RelayRequest {
        bytes32 depositTxHash;
        address sender;
        address recipient;
        address token;
        uint256 amount;
        uint256 sourceChainId;
        uint256 targetChainId;
        uint256 nonce;
        bool processed;
        uint256 timestamp;
        bytes proof;
    }

    mapping(bytes32 => RelayRequest) public relayRequests;
    mapping(bytes32 => bool) public processedRelays;
    mapping(address => bool) public validators;
    mapping(uint256 => uint256) public chainNonces;

    uint256 public constant MIN_VALIDATIONS = 1; // For MVP, can be increased for production
    uint256 public constant RELAY_TIMEOUT = 1 hours;
    
    // Events
    event RelayRequestCreated(
        bytes32 indexed relayId,
        bytes32 indexed depositTxHash,
        address indexed sender,
        address recipient,
        address token,
        uint256 amount,
        uint256 sourceChainId,
        uint256 targetChainId,
        uint256 timestamp
    );

    event RelayProcessed(
        bytes32 indexed relayId,
        bytes32 indexed depositTxHash,
        address indexed recipient,
        address token,
        uint256 amount,
        uint256 timestamp
    );

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event ProofSubmitted(bytes32 indexed relayId, address indexed validator, bool isValid);

    constructor(address _bridge, address _tokenFactory) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
        
        bridge = Bridge(_bridge);
        tokenFactory = WrappedTokenFactory(_tokenFactory);
        validators[msg.sender] = true;
    }

    // Modifiers
    modifier onlyRelayer() {
        require(hasRole(RELAYER_ROLE, msg.sender), "Relayer: caller is not relayer");
        _;
    }

    modifier onlyValidator() {
        require(hasRole(VALIDATOR_ROLE, msg.sender), "Relayer: caller is not validator");
        _;
    }

    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "Relayer: caller is not operator");
        _;
    }

    // Core relay functions
    function createRelayRequest(
        bytes32 depositTxHash,
        address sender,
        address recipient,
        address token,
        uint256 amount,
        uint256 sourceChainId,
        uint256 targetChainId,
        bytes calldata proof
    ) external onlyRelayer nonReentrant whenNotPaused {
        require(!processedRelays[depositTxHash], "Relayer: already processed");
        require(recipient != address(0), "Relayer: invalid recipient");
        require(amount > 0, "Relayer: invalid amount");
        require(sourceChainId != targetChainId, "Relayer: same chain");

        bytes32 relayId = keccak256(abi.encodePacked(
            depositTxHash,
            sender,
            recipient,
            token,
            amount,
            sourceChainId,
            targetChainId,
            chainNonces[targetChainId]
        ));

        relayRequests[relayId] = RelayRequest({
            depositTxHash: depositTxHash,
            sender: sender,
            recipient: recipient,
            token: token,
            amount: amount,
            sourceChainId: sourceChainId,
            targetChainId: targetChainId,
            nonce: chainNonces[targetChainId]++,
            processed: false,
            timestamp: block.timestamp,
            proof: proof
        });

        emit RelayRequestCreated(
            relayId,
            depositTxHash,
            sender,
            recipient,
            token,
            amount,
            sourceChainId,
            targetChainId,
            block.timestamp
        );
    }

    function processRelay(bytes32 relayId) external onlyRelayer nonReentrant whenNotPaused {
        RelayRequest storage request = relayRequests[relayId];
        require(!request.processed, "Relayer: already processed");
        require(block.timestamp >= request.timestamp + RELAY_TIMEOUT, "Relayer: too early");

        // Verify the relay request
        require(_verifyRelayRequest(request), "Relayer: invalid request");

        // Mark as processed
        request.processed = true;
        processedRelays[request.depositTxHash] = true;

        // Process the cross-chain transfer
        _processCrossChainTransfer(request);

        emit RelayProcessed(
            relayId,
            request.depositTxHash,
            request.recipient,
            request.token,
            request.amount,
            block.timestamp
        );
    }

    function submitProof(bytes32 relayId, bool isValid) external onlyValidator {
        RelayRequest storage request = relayRequests[relayId];
        require(!request.processed, "Relayer: already processed");

        emit ProofSubmitted(relayId, msg.sender, isValid);
    }

    // Admin functions
    function addValidator(address validator) external onlyOperator {
        require(validator != address(0), "Relayer: invalid validator");
        require(!validators[validator], "Relayer: already validator");
        
        validators[validator] = true;
        _grantRole(VALIDATOR_ROLE, validator);
        emit ValidatorAdded(validator);
    }

    function removeValidator(address validator) external onlyOperator {
        require(validators[validator], "Relayer: not validator");
        
        validators[validator] = false;
        _revokeRole(VALIDATOR_ROLE, validator);
        emit ValidatorRemoved(validator);
    }

    function pause() external onlyOperator {
        _pause();
    }

    function unpause() external onlyOperator {
        _unpause();
    }

    // View functions
    function getRelayRequest(bytes32 relayId) external view returns (RelayRequest memory) {
        return relayRequests[relayId];
    }

    function isRelayProcessed(bytes32 depositTxHash) external view returns (bool) {
        return processedRelays[depositTxHash];
    }

    function isValidator(address validator) external view returns (bool) {
        return validators[validator];
    }

    // Internal functions
    function _verifyRelayRequest(RelayRequest storage request) internal view returns (bool) {
        // Basic validation - can be enhanced with more sophisticated verification
        return request.sender != address(0) && 
               request.recipient != address(0) && 
               request.token != address(0) && 
               request.amount > 0;
    }

    function _processCrossChainTransfer(RelayRequest storage request) internal {
        // Check if we need to create a wrapped token
        address wrappedToken = tokenFactory.getWrappedToken(request.token);
        
        if (wrappedToken == address(0)) {
            // Create wrapped token if it doesn't exist
            // This would typically be done by an operator, but for MVP we can auto-create
            // wrappedToken = tokenFactory.createWrappedToken(
            //     request.token,
            //     request.sourceChainId,
            //     "Wrapped Token",
            //     "wTOKEN",
            //     18
            // );
        }

        if (wrappedToken != address(0)) {
            // Mint wrapped tokens to recipient
            tokenFactory.mintWrappedTokens(
                wrappedToken,
                request.recipient,
                request.amount,
                request.depositTxHash
            );
        } else {
            // If no wrapped token, use the bridge's withdraw function
            bridge.withdraw(
                request.token,
                request.recipient,
                request.amount,
                request.depositTxHash,
                request.proof
            );
        }
    }

    // Override required functions
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 