// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IAuditLog {
    function logEvent(string memory actionType, address actor, address relatedUser, uint256 relatedAssetId, string memory details) external;
}

contract AccessControlManager is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");

    // role => actionId => allowed
    mapping(bytes32 => mapping(bytes32 => bool)) public rolePermissions;
    
    IAuditLog public auditLog;
    address public identityRegistry;

    modifier onlyIdentityActive(address user) {
        if (identityRegistry != address(0)) {
            (bool success, bytes memory data) = identityRegistry.staticcall(abi.encodeWithSignature("isActive(address)", user));
            require(success && abi.decode(data, (bool)), "AccessControlManager: Identity is not active");
        }
        _;
    }

    constructor(address _auditLogAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        auditLog = IAuditLog(_auditLogAddress);
    }

    function setIdentityRegistry(address _identityRegistry) external onlyRole(ADMIN_ROLE) {
        identityRegistry = _identityRegistry;
    }

    function assignRole(address user, bytes32 role) external onlyRole(ADMIN_ROLE) onlyIdentityActive(user) {
        grantRole(role, user);
        auditLog.logEvent("ROLE_ASSIGNED", msg.sender, user, 0, "Role assigned");
    }

    function revokeRoleUser(address user, bytes32 role) external onlyRole(ADMIN_ROLE) {
        revokeRole(role, user);
        auditLog.logEvent("ROLE_REVOKED", msg.sender, user, 0, "Role revoked");
    }

    function setPermission(bytes32 role, bytes32 action, bool allowed) external onlyRole(ADMIN_ROLE) {
        rolePermissions[role][action] = allowed;
        auditLog.logEvent("PERMISSION_UPDATED", msg.sender, address(0), 0, "Permission updated");
    }

    function checkPermission(address user, bytes32 action) public view returns (bool) {
        if (hasRole(ADMIN_ROLE, user)) {
            return true;
        }
        // Iterate through roles or check specific role permissions
        // For simplicity in this implementation, we can check if the user has a specific role that permits the action
        if (hasRole(MANAGER_ROLE, user) && rolePermissions[MANAGER_ROLE][action]) return true;
        if (hasRole(AUDITOR_ROLE, user) && rolePermissions[AUDITOR_ROLE][action]) return true;
        if (hasRole(USER_ROLE, user) && rolePermissions[USER_ROLE][action]) return true;
        
        return false;
    }

    function getUserRoles(address user) external view returns (bytes32[] memory) {
        bytes32[] memory roles = new bytes32[](4);
        uint256 count = 0;
        if (hasRole(ADMIN_ROLE, user)) roles[count++] = ADMIN_ROLE;
        if (hasRole(MANAGER_ROLE, user)) roles[count++] = MANAGER_ROLE;
        if (hasRole(AUDITOR_ROLE, user)) roles[count++] = AUDITOR_ROLE;
        if (hasRole(USER_ROLE, user)) roles[count++] = USER_ROLE;
        
        // Resize array
        bytes32[] memory activeRoles = new bytes32[](count);
        for(uint i=0; i<count; i++) {
            activeRoles[i] = roles[i];
        }
        return activeRoles;
    }
}
