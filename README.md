# Avalanche L1 

这是一个基于以太坊的去中心化应用(DApp)项目，部署在Avalanche L1 local网络上，主要包含Avalanche L1 详细的本地部署方法、代币水龙头(Faucet)的领取和灵魂绑定代币(SBT)的铸造功能。项目使用Hardhat作为开发框架，React作为前端框架，支持与MetaMask等钱包连接进行交互。

## 项目结构

```
L1test/
├── contracts/                # 智能合约目录
│   ├── Faucet.sol           # 代币水龙头合约
│   └── SBT.sol              # 灵魂绑定代币合约
├── scripts/                  # 部署脚本
│   ├── deploy-faucet.js     # Faucet合约部署脚本
│   └── deploySBT.js         # SBT合约部署脚本
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/      # 通用组件
│   │   ├── pages/           # 页面组件
│   │   └── contracts/       # 合约ABI
├── hardhat.config.js        # Hardhat配置文件
└── package.json             # 项目依赖
```

## 功能特性

### 1. 代币水龙头 (Faucet)

- 允许用户领取测试代币(MTBT)
- 支持向指定地址发送代币
- 用户可以将代币返还给水龙头
- 实时显示用户余额和水龙头余额

### 2. 灵魂绑定代币 (SBT)

- 符合ERC721标准但不可转让的NFT
- 一个地址只能拥有一个SBT
- 支持铸造和销毁功能
- 支持设置铸造价格
- 支持元数据URI存储

## 技术栈

### 后端/区块链
- Solidity 
- Hardhat
- Ethers.js

### 前端
- React 
- wagmi/viem (Web3交互库)
- Chakra UI (UI组件库)
- React Router (路由)

## Avalanche L1 部署教程

在开始项目前，需要先部署和设置好Avalanche L1本地网络，推荐使用Mac或者windows下wsl2的Ubuntu系统。
以下是基于[Avalanche CLI官方文档](https://build.avax.network/docs/tooling/get-avalanche-cli)的步骤。 

--- 部署过程图片版请看img文件夹。

### 1. 安装Avalanche CLI

```bash
# 下载并安装Avalanche CLI
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s
```

该安装脚本会将二进制文件安装到`~/bin`目录。如果该目录不存在，将会自动创建。

### 2. 将Avalanche CLI添加到PATH

然后你需要将其添加到系统路径中。（如果使用bash，则为`.bashrc`；如果使用zsh，则为`.zshrc`）：

```bash
export PATH=~/bin:$PATH >> .bashrc
```

### 3. 验证安装

运行以下命令验证安装是否成功：

```bash
avalanche --version
```

### 4. 创建并启动本地Avalanche L1网络

```bash
# 创建一个本地子网 ---（基本是选择默认配置）
avalanche blockchain create mytestbc
    #选择你需要的虚拟机配置
    ? Which Virtual Machine would you like to use?: 
     ▸ Subnet-EVM
     Custom VM
     Explain the difference

    #选择验证器管理器
    ? Which validator management type would you like to use in your         blockchain?: 
     ▸ Proof Of Authority
       Proof Of Stake
       Explain the difference

    ? Which address do you want to enable as controller of ValidatorManager contract?: 
     ▸ Get address from an existing stored key (created from avalanche key  create or avalanche key import)
     Custom

    ? Which stored key should be used enable as controller of ValidatorManager contract?: 
     ▸ ewoq
       cli-awm-relayer
       cli-teleporter-deployer

    #选择区块链配置
    ? Do you want to use default values for the Blockchain configuration?: 
     ▸ I want to use defaults for a test environment
       I want to use defaults for a production environment
       I don't want to use default values
       Explain the difference
```
```bash
    #给你本地部署的Avalanche L1输入一个唯一的chain id 和 原生的代币符号
     Chain ID: 
     Token Symbol: 

    #如果部署成功，终端将会打印：
     Successfully created blockchain configuration

    #如果你要查看Genesis配置，可以在终端输入
     avalanche blockchain describe myblockchain --genesis
```
```bash
# 部署本地子网
    avalanche blockchain deploy mytestbc
    or
    avalanche blockchain deploy mytestbc --local

    #也可以部署到其他网络
    ? Choose a network for the operation: 
     ▸ Local Network
       Devnet
       Etna Devnet
       Fuji Testnet
       Mainnet

# 查看子网信息
avalanche blockchain describe mytestbc

#启动或停止本地网络
    avalanche network start
    
    avalanche node local start mytestbc-local-node-local-network

    avalanche network stop
```

### 5. 将本地网络添加到MetaMask

1. 打开MetaMask，点击网络下拉菜单
2. 选择"添加网络"
3. 输入Avalanche CLI提供的RPC URL、链ID和其他信息
4. 点击"保存"，就可以连接上本地的网络啦

### 6. 获取测试代币

```bash
# 查看本地账户
avalanche key list

# 向账户发送测试代币
avalanche key fund <YOUR_ADDRESS> --local
```

完成以上步骤后，您就可以在本地Avalanche L1网络上部署和测试智能合约了。

## 部署指南

### 1. 安装依赖

```bash
# 安装项目根目录依赖
npm install

# 安装前端依赖
cd frontend
npm install
```

### 2. 配置本地区块链网络

项目默认配置为连接本地Avalanche网络。如需修改，请编辑`hardhat.config.js`文件。

### 3. 部署智能合约

#### 部署代币和水龙头合约

```bash
npx hardhat run scripts/deploy-faucet.js --network avalancheLocal
```

这将部署MytestbcToken代币合约和Faucet水龙头合约，并向水龙头转移100万代币。

#### 部署SBT合约

```bash
npx hardhat run scripts/deploySBT.js --network avalancheLocal
```

### 4. 更新前端合约地址

部署完成后，需要更新前端代码中的合约地址：

1. 在`frontend/src/pages/Faucet.jsx`中更新`faucetAddress`变量
2. 在`frontend/src/pages/SBT.jsx`中更新`sbtAddress`变量

### 5. 启动前端应用

```bash
cd frontend
npm start
```

应用将在http://localhost:3000启动。

## 使用说明

### 连接钱包

1. 在应用中点击"连接钱包"按钮
2. 选择MetaMask或其他支持的钱包
3. 确认连接请求

### 使用代币水龙头

1. 导航到"Faucet"页面
2. 点击"领取MTBT代币"按钮
3. 输入接收地址(默认为当前连接的钱包地址)
4. 确认交易

### 铸造SBT

1. 导航到"SBT"页面
2. 输入元数据URI或上传图片(如果支持)
3. 点击"铸造SBT"按钮
4. 确认交易并支付铸造费用

## 注意事项

- 请确保钱包连接到正确的网络(默认为Avalanche本地测试网)
- 水龙头合约需要有足够的代币余额才能发放代币
- 每个地址只能铸造一个SBT

## 许可证

MIT
