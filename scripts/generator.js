const fs = require("fs");
const path = require("path");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");
const ethers = require("ethers");
const { getAddress, parseUnits } = require("ethers/lib/utils");

// Output file path
const outputPath = path.join(__dirname, "../merkle.json");
const outputFEPath = path.join(__dirname, "../fe.json");

module.exports = class Generator {
  /**
   * Setup generator
   * @param {number} decimals of token
   * @param {Record<string, number>} airdrop address to token claim mapping
   */
  constructor(decimals, airdrop) {
    // Airdrop recipients
    this.recipients = [];
    // For each airdrop entry
    for (const [address, tokens] of Object.entries(airdrop)) {
      // Push:
      this.recipients.push({
        // Checksum address
        address: getAddress(address),
        // Scaled number of tokens claimable by recipient
        value: parseUnits(tokens.toString(), decimals).toString(),
      });
    }
  }
  /**
   * Generate Merkle Tree leaf from address and value
   * @param {string} address of airdrop claimee
   * @param {string} value of airdrop tokens to claimee
   * @returns {Buffer} Merkle Tree node
   */
  generateLeaf(address, value) {
    return Buffer.from(
      // Hash in appropriate Merkle format
      ethers.utils
        .solidityKeccak256(["address", "uint256"], [address, value])
        .slice(2),
      "hex"
    );
  }
  async process() {
    console.log("Generating Merkle tree.");
    const FEConfig = {};
    // Generate merkle tree
    const merkleTree = new MerkleTree(
      // Generate leafs
      this.recipients.map(({ address, value }) => {
        const leaf = this.generateLeaf(address, value);
        FEConfig[address] = leaf;
        return leaf;
      }),
      // Hashing function
      keccak256,
      { sortPairs: true }
    );

    this.recipients.map(({ address, value }) => {
      const leaf = FEConfig[address];
      const proof = merkleTree.getHexProof(leaf);
      FEConfig[address] = {
        value,
        proof,
      };
    });
    // Collect and log merkle root
    const merkleRoot = merkleTree.getHexRoot();
    console.log(`Generated Merkle root: ${merkleRoot}`);
    // Collect and save merkle tree + root
    await fs.writeFileSync(
      // Output to merkle.json
      outputPath,
      // Root + full tree
      JSON.stringify({
        root: merkleRoot,
        tree: merkleTree,
      })
    );
    console.log("Generated merkle tree and root saved to Merkle.json.");
    await fs.writeFileSync(
      // Output to merkle.json
      outputFEPath,
      // Root + full tree
      JSON.stringify(FEConfig)
    );
    console.log("Generated feConfig saved to fe.json.");
  }
};
