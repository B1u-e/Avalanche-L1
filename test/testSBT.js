const hre = require("hardhat");

async function main() {
  console.log("===== SBT付费铸造测试 =====\n");
  
  // 获取测试账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("测试账户:", deployer.address);
  
  // 获取网络信息
  const network = await hre.ethers.provider.getNetwork();
  console.log("当前网络:", network.name, "链ID:", network.chainId);

  // 第一步：部署SBT合约
  console.log("\n===== 步骤1: 部署SBT合约 =====");
  
  const SBT = await hre.ethers.getContractFactory("SBT");
  console.log("部署SBT合约 (名称: 欢迎光临, 符号: Welcome)...");
  
  // 部署合约
  const sbt = await SBT.deploy("欢迎光临", "Welcome");
  await sbt.waitForDeployment();
  const sbtAddress = await sbt.getAddress();
  
  console.log("SBT合约已部署到地址:", sbtAddress);
  
  // 第二步：查看合约信息
  console.log("\n===== 步骤2: 查看合约信息 =====");
  
  const name = await sbt.name();
  const symbol = await sbt.symbol();
  const owner = await sbt.owner();
  const mintPrice = await sbt.mintPrice();
  
  console.log("代币名称:", name);
  console.log("代币符号:", symbol);
  console.log("合约所有者:", owner);
  console.log("铸造价格:", hre.ethers.formatEther(mintPrice), "ETH");
  
  // 第三步：测试付费铸造功能
  console.log("\n===== 步骤3: 测试付费铸造 =====");
  
  try {
    // 检查部署账户是否已经拥有SBT
    const balance = await sbt.balanceOf(deployer.address);
    
    if (balance > 0) {
      console.log("账户已拥有SBT，无法再次铸造");
      return;
    }
    
    console.log(`尝试铸造SBT (支付 ${hre.ethers.formatEther(mintPrice)} ETH)...`);
    
    // 执行付费铸造
    const mintTx = await sbt.mintWithPayment(
      "https://example.com/metadata/test",
      { value: mintPrice }
    );
    
    console.log("铸造交易已提交，等待确认...");
    console.log("交易哈希:", mintTx.hash);
    
    // 等待交易确认
    const mintReceipt = await mintTx.wait();
    console.log("铸造交易已确认，区块号:", mintReceipt.blockNumber);
    
    // 从事件日志中提取tokenId
    let tokenId;
    for (const log of mintReceipt.logs) {
      try {
        const parsedLog = sbt.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === "Attest") {
          tokenId = parsedLog.args.tokenId;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 第四步：验证铸造结果
    console.log("\n===== 步骤4: 验证铸造结果 =====");
    
    if (tokenId) {
      console.log("SBT令牌ID:", tokenId.toString());
      
      // 获取代币URI
      const tokenURI = await sbt.tokenURI(tokenId);
      console.log("SBT URI:", tokenURI);
      
      // 获取代币所有者
      const tokenOwner = await sbt.ownerOf(tokenId);
      console.log("SBT所有者:", tokenOwner);
      
      // 再次检查余额
      const newBalance = await sbt.balanceOf(deployer.address);
      console.log("账户SBT余额:", newBalance.toString());
    } else {
      console.log("未能从事件日志中提取tokenId");
      
      // 手动查询账户拥有的SBT
      const newBalance = await sbt.balanceOf(deployer.address);
      console.log("账户当前SBT余额:", newBalance.toString());
      
      if (newBalance > 0) {
        console.log("铸造似乎成功，但无法获取具体tokenId");
      }
    }
    
    // 检查合约余额
    const contractBalance = await hre.ethers.provider.getBalance(sbtAddress);
    console.log("合约ETH余额:", hre.ethers.formatEther(contractBalance), "ETH");
    
  } catch (error) {
    console.error("铸造测试失败:", error.message);
  }
  
  console.log("\n测试完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 