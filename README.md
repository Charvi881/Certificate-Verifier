# 🔐 SecuredTrust — Blockchain Certificate Verification System

> Tamper-proof, decentralized, and transparent certificate verification powered by Ethereum / Polygon, IPFS, and SHA-256 cryptography.

---

## 📁 Project Structure

```
securedtrust/
├── blockchain/              # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── CertificateRegistry.test.js
│   ├── hardhat.config.js
│   └── package.json
│
├── backend/                 # Node.js + Express REST API
│   ├── models/              # Mongoose models (User, University, Certificate)
│   ├── routes/              # auth, admin, university, verifier
│   ├── middleware/          # JWT auth, file upload (Multer), error handler
│   ├── utils/               # blockchain.js (ethers), ipfs.js (Pinata + SHA-256)
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/                # React 18 + Vite + Tailwind CSS
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx       (+ RegisterPage)
    │   │   ├── VerifyPage.jsx      (public verification)
    │   │   ├── admin/
    │   │   │   └── AdminDashboard.jsx
    │   │   ├── university/
    │   │   │   ├── UniversityDashboard.jsx
    │   │   │   ├── IssueCertificate.jsx
    │   │   │   └── CertificatesList.jsx
    │   │   └── verifier/
    │   │       └── VerifierDashboard.jsx
    │   ├── components/
    │   │   └── DashboardLayout.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── utils/
    │   │   ├── api.js
    │   │   └── helpers.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- MetaMask wallet
- Pinata account (free tier works)

---

### Step 1 — Deploy Smart Contract

```bash
cd blockchain
npm install

# Start local Hardhat node (for development)
npm run node

# In another terminal, deploy locally
npm run deploy:local

# OR deploy to Polygon Mumbai testnet
npm run deploy:testnet
```

Copy the deployed `CONTRACT_ADDRESS` from the output.

Run tests:
```bash
npm test
```

---

### Step 2 — Configure & Start Backend

```bash
cd backend
npm install

# Create your .env from the template
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/securedtrust
JWT_SECRET=your_super_secret_min_32_chars

# From Step 1
CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Polygon Mumbai RPC
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_wallet_private_key

# Pinata (https://app.pinata.cloud)
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
```

```bash
# Start development server
npm run dev
```

API runs at `http://localhost:5000`

---

### Step 3 — Start Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`

---

## 🔑 User Roles & Access

| Role         | Can Do |
|--------------|--------|
| **Admin**    | Approve universities, manage users, monitor activity |
| **University** | Issue certificates, upload PDFs, revoke certificates |
| **Verifier** | Upload PDFs or enter certificate IDs to verify |
| **Public**   | Use `/verify` page — no login required |

**First admin:** Manually set `role: "admin"` in MongoDB for your user, or use `db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })`.

---

## ⛓ How It Works

### Certificate Issuance
```
University uploads PDF
        ↓
SHA-256 hash generated (browser-side)
        ↓
PDF uploaded to IPFS via Pinata → returns CID
        ↓
Metadata JSON uploaded to IPFS → returns metadataURI
        ↓
issueCertificate(certId, hash, ipfsHash, metaURI)
called on CertificateRegistry.sol
        ↓
Transaction mined on Polygon → txHash + blockNumber stored in MongoDB
```

### Certificate Verification
```
Verifier uploads PDF (or enters certId)
        ↓
SHA-256 hash recomputed from uploaded bytes
        ↓
verifyCertificate(certId, hash) called on smart contract
        ↓
Smart contract compares stored hash ↔ uploaded hash
        ↓
✅ MATCH  →  Valid Certificate
❌ MISMATCH →  Tampered / Fake
🚫 REVOKED  →  Revoked by University
```

---

## 🛠 Technology Stack

| Layer          | Technology |
|----------------|------------|
| **Smart Contract** | Solidity ^0.8.19, Hardhat, Ethers.js v6 |
| **Blockchain** | Ethereum / Polygon (Mumbai testnet / Mainnet) |
| **Decentralised Storage** | IPFS via Pinata |
| **Hashing** | SHA-256 (browser: SubtleCrypto API; server: Node crypto) |
| **Backend** | Node.js, Express.js, Mongoose, JWT, Multer |
| **Database** | MongoDB |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6 |
| **Auth** | JWT (access + refresh tokens), bcrypt |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (role: university \| verifier) |
| POST | `/api/auth/login` | Login → returns JWT |
| GET  | `/api/auth/me` | Current user (protected) |

### Admin (requires admin JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/admin/dashboard` | Stats + recent certs |
| GET  | `/api/admin/universities` | List all universities |
| POST | `/api/admin/universities` | Create + approve university |
| PATCH| `/api/admin/universities/:id/approve` | Approve university on-chain |
| PATCH| `/api/admin/universities/:id/revoke` | Revoke university |
| GET  | `/api/admin/users` | List all users |
| PATCH| `/api/admin/users/:id/toggle` | Activate / deactivate user |

### University (requires university JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/university/certificates` | List issued certificates |
| POST | `/api/university/certificates/issue` | Issue new certificate (multipart/form-data) |
| PATCH| `/api/university/certificates/:certId/revoke` | Revoke certificate on-chain |
| GET  | `/api/university/stats` | Issued / revoked / pending counts |

### Verifier (public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verifier/verify/upload` | Verify by PDF upload |
| GET  | `/api/verifier/verify/:certId` | Verify by certificate ID |
| GET  | `/api/verifier/search?q=` | Search public certificates |

---

## 🔐 Smart Contract Reference

**CertificateRegistry.sol** — deployed on Polygon

```solidity
// Admin
approveUniversity(address wallet, string name)
revokeUniversity(address wallet)

// University (approved only)
issueCertificate(bytes32 certId, bytes32 certHash, string ipfsHash, string metaURI)
revokeCertificate(bytes32 certId)

// Anyone
verifyCertificate(bytes32 certId, bytes32 hashToCheck)
  → (bool valid, bool revoked, Certificate cert)

totalCertificates() → uint256
getUniversityCerts(address wallet) → bytes32[]
```

---

## 🌐 Environment Variables

### Backend `.env`
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/securedtrust
JWT_SECRET=min_32_char_secret
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🧪 Running Tests

```bash
# Smart contract tests
cd blockchain && npm test

# Backend tests
cd backend && npm test
```

---

## 📦 Production Deployment

### Frontend → Vercel / Netlify
```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

### Backend → Railway / Render / EC2
```bash
cd backend
NODE_ENV=production npm start
```

### Contract → Polygon Mainnet
```bash
cd blockchain
npm run deploy:mainnet
```

---

## 🔒 Security Notes

- Private keys are **never** stored in the frontend
- All file processing happens server-side (hash computed from buffer)
- JWT tokens expire in 24h; refresh tokens in 7 days
- Rate limiting: 100 requests / 15 minutes per IP
- Helmet.js sets secure HTTP headers
- Multer restricts uploads to PDF only, max 10 MB

---

## 📄 License

MIT © 2024 SecuredTrust
