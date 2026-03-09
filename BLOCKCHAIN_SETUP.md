# Blockchain Integration Setup Guide

## Prerequisites

1. **Node.js** v18+ installed
2. **Ethereum Wallet** with Sepolia testnet ETH
3. **Infura Account** (or other RPC provider)

---

## Installation Steps

### 1. Install Dependencies

Stop the dev server first, then run:

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers
npm install ethers dotenv
```

### 2. Get Sepolia Testnet ETH

- Create a wallet (MetaMask or use existing)
- Get free Sepolia ETH from faucet: https://sepoliafaucet.com
- You'll need ~0.1 ETH for deployment and testing

### 3. Get Infura RPC URL

- Sign up at https://infura.io
- Create a new project
- Copy the Sepolia endpoint URL
- Format: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

### 4. Configure Environment Variables

Edit `.env.local` and add:

```env
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_wallet_private_key_without_0x
CONTRACT_ADDRESS=will_be_filled_after_deployment
CHAIN_ID=11155111
```

**⚠️ Security Warning:**
- Never commit private keys to git
- Use a test wallet only
- Never use mainnet keys in development

---

## Deployment Steps

### 1. Compile Contract

```bash
npx hardhat compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### 2. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy-contract.ts --network sepolia
```

Expected output:
```
Deploying DocumentRegistry contract...
Deploying with account: 0x...
Account balance: 0.5 ETH

✅ Contract deployed successfully!
Contract address: 0x1234567890abcdef...

Add this to your .env.local:
CONTRACT_ADDRESS=0x1234567890abcdef...
```

### 3. Update .env.local

Copy the contract address from deployment output and add to `.env.local`:

```env
CONTRACT_ADDRESS=0x1234567890abcdef...
```

### 4. Restart Application

```bash
npm run dev
```

---

## Testing Workflow

### Test 1: Document Upload with Blockchain

1. Login as admin: `admin@schoolsystem.edu` / `password123`
2. Navigate to Upload page
3. Upload a document with columns and data
4. Check response for `tx_hash` and `blockchain_enabled: true`
5. Verify transaction on Sepolia Etherscan:
   - https://sepolia.etherscan.io/tx/YOUR_TX_HASH

### Test 2: Document Verification

1. Go to document details page
2. Click "Verify" button
3. System calls smart contract to verify hash
4. Check response:
   ```json
   {
     "verified": true,
     "tx_hash": "0x...",
     "block_number": 12345678,
     "blockchain_enabled": true
   }
   ```

### Test 3: Access Logging

1. Login as student: `alex@schoolsystem.edu` / `password123`
2. View a document
3. Access event is logged on blockchain
4. Check audit logs table for `tx_hash`

---

## Verification Commands

### Check Contract on Etherscan

```
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

### Read Contract Data (Hardhat Console)

```bash
npx hardhat console --network sepolia
```

```javascript
const contract = await ethers.getContractAt("DocumentRegistry", "YOUR_CONTRACT_ADDRESS")
const doc = await contract.getDocument(1)
console.log(doc)
```

---

## Fallback Mode

If blockchain is not configured (empty env vars), the system automatically falls back to database-only mode:

- `isBlockchainEnabled()` returns `false`
- No blockchain transactions are attempted
- All features work normally without blockchain
- API responses include `blockchain_enabled: false`

---

## Troubleshooting

### Error: "Insufficient funds"
- Get more Sepolia ETH from faucet
- Check wallet balance: https://sepolia.etherscan.io/address/YOUR_ADDRESS

### Error: "Missing blockchain environment variables"
- Verify all env vars are set in `.env.local`
- Restart dev server after changing env vars

### Error: "Transaction reverted"
- Check contract is deployed correctly
- Verify contract address is correct
- Check gas limits

### Error: "Network connection failed"
- Verify Infura URL is correct
- Check internet connection
- Try alternative RPC provider

---

## Gas Costs (Approximate on Sepolia)

- Deploy Contract: ~0.01 ETH
- Store Document: ~0.001 ETH
- Verify Document: ~0.0005 ETH
- Log Access: ~0.0008 ETH

---

## Production Considerations

For mainnet deployment:

1. Use hardware wallet or secure key management
2. Implement gas price optimization
3. Add transaction retry logic
4. Monitor gas costs
5. Consider Layer 2 solutions (Polygon, Arbitrum)
6. Implement proper error handling
7. Add transaction confirmation UI
8. Set up monitoring and alerts

---

## NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "compile": "hardhat compile",
    "deploy:sepolia": "hardhat run scripts/deploy-contract.ts --network sepolia",
    "deploy:localhost": "hardhat run scripts/deploy-contract.ts --network localhost"
  }
}
```

---

## Architecture Overview

```
User Action (Upload Document)
    ↓
Next.js API Route
    ↓
Calculate SHA-256 Hash
    ↓
Store in PostgreSQL
    ↓
Call blockchain.ts → storeDocumentOnChain()
    ↓
ethers.js → Smart Contract
    ↓
Ethereum Sepolia Network
    ↓
Transaction Confirmed
    ↓
Store tx_hash & block_number in DB
    ↓
Return Response to User
```

---

## Support

For issues:
1. Check Hardhat documentation: https://hardhat.org/docs
2. Check ethers.js documentation: https://docs.ethers.org
3. Verify Sepolia testnet status: https://sepolia.etherscan.io
