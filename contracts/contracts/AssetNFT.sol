// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./AccessControlManager.sol";

interface IIdentityRegistry {
    function isActive(address wallet) external view returns (bool);
}

contract AssetNFT is ERC721URIStorage {
    bytes32 public constant MINT_ASSET = keccak256("MINT_ASSET");
    bytes32 public constant TRANSFER_ASSET = keccak256("TRANSFER_ASSET");

    struct AssetMeta {
        address ownerDID;         // wallet acting as identity anchor
        string metadataHash;      // IPFS CID
        uint256 mintedAt;
        bool isRevoked;
    }

    mapping(uint256 => AssetMeta) public assetData;
    uint256 public nextTokenId;

    AccessControlManager public accessControl;
    IAuditLog public auditLog;
    IIdentityRegistry public identityRegistry;

    modifier onlyPermitted(bytes32 action) {
        require(accessControl.checkPermission(msg.sender, action), "TrustChain: not permitted");
        _;
    }

    modifier onlyActiveIdentity(address user) {
        require(identityRegistry.isActive(user), "TrustChain: Identity not active");
        _;
    }

    constructor(address _accessControl, address _auditLog, address _identityRegistry) ERC721("TrustChain Asset", "TCA") {
        accessControl = AccessControlManager(_accessControl);
        auditLog = IAuditLog(_auditLog);
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    function mintAsset(address to, string memory metadataURI) external onlyPermitted(MINT_ASSET) onlyActiveIdentity(to) {
        uint256 tokenId = nextTokenId++;
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        assetData[tokenId] = AssetMeta({
            ownerDID: to,
            metadataHash: metadataURI,
            mintedAt: block.timestamp,
            isRevoked: false
        });

        auditLog.logEvent("ASSET_MINTED", msg.sender, to, tokenId, metadataURI);
    }

    function transferAsset(uint256 tokenId, address newOwner) external onlyPermitted(TRANSFER_ASSET) onlyActiveIdentity(newOwner) {
        address owner = ownerOf(tokenId);
        require(!assetData[tokenId].isRevoked, "AssetNFT: Asset is revoked");

        _isCustomTransfer = true;
        _transfer(owner, newOwner, tokenId);
        _isCustomTransfer = false;
        
        assetData[tokenId].ownerDID = newOwner;

        auditLog.logEvent("ASSET_TRANSFERRED", msg.sender, newOwner, tokenId, "Asset transferred");
    }

    function revokeAsset(uint256 tokenId, string memory reason) external {
        require(accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender), "AssetNFT: Must be admin");
        require(!assetData[tokenId].isRevoked, "AssetNFT: Already revoked");

        assetData[tokenId].isRevoked = true;

        auditLog.logEvent("ASSET_REVOKED", msg.sender, ownerOf(tokenId), tokenId, reason);
    }

    bool private _isCustomTransfer;

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        if (from != address(0) && to != address(0)) {
            require(_isCustomTransfer, "AssetNFT: Use transferAsset with proper permissions");
        }
    }

    function verifyAsset(uint256 tokenId) external view returns (bool valid, address owner, string memory metadataHash) {
        require(_ownerOf(tokenId) != address(0), "AssetNFT: Nonexistent token");
        AssetMeta memory meta = assetData[tokenId];
        
        return (!meta.isRevoked, meta.ownerDID, meta.metadataHash);
    }
}
