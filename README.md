# zk-SNARK Proof of Reserves POC

A working proof-of-concept demonstrating how crypto exchanges can use **zk-SNARKs** (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) to prove solvency without revealing sensitive user data.

## 🎯 Problem Statement

**As a crypto exchange, you want to:**
- ✅ Prove you have sufficient reserves to cover all user liabilities
- ✅ Allow users to verify their balance is included in the total
- ❌ WITHOUT revealing individual user balances
- ❌ WITHOUT exposing the number of users or wealth distribution

## 💡 Solution: zk-SNARKs

This POC uses zk-SNARKs to create **cryptographic proofs** that demonstrate:

1. **All user balances are non-negative** (no fake negative balances to inflate reserves)
2. **Sum of all user balances equals the claimed total**
3. **A specific user's balance is included in the total**

All of this is proven **WITHOUT revealing the actual balances**!

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EXCHANGE (Private)                        │
│  • User balances: [15, 25, 30, 20, 10] BTC                 │
│  • Total: 100 BTC                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ zk-SNARK Proof Generation
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  PUBLIC PROOF + DATA                         │
│  • Claimed Total: 100 BTC                                   │
│  • Wallet Address: bc1qxy2k...                              │
│  • zk-SNARK Proof: { π, public_signals }                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Verification
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   USERS (Verify)                             │
│  ✅ Proof is valid                                          │
│  ✅ Their balance is included                               │
│  ✅ Check wallet on blockchain                              │
│  ❌ Cannot see other users' balances                        │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

- **Circom** - Circuit programming language for zk-SNARKs
- **snarkjs** - JavaScript library for zk-SNARK proof generation/verification
- **Groth16** - Proving system (most efficient for verification)
- **Node.js** - Runtime environment

## 📁 Project Structure

```
zksnark-poc-claude/
├── circuits/
│   └── proof_of_reserves.circom    # zk-SNARK circuit definition
├── scripts/
│   ├── 1-setup.js                  # Compile circuit & generate keys
│   ├── 2-generate-proof.js         # Exchange: generate proof
│   └── 3-verify-proof.js           # Users: verify proof
├── data/
│   └── exchange_data.json          # Sample exchange data (private)
├── build/                          # Generated files (keys, proofs)
├── package.json
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- macOS, Linux, or Windows with WSL

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `circom` - Circuit compiler
- `snarkjs` - Proof generation/verification library
- `circomlib` - Standard circuit library

### Step 2: Compile Circuit & Generate Keys

```bash
npm run setup
```

This process:
1. Compiles the Circom circuit to R1CS constraints
2. Generates WASM witness calculator
3. Performs trusted setup ceremony (Powers of Tau)
4. Creates proving key (zkey) and verification key

**⏱️ Takes ~2-3 minutes on first run**

## 🎮 Running the Demo

### Full Demo (Recommended)

Run the complete workflow:

```bash
npm run full-demo
```

### Step-by-Step

#### 1. Generate Proof (Exchange Side)

```bash
npm run generate-proof
```

**Input:** Private user balances from `data/exchange_data.json`

**Output:** Zero-knowledge proof in `build/proof.json`

**What it proves:**
- Sum of balances = 100 BTC
- All balances are non-negative
- User 2's balance (30 BTC) is included

#### 2. Verify Proof (User Side)

```bash
npm run verify-proof
```

**Input:** Public proof from `build/proof.json`

**Output:** ✅ PROOF VALID or ❌ PROOF INVALID

**What users learn:**
- ✅ The exchange's claim is mathematically proven
- ✅ Their balance is included in the total
- ❌ They CANNOT see other users' balances

## 🔬 How It Works

### The Circuit Logic

```circom
// Simplified view of proof_of_reserves.circom

1. Take private inputs:
   - userBalances[5] = [15, 25, 30, 20, 10]
   - userIndex = 2
   - userExpectedBalance = 30

2. Take public input:
   - claimedTotal = 100

3. Constraints (proven by zk-SNARK):
   - Each balance is non-negative (fits in 64 bits)
   - Sum of balances equals claimedTotal
   - userBalances[userIndex] === userExpectedBalance

4. If all constraints satisfied → Valid proof
```

### Zero-Knowledge Property

The proof reveals **NOTHING** about:
- Individual balance amounts (except the one being verified)
- Total number of users
- Distribution of wealth
- Which users have more/less

Yet it **cryptographically guarantees** the sum is correct!

## 🔐 Security Considerations

### What This POC Demonstrates ✅

- zk-SNARK proof generation and verification
- Privacy-preserving sum verification
- Individual user balance inclusion proof

### Production Requirements (Not Included) ⚠️

1. **Merkle Sum Trees**
   - For scalability with millions of users
   - Allows users to independently verify their leaf

2. **Trusted Setup Ceremony**
   - Multi-party computation (MPC)
   - Requires participation from multiple parties
   - This POC uses a toy setup (insecure for production)

3. **Regular Audits**
   - Automated proof generation (e.g., daily)
   - Historical proof archive
   - Multi-asset support (BTC, ETH, USDT, etc.)

4. **Blockchain Verification**
   - Users must independently verify the wallet address
   - Check on-chain balance matches claimed reserves
   - Use block explorers or run full nodes

## 📊 Real-World Examples

### Exchanges Using zk-SNARK Proof of Reserves

1. **Binance**
   - Implemented zk-SNARKs for PoR in 2023
   - Supports 13+ cryptocurrencies
   - Processes tens of millions of users

2. **Gate.io**
   - Uses zk-SNARKs + Merkle trees
   - Public verification system
   - Regular attestations

3. **Based on Vitalik Buterin's Proposal**
   - Published November 2022
   - Response to FTX collapse
   - Industry standard approach

## 🧪 Testing Different Scenarios

### Modify User Balances

Edit `data/exchange_data.json`:

```json
{
  "totalReserves": 100,
  "users": [
    { "balance": 15 },  // Try changing these
    { "balance": 25 },
    { "balance": 30 },
    { "balance": 20 },
    { "balance": 10 }
  ]
}
```

### Test Invalid Scenarios

1. **Sum doesn't match total:**
   - Change a balance so sum ≠ 100
   - Proof generation will fail

2. **Negative balance:**
   - Try setting a balance to -10
   - Circuit constraint will fail

## 📚 Learn More

### Research Papers
- [Having a safe CEX: proof of solvency and beyond](https://vitalik.ca/general/2022/11/19/proof_of_solvency.html) - Vitalik Buterin
- [A ZK-SNARK based Proof of Assets Protocol](https://arxiv.org/pdf/2208.01263)
- [SNARKed Merkle Sum Tree](https://ethresear.ch/t/snarked-merkle-sum-tree-a-practical-proof-of-solvency-protocol-based-on-vitaliks-proposal/14405)

### Technical Resources
- [Circom Documentation](https://docs.circom.io/)
- [snarkjs GitHub](https://github.com/iden3/snarkjs)
- [Zero-Knowledge Proofs Guide](https://z.cash/learn/what-are-zk-snarks/)

## 🤝 Contributing

This is a POC for educational purposes. For production use:

1. Implement Merkle Sum Trees for scalability
2. Use proper trusted setup (MPC ceremony)
3. Add multi-asset support
4. Integrate with blockchain verification
5. Add continuous monitoring and alerts

## 📄 License

MIT License - Feel free to use for learning and development!

---

**Built with zk-SNARKs** 🔐 | **Privacy-Preserving** 🛡️ | **Cryptographically Secure** 🔒
