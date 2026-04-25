const { ethers } = require("ethers");
const abi = require("../config/contractABI.json");

let provider, signer, contract;

/**
 * Initialize blockchain connection
 */
function initBlockchain() {
  const rpcUrl  = process.env.POLYGON_RPC_URL || "http://127.0.0.1:8545";
  const privKey = process.env.PRIVATE_KEY;
  const address = process.env.CONTRACT_ADDRESS;

  if (!address) { console.warn("⚠️  CONTRACT_ADDRESS not set — blockchain features disabled"); return; }

  provider = new ethers.JsonRpcProvider(rpcUrl);
  signer   = privKey ? new ethers.Wallet(privKey, provider) : null;
  contract = new ethers.Contract(address, abi, signer || provider);
  console.log("⛓  Blockchain service initialized →", rpcUrl);
}

/**
 * Issue certificate on-chain
 */
async function issueCertificateOnChain({ certId, certHash, ipfsHash, metadataURI }) {
  if (!contract || !signer) throw new Error("Blockchain not configured");
  const certIdBytes  = ethers.id(certId);          // bytes32 from string
  const certHashBytes = ethers.hexlify(ethers.toUtf8Bytes(certHash)).padEnd(66, "0").slice(0, 66);
  const tx = await contract.issueCertificate(certIdBytes, certHash, ipfsHash, metadataURI);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Verify certificate on-chain by comparing hashes
 */
async function verifyCertificateOnChain(certId, certHash) {
  if (!contract) return { onChain: false, reason: "Blockchain not configured" };
  const certIdBytes = ethers.id(certId);
  const [valid, revoked, cert] = await contract.verifyCertificate(certIdBytes, certHash);
  return {
    onChain:     true,
    valid,
    revoked,
    issuedAt:    cert.issuedAt ? new Date(Number(cert.issuedAt) * 1000).toISOString() : null,
    ipfsHash:    cert.ipfsHash,
    issuedBy:    cert.issuedBy,
  };
}

/**
 * Revoke certificate on-chain
 */
async function revokeCertificateOnChain(certId) {
  if (!contract || !signer) throw new Error("Blockchain not configured");
  const certIdBytes = ethers.id(certId);
  const tx = await contract.revokeCertificate(certIdBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

/**
 * Approve a university wallet on-chain
 */
async function approveUniversityOnChain(walletAddress, name) {
  if (!contract || !signer) throw new Error("Blockchain not configured");
  const tx = await contract.approveUniversity(walletAddress, name);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

module.exports = { initBlockchain, issueCertificateOnChain, verifyCertificateOnChain, revokeCertificateOnChain, approveUniversityOnChain };
