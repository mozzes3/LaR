// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract TokenRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct TokenInfo {
        address tokenAddress;
        address escrowAddress;
        uint256 chainId;
        bool isActive;
        uint256 addedAt;
        uint256 deactivatedAt;
    }

    mapping(string => mapping(uint256 => TokenInfo)) public approvedTokens;
    string[] public tokenSymbols;
    mapping(string => bool) private symbolExists;

    event TokenAdded(string indexed symbol, uint256 indexed chainId, address tokenAddress, address escrowAddress, uint256 addedAt);
    event TokenDeactivated(string indexed symbol, uint256 indexed chainId, uint256 deactivatedAt);
    event TokenReactivated(string indexed symbol, uint256 indexed chainId, uint256 reactivatedAt);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function addToken(
        string memory symbol,
        address tokenAddress,
        address escrowAddress,
        uint256 chainId
    ) external onlyRole(ADMIN_ROLE) {
        require(bytes(symbol).length > 0 && bytes(symbol).length <= 32, "Invalid symbol length");
        require(tokenAddress != address(0), "Invalid token address");
        require(escrowAddress != address(0), "Invalid escrow address");
        require(approvedTokens[symbol][chainId].tokenAddress == address(0), "Token exists for this symbol and chain");

        uint256 timestamp = block.timestamp;
        approvedTokens[symbol][chainId] = TokenInfo({
            tokenAddress: tokenAddress,
            escrowAddress: escrowAddress,
            chainId: chainId,
            isActive: true,
            addedAt: timestamp,
            deactivatedAt: 0
        });

        if (!symbolExists[symbol]) {
            tokenSymbols.push(symbol);
            symbolExists[symbol] = true;
        }

        emit TokenAdded(symbol, chainId, tokenAddress, escrowAddress, timestamp);
    }

    function verifyToken(
        string memory symbol,
        address tokenAddress,
        address escrowAddress,
        uint256 chainId
    ) external view returns (bool) {
        TokenInfo memory token = approvedTokens[symbol][chainId];
        return (
            token.isActive &&
            token.tokenAddress == tokenAddress &&
            token.escrowAddress == escrowAddress &&
            token.chainId == chainId
        );
    }

    function getToken(string memory symbol, uint256 chainId) external view returns (TokenInfo memory) {
        return approvedTokens[symbol][chainId];
    }

    function deactivateToken(string memory symbol, uint256 chainId) external onlyRole(ADMIN_ROLE) {
        TokenInfo storage token = approvedTokens[symbol][chainId];
        require(token.tokenAddress != address(0), "Token does not exist");
        require(token.isActive, "Token already inactive");

        token.isActive = false;
        token.deactivatedAt = block.timestamp;
        emit TokenDeactivated(symbol, chainId, block.timestamp);
    }

    function reactivateToken(string memory symbol, uint256 chainId) external onlyRole(ADMIN_ROLE) {
        TokenInfo storage token = approvedTokens[symbol][chainId];
        require(token.tokenAddress != address(0), "Token does not exist");
        require(!token.isActive, "Token already active");

        token.isActive = true;
        token.deactivatedAt = 0;
        emit TokenReactivated(symbol, chainId, block.timestamp);
    }

    function getAllSymbols(uint256 offset, uint256 limit) external view returns (string[] memory) {
        uint256 total = tokenSymbols.length;
        if (offset >= total) return new string[](0);

        uint256 end = offset + limit > total ? total : offset + limit;
        string[] memory symbols = new string[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            symbols[i - offset] = tokenSymbols[i];
        }
        return symbols;
    }

    function renounceAdmin() external onlyRole(ADMIN_ROLE) {
        renounceRole(ADMIN_ROLE, msg.sender);
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}