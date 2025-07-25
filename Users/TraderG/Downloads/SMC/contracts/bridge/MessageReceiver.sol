// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IMessageBridge.sol";
import "./TokenMint.sol";

contract MessageReceiver is AccessControl {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    IMessageBridge public metisBridge;
    TokenMint public tokenMint;
    address public messageSender;
    uint256 public sourceChainId;
    mapping(bytes32 => bool) public processedMessages;

    event MessageReceived(address indexed user, uint256 amount, uint256 nonce, uint256 srcChainId);

    constructor(address _metisBridge, address _tokenMint, address _messageSender, uint256 _sourceChainId) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, msg.sender);
        metisBridge = IMessageBridge(_metisBridge);
        tokenMint = TokenMint(_tokenMint);
        messageSender = _messageSender;
        sourceChainId = _sourceChainId;
    }

    function receiveMessage(bytes calldata _message, address _sender, uint256 _srcChainId) external onlyRole(BRIDGE_ROLE) {
        require(_srcChainId == sourceChainId, "Invalid source chain");
        require(_sender == messageSender, "Invalid sender");
        
        // Decode the message
        (address user, uint256 amount, uint256 nonce) = abi.decode(_message, (address, uint256, uint256));
        
        // Create a unique message hash to prevent replay attacks
        bytes32 messageHash = keccak256(abi.encodePacked(user, amount, nonce, _srcChainId));
        require(!processedMessages[messageHash], "Message already processed");
        
        // Mark message as processed
        processedMessages[messageHash] = true;
        
        // Mint tokens to the user
        tokenMint.mintTokens(user, amount, nonce);
        
        emit MessageReceived(user, amount, nonce, _srcChainId);
    }

    function verifyMessage(bytes calldata _message, address _sender, uint256 _srcChainId) external view returns (bool) {
        return metisBridge.verifyMessage(_message, _sender, _srcChainId);
    }
} 