// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Lizard Academy Certificate of Completion NFT
 * @notice Soul-bound NFT certificates - non-transferable proof of course completion
 * @dev ERC721 with transfer restrictions for educational credentials
 */
contract LizardAcademyCompletionCertificateNFT is ERC721, Ownable, Pausable {
    
    uint256 private _tokenIdCounter;
    
    struct Certificate {
        string certificateNumber;
        string metadataURI;
        address student;
        uint256 mintedAt;
    }
    
    mapping(uint256 => Certificate) public certificates;
    mapping(string => uint256) public certificateNumberToTokenId;
    mapping(address => uint256[]) private studentCertificates;
    
    event CertificateMinted(
        uint256 indexed tokenId,
        string certificateNumber,
        address indexed student,
        string metadataURI,
        uint256 mintedAt
    );
    
    constructor(address initialOwner) ERC721("Lizard Academy Certificate of Completion", "LACC") Ownable(initialOwner) {}
    
    /**
     * @notice Prevents all transfers except minting (soul-bound)
     * @dev Override to make tokens non-transferable after minting
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
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
    ) external onlyOwner whenNotPaused returns (uint256) {
        require(student != address(0), "Invalid student address");
        require(bytes(certificateNumber).length > 0, "Certificate number required");
        require(certificateNumberToTokenId[certificateNumber] == 0, "Certificate already minted");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _safeMint(student, tokenId);
        
        certificates[tokenId] = Certificate({
            certificateNumber: certificateNumber,
            metadataURI: metadataURI,
            student: student,
            mintedAt: block.timestamp
        });
        
        certificateNumberToTokenId[certificateNumber] = tokenId;
        studentCertificates[student].push(tokenId);
        
        emit CertificateMinted(tokenId, certificateNumber, student, metadataURI, block.timestamp);
        
        return tokenId;
    }
    
    /**
     * @notice Get the metadata URI for a token
     * @param tokenId The token ID
     * @return The IPFS URI containing certificate metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
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
        require(_ownerOf(tokenId) != address(0), "Certificate not found");
        Certificate memory cert = certificates[tokenId];
        return (tokenId, cert.student, cert.metadataURI, cert.mintedAt);
    }
    
    /**
     * @notice Get all certificate token IDs owned by a student
     * @param student The wallet address
     * @return Array of token IDs
     */
    function getCertificatesByStudent(address student) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return studentCertificates[student];
    }
    
    /**
     * @notice Get total number of certificates minted
     * @return Total supply of certificates
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
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
    ) external onlyOwner whenNotPaused {
        require(
            students.length == certificateNumbers.length && 
            students.length == metadataURIs.length,
            "Array lengths must match"
        );
        
        for (uint256 i = 0; i < students.length; i++) {
            require(students[i] != address(0), "Invalid student address");
            require(bytes(certificateNumbers[i]).length > 0, "Certificate number required");
            require(certificateNumberToTokenId[certificateNumbers[i]] == 0, "Certificate already minted");
            
            _tokenIdCounter++;
            uint256 tokenId = _tokenIdCounter;
            
            _safeMint(students[i], tokenId);
            
            certificates[tokenId] = Certificate({
                certificateNumber: certificateNumbers[i],
                metadataURI: metadataURIs[i],
                student: students[i],
                mintedAt: block.timestamp
            });
            
            certificateNumberToTokenId[certificateNumbers[i]] = tokenId;
            studentCertificates[students[i]].push(tokenId);
            
            emit CertificateMinted(tokenId, certificateNumbers[i], students[i], metadataURIs[i], block.timestamp);
        }
    }
    
    /**
     * @notice Check if a certificate exists
     * @param certificateNumber The certificate number to check
     * @return bool True if certificate exists
     */
    function certificateExists(string memory certificateNumber) 
        external 
        view 
        returns (bool) 
    {
        uint256 tokenId = certificateNumberToTokenId[certificateNumber];
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @notice Pause minting (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause minting
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}