// 部署MytestbcToken和Faucet合约
const { ethers } = require("hardhat");

async function main() {
  console.log("开始部署合约...");

  // 部署MytestbcToken合约
  console.log("正在部署MytestbcToken合约...");
  const MytestbcToken = await ethers.getContractFactory("MytestbcToken");
  const token = await MytestbcToken.deploy();
  await token.deployed();
  console.log("MytestbcToken合约已部署到:", token.address);

  // 部署Faucet合约，使用MytestbcToken地址作为参数
  console.log("正在部署Faucet合约...");
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(token.address);
  await faucet.deployed();
  console.log("Faucet合约已部署到:", faucet.address);

  // 向Faucet合约转移一些代币
  console.log("向Faucet合约转移代币...");
  const transferAmount = ethers.utils.parseEther("1000000"); // 转移100万代币
  await token.transfer(faucet.address, transferAmount);
  console.log(`已向Faucet合约转移 ${ethers.utils.formatEther(transferAmount)} MTBT代币`);

  console.log("部署完成！");
  console.log("MytestbcToken地址:", token.address);
  console.log("Faucet地址:", faucet.address);
  
  // 验证合约
  console.log("\n请记得在区块链浏览器上验证合约:");
  console.log(`npx hardhat verify --network <network> ${token.address}`);
  console.log(`npx hardhat verify --network <network> ${faucet.address} ${token.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 