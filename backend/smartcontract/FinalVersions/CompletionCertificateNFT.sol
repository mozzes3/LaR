// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title LizardAcademyCompletionCertificateNFT
 * @notice Soul-bound NFT certificates - non-transferable proof of course completion
 * @dev ERC721 with transfer restrictions for educational credentials
 */
contract LizardAcademyCompletionCertificateNFT is ERC721, ERC721Enumerable, Ownable, Pausable {
    using Counters for Counters.Counter;

    struct Certificate {
        string certificateNumber;
        string metadataURI;
        address student;
        uint256 mintedAt;
        bool revoked;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(string => uint256) public certificateNumberToTokenId;
    mapping(address => uint256[]) private studentCertificates;
    mapping(address => bool) public authorizedIssuers;

    Counters.Counter private _tokenIdCounter;
    uint256 public totalCertificatesIssued;

    event CertificateMinted(
        uint256 indexed tokenId,
        string certificateNumber,
        address indexed student,
        string metadataURI,
        uint256 mintedAt
    );
    event CertificateRevoked(uint256 indexed tokenId, string certificateNumber, uint256 timestamp);
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    modifier onlyAuthorized() {
        require(authorizedIssuers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address initialOwner) ERC721("Lizard Academy Certificate of Completion", "LACC") Ownable(initialOwner) {
        authorizedIssuers[initialOwner] = true;
    }

    /**
     * @notice Prevents all transfers except minting (soul-bound)
     * @dev Override to make tokens non-transferable after minting
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Soulbound: Certificates cannot be transferred");
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Mint a new certificate NFT to a student
     * @param student The wallet address of the certificate recipient
     * @param certificateNumber Unique certificate identifier
     * @param metadataURI IPFS URI containing certificate metadata
     * @return tokenId The ID of the newly minted token
     */
    function mintCertificate(
        address student,
        string memory certificateNumber,
        string memory metadataURI
    ) external onlyAuthorized whenNotPaused returns (uint256) {
        require(student != address(0), "Invalid student address");
        require(bytes(certificateNumber).length > 0, "Certificate number required");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(certificateNumberToTokenId[certificateNumber] == 0, "Certificate already minted");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(student, tokenId);

        certificates[tokenId] = Certificate({
            certificateNumber: certificateNumber,
            metadataURI: metadataURI,
            student: student,
            mintedAt: block.timestamp,
            revoked: false
        });

        certificateNumberToTokenId[certificateNumber] = tokenId;
        studentCertificates[student].push(tokenId);
        totalCertificatesIssued++;

        emit CertificateMinted(tokenId, certificateNumber, student, metadataURI, block.timestamp);

        return tokenId;
    }

    /**
     * @notice Batch mint multiple certificates (gas optimization)
     * @param students Array of student wallet addresses
     * @param certificateNumbers Array of certificate numbers
     * @param metadataURIs Array of metadata URIs
     */
    function batchMintCertificates(
        address[] memory students,
        string[] memory certificateNumbers,
        string[] memory metadataURIs
    ) external onlyAuthorized whenNotPaused {
        require(
            students.length == certificateNumbers.length &&
            students.length == metadataURIs.length,
            "Array lengths must match"
        );

        for (uint256 i = 0; i < students.length; i++) {
            require(students[i] != address(0), "Invalid student address");
            require(bytes(certificateNumbers[i]).length > 0, "Certificate number required");
            require(bytes(metadataURIs[i]).length > 0, "Metadata URI required");
            require(certificateNumberToTokenId[certificateNumbers[i]] == 0, "Certificate already minted");

            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();

            _safeMint(students[i], tokenId);

            certificates[tokenId] = Certificate({
                certificateNumber: certificateNumbers[i],
                metadataURI: metadataURIs[i],
                student: students[i],
                mintedAt: block.timestamp,
                revoked: false
            });

            certificateNumberToTokenId[certificateNumbers[i]] = tokenId;
            studentCertificates[students[i]].push(tokenId);
            totalCertificatesIssued++;

            emit CertificateMinted(tokenId, certificateNumbers[i], students[i], metadataURIs[i], block.timestamp);
        }
    }

    /**
     * @dev Revokes a certificate. Can only be done by owner.
     */
    function revokeCertificate(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        require(!certificates[tokenId].revoked, "Already revoked");

        certificates[tokenId].revoked = true;

        string memory certNumber = certificates[tokenId].certificateNumber;
        emit CertificateRevoked(tokenId, certNumber, block.timestamp);
    }

    /**
     * @notice Burn a certificate (full removal)
     * @param tokenId The token ID to burn
     */
    function burnCertificate(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        
        Certificate memory cert = certificates[tokenId];
        revokeCertificate(tokenId); // Mark revoked first
        
        // Remove from mappings
        delete certificateNumberToTokenId[cert.certificateNumber];
        
        // Remove from student list (find and remove)
        uint256[] storage certs = studentCertificates[cert.student];
        for (uint256 i = 0; i < certs.length; i++) {
            if (certs[i] == tokenId) {
                certs[i] = certs[certs.length - 1];
                certs.pop();
                break;
            }
        }
        
        _burn(tokenId);
        delete certificates[tokenId];
        totalCertificatesIssued--;
    }

/**
 * @notice Get the metadata URI for a token
 * @param tokenId The token ID
 * @return The IPFS URI containing certificate metadata
 */
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(_ownerOf(tokenId) != address(0), "Token does not exist");
    require(!certificates[tokenId].revoked, "Certificate revoked");
    return certificates[tokenId].metadataURI;
}


    /**
     * @notice Get certificate details by certificate number
     * @param certificateNumber The unique certificate identifier
     * @return tokenId Token ID of the certificate
     * @return student Address of the certificate holder
     * @return metadataURI IPFS metadata URI
     * @return mintedAt Timestamp when certificate was minted
     */
    function getCertificateByNumber(string memory certificateNumber)
        external
        view
        returns (
            uint256 tokenId,
            address student,
            string memory metadataURI,
            uint256 mintedAt
        )
    {
        tokenId = certificateNumberToTokenId[certificateNumber];
        require(tokenId != 0 && _ownerOf(tokenId) != address(0) && !certificates[tokenId].revoked, "Certificate not found or revoked");
        Certificate memory cert = certificates[tokenId];
        return (tokenId, cert.student, cert.metadataURI, cert.mintedAt);
    }

    /**
     * @notice Get all certificate token IDs owned by a student
     * @param student The wallet address
     * @return Array of token IDs (filtered for non-revoked)
     */
    function getCertificatesByStudent(address student)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory allCerts = studentCertificates[student];
        uint256 validCount = 0;
        
        for (uint256 i = 0; i < allCerts.length; i++) {
            if (!certificates[allCerts[i]].revoked) {
                validCount++;
            }
        }
        
        uint256[] memory validCerts = new uint256[](validCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allCerts.length; i++) {
            if (!certificates[allCerts[i]].revoked) {
                validCerts[index] = allCerts[i];
                index++;
            }
        }
        
        return validCerts;
    }

    /**
     * @notice Check if a certificate exists and is valid (not revoked)
     * @param certificateNumber The certificate number to check
     * @return bool True if certificate exists and is valid
     */
    function certificateExists(string memory certificateNumber)
        external
        view
        returns (bool)
    {
        uint256 tokenId = certificateNumberToTokenId[certificateNumber];
        return tokenId != 0 && _ownerOf(tokenId) != address(0) && !certificates[tokenId].revoked;
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

    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    // Pause functionality
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Ownership transfer fix: Revoke old owner's issuer status
    function transferOwnership(address newOwner) public override onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address oldOwner = owner();
        super.transferOwnership(newOwner);
        authorizedIssuers[newOwner] = true;
        authorizedIssuers[oldOwner] = false;
    }
}