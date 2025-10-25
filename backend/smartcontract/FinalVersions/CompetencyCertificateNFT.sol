// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LizardAcademyProfessionalCertificates
 * @dev Immutable professional certificate storage for Somnia blockchain
 * @notice Stores Professional Certificates of Competency permanently on-chain
 */
contract LizardAcademyProfessionalCertificates {
    
    struct ProfessionalCertificate {
        string certificateNumber;
        string certificateType;
        string studentName;
        string studentWallet;
        string certificationTitle;
        string category;
        string grade;
        uint256 score;
        uint256 completedDate;
        uint256 issuedDate;
        uint256 recordedAt;
        bool exists;
    }
    
    mapping(bytes32 => ProfessionalCertificate) public certificates;
    mapping(string => bytes32) public certificateHashes;
    mapping(address => bool) public authorizedIssuers;
    
    address public academy;
    bool public paused;
    uint256 public totalCertificatesIssued;
    
    event CertificateRecorded(
        bytes32 indexed certificateHash,
        string certificateNumber,
        string studentName,
        string certificationTitle,
        uint256 timestamp
    );
    
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event AcademyTransferred(address indexed previousAcademy, address indexed newAcademy);
    
    modifier onlyAcademy() {
        require(msg.sender == academy, "Only academy");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedIssuers[msg.sender] || msg.sender == academy, "Not authorized");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }
    
    constructor() {
        academy = msg.sender;
        authorizedIssuers[msg.sender] = true;
        paused = false;
    }
    
    function recordCertificate(
        string memory certificateNumber,
        string memory certificateType,
        string memory studentName,
        string memory studentWallet,
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
        returns (bytes32) 
    {
        require(score <= 100, "Invalid score");
        
        bytes32 certHash = keccak256(abi.encodePacked(certificateNumber));
        require(!certificates[certHash].exists, "Certificate exists");
        
        certificates[certHash] = ProfessionalCertificate({
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
            exists: true
        });
        
        certificateHashes[certificateNumber] = certHash;
        totalCertificatesIssued++;
        
        emit CertificateRecorded(
            certHash,
            certificateNumber,
            studentName,
            certificationTitle,
            block.timestamp
        );
        
        return certHash;
    }
    
    function verifyCertificate(string memory certificateNumber)
        public
        view
        returns (
            bool exists,
            string memory studentName,
            string memory certificationTitle,
            string memory category,
            string memory grade,
            uint256 score,
            uint256 completedDate,
            uint256 issuedDate
        )
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        ProfessionalCertificate memory cert = certificates[certHash];
        
        return (
            cert.exists,
            cert.studentName,
            cert.certificationTitle,
            cert.category,
            cert.grade,
            cert.score,
            cert.completedDate,
            cert.issuedDate
        );
    }
    
    function getCertificate(bytes32 certHash)
        public
        view
        returns (ProfessionalCertificate memory)
    {
        require(certificates[certHash].exists, "Not found");
        return certificates[certHash];
    }
    
    function getCertificateByNumber(string memory certificateNumber)
        public
        view
        returns (ProfessionalCertificate memory)
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        require(certificates[certHash].exists, "Not found");
        return certificates[certHash];
    }
    
    function isCertificateValid(string memory certificateNumber)
        public
        view
        returns (bool)
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        return certificates[certHash].exists;
    }
    
    function addIssuer(address issuer) public onlyAcademy {
        require(issuer != address(0), "Invalid address");
        require(!authorizedIssuers[issuer], "Already authorized");
        
        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }
    
    function removeIssuer(address issuer) public onlyAcademy {
        require(issuer != academy, "Cannot remove academy");
        require(authorizedIssuers[issuer], "Not issuer");
        
        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }
    
    function pause() public onlyAcademy {
        require(!paused, "Already paused");
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() public onlyAcademy {
        require(paused, "Not paused");
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    function transferAcademy(address newAcademy) public onlyAcademy {
        require(newAcademy != address(0), "Invalid address");
        require(newAcademy != academy, "Same address");
        
        address oldAcademy = academy;
        academy = newAcademy;
        authorizedIssuers[newAcademy] = true;
        
        emit AcademyTransferred(oldAcademy, newAcademy);
    }
    
    function isAuthorized(address account) public view returns (bool) {
        return authorizedIssuers[account] || account == academy;
    }
}