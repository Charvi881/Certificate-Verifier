// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CertificateRegistry
 * @dev SecuredTrust - Blockchain Certificate Verification System
 * @notice Immutable on-chain registry for academic certificates
 */
contract CertificateRegistry {
    address public owner;

    // ─── Structs ────────────────────────────────────────────────────────────
    struct Certificate {
        bytes32 certHash;       // SHA-256 hash of the certificate PDF
        string  ipfsHash;       // IPFS CID for the full document
        address issuedBy;       // University wallet address
        uint256 issuedAt;       // Block timestamp of issuance
        bool    isRevoked;      // Revocation flag
        string  metadataURI;    // JSON metadata URI (name, course, grade…)
    }

    struct University {
        string  name;
        bool    approved;
        address wallet;
        uint256 registeredAt;
    }

    // ─── State ──────────────────────────────────────────────────────────────
    mapping(bytes32 => Certificate)  public certificates;   // certId → Certificate
    mapping(address => University)   public universities;   // wallet  → University
    mapping(address => bytes32[])    public issuedBy;       // wallet  → list of certIds

    bytes32[] public allCertIds;

    // ─── Events ─────────────────────────────────────────────────────────────
    event UniversityApproved(address indexed wallet, string name, uint256 timestamp);
    event CertificateIssued(bytes32 indexed certId, bytes32 certHash, address indexed university, uint256 timestamp);
    event CertificateRevoked(bytes32 indexed certId, address indexed revokedBy, uint256 timestamp);

    // ─── Modifiers ──────────────────────────────────────────────────────────
    modifier onlyOwner()       { require(msg.sender == owner, "Not owner");          _; }
    modifier onlyApproved()    { require(universities[msg.sender].approved, "University not approved"); _; }
    modifier certExists(bytes32 id) { require(certificates[id].issuedAt != 0, "Certificate not found"); _; }

    constructor() { owner = msg.sender; }

    // ─── Admin Functions ────────────────────────────────────────────────────

    /**
     * @dev Approve a university to issue certificates
     */
    function approveUniversity(address _wallet, string calldata _name) external onlyOwner {
        require(!universities[_wallet].approved, "Already approved");
        universities[_wallet] = University({
            name: _name,
            approved: true,
            wallet: _wallet,
            registeredAt: block.timestamp
        });
        emit UniversityApproved(_wallet, _name, block.timestamp);
    }

    /**
     * @dev Revoke university approval
     */
    function revokeUniversity(address _wallet) external onlyOwner {
        require(universities[_wallet].approved, "Not approved");
        universities[_wallet].approved = false;
    }

    // ─── University Functions ────────────────────────────────────────────────

    /**
     * @dev Issue a new certificate — stores hash on-chain
     * @param _certId    Unique certificate identifier (bytes32)
     * @param _certHash  SHA-256 hash of the PDF
     * @param _ipfsHash  IPFS CID
     * @param _metaURI   Metadata JSON URI
     */
    function issueCertificate(
        bytes32 _certId,
        bytes32 _certHash,
        string calldata _ipfsHash,
        string calldata _metaURI
    ) external onlyApproved {
        require(certificates[_certId].issuedAt == 0, "Certificate ID already exists");

        certificates[_certId] = Certificate({
            certHash:    _certHash,
            ipfsHash:    _ipfsHash,
            issuedBy:    msg.sender,
            issuedAt:    block.timestamp,
            isRevoked:   false,
            metadataURI: _metaURI
        });

        issuedBy[msg.sender].push(_certId);
        allCertIds.push(_certId);

        emit CertificateIssued(_certId, _certHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Revoke an issued certificate
     */
    function revokeCertificate(bytes32 _certId) external certExists(_certId) {
        require(certificates[_certId].issuedBy == msg.sender || msg.sender == owner, "Unauthorized");
        require(!certificates[_certId].isRevoked, "Already revoked");
        certificates[_certId].isRevoked = true;
        emit CertificateRevoked(_certId, msg.sender, block.timestamp);
    }

    // ─── Verifier Functions ─────────────────────────────────────────────────

    /**
     * @dev Verify a certificate by comparing hashes
     * @return valid     true if hash matches and not revoked
     * @return revoked   true if explicitly revoked
     * @return cert      the full Certificate struct
     */
    function verifyCertificate(bytes32 _certId, bytes32 _hashToCheck)
        external view
        returns (bool valid, bool revoked, Certificate memory cert)
    {
        cert = certificates[_certId];
        if (cert.issuedAt == 0) return (false, false, cert); // not found
        revoked = cert.isRevoked;
        valid   = (!cert.isRevoked) && (cert.certHash == _hashToCheck);
    }

    /**
     * @dev Get all certificates issued by a university
     */
    function getUniversityCerts(address _wallet) external view returns (bytes32[] memory) {
        return issuedBy[_wallet];
    }

    /**
     * @dev Total certificates on-chain
     */
    function totalCertificates() external view returns (uint256) {
        return allCertIds.length;
    }
}
