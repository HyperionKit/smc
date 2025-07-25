// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Bridge is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct BridgeRequest {
        address sender;
        address recipient;
        uint256 amount;
        uint256 targetChainId;
        uint256 nonce;
        bool processed;
        uint256 timestamp;
    }

    struct TokenConfig {
        bool isSupported;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 dailyLimit;
        uint256 dailyUsed;
        uint256 lastResetTime;
    }

    // State variables
    mapping(bytes32 => BridgeRequest) public bridgeRequests;
    mapping(address => TokenConfig) public supportedTokens;
    mapping(uint256 => uint256) public chainNonces;
    mapping(bytes32 => bool) public processedTxs;
    
    uint256 public constant MINIMUM_DELAY = 1 hours;
    uint256 public constant MAXIMUM_DELAY = 24 hours;
    uint256 public bridgeDelay = 2 hours;
    
    // Events
    event BridgeDeposit(
        bytes32 indexed requestId,
        address indexed sender,
        address indexed recipient,
        address token,
        uint256 amount,
        uint256 targetChainId,
        uint256 nonce,
        uint256 timestamp
    );
    
    event BridgeWithdraw(
        bytes32 indexed requestId,
        address indexed recipient,
        address token,
        uint256 amount,
        bytes32 depositTxHash,
        uint256 timestamp
    );
    
    event TokenConfigUpdated(
        address indexed token,
        bool isSupported,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 dailyLimit
    );
    
    event BridgeDelayUpdated(uint256 newDelay);
    event EmergencyWithdraw(address indexed token, address indexed recipient, uint256 amount);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    // Modifiers
    modifier onlyRelayer() {
        require(hasRole(RELAYER_ROLE, msg.sender), "Bridge: caller is not relayer");
        _;
    }

    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "Bridge: caller is not operator");
        _;
    }

    // Core bridge functions
    function deposit(
        address token,
        address recipient,
        uint256 amount,
        uint256 targetChainId
    ) external nonReentrant whenNotPaused {
        require(supportedTokens[token].isSupported, "Bridge: token not supported");
        require(amount >= supportedTokens[token].minAmount, "Bridge: amount too low");
        require(amount <= supportedTokens[token].maxAmount, "Bridge: amount too high");
        require(recipient != address(0), "Bridge: invalid recipient");
        require(targetChainId != block.chainid, "Bridge: same chain");
        
        // Check daily limits
        _checkDailyLimit(token, amount);
        
        // Transfer tokens from user to bridge
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Create bridge request
        uint256 nonce = chainNonces[targetChainId]++;
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            amount,
            targetChainId,
            nonce,
            block.chainid
        ));
        
        bridgeRequests[requestId] = BridgeRequest({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            targetChainId: targetChainId,
            nonce: nonce,
            processed: false,
            timestamp: block.timestamp
        });
        
        // Update daily usage
        supportedTokens[token].dailyUsed += amount;
        
        emit BridgeDeposit(
            requestId,
            msg.sender,
            recipient,
            token,
            amount,
            targetChainId,
            nonce,
            block.timestamp
        );
    }

    function withdraw(
        address token,
        address recipient,
        uint256 amount,
        bytes32 depositTxHash,
        bytes calldata proof
    ) external onlyRelayer nonReentrant whenNotPaused {
        require(!processedTxs[depositTxHash], "Bridge: already processed");
        require(recipient != address(0), "Bridge: invalid recipient");
        require(amount > 0, "Bridge: invalid amount");
        
        // Verify proof (simplified for MVP - can be enhanced with merkle proofs)
        require(_verifyWithdrawalProof(depositTxHash, proof), "Bridge: invalid proof");
        
        // Mark as processed
        processedTxs[depositTxHash] = true;
        
        // Transfer tokens to recipient
        IERC20(token).safeTransfer(recipient, amount);
        
        emit BridgeWithdraw(
            depositTxHash,
            recipient,
            token,
            amount,
            depositTxHash,
            block.timestamp
        );
    }

    // Admin functions
    function addSupportedToken(
        address token,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 dailyLimit
    ) external onlyOperator {
        supportedTokens[token] = TokenConfig({
            isSupported: true,
            minAmount: minAmount,
            maxAmount: maxAmount,
            dailyLimit: dailyLimit,
            dailyUsed: 0,
            lastResetTime: block.timestamp
        });
        
        emit TokenConfigUpdated(token, true, minAmount, maxAmount, dailyLimit);
    }

    function removeSupportedToken(address token) external onlyOperator {
        supportedTokens[token].isSupported = false;
        emit TokenConfigUpdated(token, false, 0, 0, 0);
    }

    function updateTokenConfig(
        address token,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 dailyLimit
    ) external onlyOperator {
        require(supportedTokens[token].isSupported, "Bridge: token not supported");
        supportedTokens[token].minAmount = minAmount;
        supportedTokens[token].maxAmount = maxAmount;
        supportedTokens[token].dailyLimit = dailyLimit;
        
        emit TokenConfigUpdated(token, true, minAmount, maxAmount, dailyLimit);
    }

    function setBridgeDelay(uint256 newDelay) external onlyOperator {
        require(newDelay >= MINIMUM_DELAY && newDelay <= MAXIMUM_DELAY, "Bridge: invalid delay");
        bridgeDelay = newDelay;
        emit BridgeDelayUpdated(newDelay);
    }

    function pause() external onlyOperator {
        _pause();
    }

    function unpause() external onlyOperator {
        _unpause();
    }

    function emergencyWithdraw(address token, address recipient) external onlyOperator {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "Bridge: no balance to withdraw");
        IERC20(token).safeTransfer(recipient, balance);
        emit EmergencyWithdraw(token, recipient, balance);
    }

    // View functions
    function getBridgeRequest(bytes32 requestId) external view returns (BridgeRequest memory) {
        return bridgeRequests[requestId];
    }

    function getTokenConfig(address token) external view returns (TokenConfig memory) {
        return supportedTokens[token];
    }

    function isProcessed(bytes32 txHash) external view returns (bool) {
        return processedTxs[txHash];
    }

    // Internal functions
    function _checkDailyLimit(address token, uint256 amount) internal {
        TokenConfig storage config = supportedTokens[token];
        
        // Reset daily usage if 24 hours have passed
        if (block.timestamp >= config.lastResetTime + 1 days) {
            config.dailyUsed = 0;
            config.lastResetTime = block.timestamp;
        }
        
        require(config.dailyUsed + amount <= config.dailyLimit, "Bridge: daily limit exceeded");
    }

    function _verifyWithdrawalProof(bytes32 depositTxHash, bytes calldata proof) internal pure returns (bool) {
        // Simplified proof verification for MVP
        // In production, this should verify merkle proofs or signatures
        return proof.length > 0;
    }

    // Override required functions
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 