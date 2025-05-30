// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title 灵魂绑定代币 (SBT) 合约
 * @dev 这是一个简化的SBT实现，代币一旦铸造给某地址后不能被转移，只能被销毁
 */
contract SBT is Ownable, ERC165, IERC721, IERC721Metadata {
    // 事件
    event Attest(address indexed to, uint256 indexed tokenId);
    event Revoke(address indexed from, uint256 indexed tokenId);
    event MintPriceChanged(uint256 oldPrice, uint256 newPrice);
    event Withdrawn(address to, uint256 amount);

    // 错误
    error TokenNonExistent(uint256 tokenId);
    error AlreadyMinted(address to);
    error Unauthorized(address caller, uint256 tokenId);
    error SoulboundTokenNoTransfer(string message);
    error InsufficientPayment(uint256 paid, uint256 required);

    // 状态变量
    string private _name;
    string private _symbol;
    uint256 private _nextTokenId = 1;
    uint256 public mintPrice = 1 * 10 ** 18; // 默认铸造价格为1个代币

    // 映射
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _ownedTokens; // 用户拥有的token
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    constructor(
        string memory name_,
        string memory symbol_
    ) Ownable(msg.sender) {
        _name = name_;
        _symbol = symbol_;
    }

    function mint(
        address to,
        string memory uri
    ) public onlyOwner returns (uint256) {
        if (to == address(0)) revert("SBT: can`t mint to the zero address");
        if (_balances[to] > 0) revert AlreadyMinted(to);

        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId, uri);
        return tokenId;
    }

    function mintWithPayment(
        string memory uri
    ) public payable returns (uint256) {
        address to = msg.sender;

        // 检查支付金额
        if (msg.value < mintPrice)
            revert InsufficientPayment(msg.value, mintPrice);

        // 检查接收地址是否有效以及是否已经铸造过
        if (to == address(0)) revert("SBT: mint to the zero address");
        if (_balances[to] > 0) revert AlreadyMinted(to);

        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId, uri);
        return tokenId;
    }

    /**
     * @dev 设置铸造价格
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceChanged(oldPrice, newPrice);
    }

    /**
     * @dev 提取合约中的token
     */
    function withdraw(address payable to) public onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = to.call{value: balance}("");
        require(success, "Withdrawal failed");
        emit Withdrawn(to, balance);
    }

    function _mint(address to, uint256 tokenId, string memory uri) internal {
        _balances[to] += 1;
        _owners[tokenId] = to;
        _ownedTokens[to] = tokenId;
        _tokenURIs[tokenId] = uri;

        emit Attest(to, tokenId);
        emit Transfer(address(0), to, tokenId);
    }

    function burn(uint256 tokenId) public {
        address owner = ownerOf(tokenId);

        // 检查调用者是否为代币拥有者或合约拥有者
        if (msg.sender != owner && msg.sender != this.owner())
            revert Unauthorized(msg.sender, tokenId);

        _burn(tokenId);
    }

    function _burn(uint256 tokenId) internal {
        address owner = ownerOf(tokenId);

        _balances[owner] -= 1;
        delete _owners[tokenId];
        delete _ownedTokens[owner];
        delete _tokenURIs[tokenId];
        delete _tokenApprovals[tokenId];

        emit Revoke(owner, tokenId);
        emit Transfer(owner, address(0), tokenId);
    }

    /**
     * @dev 返回指定地址拥有的代币数量
     */
    function balanceOf(address owner) public view override returns (uint256) {
        require(owner != address(0), "SBT: address zero is not a valid owner");
        return _balances[owner];
    }

    /**
     * @dev 返回指定代币ID的所有者
     */
    function ownerOf(uint256 tokenId) public view override returns (address) {
        address owner = _owners[tokenId];
        if (owner == address(0)) revert TokenNonExistent(tokenId);
        return owner;
    }

    /**
     * @dev 获取代币URI
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        if (!_exists(tokenId)) revert TokenNonExistent(tokenId);
        return _tokenURIs[tokenId];
    }

    /**
     * @dev 检查代币是否存在
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }

    /**
     * @dev 返回代币名称
     */
    function name() public view override returns (string memory) {
        return _name;
    }

    /**
     * @dev 返回代币符号
     */
    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev 禁止转移函数
     */
    function transferFrom(address, address, uint256) public pure override {
        revert SoulboundTokenNoTransfer("SBT cannot be transferred");
    }

    function safeTransferFrom(address, address, uint256) public pure override {
        revert SoulboundTokenNoTransfer("SBT cannot be transferred");
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert SoulboundTokenNoTransfer("SBT cannot be transferred");
    }

    function approve(address, uint256) public pure override {
        revert SoulboundTokenNoTransfer("SBT cannot be approved");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundTokenNoTransfer("SBT cannot be approved");
    }

    function getApproved(uint256) public pure override returns (address) {
        revert SoulboundTokenNoTransfer("SBT cannot be approved");
    }

    function isApprovedForAll(
        address,
        address
    ) public pure override returns (bool) {
        return false;
    }

    /**
     * @dev 合约支持的接口标识
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    receive() external payable {}
}
