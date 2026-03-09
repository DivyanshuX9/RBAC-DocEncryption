export function createAuthFetcher(token: string | null) {
  return async (url: string) => {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const error = new Error("API request failed") as Error & { status: number }
      error.status = res.status
      throw error
    }
    return res.json()
  }
}
