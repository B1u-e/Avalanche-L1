const hre = require("hardhat");

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

  console.log("\n===== 部署SBT合约 =====");
  console.log("代币名称: Mytestbct SBT");
  console.log("代币符号: MSTB");

  // 获取合约工厂
  const SBT = await hre.ethers.getContractFactory("SBT");
  
  // 部署合约，并传递构造函数参数
  const sbt = await SBT.deploy("Mytestbct SBT", "MSTB");
  
  // 获取部署交易
  const deployTx = sbt.deploymentTransaction();
  console.log("部署交易哈希:", deployTx.hash);
  
  // 等待合约部署完成
  await sbt.waitForDeployment();
  
  // 获取交易收据
  const receipt = await deployTx.wait();
  
  // 获取合约地址
  const sbtAddress = await sbt.getAddress();
  
  console.log("\n===== 部署详情 =====");
  console.log("SBT合约地址:", sbtAddress);
  console.log("交易区块号:", receipt.blockNumber);
  console.log("Gas使用量:", receipt.gasUsed.toString());
  console.log("交易状态:", receipt.status === 1 ? "Success" : "Failed");
  
  // 显示事件日志
  if (receipt.logs && receipt.logs.length > 0) {
    console.log("\n===== 事件日志 =====");
    for (let i = 0; i < receipt.logs.length; i++) {
      console.log(`日志 ${i + 1}:`, receipt.logs[i]);
    }
  }

  console.log("\n部署完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 