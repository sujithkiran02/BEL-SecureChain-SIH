// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlManager.sol";

contract IdentityRegistry {
    struct Identity {
        string didDocumentHash;   // IPFS hash of the DID Document (public key, service endpoints)
        bool isVerified;
        bool isRevoked;
        uint256 registeredAt;
    }

    mapping(address => Identity) public identities;
    mapping(string => address) public didToAddress; // reverse lookup did:trustchain:xxx -> wallet

    AccessControlManager public accessControl;
    IAuditLog public auditLog;

    constructor(address _accessControl, address _auditLog) {
        accessControl = AccessControlManager(_accessControl);
        auditLog = IAuditLog(_auditLog);
    }

    modifier onlyAdmin() {
        require(accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender), "IdentityRegistry: Must be admin");
        _;
    }

    function registerIdentity(string memory didDocumentHash, string memory didString) external {
        require(identities[msg.sender].registeredAt == 0, "IdentityRegistry: Identity already exists");
        require(didToAddress[didString] == address(0), "IdentityRegistry: DID already used");

        identities[msg.sender] = Identity({
            didDocumentHash: didDocumentHash,
            isVerified: false,
            isRevoked: false,
            registeredAt: block.timestamp
        });
        
        didToAddress[didString] = msg.sender;

        auditLog.logEvent("IDENTITY_REGISTERED", msg.sender, msg.sender, 0, didString);
    }

    function verifyIdentity(address wallet) external onlyAdmin {
        require(identities[wallet].registeredAt != 0, "IdentityRegistry: Identity not registered");
        require(!identities[wallet].isVerified, "IdentityRegistry: Already verified");
        require(!identities[wallet].isRevoked, "IdentityRegistry: Cannot verify revoked identity");

        identities[wallet].isVerified = true;

        auditLog.logEvent("IDENTITY_VERIFIED", msg.sender, wallet, 0, "Identity verified");
    }

    function revokeIdentity(address wallet, string memory reason) external onlyAdmin {
        require(identities[wallet].registeredAt != 0, "IdentityRegistry: Identity not registered");
        require(!identities[wallet].isRevoked, "IdentityRegistry: Already revoked");

        identities[wallet].isRevoked = true;
        identities[wallet].isVerified = false;

        // Revoking cascades logic could be handled here or via events listening on backend
        // AccessControlManager could also use isActive check directly (already implemented).

        auditLog.logEvent("IDENTITY_REVOKED", msg.sender, wallet, 0, reason);
    }

    function getIdentity(address wallet) external view returns (Identity memory) {
        return identities[wallet];
    }

    function isActive(address wallet) external view returns (bool) {
        Identity memory id = identities[wallet];
        return id.isVerified && !id.isRevoked;
    }
}
