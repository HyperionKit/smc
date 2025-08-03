// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Faucet is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct TokenInfo {
        address tokenAddress;
        string symbol;
        uint8 decimals;
        uint256 dripAmount;
        uint256 maxBalance;
        bool isActive;
    }

    struct UserInfo {
        uint256 lastDripTime;
        uint256 totalDripped;
        mapping(address => uint256) tokenDripped;
    }

    event TokenDripped(
        address indexed user,
        address indexed token,
        uint256 amount,
        string symbol
    );
    event TokenAdded(address indexed token, string symbol, uint256 dripAmount, uint256 maxBalance);
    event TokenRemoved(address indexed token);
    event TokenUpdated(address indexed token, uint256 newDripAmount, uint256 newMaxBalance);
    event DripIntervalUpdated(uint256 newInterval);
    event MaxDripPerUserUpdated(uint256 newMaxDrip);

    mapping(address => TokenInfo) public supportedTokens;
    mapping(address => UserInfo) public userInfo;
    mapping(address => bool) public isSupportedToken;

    uint256 public dripInterval = 24 hours; // 24 hours between drips
    uint256 public maxDripPerUser = 1000; // Maximum total drips per user
    uint256 public totalUsers = 0;
    uint256 public totalDrips = 0;

    address[] public tokenAddresses;

    modifier validToken(address token) {
        require(isSupportedToken[token], "Faucet: token not supported");
        require(supportedTokens[token].isActive, "Faucet: token not active");
        _;
    }

    modifier canDrip(address token) {
        require(isSupportedToken[token], "Faucet: token not supported");
        require(supportedTokens[token].isActive, "Faucet: token not active");
        
        UserInfo storage user = userInfo[msg.sender];
        require(
            block.timestamp >= user.lastDripTime + dripInterval,
            "Faucet: drip interval not met"
        );
        require(
            user.totalDripped < maxDripPerUser,
            "Faucet: max drips per user reached"
        );
        _;
    }

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @dev Drip a specific token to the caller
     * @param token Address of the token to drip
     */
    function drip(address token) external nonReentrant whenNotPaused canDrip(token) {
        TokenInfo storage tokenInfo = supportedTokens[token];
        UserInfo storage user = userInfo[msg.sender];

        // Check if user has exceeded max balance for this token
        uint256 userBalance = IERC20(token).balanceOf(msg.sender);
        require(
            userBalance < tokenInfo.maxBalance,
            "Faucet: user balance exceeds maximum"
        );

        // Check if faucet has enough tokens
        uint256 faucetBalance = IERC20(token).balanceOf(address(this));
        require(
            faucetBalance >= tokenInfo.dripAmount,
            "Faucet: insufficient token balance"
        );

        // Update user info
        if (user.lastDripTime == 0) {
            totalUsers++;
        }
        user.lastDripTime = block.timestamp;
        user.totalDripped++;
        user.tokenDripped[token] += tokenInfo.dripAmount;

        totalDrips++;

        // Transfer tokens
        IERC20(token).safeTransfer(msg.sender, tokenInfo.dripAmount);

        emit TokenDripped(msg.sender, token, tokenInfo.dripAmount, tokenInfo.symbol);
    }

    /**
     * @dev Drip all supported tokens to the caller
     */
    function dripAll() external nonReentrant whenNotPaused {
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            address token = tokenAddresses[i];
            if (isSupportedToken[token] && supportedTokens[token].isActive) {
                try this.drip(token) {
                    // Drip successful
                } catch {
                    // Skip this token if drip fails
                    continue;
                }
            }
        }
    }

    /**
     * @dev Get user's drip information for a specific token
     * @param user User address
     * @param token Token address
     * @return lastDripTime Last drip time
     * @return totalDripped Total drips by user
     * @return tokenDripped Amount dripped for this specific token
     * @return canDrip Whether user can drip this token
     * @return timeUntilNextDrip Time until next drip is available
     */
    function getUserTokenInfo(address user, address token) 
        external 
        view 
        returns (
            uint256 lastDripTime,
            uint256 totalDripped,
            uint256 tokenDripped,
            bool canDrip,
            uint256 timeUntilNextDrip
        ) 
    {
        UserInfo storage userData = userInfo[user];
        lastDripTime = userData.lastDripTime;
        totalDripped = userData.totalDripped;
        tokenDripped = userData.tokenDripped[token];

        if (!isSupportedToken[token] || !supportedTokens[token].isActive) {
            canDrip = false;
            timeUntilNextDrip = 0;
        } else if (userData.totalDripped >= maxDripPerUser) {
            canDrip = false;
            timeUntilNextDrip = 0;
        } else if (block.timestamp < userData.lastDripTime + dripInterval) {
            canDrip = false;
            timeUntilNextDrip = userData.lastDripTime + dripInterval - block.timestamp;
        } else {
            canDrip = true;
            timeUntilNextDrip = 0;
        }
    }

    /**
     * @dev Get faucet statistics
     * @return _totalUsers Total unique users
     * @return _totalDrips Total drips performed
     * @return _dripInterval Current drip interval
     * @return _maxDripPerUser Maximum drips per user
     */
    function getFaucetStats() 
        external 
        view 
        returns (
            uint256 _totalUsers,
            uint256 _totalDrips,
            uint256 _dripInterval,
            uint256 _maxDripPerUser
        ) 
    {
        return (totalUsers, totalDrips, dripInterval, maxDripPerUser);
    }

    /**
     * @dev Get all supported tokens
     * @return tokens Array of token addresses
     */
    function getSupportedTokens() external view returns (address[] memory tokens) {
        return tokenAddresses;
    }

    /**
     * @dev Get token information
     * @param token Token address
     * @return symbol Token symbol
     * @return decimals Token decimals
     * @return dripAmount Drip amount for this token
     * @return maxBalance Maximum balance allowed for users
     * @return isActive Whether token is active
     * @return faucetBalance Current faucet balance
     */
    function getTokenInfo(address token) 
        external 
        view 
        returns (
            string memory symbol,
            uint8 decimals,
            uint256 dripAmount,
            uint256 maxBalance,
            bool isActive,
            uint256 faucetBalance
        ) 
    {
        require(isSupportedToken[token], "Faucet: token not supported");
        TokenInfo storage tokenInfo = supportedTokens[token];
        
        return (
            tokenInfo.symbol,
            tokenInfo.decimals,
            tokenInfo.dripAmount,
            tokenInfo.maxBalance,
            tokenInfo.isActive,
            IERC20(token).balanceOf(address(this))
        );
    }

    // Admin functions

    /**
     * @dev Add a new token to the faucet
     * @param token Token address
     * @param symbol Token symbol
     * @param decimals Token decimals
     * @param dripAmount Amount to drip per request
     * @param maxBalance Maximum balance allowed for users
     */
    function addToken(
        address token,
        string calldata symbol,
        uint8 decimals,
        uint256 dripAmount,
        uint256 maxBalance
    ) external onlyOwner {
        require(token != address(0), "Faucet: invalid token address");
        require(!isSupportedToken[token], "Faucet: token already supported");
        require(dripAmount > 0, "Faucet: invalid drip amount");
        require(maxBalance > 0, "Faucet: invalid max balance");

        isSupportedToken[token] = true;
        supportedTokens[token] = TokenInfo({
            tokenAddress: token,
            symbol: symbol,
            decimals: decimals,
            dripAmount: dripAmount,
            maxBalance: maxBalance,
            isActive: true
        });

        tokenAddresses.push(token);

        emit TokenAdded(token, symbol, dripAmount, maxBalance);
    }

    /**
     * @dev Remove a token from the faucet
     * @param token Token address
     */
    function removeToken(address token) external onlyOwner {
        require(isSupportedToken[token], "Faucet: token not supported");

        isSupportedToken[token] = false;
        supportedTokens[token].isActive = false;

        // Remove from tokenAddresses array
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            if (tokenAddresses[i] == token) {
                tokenAddresses[i] = tokenAddresses[tokenAddresses.length - 1];
                tokenAddresses.pop();
                break;
            }
        }

        emit TokenRemoved(token);
    }

    /**
     * @dev Update token drip amount and max balance
     * @param token Token address
     * @param newDripAmount New drip amount
     * @param newMaxBalance New maximum balance
     */
    function updateToken(
        address token,
        uint256 newDripAmount,
        uint256 newMaxBalance
    ) external onlyOwner {
        require(isSupportedToken[token], "Faucet: token not supported");
        require(newDripAmount > 0, "Faucet: invalid drip amount");
        require(newMaxBalance > 0, "Faucet: invalid max balance");

        TokenInfo storage tokenInfo = supportedTokens[token];
        tokenInfo.dripAmount = newDripAmount;
        tokenInfo.maxBalance = newMaxBalance;

        emit TokenUpdated(token, newDripAmount, newMaxBalance);
    }

    /**
     * @dev Set token active/inactive status
     * @param token Token address
     * @param active Whether token should be active
     */
    function setTokenActive(address token, bool active) external onlyOwner {
        require(isSupportedToken[token], "Faucet: token not supported");
        supportedTokens[token].isActive = active;
    }

    /**
     * @dev Update drip interval
     * @param newInterval New drip interval in seconds
     */
    function setDripInterval(uint256 newInterval) external onlyOwner {
        require(newInterval > 0, "Faucet: invalid interval");
        dripInterval = newInterval;
        emit DripIntervalUpdated(newInterval);
    }

    /**
     * @dev Update maximum drips per user
     * @param newMaxDrip New maximum drips per user
     */
    function setMaxDripPerUser(uint256 newMaxDrip) external onlyOwner {
        require(newMaxDrip > 0, "Faucet: invalid max drip");
        maxDripPerUser = newMaxDrip;
        emit MaxDripPerUserUpdated(newMaxDrip);
    }

    /**
     * @dev Fund the faucet with tokens
     * @param token Token address
     * @param amount Amount to fund
     */
    function fundFaucet(address token, uint256 amount) external onlyOwner {
        require(isSupportedToken[token], "Faucet: token not supported");
        require(amount > 0, "Faucet: invalid amount");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Withdraw tokens from faucet (emergency)
     * @param token Token address
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address to
    ) external onlyOwner {
        require(to != address(0), "Faucet: invalid recipient");
        require(amount > 0, "Faucet: invalid amount");

        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @dev Withdraw ETH from faucet (emergency)
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function emergencyWithdrawETH(uint256 amount, address to) external onlyOwner {
        require(to != address(0), "Faucet: invalid recipient");
        require(amount > 0, "Faucet: invalid amount");
        require(amount <= address(this).balance, "Faucet: insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Faucet: ETH transfer failed");
    }

    // Receive function to accept ETH
    receive() external payable {
        // Allow receiving ETH
    }
} 