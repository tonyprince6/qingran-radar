const API_URL = import.meta.env.VITE_ANALYZE_API_URL || '/api/analyze'

export async function analyzeCopy(payload, { signal } = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'AI 分析失败，请稍后重试。')
  return result
}

