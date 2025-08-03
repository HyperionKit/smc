// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Bridge
 * @dev Cross-chain bridge for ERC20 tokens with token mapping
 * Supports: USDT, USDC, DAI, WETH across multiple networks
 * Networks: Hyperion, Lazchain, Metis Sepolia
 */
contract Bridge is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Events ============
    event TokenDeposited(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 indexed destinationChainId,
        address destinationAddress,
        bytes32 depositId
    );

    event TokenWithdrawn(
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 indexed depositId,
        bytes32 withdrawalId
    );

    event RelayerAdded(address indexed relayer);
    event RelayerRemoved(address indexed relayer);
    event TokenAdded(address indexed token, string symbol, uint256 chainId);
    event TokenRemoved(address indexed token, uint256 chainId);
    event ChainSupported(uint256 indexed chainId, bool supported);
    event FeeUpdated(uint256 newFee);
    event TimeoutUpdated(uint256 newTimeout);

    // ============ Structs ============
    struct Deposit {
        address user;
        address token;
        uint256 amount;
        uint256 destinationChainId;
        address destinationAddress;
        uint256 timestamp;
        bool withdrawn;
    }

    struct Withdrawal {
        address user;
        address token;
        uint256 amount;
        bytes32 depositId;
        uint256 timestamp;
        bool processed;
    }

    struct TokenMapping {
        string symbol;
        address tokenAddress;
        uint256 chainId;
        uint8 decimals;
        bool isActive;
    }

    // ============ State Variables ============
    mapping(address => bool) public relayers;
    mapping(address => bool) public supportedTokens;
    mapping(address => string) public tokenSymbols;
    mapping(uint256 => bool) public supportedChains;
    mapping(bytes32 => Deposit) public deposits;
    mapping(bytes32 => Withdrawal) public withdrawals;
    mapping(bytes32 => bool) public processedWithdrawals;

    // Token mapping: symbol => chainId => tokenAddress
    mapping(string => mapping(uint256 => address)) public tokenAddresses;
    // Reverse mapping: tokenAddress => symbol
    mapping(address => string) public addressToSymbol;
    // Token decimals mapping: symbol => chainId => decimals
    mapping(string => mapping(uint256 => uint8)) public tokenDecimals;
    // Active tokens per chain: chainId => symbol[] => bool
    mapping(uint256 => mapping(string => bool)) public activeTokens;

    uint256 public bridgeFee = 0.001 ether; // 0.001 ETH fee
    uint256 public withdrawalTimeout = 24 hours;
    uint256 public depositCount = 0;
    uint256 public withdrawalCount = 0;

    // ============ Modifiers ============
    modifier onlyRelayer() {
        require(relayers[msg.sender], "Bridge: caller is not a relayer");
        _;
    }

    modifier validToken(address token) {
        require(supportedTokens[token], "Bridge: token not supported");
        _;
    }

    modifier validChain(uint256 chainId) {
        require(supportedChains[chainId], "Bridge: chain not supported");
        _;
    }

    // ============ Constructor ============
    constructor(address _owner) Ownable(_owner) {
        // Add deployer as first relayer
        relayers[_owner] = true;
        emit RelayerAdded(_owner);
    }

    // ============ Core Functions ============

    /**
     * @dev Deposit tokens to bridge to another chain
     * @param token Token address to bridge
     * @param amount Amount to bridge
     * @param destinationChainId Target chain ID
     * @param destinationAddress Recipient address on target chain
     */
    function deposit(
        address token,
        uint256 amount,
        uint256 destinationChainId,
        address destinationAddress
    ) external payable nonReentrant whenNotPaused validToken(token) validChain(destinationChainId) {
        require(amount > 0, "Bridge: amount must be greater than 0");
        require(destinationAddress != address(0), "Bridge: invalid destination address");
        require(msg.value >= bridgeFee, "Bridge: insufficient bridge fee");

        // Get token symbol for mapping
        string memory symbol = tokenSymbols[token];
        require(bytes(symbol).length > 0, "Bridge: token symbol not found");

        // Verify token is active on destination chain
        require(activeTokens[destinationChainId][symbol], "Bridge: token not active on destination chain");

        // Transfer tokens from user to bridge
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Generate deposit ID
        bytes32 depositId = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                amount,
                destinationChainId,
                destinationAddress,
                block.timestamp,
                depositCount
            )
        );

        // Store deposit
        deposits[depositId] = Deposit({
            user: msg.sender,
            token: token,
            amount: amount,
            destinationChainId: destinationChainId,
            destinationAddress: destinationAddress,
            timestamp: block.timestamp,
            withdrawn: false
        });

        depositCount++;

        emit TokenDeposited(
            msg.sender,
            token,
            amount,
            destinationChainId,
            destinationAddress,
            depositId
        );
    }

    /**
     * @dev Withdraw tokens from bridge (called by relayer)
     * @param user Recipient address
     * @param token Token address
     * @param amount Amount to withdraw
     * @param depositId Original deposit ID
     * @param signature Relayer signature for verification
     */
    function withdraw(
        address user,
        address token,
        uint256 amount,
        bytes32 depositId,
        bytes calldata signature
    ) external onlyRelayer nonReentrant whenNotPaused validToken(token) {
        require(user != address(0), "Bridge: invalid user address");
        require(amount > 0, "Bridge: amount must be greater than 0");
        require(!processedWithdrawals[depositId], "Bridge: withdrawal already processed");

        // Verify signature (simplified - in production use proper signature verification)
        bytes32 messageHash = keccak256(abi.encodePacked(user, token, amount, depositId));
        require(_verifySignature(messageHash, signature), "Bridge: invalid signature");

        // Mark as processed
        processedWithdrawals[depositId] = true;

        // Generate withdrawal ID
        bytes32 withdrawalId = keccak256(
            abi.encodePacked(user, token, amount, depositId, block.timestamp, withdrawalCount)
        );

        // Store withdrawal
        withdrawals[withdrawalId] = Withdrawal({
            user: user,
            token: token,
            amount: amount,
            depositId: depositId,
            timestamp: block.timestamp,
            processed: true
        });

        withdrawalCount++;

        // Transfer tokens to user
        IERC20(token).safeTransfer(user, amount);

        emit TokenWithdrawn(user, token, amount, depositId, withdrawalId);
    }

    // ============ View Functions ============

    /**
     * @dev Get deposit information
     */
    function getDeposit(bytes32 depositId) external view returns (Deposit memory) {
        return deposits[depositId];
    }

    /**
     * @dev Get withdrawal information
     */
    function getWithdrawal(bytes32 withdrawalId) external view returns (Withdrawal memory) {
        return withdrawals[withdrawalId];
    }

    /**
     * @dev Check if withdrawal is processed
     */
    function isWithdrawalProcessed(bytes32 depositId) external view returns (bool) {
        return processedWithdrawals[depositId];
    }

    /**
     * @dev Get bridge statistics
     */
    function getBridgeStats() external view returns (
        uint256 totalDeposits,
        uint256 totalWithdrawals,
        uint256 currentFee,
        uint256 currentTimeout
    ) {
        return (depositCount, withdrawalCount, bridgeFee, withdrawalTimeout);
    }

    /**
     * @dev Get token address for a symbol on a specific chain
     */
    function getTokenAddress(string calldata symbol, uint256 chainId) external view returns (address) {
        return tokenAddresses[symbol][chainId];
    }

    /**
     * @dev Get token symbol for an address
     */
    function getTokenSymbol(address token) external view returns (string memory) {
        return addressToSymbol[token];
    }

    /**
     * @dev Get token decimals for a symbol on a specific chain
     */
    function getTokenDecimals(string calldata symbol, uint256 chainId) external view returns (uint8) {
        return tokenDecimals[symbol][chainId];
    }

    /**
     * @dev Check if token is active on a specific chain
     */
    function isTokenActive(string calldata symbol, uint256 chainId) external view returns (bool) {
        return activeTokens[chainId][symbol];
    }

    /**
     * @dev Get all token mappings for a symbol
     */
    function getTokenMappings(string calldata symbol) external view returns (TokenMapping[] memory) {
        // Count active mappings
        uint256 count = 0;
        uint256[] memory chainIds = new uint256[](10); // Assuming max 10 chains
        uint256 chainCount = 0;
        
        // Get all supported chains
        for (uint256 i = 0; i < 1000; i++) { // Reasonable range for chain IDs
            if (supportedChains[i] && activeTokens[i][symbol]) {
                chainIds[chainCount] = i;
                chainCount++;
                count++;
            }
        }

        TokenMapping[] memory mappings = new TokenMapping[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 chainId = chainIds[i];
            mappings[i] = TokenMapping({
                symbol: symbol,
                tokenAddress: tokenAddresses[symbol][chainId],
                chainId: chainId,
                decimals: tokenDecimals[symbol][chainId],
                isActive: true
            });
        }

        return mappings;
    }

    // ============ Admin Functions ============

    /**
     * @dev Add a new relayer
     */
    function addRelayer(address relayer) external onlyOwner {
        require(relayer != address(0), "Bridge: invalid relayer address");
        require(!relayers[relayer], "Bridge: relayer already exists");
        
        relayers[relayer] = true;
        emit RelayerAdded(relayer);
    }

    /**
     * @dev Remove a relayer
     */
    function removeRelayer(address relayer) external onlyOwner {
        require(relayers[relayer], "Bridge: relayer does not exist");
        
        relayers[relayer] = false;
        emit RelayerRemoved(relayer);
    }

    /**
     * @dev Add a supported token with mapping
     */
    function addToken(
        address token,
        string calldata symbol,
        uint256 chainId,
        uint8 decimals
    ) external onlyOwner {
        require(token != address(0), "Bridge: invalid token address");
        require(bytes(symbol).length > 0, "Bridge: invalid symbol");
        require(chainId > 0, "Bridge: invalid chain ID");
        
        // Add to local token support
        supportedTokens[token] = true;
        tokenSymbols[token] = symbol;
        addressToSymbol[token] = symbol;
        
        // Add to cross-chain mapping
        tokenAddresses[symbol][chainId] = token;
        tokenDecimals[symbol][chainId] = decimals;
        activeTokens[chainId][symbol] = true;
        
        emit TokenAdded(token, symbol, chainId);
    }

    /**
     * @dev Remove a supported token
     */
    function removeToken(address token, uint256 chainId) external onlyOwner {
        require(supportedTokens[token], "Bridge: token not supported");
        
        string memory symbol = tokenSymbols[token];
        
        // Remove from local support
        supportedTokens[token] = false;
        delete tokenSymbols[token];
        delete addressToSymbol[token];
        
        // Remove from cross-chain mapping
        delete tokenAddresses[symbol][chainId];
        delete tokenDecimals[symbol][chainId];
        activeTokens[chainId][symbol] = false;
        
        emit TokenRemoved(token, chainId);
    }

    /**
     * @dev Add/remove supported chain
     */
    function setChainSupport(uint256 chainId, bool supported) external onlyOwner {
        supportedChains[chainId] = supported;
        emit ChainSupported(chainId, supported);
    }

    /**
     * @dev Update bridge fee
     */
    function updateFee(uint256 newFee) external onlyOwner {
        bridgeFee = newFee;
        emit FeeUpdated(newFee);
    }

    /**
     * @dev Update withdrawal timeout
     */
    function updateTimeout(uint256 newTimeout) external onlyOwner {
        withdrawalTimeout = newTimeout;
        emit TimeoutUpdated(newTimeout);
    }

    /**
     * @dev Emergency pause
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Emergency unpause
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw tokens (owner only)
     */
    function emergencyWithdrawToken(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Bridge: invalid recipient");
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @dev Emergency withdraw ETH (owner only)
     */
    function emergencyWithdrawETH(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Bridge: invalid recipient");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Bridge: ETH transfer failed");
    }

    // ============ Internal Functions ============

    /**
     * @dev Verify relayer signature (simplified implementation)
     * In production, implement proper signature verification
     */
    function _verifySignature(bytes32 messageHash, bytes calldata signature) internal view returns (bool) {
        // Simplified verification - in production use proper ECDSA verification
        // For now, just check if the signer is a relayer
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address signer = _recoverSigner(ethSignedMessageHash, signature);
        return relayers[signer];
    }

    /**
     * @dev Recover signer from signature
     */
    function _recoverSigner(bytes32 ethSignedMessageHash, bytes calldata signature) internal pure returns (address) {
        require(signature.length == 65, "Bridge: invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Bridge: invalid signature 'v' value");

        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    // ============ Receive Function ============
    receive() external payable {
        // Accept ETH for bridge fees
    }
} 