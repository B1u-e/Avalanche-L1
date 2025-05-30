require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "avalancheLocal",
  networks: {
    avalancheLocal: {
      url: "http://127.0.0.1:38561/ext/bc/h2BZHAsqc5c1af6dAHzMHYS5NGmHGmRhUZr9QtaVFXzDqtETu/rpc",
      chainId: 337,
      accounts: [
        "56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
      ],
    },
  },
};
