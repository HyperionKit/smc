// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./WtMetis.sol";

contract TokenMint is AccessControl {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    WtMetis public wtMetis; // Wrapped tMetis token
    address public messageReceiver; // MessageReceiver contract

    event TokensMinted(address indexed user, uint256 amount, uint256 nonce);
    event TokensBurned(address indexed user, uint256 amount, uint16 dstChainId, uint256 nonce);

    constructor(address _wtMetis, address _messageReceiver) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, _messageReceiver);
        wtMetis = WtMetis(_wtMetis);
        messageReceiver = _messageReceiver;
    }

    function mintTokens(address _user, uint256 _amount, uint256 _nonce) external onlyRole(BRIDGE_ROLE) {
        wtMetis.mint(_user, _amount);
        emit TokensMinted(_user, _amount, _nonce);
    }

    function burnTokens(uint256 _amount, uint16 _dstChainId) external {
        require(_amount > 0, "Amount must be greater than 0");
        wtMetis.burn(msg.sender, _amount);
        emit TokensBurned(msg.sender, _amount, _dstChainId, uint256(keccak256(abi.encode(msg.sender, _amount, _dstChainId))));
    }
}