import { buildAnalysisContext, normalizeAnalysisResult, SYSTEM_PROMPT } from '../src/services/analysisProtocol.js'

const DEFAULT_DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const MAX_COPY_LENGTH = 6000
const REQUEST_TIMEOUT_MS = 55_000
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 8
const requestBuckets = new Map()

function sendJson(response, status, payload) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

async function readBody(request) {
  if (request.body && typeof request.body === 'object') return request.body
  if (typeof request.body === 'string') return JSON.parse(request.body)

  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (body.length > MAX_COPY_LENGTH * 2) throw new Error('PAYLOAD_TOO_LARGE')
  }
  return body ? JSON.parse(body) : {}
}

function getAllowedOrigin(request) {
  const origin = request.headers?.origin
  if (!origin) return ''

  const configured = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
  const local = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)
  return local || configured.includes(origin) ? origin : ''
}

function isRateLimited(request) {
  const forwarded = request.headers?.['x-forwarded-for']
  const clientId = String(forwarded || request.socket?.remoteAddress || 'local').split(',')[0].trim()
  const now = Date.now()
  const recent = (requestBuckets.get(clientId) ?? []).filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS)
  recent.push(now)
  requestBuckets.set(clientId, recent)
  return recent.length > RATE_LIMIT_MAX
}

export async function handleAnalyze(request, response) {
  const allowedOrigin = getAllowedOrigin(request)
  if (allowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    response.setHeader('Vary', 'Origin')
  }
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Cache-Control', 'no-store')

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.end()
    return
  }
  if (request.method !== 'POST') return sendJson(response, 405, { error: '只支持 POST 请求' })
  if (isRateLimited(request)) {
    response.setHeader('Retry-After', String(RATE_LIMIT_WINDOW_MS / 1000))
    return sendJson(response, 429, { error: '请求过于频繁，请稍后再试。' })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return sendJson(response, 503, { error: 'DeepSeek API 尚未配置，请先设置服务端 DEEPSEEK_API_KEY。' })

  try {
    const body = await readBody(request)
    const copy = typeof body.copy === 'string' ? body.copy.trim() : ''
    if (copy.length < 20) return sendJson(response, 400, { error: '请至少输入 20 个字的视频文案。' })
    if (copy.length > MAX_COPY_LENGTH) return sendJson(response, 413, { error: `视频文案不能超过 ${MAX_COPY_LENGTH} 字。` })

    const context = buildAnalysisContext({ ...body, copy })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let apiResponse
    try {
      apiResponse = await fetch(process.env.DEEPSEEK_API_URL || DEFAULT_DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: context },
          ],
          response_format: { type: 'json_object' },
          thinking: { type: 'disabled' },
          temperature: 0.6,
          max_tokens: 3000,
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    const apiPayload = await apiResponse.json().catch(() => ({}))
    if (!apiResponse.ok) {
      const providerMessage = apiPayload?.error?.message
      console.error('DeepSeek API error', apiResponse.status, providerMessage)
      return sendJson(response, 502, { error: 'DeepSeek 分析失败，请稍后重试。' })
    }

    const content = apiPayload?.choices?.[0]?.message?.content
    if (!content) throw new Error('EMPTY_MODEL_OUTPUT')
    const result = normalizeAnalysisResult(JSON.parse(content))
    return sendJson(response, 200, {
      ...result,
      meta: {
        provider: 'DeepSeek',
        model: apiPayload.model || process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (error?.name === 'AbortError') return sendJson(response, 504, { error: 'DeepSeek 响应超时，请重试。' })
    if (error?.message === 'PAYLOAD_TOO_LARGE') return sendJson(response, 413, { error: '请求内容过大。' })
    if (error instanceof SyntaxError) return sendJson(response, 400, { error: '请求或模型返回的 JSON 格式无效。' })
    console.error('Analyze route error', error)
    return sendJson(response, 500, { error: '分析服务暂时不可用，请稍后重试。' })
  }
}
