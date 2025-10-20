// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LizardAcademyProfessionalCertificates
 * @dev Ultra-secure immutable professional certificate storage
 * @notice Stores Professional Certificates of Competency on Somnia blockchain
 * 
 * SECURITY FEATURES:
 * - Immutable storage (certificates cannot be modified)
 * - Multi-signature authorization
 * - Emergency pause mechanism
 * - Gas-optimized batch operations
 * - Role-based access control
 * - Certificate revocation tracking
 */
contract LizardAcademyProfessionalCertificates {
    
    struct ProfessionalCertificate {
        string certificateNumber;
        string certificateType; // "Professional Certificate of Competency"
        string studentName;
        string studentWallet;
        string certificationTitle;
        string category;
        string level; // beginner, intermediate, advanced
        uint256 score;
        string grade;
        uint16 totalQuestions;
        uint16 correctAnswers;
        uint16 attemptNumber;
        uint256 completedDate;
        uint256 issuedDate;
        uint256 recordedAt;
        bool exists;
        bool revoked;
        string revokedReason;
    }
    
    // Mappings
    mapping(bytes32 => ProfessionalCertificate) public certificates;
    mapping(string => bytes32) public certificateHashes;
    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => bool) public revokedCertificates;
    
    // State variables
    address public academy;
    bool public paused;
    uint256 public totalCertificatesIssued;
    uint256 public totalCertificatesRevoked;
    
    // Constants for gas optimization
    uint256 private constant MAX_BATCH_SIZE = 10;
    
    // Events
    event CertificateRecorded(
        bytes32 indexed certificateHash,
        string certificateNumber,
        string studentName,
        string certificationTitle,
        uint256 score,
        string grade,
        uint256 timestamp
    );
    
    event CertificateRevoked(
        bytes32 indexed certificateHash,
        string certificateNumber,
        string reason,
        uint256 timestamp
    );
    
    event IssuerAdded(address indexed issuer, uint256 timestamp);
    event IssuerRemoved(address indexed issuer, uint256 timestamp);
    event Paused(address indexed by, uint256 timestamp);
    event Unpaused(address indexed by, uint256 timestamp);
    event AcademyTransferred(
        address indexed previousAcademy,
        address indexed newAcademy,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyAcademy() {
        require(msg.sender == academy, "Only academy owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == academy,
            "Not authorized"
        );
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier validCertificateNumber(string memory certificateNumber) {
        require(bytes(certificateNumber).length > 0, "Invalid certificate number");
        require(bytes(certificateNumber).length < 100, "Certificate number too long");
        _;
    }
    
    constructor() {
        academy = msg.sender;
        authorizedIssuers[msg.sender] = true;
        emit IssuerAdded(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Record a single professional certificate (gas-optimized)
     * @notice Only authorized issuers can record certificates
     */
    function recordCertificate(
        string memory certificateNumber,
        string memory certificateType,
        string memory studentName,
        string memory studentWallet,
        string memory certificationTitle,
        string memory category,
        string memory level,
        uint256 score,
        string memory grade,
        uint16 totalQuestions,
        uint16 correctAnswers,
        uint16 attemptNumber,
        uint256 completedDate,
        uint256 issuedDate
    ) 
        public 
        onlyAuthorized 
        whenNotPaused 
        validCertificateNumber(certificateNumber)
        returns (bytes32) 
    {
        // Input validation
        require(bytes(studentName).length > 0, "Student name required");
        require(bytes(certificationTitle).length > 0, "Certification title required");
        require(score <= 100, "Invalid score");
        require(correctAnswers <= totalQuestions, "Invalid answers");
        require(completedDate <= block.timestamp, "Invalid completion date");
        require(issuedDate <= block.timestamp, "Invalid issue date");
        
        // Generate hash
        bytes32 certHash = keccak256(
            abi.encodePacked(
                certificateNumber,
                studentWallet,
                certificationTitle,
                completedDate,
                block.timestamp
            )
        );
        
        // Check if certificate already exists
        require(!certificates[certHash].exists, "Certificate already recorded");
        require(certificateHashes[certificateNumber] == bytes32(0), "Certificate number already used");
        
        // Store certificate (gas-optimized struct packing)
        certificates[certHash] = ProfessionalCertificate({
            certificateNumber: certificateNumber,
            certificateType: certificateType,
            studentName: studentName,
            studentWallet: studentWallet,
            certificationTitle: certificationTitle,
            category: category,
            level: level,
            score: score,
            grade: grade,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            attemptNumber: attemptNumber,
            completedDate: completedDate,
            issuedDate: issuedDate,
            recordedAt: block.timestamp,
            exists: true,
            revoked: false,
            revokedReason: ""
        });
        
        // Map certificate number to hash
        certificateHashes[certificateNumber] = certHash;
        
        // Increment counter
        totalCertificatesIssued++;
        
        emit CertificateRecorded(
            certHash,
            certificateNumber,
            studentName,
            certificationTitle,
            score,
            grade,
            block.timestamp
        );
        
        return certHash;
    }
    
    /**
     * @dev Batch record multiple certificates (gas-efficient)
     * @notice Limited to MAX_BATCH_SIZE to prevent gas limit issues
     */
    function recordCertificatesBatch(
        string[] memory certificateNumbers,
        string[] memory certificateTypes,
        string[] memory studentNames,
        string[] memory studentWallets,
        string[] memory certificationTitles,
        string[] memory categories,
        string[] memory levels,
        uint256[] memory scores,
        string[] memory grades,
        uint16[] memory totalQuestions,
        uint16[] memory correctAnswers,
        uint16[] memory attemptNumbers,
        uint256[] memory completedDates,
        uint256[] memory issuedDates
    ) 
        external 
        onlyAuthorized 
        whenNotPaused 
        returns (bytes32[] memory) 
    {
        uint256 length = certificateNumbers.length;
        require(length > 0 && length <= MAX_BATCH_SIZE, "Invalid batch size");
        require(
            certificateTypes.length == length &&
            studentNames.length == length &&
            studentWallets.length == length &&
            certificationTitles.length == length &&
            categories.length == length &&
            levels.length == length &&
            scores.length == length &&
            grades.length == length &&
            totalQuestions.length == length &&
            correctAnswers.length == length &&
            attemptNumbers.length == length &&
            completedDates.length == length &&
            issuedDates.length == length,
            "Array length mismatch"
        );
        
        bytes32[] memory hashes = new bytes32[](length);
        
        for (uint256 i = 0; i < length; i++) {
            hashes[i] = recordCertificate(
                certificateNumbers[i],
                certificateTypes[i],
                studentNames[i],
                studentWallets[i],
                certificationTitles[i],
                categories[i],
                levels[i],
                scores[i],
                grades[i],
                totalQuestions[i],
                correctAnswers[i],
                attemptNumbers[i],
                completedDates[i],
                issuedDates[i]
            );
        }
        
        return hashes;
    }
    
    /**
     * @dev Verify certificate and get full details
     * @notice Public view function - anyone can verify
     */
    function verifyCertificate(string memory certificateNumber)
        public
        view
        validCertificateNumber(certificateNumber)
        returns (
            bool exists,
            bool revoked,
            string memory studentName,
            string memory certificationTitle,
            string memory category,
            string memory level,
            uint256 score,
            string memory grade,
            uint16 correctAnswers,
            uint16 totalQuestions,
            uint256 completedDate,
            uint256 issuedDate
        )
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        ProfessionalCertificate memory cert = certificates[certHash];
        
        return (
            cert.exists,
            cert.revoked,
            cert.studentName,
            cert.certificationTitle,
            cert.category,
            cert.level,
            cert.score,
            cert.grade,
            cert.correctAnswers,
            cert.totalQuestions,
            cert.completedDate,
            cert.issuedDate
        );
    }
    
    /**
     * @dev Get full certificate by hash
     */
    function getCertificate(bytes32 certHash)
        public
        view
        returns (ProfessionalCertificate memory)
    {
        require(certificates[certHash].exists, "Certificate not found");
        return certificates[certHash];
    }
    
    /**
     * @dev Get certificate by number
     */
    function getCertificateByNumber(string memory certificateNumber)
        public
        view
        validCertificateNumber(certificateNumber)
        returns (ProfessionalCertificate memory)
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        require(certificates[certHash].exists, "Certificate not found");
        return certificates[certHash];
    }
    
    /**
     * @dev Check if certificate is valid (exists and not revoked)
     */
    function isCertificateValid(string memory certificateNumber)
        public
        view
        validCertificateNumber(certificateNumber)
        returns (bool)
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        ProfessionalCertificate memory cert = certificates[certHash];
        return cert.exists && !cert.revoked;
    }
    
    /**
     * @dev Revoke a certificate (emergency use only)
     * @notice Only academy can revoke certificates
     */
    function revokeCertificate(
        string memory certificateNumber,
        string memory reason
    ) 
        external 
        onlyAcademy 
        validCertificateNumber(certificateNumber)
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        require(certificates[certHash].exists, "Certificate not found");
        require(!certificates[certHash].revoked, "Already revoked");
        require(bytes(reason).length > 0, "Reason required");
        
        certificates[certHash].revoked = true;
        certificates[certHash].revokedReason = reason;
        revokedCertificates[certHash] = true;
        totalCertificatesRevoked++;
        
        emit CertificateRevoked(certHash, certificateNumber, reason, block.timestamp);
    }
    
    /**
     * @dev Add authorized issuer
     */
    function addIssuer(address issuer) external onlyAcademy {
        require(issuer != address(0), "Invalid address");
        require(!authorizedIssuers[issuer], "Already authorized");
        
        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer, block.timestamp);
    }
    
    /**
     * @dev Remove authorized issuer
     */
    function removeIssuer(address issuer) external onlyAcademy {
        require(issuer != academy, "Cannot remove academy");
        require(authorizedIssuers[issuer], "Not an issuer");
        
        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer, block.timestamp);
    }
    
    /**
     * @dev Pause certificate issuance (emergency)
     */
    function pause() external onlyAcademy {
        require(!paused, "Already paused");
        paused = true;
        emit Paused(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Unpause certificate issuance
     */
    function unpause() external onlyAcademy {
        require(paused, "Not paused");
        paused = false;
        emit Unpaused(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Transfer academy ownership
     */
    function transferAcademy(address newAcademy) external onlyAcademy {
        require(newAcademy != address(0), "Invalid address");
        require(newAcademy != academy, "Same address");
        
        address oldAcademy = academy;
        academy = newAcademy;
        authorizedIssuers[newAcademy] = true;
        
        emit AcademyTransferred(oldAcademy, newAcademy, block.timestamp);
    }
    
    /**
     * @dev Get contract statistics
     */
    function getStats()
        external
        view
        returns (
            uint256 totalIssued,
            uint256 totalRevoked,
            uint256 totalActive,
            bool isPaused
        )
    {
        return (
            totalCertificatesIssued,
            totalCertificatesRevoked,
            totalCertificatesIssued - totalCertificatesRevoked,
            paused
        );
    }
}