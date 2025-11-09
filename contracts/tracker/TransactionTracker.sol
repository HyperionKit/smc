// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TransactionTracker is Ownable, ReentrancyGuard {
    
    struct Transaction {
        address user;
        address contractAddress;
        string contractType; // "swap", "buy", "stake", "bridge", "faucet"
        address tokenAddress;
        string tokenSymbol;
        uint256 amount;
        uint256 valueInUSD;
        uint256 timestamp;
        string txHash;
    }
    
    struct ContractStats {
        uint256 totalTransactions;
        uint256 totalValueUSD;
        uint256 lastTransactionTime;
        bool isActive;
    }
    
    struct TokenStats {
        uint256 totalVolume;
        uint256 totalValueUSD;
        uint256 lastTransactionTime;
    }
    
    // Contract addresses for tracking
    mapping(address => string) public contractTypes;
    mapping(address => bool) public trackedContracts;
    
    // Statistics
    mapping(string => ContractStats) public contractStats; // contractType => stats
    mapping(address => TokenStats) public tokenStats; // tokenAddress => stats
    mapping(address => uint256) public userTotalValue; // user => total value
    
    // Global statistics
    uint256 public totalTransactions;
    uint256 public totalValueTransferredUSD;
    uint256 public lastTransactionTime;
    
    // Transaction history
    Transaction[] public transactions;
    
    // Events
    event TransactionRecorded(
        address indexed user,
        address indexed contractAddress,
        string contractType,
        address indexed tokenAddress,
        string tokenSymbol,
        uint256 amount,
        uint256 valueInUSD,
        uint256 timestamp,
        string txHash
    );
    
    event ContractAdded(address indexed contractAddress, string contractType);
    event ContractRemoved(address indexed contractAddress);
    
    constructor(address _owner) Ownable(_owner) {}
    
    /**
     * @dev Record a transaction (called by tracked contracts)
     */
    function recordTransaction(
        address user,
        address tokenAddress,
        string memory tokenSymbol,
        uint256 amount,
        uint256 valueInUSD,
        string memory txHash
    ) external {
        require(trackedContracts[msg.sender], "TransactionTracker: Contract not tracked");
        
        string memory contractType = contractTypes[msg.sender];
        require(bytes(contractType).length > 0, "TransactionTracker: Contract type not set");
        
        // Create transaction record
        Transaction memory tx = Transaction({
            user: user,
            contractAddress: msg.sender,
            contractType: contractType,
            tokenAddress: tokenAddress,
            tokenSymbol: tokenSymbol,
            amount: amount,
            valueInUSD: valueInUSD,
            timestamp: block.timestamp,
            txHash: txHash
        });
        
        // Add to transactions array
        transactions.push(tx);
        
        // Update contract statistics
        ContractStats storage contractStat = contractStats[contractType];
        contractStat.totalTransactions++;
        contractStat.totalValueUSD += valueInUSD;
        contractStat.lastTransactionTime = block.timestamp;
        
        // Update token statistics
        TokenStats storage tokenStat = tokenStats[tokenAddress];
        tokenStat.totalVolume += amount;
        tokenStat.totalValueUSD += valueInUSD;
        tokenStat.lastTransactionTime = block.timestamp;
        
        // Update user statistics
        userTotalValue[user] += valueInUSD;
        
        // Update global statistics
        totalTransactions++;
        totalValueTransferredUSD += valueInUSD;
        lastTransactionTime = block.timestamp;
        
        emit TransactionRecorded(
            user,
            msg.sender,
            contractType,
            tokenAddress,
            tokenSymbol,
            amount,
            valueInUSD,
            block.timestamp,
            txHash
        );
    }
    
    /**
     * @dev Add a contract for tracking
     */
    function addContract(address contractAddress, string memory contractType) external onlyOwner {
        require(contractAddress != address(0), "TransactionTracker: Invalid contract address");
        require(bytes(contractType).length > 0, "TransactionTracker: Invalid contract type");
        
        trackedContracts[contractAddress] = true;
        contractTypes[contractAddress] = contractType;
        
        // Initialize contract stats
        if (contractStats[contractType].lastTransactionTime == 0) {
            contractStats[contractType] = ContractStats({
                totalTransactions: 0,
                totalValueUSD: 0,
                lastTransactionTime: 0,
                isActive: true
            });
        }
        
        emit ContractAdded(contractAddress, contractType);
    }
    
    /**
     * @dev Remove a contract from tracking
     */
    function removeContract(address contractAddress) external onlyOwner {
        require(trackedContracts[contractAddress], "TransactionTracker: Contract not tracked");
        
        string memory contractType = contractTypes[contractAddress];
        
        delete trackedContracts[contractAddress];
        delete contractTypes[contractAddress];
        
        // Mark contract type as inactive
        contractStats[contractType].isActive = false;
        
        emit ContractRemoved(contractAddress);
    }
    
    /**
     * @dev Get transaction by index
     */
    function getTransaction(uint256 index) external view returns (Transaction memory) {
        require(index < transactions.length, "TransactionTracker: Index out of bounds");
        return transactions[index];
    }
    
    /**
     * @dev Get recent transactions
     */
    function getRecentTransactions(uint256 count) external view returns (Transaction[] memory) {
        uint256 totalCount = transactions.length;
        uint256 returnCount = count > totalCount ? totalCount : count;
        
        Transaction[] memory recent = new Transaction[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            recent[i] = transactions[totalCount - 1 - i];
        }
        
        return recent;
    }
    
    /**
     * @dev Get user transactions
     */
    function getUserTransactions(address user, uint256 count) external view returns (Transaction[] memory) {
        uint256 userTxCount = 0;
        
        // Count user transactions
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].user == user) {
                userTxCount++;
            }
        }
        
        uint256 returnCount = count > userTxCount ? userTxCount : count;
        Transaction[] memory userTxs = new Transaction[](returnCount);
        
        uint256 found = 0;
        for (uint256 i = transactions.length; i > 0 && found < returnCount; i--) {
            if (transactions[i - 1].user == user) {
                userTxs[found] = transactions[i - 1];
                found++;
            }
        }
        
        return userTxs;
    }
    
    /**
     * @dev Get contract statistics
     */
    function getContractStats(string memory contractType) external view returns (ContractStats memory) {
        return contractStats[contractType];
    }
    
    /**
     * @dev Get token statistics
     */
    function getTokenStats(address tokenAddress) external view returns (TokenStats memory) {
        return tokenStats[tokenAddress];
    }
    
    /**
     * @dev Get user total value
     */
    function getUserTotalValue(address user) external view returns (uint256) {
        return userTotalValue[user];
    }
    
    /**
     * @dev Get total transactions count
     */
    function getTotalTransactions() external view returns (uint256) {
        return transactions.length;
    }
    
    /**
     * @dev Get global statistics
     */
    function getGlobalStats() external view returns (
        uint256 _totalTransactions,
        uint256 _totalValueTransferredUSD,
        uint256 _lastTransactionTime
    ) {
        return (totalTransactions, totalValueTransferredUSD, lastTransactionTime);
    }
    
    /**
     * @dev Get all contract types and their stats
     */
    function getAllContractStats() external view returns (
        string[] memory contractTypes,
        ContractStats[] memory stats
    ) {
        // This is a simplified version - in production you'd want to store contract types separately
        string[] memory types = new string[](5);
        types[0] = "swap";
        types[1] = "buy";
        types[2] = "stake";
        types[3] = "bridge";
        types[4] = "faucet";
        
        ContractStats[] memory contractStatsArray = new ContractStats[](5);
        for (uint256 i = 0; i < 5; i++) {
            contractStatsArray[i] = contractStats[types[i]];
        }
        
        return (types, contractStatsArray);
    }
} 