const hre = require("hardhat");

// 部署MytestbcToken代币合约和Faucet合约

async function main() {
    // 获取部署者账户
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署账户:", deployer.address);
    
    // 获取网络信息
    const network = await hre.ethers.provider.getNetwork();
    console.log("当前网络名称:", network.name);
    console.log("当前链ID:", network.chainId);
    
    // 获取当前区块高度
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log("当前区块高度:", blockNumber);

    try {
        // 部署MytestbcToken代币合约
        console.log("\n====== 部署MytestbcToken代币合约 ======");
        const MytestbcToken = await hre.ethers.getContractFactory("MytestbcToken");
        const token = await MytestbcToken.deploy();
        
        // 获取部署交易
        const tokenDeployTx = token.deploymentTransaction();
        console.log("代币部署交易哈希:", tokenDeployTx.hash);
        
        // 等待部署完成
        await token.waitForDeployment();
        const tokenAddress = await token.getAddress();
        
        // 获取交易收据
        const tokenReceipt = await tokenDeployTx.wait();
        
        console.log("\n====== 代币部署详情 ======");
        console.log("MytestbcToken合约地址:", tokenAddress);
        console.log("交易区块号:", tokenReceipt.blockNumber);
        console.log("Gas使用量:", tokenReceipt.gasUsed.toString());
        console.log("交易状态:", tokenReceipt.status === 1 ? "成功" : "失败");
        
        // 检查代币余额
        const balance = await token.balanceOf(deployer.address);
        console.log("部署账户代币余额:", hre.ethers.formatEther(balance));
        
        // 要转入水龙头的代币数量（考虑18位小数）
        const faucetAmount = hre.ethers.parseEther("100000000"); // 100000000个代币
        
        // 部署Faucet合约
        console.log("\n====== 部署Faucet合约 ======");
        const Faucet = await hre.ethers.getContractFactory("Faucet");
        const faucet = await Faucet.deploy(tokenAddress);
        
        // 获取部署交易
        const faucetDeployTx = faucet.deploymentTransaction();
        console.log("Faucet部署交易哈希:", faucetDeployTx.hash);
        
        // 等待部署完成
        await faucet.waitForDeployment();
        const faucetAddress = await faucet.getAddress();
        
        // 获取交易收据
        const faucetReceipt = await faucetDeployTx.wait();
        
        console.log("\n====== Faucet部署详情 ======");
        console.log("Faucet合约地址:", faucetAddress);
        console.log("交易区块号:", faucetReceipt.blockNumber);
        console.log("Gas使用量:", faucetReceipt.gasUsed.toString());
        console.log("交易状态:", faucetReceipt.status === 1 ? "成功" : "失败");
        
        // 向Faucet合约转入代币
        console.log("\n开始向Faucet合约转入代币...");
        const transferTx = await token.transfer(faucetAddress, faucetAmount);
        console.log("转账交易哈希:", transferTx.hash);
        
        // 等待转账完成
        const transferReceipt = await transferTx.wait();
        
        // 检查Faucet合约的代币余额
        const faucetBalance = await token.balanceOf(faucetAddress);
        console.log("\n====== 转账结果 ======");
        console.log("Faucet合约代币余额:", hre.ethers.formatEther(faucetBalance));
        console.log("转账Gas使用量:", transferReceipt.gasUsed.toString());
        console.log("转账状态:", transferReceipt.status === 1 ? "成功" : "失败");
        
        // 验证Faucet合约的tokenContract是否正确设置
        const tokenContractAddress = await faucet.tokenContract();
        console.log("\n====== 验证Faucet合约 ======");
        console.log("Faucet合约中的代币地址:", tokenContractAddress);
        console.log("是否正确设置:", tokenContractAddress === tokenAddress ? "是" : "否");
        
        // 获取每次领取的代币数量
        const amountAllowed = await faucet.amountAllowed();
        console.log("每次可领取的代币数量:", hre.ethers.formatEther(amountAllowed));
        
        console.log("\n====== 部署总结 ======");
        console.log("MytestbcToken合约地址:", tokenAddress);
        console.log("Faucet合约地址:", faucetAddress);
        console.log("部署账户代币余额:", hre.ethers.formatEther(balance - faucetAmount));
        console.log("Faucet合约代币余额:", hre.ethers.formatEther(faucetBalance));
        
        console.log("\n====== 前端更新提示 ======");
        console.log("请更新frontend/src/pages/Faucet.jsx中的faucetAddress变量为:", faucetAddress);
        console.log("请确保frontend/src/contracts/Faucet.json文件已更新为最新的合约ABI");
        
        // 生成更新前端的命令
        console.log("\n====== 快速更新命令 ======");
        console.log(`sed -i 's/const faucetAddress = .*;/const faucetAddress = "${faucetAddress}";/' frontend/src/pages/Faucet.jsx`);
        
    } catch (error) {
        console.error("\n====== 错误详情 ======");
        console.error("错误类型:", error.name);
        console.error("错误消息:", error.message);
        if (error.code) {
            console.error("错误代码:", error.code);
        }
        if (error.data) {
            console.error("错误数据:", error.data);
        }
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});