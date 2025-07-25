// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract WrappedTokenFactory is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct WrappedToken {
        address originalToken;
        uint256 originalChainId;
        string name;
        string symbol;
        uint8 decimals;
        bool isActive;
    }

    // State variables
    mapping(address => WrappedToken) public wrappedTokens;
    mapping(address => address) public originalToWrapped; // original token => wrapped token
    mapping(address => address) public wrappedToOriginal; // wrapped token => original token
    address[] public allWrappedTokens;

    // Events
    event WrappedTokenCreated(
        address indexed originalToken,
        address indexed wrappedToken,
        uint256 originalChainId,
        string name,
        string symbol,
        uint8 decimals
    );

    event TokensMinted(
        address indexed wrappedToken,
        address indexed recipient,
        uint256 amount,
        bytes32 indexed depositTxHash
    );

    event TokensBurned(
        address indexed wrappedToken,
        address indexed sender,
        uint256 amount,
        uint256 targetChainId,
        bytes32 indexed burnTxHash
    );

    event TokenDeactivated(address indexed wrappedToken);
    event TokenReactivated(address indexed wrappedToken);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    // Modifiers
    modifier onlyBridge() {
        require(hasRole(BRIDGE_ROLE, msg.sender), "Factory: caller is not bridge");
        _;
    }

    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "Factory: caller is not operator");
        _;
    }

    // Core functions
    function createWrappedToken(
        address originalToken,
        uint256 originalChainId,
        string memory name,
        string memory symbol,
        uint8 decimals
    ) external onlyOperator returns (address) {
        require(originalToken != address(0), "Factory: invalid original token");
        require(originalToWrapped[originalToken] == address(0), "Factory: token already wrapped");
        require(bytes(name).length > 0, "Factory: empty name");
        require(bytes(symbol).length > 0, "Factory: empty symbol");

        // Deploy wrapped token contract
        WrappedTokenContract wrappedToken = new WrappedTokenContract(
            name,
            symbol,
            decimals,
            address(this)
        );

        address wrappedTokenAddress = address(wrappedToken);

        // Store token info
        wrappedTokens[wrappedTokenAddress] = WrappedToken({
            originalToken: originalToken,
            originalChainId: originalChainId,
            name: name,
            symbol: symbol,
            decimals: decimals,
            isActive: true
        });

        // Update mappings
        originalToWrapped[originalToken] = wrappedTokenAddress;
        wrappedToOriginal[wrappedTokenAddress] = originalToken;
        allWrappedTokens.push(wrappedTokenAddress);

        emit WrappedTokenCreated(
            originalToken,
            wrappedTokenAddress,
            originalChainId,
            name,
            symbol,
            decimals
        );

        return wrappedTokenAddress;
    }

    function mintWrappedTokens(
        address wrappedToken,
        address recipient,
        uint256 amount,
        bytes32 depositTxHash
    ) external onlyBridge nonReentrant {
        require(wrappedTokens[wrappedToken].isActive, "Factory: token not active");
        require(recipient != address(0), "Factory: invalid recipient");
        require(amount > 0, "Factory: invalid amount");

        WrappedTokenContract(wrappedToken).mint(recipient, amount);

        emit TokensMinted(wrappedToken, recipient, amount, depositTxHash);
    }

    function burnWrappedTokens(
        address wrappedToken,
        uint256 amount,
        uint256 targetChainId
    ) external nonReentrant {
        require(wrappedTokens[wrappedToken].isActive, "Factory: token not active");
        require(amount > 0, "Factory: invalid amount");

        // Burn tokens from sender
        WrappedTokenContract(wrappedToken).burn(msg.sender, amount);

        bytes32 burnTxHash = keccak256(abi.encodePacked(
            msg.sender,
            wrappedToken,
            amount,
            targetChainId,
            block.timestamp
        ));

        emit TokensBurned(wrappedToken, msg.sender, amount, targetChainId, burnTxHash);
    }

    // Admin functions
    function deactivateToken(address wrappedToken) external onlyOperator {
        require(wrappedTokens[wrappedToken].isActive, "Factory: token already inactive");
        wrappedTokens[wrappedToken].isActive = false;
        emit TokenDeactivated(wrappedToken);
    }

    function reactivateToken(address wrappedToken) external onlyOperator {
        require(!wrappedTokens[wrappedToken].isActive, "Factory: token already active");
        wrappedTokens[wrappedToken].isActive = true;
        emit TokenReactivated(wrappedToken);
    }

    // View functions
    function getWrappedToken(address originalToken) external view returns (address) {
        return originalToWrapped[originalToken];
    }

    function getOriginalToken(address wrappedToken) external view returns (address) {
        return wrappedToOriginal[wrappedToken];
    }

    function getWrappedTokenInfo(address wrappedToken) external view returns (WrappedToken memory) {
        return wrappedTokens[wrappedToken];
    }

    function getAllWrappedTokens() external view returns (address[] memory) {
        return allWrappedTokens;
    }

    function isWrappedToken(address token) external view returns (bool) {
        return wrappedToOriginal[token] != address(0);
    }

    function isActiveToken(address wrappedToken) external view returns (bool) {
        return wrappedTokens[wrappedToken].isActive;
    }
}

// Wrapped Token Contract
contract WrappedTokenContract is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    address public immutable factory;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address _factory
    ) ERC20(name, symbol) {
        factory = _factory;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, _factory);
        _grantRole(BURNER_ROLE, _factory);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 18; // Standard for wrapped tokens
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 