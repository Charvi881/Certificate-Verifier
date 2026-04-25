const crypto   = require("crypto");
const axios    = require("axios");
const FormData = require("form-data");

// ─── SHA-256 Hashing ─────────────────────────────────────────────────────────

/**
 * Generate SHA-256 hash of a buffer (PDF bytes)
 * @param {Buffer} buffer
 * @returns {string} hex hash prefixed with 0x
 */
function hashBuffer(buffer) {
  return "0x" + crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Hash a JSON metadata object
 */
function hashMetadata(meta) {
  const str = JSON.stringify(meta, Object.keys(meta).sort());
  return "0x" + crypto.createHash("sha256").update(str).digest("hex");
}

// ─── IPFS / Pinata ─────────────────────────────────────────────────────────

const PINATA_API_KEY    = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_BASE       = "https://api.pinata.cloud";

/**
 * Upload a PDF buffer to IPFS via Pinata
 * @returns {Promise<{ipfsHash: string, ipfsUrl: string}>}
 */
async function uploadToIPFS(fileBuffer, fileName, metadata = {}) {
  if (!PINATA_API_KEY) {
    // Mock for development
    const mockHash = "Qm" + crypto.randomBytes(22).toString("base64url");
    return { ipfsHash: mockHash, ipfsUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}` };
  }

  const form = new FormData();
  form.append("file", fileBuffer, { filename: fileName, contentType: "application/pdf" });

  const pinataMetadata = JSON.stringify({ name: fileName, keyvalues: metadata });
  form.append("pinataMetadata", pinataMetadata);

  const pinataOptions = JSON.stringify({ cidVersion: 1 });
  form.append("pinataOptions", pinataOptions);

  const response = await axios.post(`${PINATA_BASE}/pinning/pinFileToIPFS`, form, {
    maxBodyLength: Infinity,
    headers: {
      ...form.getHeaders(),
      pinata_api_key:        PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    }
  });

  const ipfsHash = response.data.IpfsHash;
  return { ipfsHash, ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}` };
}

/**
 * Upload JSON metadata to IPFS
 */
async function uploadMetadataToIPFS(metadata) {
  if (!PINATA_API_KEY) {
    const mockHash = "Qm" + crypto.randomBytes(22).toString("base64url");
    return { ipfsHash: mockHash, ipfsUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}` };
  }

  const response = await axios.post(`${PINATA_BASE}/pinning/pinJSONToIPFS`, {
    pinataContent:  metadata,
    pinataMetadata: { name: `cert-meta-${metadata.certId}.json` },
    pinataOptions:  { cidVersion: 1 },
  }, {
    headers: {
      "Content-Type":        "application/json",
      pinata_api_key:        PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    }
  });

  const ipfsHash = response.data.IpfsHash;
  return { ipfsHash, ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}` };
}

module.exports = { hashBuffer, hashMetadata, uploadToIPFS, uploadMetadataToIPFS };
