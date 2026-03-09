import { ethers } from "ethers";

const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const CONTRACT_ABI = [
  "function storeDocument(uint256 _documentId, bytes32 _sha256Hash, string memory _columnAccessMapping) external",
  "function verifyDocument(uint256 _documentId, bytes32 _sha256Hash) external returns (bool valid)",
  "function logAccess(uint256 _documentId, string memory _accessedColumns, string memory _deniedColumns) external",
  "function updateRoleMapping(uint256 _documentId, string memory _newMapping) external",
  "function getDocument(uint256 _documentId) external view returns (bytes32 sha256Hash, address creator, uint256 timestamp, string memory columnAccessMapping)",
  "function getAccessLog(uint256 _index) external view returns (address accessor, uint256 documentId, string memory accessedColumns, string memory deniedColumns, uint256 timestamp)",
  "event DocumentStored(uint256 indexed documentId, bytes32 sha256Hash, address indexed creator, uint256 timestamp)",
  "event DocumentVerified(uint256 indexed documentId, bool integrityValid, address indexed verifier)",
  "event AccessLogged(uint256 indexed documentId, address indexed accessor, string accessedColumns, string deniedColumns, uint256 timestamp)"
];

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

function initializeBlockchain() {
  if (!ETHEREUM_RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
    throw new Error("Missing blockchain environment variables");
  }

  if (!provider) {
    provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
  }

  if (!wallet) {
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  }

  if (!contract) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  }

  return { provider, wallet, contract };
}

export async function storeDocumentOnChain(
  documentId: number,
  sha256Hash: string,
  columnAccessMapping: Record<string, string[]>
): Promise<{ txHash: string; blockNumber: number }> {
  const { contract } = initializeBlockchain();

  const hashBytes = ethers.getBytes("0x" + sha256Hash);
  const mappingJson = JSON.stringify(columnAccessMapping);

  const tx = await contract.storeDocument(documentId, hashBytes, mappingJson);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

export async function verifyDocumentOnChain(
  documentId: number,
  sha256Hash: string
): Promise<{ verified: boolean; txHash: string; blockNumber: number }> {
  const { contract } = initializeBlockchain();

  const hashBytes = ethers.getBytes("0x" + sha256Hash);

  const tx = await contract.verifyDocument(documentId, hashBytes);
  const receipt = await tx.wait();

  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "DocumentVerified";
    } catch {
      return false;
    }
  });

  let verified = false;
  if (event) {
    const parsed = contract.interface.parseLog(event);
    verified = parsed?.args?.integrityValid || false;
  }

  return {
    verified,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

export async function logAccessOnChain(
  documentId: number,
  accessedColumns: string[],
  deniedColumns: string[]
): Promise<{ txHash: string; blockNumber: number }> {
  const { contract } = initializeBlockchain();

  const accessedJson = JSON.stringify(accessedColumns);
  const deniedJson = JSON.stringify(deniedColumns);

  const tx = await contract.logAccess(documentId, accessedJson, deniedJson);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

export async function getDocumentFromChain(documentId: number): Promise<{
  sha256Hash: string;
  creator: string;
  timestamp: number;
  columnAccessMapping: Record<string, string[]>;
}> {
  const { contract } = initializeBlockchain();

  const result = await contract.getDocument(documentId);

  return {
    sha256Hash: result.sha256Hash,
    creator: result.creator,
    timestamp: Number(result.timestamp),
    columnAccessMapping: JSON.parse(result.columnAccessMapping),
  };
}

export function isBlockchainEnabled(): boolean {
  return !!(ETHEREUM_RPC_URL && PRIVATE_KEY && CONTRACT_ADDRESS);
}
