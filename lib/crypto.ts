export async function computeSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const buffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function deterministicStringify(obj: any): string {
  if (obj === null) return 'null'
  if (typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return '[' + obj.map(deterministicStringify).join(',') + ']'
  const keys = Object.keys(obj).sort()
  const pairs = keys.map(k => JSON.stringify(k) + ':' + deterministicStringify(obj[k]))
  return '{' + pairs.join(',') + '}'
}

export function maskValue(_value: string): string {
  return "ACCESS_DENIED"
}
