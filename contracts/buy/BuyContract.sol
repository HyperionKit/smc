// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract BuyVault {
    IERC20 public usdc;
    IERC20 public usdt;
    
    uint256 public usdcPrice; // Price in wei (1 METIS = 10^18 wei)
    uint256 public usdtPrice; // Price in wei (1 METIS = 10^18 wei)
    
    address public owner;
    bool public paused;
    
    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public constant MIN_PURCHASE_AMOUNT = 0.001 ether; // 0.001 METIS minimum
    
    event TokensBought(address indexed buyer, address indexed token, uint256 metisAmount, uint256 tokenAmount);
    event PriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice);
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    event METISWithdrawn(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address indexed account);
    event Unpaused(address indexed account);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier nonReentrant() {
        require(!paused, "Reentrancy not allowed");
        _;
    }

    constructor(
        address _usdc, 
        address _usdt, 
        uint256 _usdcPrice, 
        uint256 _usdtPrice
    ) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_usdt != address(0), "Invalid USDT address");
        require(_usdcPrice > 0, "Invalid USDC price");
        require(_usdtPrice > 0, "Invalid USDT price");
        
        owner = msg.sender;
        usdc = IERC20(_usdc);
        usdt = IERC20(_usdt);
        usdcPrice = _usdcPrice;
        usdtPrice = _usdtPrice;
        paused = false;
    }

    /**
     * @dev Buy USDC with METIS
     * @param minTokenAmount Minimum amount of USDC to receive (for slippage protection)
     */
    function buyUSDC(uint256 minTokenAmount) external payable whenNotPaused nonReentrant {
        require(msg.value >= MIN_PURCHASE_AMOUNT, "Amount below minimum");
        
        // Convert result to 6 decimals (USDC decimals)
        uint256 tokenAmount = ((msg.value * PRICE_PRECISION) / usdcPrice) / (10**12);
        require(tokenAmount >= minTokenAmount, "Insufficient token amount");
        require(tokenAmount > 0, "Zero token amount");
        
        // Check contract has enough USDC
        uint256 contractBalance = usdc.balanceOf(address(this));
        require(contractBalance >= tokenAmount, "Insufficient USDC in contract");
        
        // Transfer USDC to buyer
        require(usdc.transfer(msg.sender, tokenAmount), "USDC transfer failed");
        
        emit TokensBought(msg.sender, address(usdc), msg.value, tokenAmount);
    }

    /**
     * @dev Buy USDT with METIS
     * @param minTokenAmount Minimum amount of USDT to receive (for slippage protection)
     */
    function buyUSDT(uint256 minTokenAmount) external payable whenNotPaused nonReentrant {
        require(msg.value >= MIN_PURCHASE_AMOUNT, "Amount below minimum");
        
        // Convert result to 6 decimals (USDT decimals)
        uint256 tokenAmount = ((msg.value * PRICE_PRECISION) / usdtPrice) / (10**12);
        require(tokenAmount >= minTokenAmount, "Insufficient token amount");
        require(tokenAmount > 0, "Zero token amount");
        
        // Check contract has enough USDT
        uint256 contractBalance = usdt.balanceOf(address(this));
        require(contractBalance >= tokenAmount, "Insufficient USDT in contract");
        
        // Transfer USDT to buyer
        require(usdt.transfer(msg.sender, tokenAmount), "USDT transfer failed");
        
        emit TokensBought(msg.sender, address(usdt), msg.value, tokenAmount);
    }

    /**
     * @dev Calculate how much USDC you would get for a given amount of METIS
     */
    function getUSDCAmount(uint256 metisAmount) external view returns (uint256) {
        // Convert result to 6 decimals (USDC decimals)
        return ((metisAmount * PRICE_PRECISION) / usdcPrice) / (10**12);
    }

    /**
     * @dev Calculate how much USDT you would get for a given amount of METIS
     */
    function getUSDTAmount(uint256 metisAmount) external view returns (uint256) {
        // Convert result to 6 decimals (USDT decimals)
        return ((metisAmount * PRICE_PRECISION) / usdtPrice) / (10**12);
    }

    /**
     * @dev Get current prices and contract balances
     */
    function getContractInfo() external view returns (
        uint256 _usdcPrice,
        uint256 _usdtPrice,
        uint256 usdcBalance,
        uint256 usdtBalance,
        uint256 metisBalance
    ) {
        return (
            usdcPrice,
            usdtPrice,
            usdc.balanceOf(address(this)),
            usdt.balanceOf(address(this)),
            address(this).balance
        );
    }

    // Admin functions

    /**
     * @dev Set USDC price (only owner)
     */
    function setUSDCPrice(uint256 _usdcPrice) external onlyOwner {
        require(_usdcPrice > 0, "Invalid price");
        uint256 oldPrice = usdcPrice;
        usdcPrice = _usdcPrice;
        emit PriceUpdated(address(usdc), oldPrice, _usdcPrice);
    }

    /**
     * @dev Set USDT price (only owner)
     */
    function setUSDTPrice(uint256 _usdtPrice) external onlyOwner {
        require(_usdtPrice > 0, "Invalid price");
        uint256 oldPrice = usdtPrice;
        usdtPrice = _usdtPrice;
        emit PriceUpdated(address(usdt), oldPrice, _usdtPrice);
    }

    /**
     * @dev Withdraw tokens from contract (only owner)
     */
    function withdrawTokens(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        
        IERC20(token).transfer(to, amount);
        emit TokensWithdrawn(token, to, amount);
    }

    /**
     * @dev Withdraw METIS from contract (only owner)
     */
    function withdrawMETIS(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "METIS transfer failed");
        
        emit METISWithdrawn(to, amount);
    }

    /**
     * @dev Transfer ownership (only owner)
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Emergency function to withdraw all METIS (only owner)
     */
    function emergencyWithdrawMETIS() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No METIS to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "METIS transfer failed");
        
        emit METISWithdrawn(owner, balance);
    }

    // Receive function to accept METIS
    receive() external payable {
        // Allow receiving METIS
    }
} 