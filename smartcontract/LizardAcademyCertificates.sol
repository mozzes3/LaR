// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LizardAcademyCertificates
 * @dev Immutable certificate storage with enhanced security for Somnia blockchain
 * @notice This contract permanently stores educational certificates on-chain
 */
contract LizardAcademyCertificates {
    struct Certificate {
        string certificateNumber;
        string studentName;
        string studentWallet;
        string courseTitle;
        string instructor;
        uint256 completedDate;
        string grade;
        uint256 finalScore;
        uint256 totalHours;
        uint256 totalLessons;
        uint256 recordedAt;
        bool exists;
    }

    // Mapping from certificate hash to certificate data
    mapping(bytes32 => Certificate) public certificates;
    
    // Mapping from certificate number to hash for lookup
    mapping(string => bytes32) public certificateHashes;
    
    // Academy owner/operator
    address public academy;
    
    // Emergency pause mechanism
    bool public paused;
    
    // Authorized signers who can record certificates
    mapping(address => bool) public authorizedSigners;
    
    // Track total certificates issued
    uint256 public totalCertificates;
    
    // Events
    event CertificateRecorded(
        bytes32 indexed certificateHash,
        string certificateNumber,
        string studentName,
        string courseTitle,
        uint256 timestamp
    );
    
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event AcademyTransferred(address indexed previousAcademy, address indexed newAcademy);

    modifier onlyAcademy() {
        require(msg.sender == academy, "Only academy owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedSigners[msg.sender] || msg.sender == academy, "Not authorized");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor() {
        academy = msg.sender;
        authorizedSigners[msg.sender] = true;
        paused = false;
    }

    /**
     * @dev Record a new certificate on blockchain
     * @notice Can only be called by authorized signers
     * @notice Certificate data is immutable once recorded
     */
    function recordCertificate(
        string memory certificateNumber,
        string memory studentName,
        string memory studentWallet,
        string memory courseTitle,
        string memory instructor,
        uint256 completedDate,
        string memory grade,
        uint256 finalScore,
        uint256 totalHours,
        uint256 totalLessons
    ) public onlyAuthorized whenNotPaused returns (bytes32) {
        // Input validation
        require(bytes(certificateNumber).length > 0, "Certificate number required");
        require(bytes(studentName).length > 0, "Student name required");
        require(bytes(courseTitle).length > 0, "Course title required");
        require(bytes(instructor).length > 0, "Instructor required");
        require(completedDate > 0, "Completion date required");
        require(finalScore <= 100, "Invalid score");
        
        // Generate unique hash
        bytes32 certHash = keccak256(abi.encodePacked(certificateNumber));
        
        // Prevent duplicates - certificates are immutable
        require(!certificates[certHash].exists, "Certificate already exists");
        
        // Store certificate data (immutable after this point)
        certificates[certHash] = Certificate({
            certificateNumber: certificateNumber,
            studentName: studentName,
            studentWallet: studentWallet,
            courseTitle: courseTitle,
            instructor: instructor,
            completedDate: completedDate,
            grade: grade,
            finalScore: finalScore,
            totalHours: totalHours,
            totalLessons: totalLessons,
            recordedAt: block.timestamp,
            exists: true
        });
        
        // Map certificate number to hash
        certificateHashes[certificateNumber] = certHash;
        
        // Increment counter
        totalCertificates++;
        
        emit CertificateRecorded(
            certHash,
            certificateNumber,
            studentName,
            courseTitle,
            block.timestamp
        );
        
        return certHash;
    }

    /**
     * @dev Verify certificate exists and get details
     * @notice Public view function - anyone can verify
     */
    function verifyCertificate(string memory certificateNumber) 
        public 
        view 
        returns (
            bool exists,
            string memory studentName,
            string memory courseTitle,
            string memory instructor,
            uint256 completedDate,
            string memory grade,
            uint256 finalScore
        ) 
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        Certificate memory cert = certificates[certHash];
        
        return (
            cert.exists,
            cert.studentName,
            cert.courseTitle,
            cert.instructor,
            cert.completedDate,
            cert.grade,
            cert.finalScore
        );
    }

    /**
     * @dev Get full certificate details by hash
     * @notice Public view function
     */
    function getCertificate(bytes32 certHash) 
        public 
        view 
        returns (Certificate memory) 
    {
        require(certificates[certHash].exists, "Certificate not found");
        return certificates[certHash];
    }
    
    /**
     * @dev Get certificate by number
     * @notice Public view function
     */
    function getCertificateByNumber(string memory certificateNumber)
        public
        view
        returns (Certificate memory)
    {
        bytes32 certHash = certificateHashes[certificateNumber];
        require(certificates[certHash].exists, "Certificate not found");
        return certificates[certHash];
    }

    /**
     * @dev Add authorized signer
     * @notice Only academy owner can add signers
     */
    function addSigner(address signer) public onlyAcademy {
        require(signer != address(0), "Invalid address");
        require(!authorizedSigners[signer], "Already authorized");
        
        authorizedSigners[signer] = true;
        emit SignerAdded(signer);
    }

    /**
     * @dev Remove authorized signer
     * @notice Only academy owner can remove signers
     */
    function removeSigner(address signer) public onlyAcademy {
        require(signer != academy, "Cannot remove academy");
        require(authorizedSigners[signer], "Not authorized");
        
        authorizedSigners[signer] = false;
        emit SignerRemoved(signer);
    }

    /**
     * @dev Emergency pause - stops certificate recording
     * @notice Only academy owner can pause
     */
    function pause() public onlyAcademy {
        require(!paused, "Already paused");
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Unpause contract
     * @notice Only academy owner can unpause
     */
    function unpause() public onlyAcademy {
        require(paused, "Not paused");
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Transfer academy ownership
     * @notice Only current academy owner can transfer
     * @notice Use with extreme caution - irreversible
     */
    function transferAcademy(address newAcademy) public onlyAcademy {
        require(newAcademy != address(0), "Invalid address");
        require(newAcademy != academy, "Already academy");
        
        address oldAcademy = academy;
        academy = newAcademy;
        
        // New academy becomes authorized signer
        authorizedSigners[newAcademy] = true;
        
        emit AcademyTransferred(oldAcademy, newAcademy);
    }
    
    /**
     * @dev Check if address is authorized
     */
    function isAuthorized(address account) public view returns (bool) {
        return authorizedSigners[account] || account == academy;
    }
}