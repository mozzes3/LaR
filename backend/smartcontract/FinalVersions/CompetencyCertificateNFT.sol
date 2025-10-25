// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title LizardAcademyCompetencyCertificate
 * @dev Soulbound NFT-based competency certificate system for Somnia blockchain
 * @notice Stores Certificates of Competency as soulbound NFTs (non-transferable) permanently on-chain
 */
contract LizardAcademyCompetencyCertificate is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, Pausable {
    using Counters for Counters.Counter;

    struct CompetencyCertificate {
        string certificateNumber;
        string certificateType;
        string studentName;
        address studentWallet; // Changed to address type for better validation and ownership
        string certificationTitle;
        string category;
        string grade;
        uint256 score;
        uint256 completedDate;
        uint256 issuedDate;
        uint256 recordedAt;
        bool revoked;
        string metadataURI; // Added to match old contract and store IPFS metadata link directly in struct
    }

    mapping(uint256 => CompetencyCertificate) private _certificates; // Keyed by tokenId
    mapping(string => uint256) public certificateToTokenId; // For lookup by certificateNumber
    mapping(address => bool) public authorizedIssuers;

    Counters.Counter private _tokenIdCounter;
    uint256 public totalCertificatesIssued;

    event CertificateRecorded(
        uint256 indexed tokenId,
        string certificateNumber,
        string studentName,
        string certificationTitle,
        uint256 timestamp
    );

    event CertificateRevoked(uint256 indexed tokenId, string certificateNumber, uint256 timestamp);

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    modifier onlyAuthorized() {
        require(authorizedIssuers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() ERC721("LizardAcademyCertificates", "LACERT") Ownable(msg.sender) {
        authorizedIssuers[msg.sender] = true;
    }

    /**
     * @dev Records a new certificate data and generates a tokenId (but does not mint yet).
     */
    function recordCertificate(
        string memory certificateNumber,
        string memory certificateType,
        string memory studentName,
        address studentWallet, // Now address type
        string memory certificationTitle,
        string memory category,
        string memory grade,
        uint256 score,
        uint256 completedDate,
        uint256 issuedDate
    )
        public
        onlyAuthorized
        whenNotPaused
        returns (uint256)
    {
        require(score <= 100, "Invalid score");
        require(studentWallet != address(0), "Invalid student wallet");
        require(completedDate <= issuedDate, "Completed date must be before or equal to issued date");
        require(issuedDate <= block.timestamp, "Issued date cannot be in the future");

        require(certificateToTokenId[certificateNumber] == 0, "Certificate exists");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _certificates[tokenId] = CompetencyCertificate({
            certificateNumber: certificateNumber,
            certificateType: certificateType,
            studentName: studentName,
            studentWallet: studentWallet,
            certificationTitle: certificationTitle,
            category: category,
            grade: grade,
            score: score,
            completedDate: completedDate,
            issuedDate: issuedDate,
            recordedAt: block.timestamp,
            revoked: false,
            metadataURI: "" // Initialize empty; set during mint
        });

        certificateToTokenId[certificateNumber] = tokenId;
        totalCertificatesIssued++;

        emit CertificateRecorded(
            tokenId,
            certificateNumber,
            studentName,
            certificationTitle,
            block.timestamp
        );

        return tokenId;
    }

    /**
     * @dev Mints the soulbound NFT for a recorded certificate and sets metadata URI.
     * Matches the backend's second call (address, certNumber, URI).
     * If the function name doesn't match your backend's expected signature for 0x6b55243d, rename it accordingly (e.g., mint, safeMintNFT).
     */
    function mintNFT(
        address studentWallet,
        string memory certificateNumber,
        string memory metadataURI
    )
        public
        onlyAuthorized
        whenNotPaused
    {
        uint256 tokenId = certificateToTokenId[certificateNumber];
        require(tokenId != 0, "Certificate not recorded");
        require(_ownerOf(tokenId) == address(0), "Already minted");

        // Ensure studentWallet matches the recorded one if set
        require(_certificates[tokenId].studentWallet == studentWallet, "Wallet mismatch");

        _safeMint(studentWallet, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _certificates[tokenId].metadataURI = metadataURI; // Store in struct to match old contract
    }

    /**
     * @dev Revokes a certificate. Can only be done by owner.
     */
    function revokeCertificate(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        require(!_certificates[tokenId].revoked, "Already revoked");

        _certificates[tokenId].revoked = true;

        string memory certNumber = _certificates[tokenId].certificateNumber;
        emit CertificateRevoked(tokenId, certNumber, block.timestamp);
    }

    /**
     * @dev Verifies a certificate by number.
     * Returns data only if exists and not revoked.
     */
    function verifyCertificate(string memory certificateNumber)
        public
        view
        returns (
            bool valid,
            string memory studentName,
            string memory certificationTitle,
            string memory category,
            string memory grade,
            uint256 score,
            uint256 completedDate,
            uint256 issuedDate
        )
    {
        uint256 tokenId = certificateToTokenId[certificateNumber];
        if (tokenId == 0 || _certificates[tokenId].revoked || _ownerOf(tokenId) == address(0)) {
            return (false, "", "", "", "", 0, 0, 0);
        }

        CompetencyCertificate memory cert = _certificates[tokenId];
        return (
            true,
            cert.studentName,
            cert.certificationTitle,
            cert.category,
            cert.grade,
            cert.score,
            cert.completedDate,
            cert.issuedDate
        );
    }

    /**
     * @dev Gets full certificate data by tokenId.
     */
    function getCertificate(uint256 tokenId)
        public
        view
        returns (CompetencyCertificate memory)
    {
        require(_ownerOf(tokenId) != address(0), "Not found");
        return _certificates[tokenId];
    }

    /**
     * @dev Gets full certificate data by number.
     */
    function getCertificateByNumber(string memory certificateNumber)
        public
        view
        returns (CompetencyCertificate memory)
    {
        uint256 tokenId = certificateToTokenId[certificateNumber];
        require(tokenId != 0, "Not found");
        return _certificates[tokenId];
    }

    /**
     * @dev Checks if a certificate is valid (exists, minted, and not revoked).
     */
    function isCertificateValid(string memory certificateNumber)
        public
        view
        returns (bool)
    {
        uint256 tokenId = certificateToTokenId[certificateNumber];
        return tokenId != 0 && _ownerOf(tokenId) != address(0) && !_certificates[tokenId].revoked;
    }

    function addIssuer(address issuer) public onlyOwner {
        require(issuer != address(0), "Invalid address");
        require(!authorizedIssuers[issuer], "Already authorized");

        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }

    function removeIssuer(address issuer) public onlyOwner {
        require(issuer != owner(), "Cannot remove owner");
        require(authorizedIssuers[issuer], "Not issuer");

        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    function isAuthorized(address account) public view returns (bool) {
        return authorizedIssuers[account] || account == owner();
    }

    // Required overrides for multiple inheritance
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        // Soulbound logic: Allow mint (from == 0) and burn (to == 0), block transfers
        require(from == address(0) || to == address(0), "Soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    // Token URI overrides for URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Pause functionality from Pausable
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Ownership transfer fix: Revoke old owner's issuer status if desired
    function transferOwnership(address newOwner) public override onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address oldOwner = owner();
        super.transferOwnership(newOwner);
        authorizedIssuers[newOwner] = true;
        authorizedIssuers[oldOwner] = false; // Revoke old issuer status
    }
}