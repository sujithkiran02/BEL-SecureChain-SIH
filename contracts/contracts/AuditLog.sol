// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuditLog {
    struct AuditEntry {
        uint256 id;
        string actionType;     // "IDENTITY_REGISTERED", "ROLE_ASSIGNED", "ASSET_MINTED", etc.
        address actor;
        address relatedUser;   // who the action affects, if applicable
        uint256 relatedAssetId; // 0 if not asset-related
        string details;        // short human-readable string or IPFS hash for longer detail
        uint256 timestamp;
        uint256 blockNumber;
    }

    AuditEntry[] public entries;
    mapping(address => uint256[]) public entriesByActor;
    mapping(address => bool) public authorizedContracts;
    
    address public owner;

    event EventLogged(uint256 indexed id, string actionType, address indexed actor, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "AuditLog: Not owner");
        _;
    }

    modifier onlyAuthorizedContracts() {
        require(authorizedContracts[msg.sender], "AuditLog: Not authorized contract");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setAuthorizedContract(address _contract, bool _status) external onlyOwner {
        authorizedContracts[_contract] = _status;
    }

    function logEvent(
        string memory actionType,
        address actor,
        address relatedUser,
        uint256 relatedAssetId,
        string memory details
    ) external onlyAuthorizedContracts {
        uint256 entryId = entries.length;
        entries.push(AuditEntry({
            id: entryId,
            actionType: actionType,
            actor: actor,
            relatedUser: relatedUser,
            relatedAssetId: relatedAssetId,
            details: details,
            timestamp: block.timestamp,
            blockNumber: block.number
        }));
        
        entriesByActor[actor].push(entryId);
        
        emit EventLogged(entryId, actionType, actor, block.timestamp);
    }

    function getEntry(uint256 id) external view returns (AuditEntry memory) {
        require(id < entries.length, "AuditLog: Entry does not exist");
        return entries[id];
    }

    function getEntriesByActor(address actor) external view returns (uint256[] memory) {
        return entriesByActor[actor];
    }

    function getTotalEntries() external view returns (uint256) {
        return entries.length;
    }
}
