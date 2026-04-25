const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  let registry, owner, university, verifier, other;

  const CERT_ID   = ethers.id("CERT-2024-001");
  const CERT_HASH = ethers.id("sha256:abc123def456");
  const IPFS_HASH = "QmX7n9pLkR3mT2wV8sA4dC6eF1gH5jK0";
  const META_URI  = "ipfs://QmMetadata123";

  beforeEach(async () => {
    [owner, university, verifier, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertificateRegistry");
    registry = await Factory.deploy();
  });

  describe("University Management", () => {
    it("owner can approve a university", async () => {
      await expect(registry.approveUniversity(university.address, "IIT Delhi"))
        .to.emit(registry, "UniversityApproved")
        .withArgs(university.address, "IIT Delhi", await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
      const uni = await registry.universities(university.address);
      expect(uni.approved).to.be.true;
    });

    it("non-owner cannot approve a university", async () => {
      await expect(registry.connect(other).approveUniversity(university.address, "Fake Uni"))
        .to.be.revertedWith("Not owner");
    });

    it("owner can revoke university approval", async () => {
      await registry.approveUniversity(university.address, "IIT Delhi");
      await registry.revokeUniversity(university.address);
      const uni = await registry.universities(university.address);
      expect(uni.approved).to.be.false;
    });
  });

  describe("Certificate Issuance", () => {
    beforeEach(async () => {
      await registry.approveUniversity(university.address, "IIT Delhi");
    });

    it("approved university can issue a certificate", async () => {
      await expect(registry.connect(university).issueCertificate(CERT_ID, CERT_HASH, IPFS_HASH, META_URI))
        .to.emit(registry, "CertificateIssued");
      const cert = await registry.certificates(CERT_ID);
      expect(cert.certHash).to.equal(CERT_HASH);
      expect(cert.issuedBy).to.equal(university.address);
      expect(cert.isRevoked).to.be.false;
    });

    it("unapproved address cannot issue certificates", async () => {
      await expect(registry.connect(other).issueCertificate(CERT_ID, CERT_HASH, IPFS_HASH, META_URI))
        .to.be.revertedWith("University not approved");
    });

    it("cannot issue duplicate certificate IDs", async () => {
      await registry.connect(university).issueCertificate(CERT_ID, CERT_HASH, IPFS_HASH, META_URI);
      await expect(registry.connect(university).issueCertificate(CERT_ID, CERT_HASH, IPFS_HASH, META_URI))
        .to.be.revertedWith("Certificate ID already exists");
    });
  });

  describe("Certificate Verification", () => {
    beforeEach(async () => {
      await registry.approveUniversity(university.address, "IIT Delhi");
      await registry.connect(university).issueCertificate(CERT_ID, CERT_HASH, IPFS_HASH, META_URI);
    });

    it("valid hash returns verified=true", async () => {
      const [valid, revoked] = await registry.verifyCertificate(CERT_ID, CERT_HASH);
      expect(valid).to.be.true;
      expect(revoked).to.be.false;
    });

    it("wrong hash returns verified=false", async () => {
      const [valid] = await registry.verifyCertificate(CERT_ID, ethers.id("wrong-hash"));
      expect(valid).to.be.false;
    });

    it("revoked certificate returns verified=false", async () => {
      await registry.connect(university).revokeCertificate(CERT_ID);
      const [valid, revoked] = await registry.verifyCertificate(CERT_ID, CERT_HASH);
      expect(valid).to.be.false;
      expect(revoked).to.be.true;
    });
  });
});
