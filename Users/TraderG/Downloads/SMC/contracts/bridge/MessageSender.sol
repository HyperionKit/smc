// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IMessageBridge.sol";
import "./Bridge.sol";

contract MessageSender is AccessControl, ReentrancyGuard {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    IMessageBridge public metisBridge;
    Bridge public bridge;
    mapping(uint256 => address) public destinationContracts;
    mapping(bytes32 => bool) public processedMessages;
    uint256 public nonce;

    event CrossChainMessageSent(
        bytes32 indexed messageId,
        address indexed sender,
        address indexed recipient,
        uint256 dstChainId,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    );

    event CrossChainMessageReceived(
        bytes32 indexed messageId,
        address indexed recipient,
        uint256 amount,
        uint256 srcChainId,
        uint256 timestamp
    );

    constructor(address _metisBridge, address _bridge) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        metisBridge = IMessageBridge(_metisBridge);
        bridge = Bridge(_bridge);
    }

    modifier onlyBridge() {
        require(hasRole(BRIDGE_ROLE, msg.sender), "MessageSender: caller is not bridge");
        _;
    }

    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "MessageSender: caller is not operator");
        _;
    }

    function setDestination(uint256 _dstChainId, address _receiver) external onlyOperator {
        destinationContracts[_dstChainId] = _receiver;
    }

    function sendCrossChainMessage(
        address recipient,
        uint256 amount,
        uint256 dstChainId,
        bytes calldata additionalData
    ) external payable onlyBridge nonReentrant {
        address receiver = destinationContracts[dstChainId];
        require(receiver != address(0), "MessageSender: destination not set");
        require(recipient != address(0), "MessageSender: invalid recipient");
        require(amount > 0, "MessageSender: invalid amount");

        bytes32 messageId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            amount,
            dstChainId,
            nonce,
            block.chainid,
            block.timestamp
        ));

        // Encode the message with all necessary data
        bytes memory message = abi.encode(
            messageId,
            msg.sender,
            recipient,
            amount,
            dstChainId,
            nonce,
            block.chainid,
            additionalData
        );

        // Send message via Metis bridge
        metisBridge.sendMessage{value: msg.value}(receiver, dstChainId, message);

        emit CrossChainMessageSent(
            messageId,
            msg.sender,
            recipient,
            dstChainId,
            amount,
            nonce,
            block.timestamp
        );

        nonce++;
    }

    function receiveCrossChainMessage(
        bytes calldata message,
        address sender,
        uint256 srcChainId
    ) external onlyBridge nonReentrant {
        require(sender == destinationContracts[srcChainId], "MessageSender: invalid sender");
        
        // Decode the message
        (
            bytes32 messageId,
            address originalSender,
            address recipient,
            uint256 amount,
            uint256 originalDstChainId,
            uint256 originalNonce,
            uint256 originalChainId,
            bytes memory additionalData
        ) = abi.decode(message, (bytes32, address, address, uint256, uint256, uint256, uint256, bytes));

        require(!processedMessages[messageId], "MessageSender: message already processed");
        require(originalDstChainId == block.chainid, "MessageSender: wrong destination chain");
        
        // Mark message as processed
        processedMessages[messageId] = true;

        // Process the cross-chain transfer
        _processCrossChainTransfer(recipient, amount, additionalData);

        emit CrossChainMessageReceived(
            messageId,
            recipient,
            amount,
            srcChainId,
            block.timestamp
        );
    }

    function _processCrossChainTransfer(
        address recipient,
        uint256 amount,
        bytes memory additionalData
    ) internal {
        // This function can be extended to handle different types of cross-chain operations
        // For now, it just emits an event - the actual token minting is handled by the Bridge contract
    }

    // View functions
    function isMessageProcessed(bytes32 messageId) external view returns (bool) {
        return processedMessages[messageId];
    }

    function getDestinationContract(uint256 chainId) external view returns (address) {
        return destinationContracts[chainId];
    }
}