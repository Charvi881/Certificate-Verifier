// Run this script to approve all universities on the local blockchain
// Usage: node approveUniversities.js
// Run from: securedtrust/blockchain/

require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load contract ABI
const artifact = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"),
    "utf8"
  )
);

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || "http://127.0.0.1:8545");
  const signer   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, artifact.abi, signer);

  console.log("🔗 Connected to:", process.env.POLYGON_RPC_URL);
  console.log("👤 Owner wallet:", signer.address);
  console.log("📄 Contract:", process.env.CONTRACT_ADDRESS);
  console.log("");

  // ── List every university wallet address you want to approve ──
  // These are the walletAddress values from your MongoDB universities collection
  // Since you're on localhost, use the Hardhat Account #0 address for all of them
  const universities = [
    {
      wallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      name:   "All Universities (Hardhat Account #0)"
    },
    // Add more if universities have different wallet addresses:
    // { wallet: "0xAnotherAddress", name: "University Name" },
  ];

  for (const uni of universities) {
    try {
      // Check if already approved
      const info = await contract.universities(uni.wallet);
      if (info.approved) {
        console.log(`✅ Already approved: ${uni.name} (${uni.wallet})`);
        continue;
      }

      console.log(`⏳ Approving: ${uni.name} (${uni.wallet})...`);
      const tx = await contract.approveUniversity(uni.wallet, uni.name);
      await tx.wait();
      console.log(`✅ Approved! TX: ${tx.hash}`);
    } catch (err) {
      console.error(`❌ Failed for ${uni.wallet}:`, err.message);
    }
  }

  console.log("\n🎉 Done! All universities approved. Issue a certificate to test.");
}

main().catch(console.error);