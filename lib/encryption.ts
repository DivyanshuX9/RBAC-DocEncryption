const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY;

if (!MASTER_KEY || MASTER_KEY.length !== 64) {
  throw new Error("MASTER_ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
}

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert Uint8Array to base64
function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

// Convert base64 to Uint8Array
function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

// Generate a random 256-bit encryption key
export async function generateColumnKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt a single value with AES-256-GCM
export async function encryptValue(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

// Decrypt a single value with AES-256-GCM
export async function decryptValue(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const encryptedData = base64ToBytes(ciphertext);
  const ivBytes = base64ToBytes(iv);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Encrypt column key using master key
export async function encryptColumnKey(
  columnKey: CryptoKey
): Promise<{ encryptedKey: string; iv: string }> {
  // Export column key as raw bytes
  const keyBytes = await crypto.subtle.exportKey("raw", columnKey);

  // Import master key
  const masterKeyBytes = hexToBytes(MASTER_KEY!);
  const masterKey = await crypto.subtle.importKey(
    "raw",
    masterKeyBytes,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );

  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt column key with master key
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    masterKey,
    keyBytes
  );

  return {
    encryptedKey: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

// Decrypt column key using master key
export async function decryptColumnKey(
  encryptedKey: string,
  iv: string
): Promise<CryptoKey> {
  // Import master key
  const masterKeyBytes = hexToBytes(MASTER_KEY!);
  const masterKey = await crypto.subtle.importKey(
    "raw",
    masterKeyBytes,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );

  const encryptedKeyBytes = base64ToBytes(encryptedKey);
  const ivBytes = base64ToBytes(iv);

  // Decrypt column key
  const decryptedKeyBytes = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    masterKey,
    encryptedKeyBytes
  );

  // Import decrypted key as CryptoKey
  return await crypto.subtle.importKey(
    "raw",
    decryptedKeyBytes,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt entire column data
export async function encryptColumnData(
  data: Array<{ row: number; val: string }>,
  columnKey: CryptoKey
): Promise<Array<{ row: number; ciphertext: string; iv: string }>> {
  const encrypted = [];

  for (const item of data) {
    const { ciphertext, iv } = await encryptValue(item.val, columnKey);
    encrypted.push({
      row: item.row,
      ciphertext,
      iv,
    });
  }

  return encrypted;
}

// Decrypt entire column data
export async function decryptColumnData(
  encryptedData: Array<{ row: number; ciphertext: string; iv: string }>,
  columnKey: CryptoKey
): Promise<Array<{ row: number; val: string }>> {
  const decrypted = [];

  for (const item of encryptedData) {
    const val = await decryptValue(item.ciphertext, item.iv, columnKey);
    decrypted.push({
      row: item.row,
      val,
    });
  }

  return decrypted;
}
