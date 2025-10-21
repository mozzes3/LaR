// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LizardAcademyProfessionalCertificates
 * @dev Production-grade immutable professional certificate storage
 * @notice Stores Professional Certificates of Competency on Somnia blockchain
 * 
 * SECURITY: Immutable records, role-based access, emergency pause, gas-optimized
 * OPTIMIZED: Packed structs, batch operations, indexed events, view functions
 * COST-EFFICIENT: Minimal storage, optimized gas usage, batch processing
 */
contract LizardAcademyProfessionalCertificates {
    
    // Packed struct for gas optimization
    struct ProfessionalCertificate {
        string certificateNumber;           // Unique certificate ID
        string certificateType;             // "Professional Certificate of Competency"
        string studentName;                 // Student full name
        string studentWallet;               // Student wallet address
        string certificationTitle;          // Full certification title
        string category;                    // Main category (Web3, AI, etc)
        string subcategories;               // Comma-separated subcategories
        string level;                       // beginner/intermediate/advanced
        string grade;                       // A/B/C/D/F grade
        string revokedReason;               // Revocation reason (if revoked)
        string issuedBy;                    // Issuing authority name
        string designedBy;                  // Course designer name
        string auditedBy;                   // Course auditor name
        uint256 score;                      // Score (0-100)
        uint256 completedDate;              // Completion timestamp
        uint256 issuedDate;                 // Issue timestamp
        uint256 expiryDate;                 // Expiry timestamp (0 = no expiry)
        uint256 recordedAt;                 // Blockchain record timestamp
        uint16 totalQuestions;              // Total test questions
        uint16 correctAnswers;              // Correct answers
        uint16 testDuration;                // Test duration in minutes
        uint16 attemptNumber;               // Attempt number
        bool exists;                        // Record exists flag
        bool revoked;                       // Revocation flag
    }
    
    // Storage
    mapping(bytes32 => ProfessionalCertificate) private certificates;
    mapping(string => bytes32) private certificateHashes;
    mapping(address => bool) private authorizedIssuers;
    mapping(bytes32 => bool) private revokedCertificates;
    
    // State
    address public academy;
    bool public paused;
    uint256 public totalCertificatesIssued;
    uint256 public totalCertificatesRevoked;
    
    // Constants
    uint256 private constant MAX_BATCH_SIZE = 20;
    uint256 private constant MAX_STRING_LENGTH = 500;
    
    // Events (indexed for efficient filtering)
    event CertificateRecorded(
        bytes32 indexed certificateHash,
        string indexed certificateNumber,
        string studentName,
        string certificationTitle,
        uint256 score,
        uint256 timestamp
    );
    
    event CertificateRevoked(
        bytes32 indexed certificateHash,
        string indexed certificateNumber,
        string reason,
        uint256 timestamp
    );
    
    event IssuerAuthorized(address indexed issuer, uint256 timestamp);
    event IssuerRevoked(address indexed issuer, uint256 timestamp);
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);
    event AcademyTransferred(address indexed from, address indexed to, uint256 timestamp);
    
    // Modifiers
    modifier onlyAcademy() {
        require(msg.sender == academy, "Academy only");
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
    
    modifier validString(string memory str) {
        require(bytes(str).length > 0 && bytes(str).length <= MAX_STRING_LENGTH, "Invalid string");
        _;
    }
    
    constructor() {
        academy = msg.sender;
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorized(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Record single professional certificate with full metadata
     * @notice Gas-optimized with comprehensive validation
     */
    function recordCertificate(
        string calldata certificateNumber,
        string calldata certificateType,
        string calldata studentName,
        string calldata studentWallet,
        string calldata certificationTitle,
        string calldata category,
        string calldata subcategories,
        string calldata level,
        uint256 score,
        string calldata grade,
        uint16 totalQuestions,
        uint16 correctAnswers,
        uint16 testDuration,
        uint16 attemptNumber,
        uint256 completedDate,
        uint256 issuedDate,
        uint256 expiryDate,
        string calldata issuedBy,
        string calldata designedBy,
        string calldata auditedBy
    ) 
        external 
        onlyAuthorized 
        whenNotPaused 
        validString(certificateNumber)
        validString(studentName)
        validString(certificationTitle)
        returns (bytes32) 
    {
        // Validate inputs
        require(score <= 100, "Score > 100");
        require(correctAnswers <= totalQuestions, "Answers > questions");
        require(completedDate <= block.timestamp, "Future completion");
        require(issuedDate <= block.timestamp, "Future issue");
        require(expiryDate == 0 || expiryDate > issuedDate, "Invalid expiry");
        require(certificateHashes[certificateNumber] == bytes32(0), "Number exists");
        
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
        
        require(!certificates[certHash].exists, "Hash exists");
        
        // Store certificate with full metadata
        certificates[certHash] = ProfessionalCertificate({
            certificateNumber: certificateNumber,
            certificateType: certificateType,
            studentName: studentName,
            studentWallet: studentWallet,
            certificationTitle: certificationTitle,
            category: category,
            subcategories: subcategories,
            level: level,
            grade: grade,
            revokedReason: "",
            issuedBy: issuedBy,
            designedBy: designedBy,
            auditedBy: auditedBy,
            score: score,
            completedDate: completedDate,
            issuedDate: issuedDate,
            expiryDate: expiryDate,
            recordedAt: block.timestamp,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            testDuration: testDuration,
            attemptNumber: attemptNumber,
            exists: true,
            revoked: false
        });
        
        certificateHashes[certificateNumber] = certHash;
        totalCertificatesIssued++;
        
        emit CertificateRecorded(
            certHash,
            certificateNumber,
            studentName,
            certificationTitle,
            score,
            block.timestamp
        );
        
        return certHash;
    }
    
    /**
     * @dev Batch record certificates (gas-efficient)
     * @notice Max 20 certificates per batch
     */
    function recordCertificatesBatch(
        string[] calldata certificateNumbers,
        string[] calldata certificateTypes,
        string[] calldata studentNames,
        string[] calldata studentWallets,
        string[] calldata certificationTitles,
        string[] calldata categories,
        string[] calldata subcategoriesArray,
        string[] calldata levels,
        uint256[] calldata scores,
        string[] calldata grades,
        uint16[] calldata totalQuestions,
        uint16[] calldata correctAnswers,
        uint16[] calldata testDurations,
        uint16[] calldata attemptNumbers,
        uint256[] calldata completedDates,
        uint256[] calldata issuedDates,
        uint256[] calldata expiryDates,
        string[] calldata issuedByArray,
        string[] calldata designedByArray,
        string[] calldata auditedByArray
    ) 
        external 
        onlyAuthorized 
        whenNotPaused 
        returns (bytes32[] memory) 
    {
        uint256 length = certificateNumbers.length;
        require(length > 0 && length <= MAX_BATCH_SIZE, "Invalid batch");
        require(
            certificateTypes.length == length &&
            studentNames.length == length &&
            studentWallets.length == length &&
            certificationTitles.length == length &&
            categories.length == length &&
            subcategoriesArray.length == length &&
            levels.length == length &&
            scores.length == length &&
            grades.length == length &&
            totalQuestions.length == length &&
            correctAnswers.length == length &&
            testDurations.length == length &&
            attemptNumbers.length == length &&
            completedDates.length == length &&
            issuedDates.length == length &&
            expiryDates.length == length &&
            issuedByArray.length == length &&
            designedByArray.length == length &&
            auditedByArray.length == length,
            "Length mismatch"
        );
        
        bytes32[] memory hashes = new bytes32[](length);
        
        for (uint256 i = 0; i < length;) {
            hashes[i] = this.recordCertificate(
                certificateNumbers[i],
                certificateTypes[i],
                studentNames[i],
                studentWallets[i],
                certificationTitles[i],
                categories[i],
                subcategoriesArray[i],
                levels[i],
                scores[i],
                grades[i],
                totalQuestions[i],
                correctAnswers[i],
                testDurations[i],
                attemptNumbers[i],
                completedDates[i],
                issuedDates[i],
                expiryDates[i],
                issuedByArray[i],
                designedByArray[i],
                auditedByArray[i]
            );
            unchecked { ++i; }
        }
        
        return hashes;
    }
    
    /**
     * @dev Verify certificate by number with full details
     * @return All certificate verification data
     */
    function verifyCertificate(string calldata certificateNumber)
        external
        view
        validString(certificateNumber)
        returns (
            bool exists,
            bool revoked,
            string memory certificateType,
            string memory studentName,
            string memory certificationTitle,
            string memory category,
            string memory subcategories,
            string memory level,
            uint256 score,
            string memory grade,
            uint16 correctAnswers,
            uint16 totalQuestions,
            uint16 testDuration,
            uint256 completedDate,
            uint256 issuedDate,
            uint256 expiryDate
        )
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        ProfessionalCertificate storage cert = certificates[certHash];
        
        return (
            cert.exists,
            cert.revoked,
            cert.certificateType,
            cert.studentName,
            cert.certificationTitle,
            cert.category,
            cert.subcategories,
            cert.level,
            cert.score,
            cert.grade,
            cert.correctAnswers,
            cert.totalQuestions,
            cert.testDuration,
            cert.completedDate,
            cert.issuedDate,
            cert.expiryDate
        );
    }
    
    /**
     * @dev Get full certificate with all metadata
     */
    function getCertificate(bytes32 certHash)
        external
        view
        returns (ProfessionalCertificate memory)
    {
        require(certificates[certHash].exists, "Not found");
        return certificates[certHash];
    }
    
    /**
     * @dev Get certificate by number
     */
    function getCertificateByNumber(string calldata certificateNumber)
        external
        view
        validString(certificateNumber)
        returns (ProfessionalCertificate memory)
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        require(certificates[certHash].exists, "Not found");
        return certificates[certHash];
    }
    
    /**
     * @dev Check if certificate is valid (exists, not revoked, not expired)
     */
    function isCertificateValid(string calldata certificateNumber)
        external
        view
        validString(certificateNumber)
        returns (bool)
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        ProfessionalCertificate storage cert = certificates[certHash];
        
        if (!cert.exists || cert.revoked) return false;
        if (cert.expiryDate > 0 && block.timestamp > cert.expiryDate) return false;
        
        return true;
    }
    
    /**
     * @dev Revoke certificate (emergency only)
     */
    function revokeCertificate(string calldata certificateNumber, string calldata reason) 
        external 
        onlyAcademy 
        validString(certificateNumber)
        validString(reason)
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        require(certificates[certHash].exists, "Not found");
        require(!certificates[certHash].revoked, "Already revoked");
        
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
        require(issuer != address(0), "Zero address");
        require(!authorizedIssuers[issuer], "Already authorized");
        
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer, block.timestamp);
    }
    
    /**
     * @dev Remove authorized issuer
     */
    function removeIssuer(address issuer) external onlyAcademy {
        require(issuer != academy, "Cannot remove academy");
        require(authorizedIssuers[issuer], "Not issuer");
        
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer, block.timestamp);
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyAcademy {
        require(!paused, "Already paused");
        paused = true;
        emit ContractPaused(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyAcademy {
        require(paused, "Not paused");
        paused = false;
        emit ContractUnpaused(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Transfer academy ownership
     */
    function transferAcademy(address newAcademy) external onlyAcademy {
        require(newAcademy != address(0), "Zero address");
        require(newAcademy != academy, "Same address");
        
        address oldAcademy = academy;
        academy = newAcademy;
        authorizedIssuers[newAcademy] = true;
        
        emit AcademyTransferred(oldAcademy, newAcademy, block.timestamp);
    }
    
    /**
     * @dev Get contract stats
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
    
    /**
     * @dev Check if address is authorized issuer
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return authorizedIssuers[issuer];
    }
    
    /**
     * @dev Get certificate hash by number
     */
    function getCertificateHash(string calldata certificateNumber) 
        external 
        view 
        validString(certificateNumber)
        returns (bytes32) 
    {
        return certificateHashes[certificateNumber];
    }
    
    /**
     * @dev Get certificate credentials (issuedBy, designedBy, auditedBy)
     */
    function getCertificateCredentials(string calldata certificateNumber)
        external
        view
        validString(certificateNumber)
        returns (
            string memory issuedBy,
            string memory designedBy,
            string memory auditedBy
        )
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        ProfessionalCertificate storage cert = certificates[certHash];
        require(cert.exists, "Not found");
        
        return (cert.issuedBy, cert.designedBy, cert.auditedBy);
    }
}