// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMessageBridge {
    function sendMessage(address _receiver, uint256 _dstChainId, bytes calldata _message) external payable;
    function verifyMessage(bytes calldata _message, address _sender, uint256 _srcChainId) external view returns (bool);
}