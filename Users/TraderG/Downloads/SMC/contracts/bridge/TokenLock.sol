// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TokenLock is AccessControl {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    IERC20 public tMetis; // tMetis token on Hyperion
    address public messageSender; // MessageSender contract
    uint256 public lockedBalance;
    mapping(address => uint256) public userBalances;

    event TokensLocked(address indexed user, uint256 amount, uint16 dstChainId, uint256 nonce);
    event TokensReleased(address indexed user, uint256 amount, uint256 nonce);

    constructor(address _tMetis, address _messageSender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, _messageSender);
        tMetis = IERC20(_tMetis);
        messageSender = _messageSender;
    }

    function lockTokens(uint256 _amount, uint16 _dstChainId) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(tMetis.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        lockedBalance += _amount;
        userBalances[msg.sender] += _amount;
        emit TokensLocked(msg.sender, _amount, _dstChainId, uint256(keccak256(abi.encode(msg.sender, _amount, _dstChainId))));
    }

    function releaseTokens(address _user, uint256 _amount, uint256 _nonce) external onlyRole(BRIDGE_ROLE) {
        require(userBalances[_user] >= _amount, "Insufficient locked balance");
        userBalances[_user] -= _amount;
        lockedBalance -= _amount;
        require(tMetis.transfer(_user, _amount), "Transfer failed");
        emit TokensReleased(_user, _amount, _nonce);
    }
}