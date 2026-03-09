# Quick Start: FREE Local Blockchain (No Money Required)

## 🎯 100% Free - Real Blockchain & Cryptography

Use Hardhat's local blockchain - get real Ethereum functionality without spending money!

## 🚀 Fast Setup (3 minutes)

### 1. Install Dependencies
```bash
# Stop dev server first (Ctrl+C)
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers
npm install ethers
```

### 2. Start Local Blockchain

Open a **NEW terminal** and run:
```bash
npx hardhat node
```

**Keep this running!** You'll get 10 accounts with 10,000 ETH each (FREE).

### 3. Deploy Contract

Open **ANOTHER terminal** and run:
```bash
npm run compile
npm run deploy:localhost
```

Copy the contract address from output.

### 4. Configure .env.local
```env
ETHEREUM_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
CHAIN_ID=31337
```

### 5. Start Application
```bash
npm run dev
```

## ✅ Test It Works

1. Login: `admin@schoolsystem.edu` / `password123`
2. Upload a document
3. Check response has `blockchain_enabled: true`
4. Watch the Hardhat node terminal - you'll see real transactions!

## 🔍 Verify Real Blockchain

```bash
npx hardhat console --network localhost
```

```javascript
const contract = await ethers.getContractAt("DocumentRegistry", "YOUR_CONTRACT_ADDRESS")
const doc = await contract.getDocument(1)
console.log(doc) // Real on-chain data!
```

## 📝 What Changed

### Before (Fake):
```javascript
const txHash = generateTxHash() // Random string
```

### After (Real):
```javascript
const result = await storeDocumentOnChain(docId, hash, mapping)
const txHash = result.txHash // Real Ethereum transaction
```

## 🔧 Files Modified

- ✅ `lib/blockchain.ts` - NEW: Blockchain client
- ✅ `lib/crypto.ts` - Removed fake `generateTxHash()`
- ✅ `app/api/documents/route.ts` - Real blockchain storage
- ✅ `app/api/documents/[id]/verify/route.ts` - Real verification
- ✅ `app/api/documents/[id]/route.ts` - Real access logging
- ✅ `hardhat.config.ts` - NEW: Hardhat configuration
- ✅ `scripts/deploy-contract.ts` - NEW: Deployment script

## 🎯 Key Features

1. **Automatic Fallback**: Works without blockchain if env vars empty
2. **Error Handling**: Graceful degradation on blockchain failures
3. **No Breaking Changes**: All existing features still work
4. **Production Ready**: Proper error handling and logging

## 📊 API Response Changes

### Document Upload Response:
```json
{
  "id": 1,
  "document_name": "Test Doc",
  "tx_hash": "0xabc123...",
  "blockchain_enabled": true
}
```

### Verification Response:
```json
{
  "verified": true,
  "tx_hash": "0xdef456...",
  "block_number": 12345678,
  "blockchain_enabled": true
}
```

## 💡 Pro Tips

1. **FREE**: Local blockchain costs $0 - you get 10,000 ETH per account
2. **INSTANT**: Transactions confirm immediately (no 15-30 second wait)
3. **OFFLINE**: Works without internet connection
4. **RESET**: Restart `npx hardhat node` to reset blockchain
5. **REAL**: Same blockchain technology as Ethereum mainnet

## 👍 Why Local Blockchain?

- ✅ **Real blockchain** (Ethereum Virtual Machine)
- ✅ **Real cryptography** (SHA-256, ECDSA)
- ✅ **Real smart contracts** (Solidity)
- ✅ **Real transactions** (with gas fees)
- ✅ **100% FREE** (no faucets, no waiting)
- ✅ **Instant** (no network delays)

## 🚀 Want Public Blockchain?

See `BLOCKCHAIN_SETUP.md` for Sepolia testnet (also free, but needs faucet ETH).

## 🆘 Common Issues

**"Cannot connect to blockchain"**
→ Make sure `npx hardhat node` is running in another terminal

**"Contract not deployed"**
→ Run `npm run deploy:localhost` again

**"Missing environment variables"**
→ Check `.env.local` has all blockchain vars

**"Want to reset blockchain?"**
→ Stop and restart `npx hardhat node`, then redeploy contract

## 📚 Full Documentation

See `BLOCKCHAIN_SETUP.md` for complete details.
