// SPDX-License-Identifier: MIT
// By 0xAA
pragma solidity ^0.8.21;

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

// 自定义ERC20代币合约 - Mytestbc Token
contract MytestbcToken is IERC20 {
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;
    uint256 public override totalSupply; // 代币总供给
    string public name = "Mytestbc Token"; // 名称
    string public symbol = "MTBT"; // 符号
    uint8 public decimals = 18; // 小数位数

    constructor() {
        // 初始化总发行量为2亿
        uint256 initialSupply = 200_000_000 * 10 ** 18;
        balanceOf[msg.sender] = initialSupply;
        totalSupply = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
    }

    // @dev 实现`transfer`函数，代币转账逻辑
    function transfer(
        address recipient,
        uint amount
    ) public override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    // @dev 实现 `approve` 函数, 代币授权逻辑
    function approve(
        address spender,
        uint amount
    ) public override returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // @dev 实现`transferFrom`函数，代币授权转账逻辑
    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) public override returns (bool) {
        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    // @dev 铸造代币，从 `0` 地址转账给 调用者地址
    function mint(uint amount) external {
        balanceOf[msg.sender] += amount;
        totalSupply += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    // @dev 销毁代币，从 调用者地址 转账给 `0` 地址
    function burn(uint amount) external {
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
}

// ERC20代币的水龙头合约
contract Faucet {
    uint256 public amountAllowed = 1000 * 10 ** 18; // 每次领 1000单位代币，考虑18位小数
    address public tokenContract; // token合约地址
    mapping(address => bool) public requestedAddress; // 记录领取过代币的地址

    // SendToken事件
    event SendToken(address indexed Receiver, uint256 indexed Amount);
    // ReturnToken事件
    event ReturnToken(address indexed Sender, uint256 indexed Amount);

    // 部署时设定ERC20代币合约
    constructor(address _tokenContract) {
        require(_tokenContract != address(0), "Invalid token contract address");
        tokenContract = _tokenContract; // set token contract
    }

    // 用户领取代币函数
    function requestTokens() external {
        IERC20 token = IERC20(tokenContract); // 创建IERC20合约对象
        require(
            token.balanceOf(address(this)) >= amountAllowed,
            "Faucet Empty!"
        ); // 水龙头空了

        token.transfer(msg.sender, amountAllowed); // 发送token
        requestedAddress[msg.sender] = true;

        emit SendToken(msg.sender, amountAllowed); // 释放SendToken事件
    }

    // 新增：向指定地址发送代币
    function requestTokensTo(address recipient) external {
        IERC20 token = IERC20(tokenContract); // 创建IERC20合约对象
        require(
            token.balanceOf(address(this)) >= amountAllowed,
            "Faucet Empty!"
        ); // 水龙头空了
        require(recipient != address(0), "Invalid recipient address");

        token.transfer(recipient, amountAllowed); // 发送token到指定地址
        requestedAddress[recipient] = true;

        emit SendToken(recipient, amountAllowed); // 释放SendToken事件
    }

    // 用户返还代币函数
    function returnTokens() external {
        IERC20 token = IERC20(tokenContract);
        uint256 balance = token.balanceOf(msg.sender);
        require(balance > 0, "No tokens to return");

        // 转移用户所有代币到水龙头合约
        token.transferFrom(msg.sender, address(this), balance);

        emit ReturnToken(msg.sender, balance);
    }
}
