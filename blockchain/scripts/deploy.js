const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying CertificateRegistry with account:", deployer.address);
  console.log("   Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("\n✅ CertificateRegistry deployed to:", address);
  console.log("   Network:", hre.network.name);
  console.log("\n📋 Add this to your backend .env:");
  console.log(`   CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
