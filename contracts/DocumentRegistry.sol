// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DocumentRegistry
 * @dev Stores document metadata hashes and column-level access control on Ethereum.
 * Part of the SecureVault RBDEC (Role-Based Document Encryption & Control) platform.
 *
 * Deployment:
 *   1. Install Hardhat: npm install --save-dev hardhat
 *   2. npx hardhat compile
 *   3. Deploy to local Ganache or testnet (Sepolia/Goerli)
 *
 * Usage from backend:
 *   - Use ethers.js to call storeDocument() when a new document is uploaded
 *   - Call verifyDocument() to check integrity
 *   - Call logAccess() to record column-level access on-chain
 */
contract DocumentRegistry {
    struct Document {
        uint256 documentId;
        bytes32 sha256Hash;
        address creator;
        uint256 timestamp;
        string columnAccessMapping; // JSON string of column -> role[] mapping
        bool exists;
    }

    struct AccessLog {
        address accessor;
        uint256 documentId;
        string accessedColumns; // JSON array of column names
        string deniedColumns;   // JSON array of column names
        uint256 timestamp;
    }

    // State variables
    address public owner;
    mapping(uint256 => Document) public documents;
    AccessLog[] public accessLogs;
    uint256 public documentCount;
    uint256 public accessLogCount;

    // Events
    event DocumentStored(
        uint256 indexed documentId,
        bytes32 sha256Hash,
        address indexed creator,
        uint256 timestamp
    );

    event DocumentVerified(
        uint256 indexed documentId,
        bool integrityValid,
        address indexed verifier
    );

    event AccessLogged(
        uint256 indexed documentId,
        address indexed accessor,
        string accessedColumns,
        string deniedColumns,
        uint256 timestamp
    );

    event RoleMappingUpdated(
        uint256 indexed documentId,
        string newColumnAccessMapping,
        address indexed updater
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier documentExists(uint256 _documentId) {
        require(documents[_documentId].exists, "Document does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Store a new document's metadata hash and column access mapping
     * @param _documentId Unique identifier for the document
     * @param _sha256Hash SHA-256 hash of the document content
     * @param _columnAccessMapping JSON string mapping columns to allowed roles
     */
    function storeDocument(
        uint256 _documentId,
        bytes32 _sha256Hash,
        string memory _columnAccessMapping
    ) external {
        require(!documents[_documentId].exists, "Document already registered");

        documents[_documentId] = Document({
            documentId: _documentId,
            sha256Hash: _sha256Hash,
            creator: msg.sender,
            timestamp: block.timestamp,
            columnAccessMapping: _columnAccessMapping,
            exists: true
        });

        documentCount++;

        emit DocumentStored(_documentId, _sha256Hash, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify a document's integrity by comparing hashes
     * @param _documentId The document to verify
     * @param _sha256Hash The hash to verify against
     * @return valid Whether the hash matches
     */
    function verifyDocument(
        uint256 _documentId,
        bytes32 _sha256Hash
    ) external documentExists(_documentId) returns (bool valid) {
        valid = documents[_documentId].sha256Hash == _sha256Hash;

        emit DocumentVerified(_documentId, valid, msg.sender);

        return valid;
    }

    /**
     * @dev Log a column-level access event on-chain
     * @param _documentId The accessed document
     * @param _accessedColumns JSON array of accessible column names
     * @param _deniedColumns JSON array of denied column names
     */
    function logAccess(
        uint256 _documentId,
        string memory _accessedColumns,
        string memory _deniedColumns
    ) external documentExists(_documentId) {
        accessLogs.push(AccessLog({
            accessor: msg.sender,
            documentId: _documentId,
            accessedColumns: _accessedColumns,
            deniedColumns: _deniedColumns,
            timestamp: block.timestamp
        }));

        accessLogCount++;

        emit AccessLogged(
            _documentId,
            msg.sender,
            _accessedColumns,
            _deniedColumns,
            block.timestamp
        );
    }

    /**
     * @dev Update the column access mapping for a document (owner only)
     * @param _documentId The document to update
     * @param _newMapping New JSON column access mapping
     */
    function updateRoleMapping(
        uint256 _documentId,
        string memory _newMapping
    ) external onlyOwner documentExists(_documentId) {
        documents[_documentId].columnAccessMapping = _newMapping;

        emit RoleMappingUpdated(_documentId, _newMapping, msg.sender);
    }

    /**
     * @dev Get document details
     */
    function getDocument(uint256 _documentId)
        external
        view
        documentExists(_documentId)
        returns (
            bytes32 sha256Hash,
            address creator,
            uint256 timestamp,
            string memory columnAccessMapping
        )
    {
        Document storage doc = documents[_documentId];
        return (doc.sha256Hash, doc.creator, doc.timestamp, doc.columnAccessMapping);
    }

    /**
     * @dev Get access log by index
     */
    function getAccessLog(uint256 _index)
        external
        view
        returns (
            address accessor,
            uint256 documentId,
            string memory accessedColumns,
            string memory deniedColumns,
            uint256 timestamp
        )
    {
        require(_index < accessLogCount, "Index out of bounds");
        AccessLog storage log = accessLogs[_index];
        return (log.accessor, log.documentId, log.accessedColumns, log.deniedColumns, log.timestamp);
    }
}
