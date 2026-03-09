// Compute the hash for demo passwords using the same algorithm as lib/auth.ts
function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt_rbdec_2026")
  let hash = 0
  const bytes = data
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) - hash + bytes[i]) | 0
  }
  return "pbkdf2$" + Math.abs(hash).toString(16).padStart(16, "0")
}

console.log("demo123:", hashPassword("demo123"))
console.log("password123:", hashPassword("password123"))
