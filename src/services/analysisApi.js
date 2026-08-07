import { buildAnalysisContext, normalizeAnalysisResult, SYSTEM_PROMPT } from './analysisProtocol.js'
import { getDeviceApiKey } from './deviceApiKey.js'

const API_URL = import.meta.env?.VITE_ANALYZE_API_URL || '/api/analyze'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

async function analyzeDirect(payload, apiKey, signal) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildAnalysisContext(payload) },
      ],
      response_format: { type: 'json_object' },
      thinking: { type: 'disabled' },
      temperature: 0.6,
      max_tokens: 3000,
    }),
    signal,
  })
  const apiPayload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(apiPayload?.error?.message || 'DeepSeek API Key 无效或余额不足。')
  const content = apiPayload?.choices?.[0]?.message?.content
  if (!content) throw new Error('DeepSeek 没有返回有效内容。')
  return {
    ...normalizeAnalysisResult(JSON.parse(content)),
    meta: {
      provider: 'DeepSeek · 当前设备直连',
      model: apiPayload.model || 'deepseek-v4-flash',
      generatedAt: new Date().toISOString(),
    },
  }
}

export async function analyzeCopy(payload, { signal } = {}) {
  const deviceApiKey = getDeviceApiKey()
  if (deviceApiKey) return analyzeDirect(payload, deviceApiKey, signal)

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
