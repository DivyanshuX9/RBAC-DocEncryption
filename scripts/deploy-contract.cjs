const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DocumentRegistry contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const contract = await DocumentRegistry.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ Contract deployed successfully!");
  console.log("Contract address:", address);
  console.log("\nAdd this to your .env.local:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
