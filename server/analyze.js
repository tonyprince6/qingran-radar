const DEFAULT_DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const MAX_COPY_LENGTH = 6000
const REQUEST_TIMEOUT_MS = 55_000
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 8
const requestBuckets = new Map()

const SYSTEM_PROMPT = `你是一名资深中文短视频编导，专注减脂、减肥和体重管理内容。
你的任务是拆解用户提供的视频文案，并给出可直接拍摄的改写方案。

要求：
1. 只分析用户提交的文案，不编造播放量、作者经历、实验结果或医学结论。
2. 禁止承诺快速减重、局部减脂、极端节食、催吐、泻药等危险方法；遇到风险表达时要明确提示并改写为稳健说法。
3. 输出必须是合法 JSON，不要 Markdown，不要代码围栏。
4. 中文表达口语化、具体、紧凑，适合 30–45 秒抖音视频。
5. openingVariants 固定输出 5 个不同角度的开头。

JSON 格式示例：
{
  "hookAnalysis": {
    "type": "反常识",
    "core": "一句话概括爆点",
    "whyItWorks": "为什么能让目标观众停留"
  },
  "retention": [
    {"stage": "0–3秒", "technique": "悬念", "explanation": "具体留客机制"}
  ],
  "rewrittenScript": {
    "hook": "0–3秒文案",
    "pain": "4–12秒文案",
    "method": "13–28秒文案",
    "close": "29–40秒文案",
    "fullText": "合并后的完整口播文案"
  },
  "openingVariants": [
    {"style": "反常识", "text": "开头文案"}
  ],
  "safetyNote": "健康信息风险提示；没有明显风险时写‘未发现明显高风险表达，仍建议结合个人情况理性参考。’"
}`

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

function normalizeResult(result) {
  const rewritten = result?.rewrittenScript ?? {}
  const variants = Array.isArray(result?.openingVariants) ? result.openingVariants.slice(0, 5) : []
  const retention = Array.isArray(result?.retention) ? result.retention.slice(0, 6) : []

  if (!result?.hookAnalysis?.core || !rewritten.hook || !rewritten.fullText || variants.length < 3) {
    throw new Error('INVALID_MODEL_OUTPUT')
  }

  return {
    hookAnalysis: {
      type: String(result.hookAnalysis.type ?? '未分类'),
      core: String(result.hookAnalysis.core),
      whyItWorks: String(result.hookAnalysis.whyItWorks ?? ''),
    },
    retention: retention.map(item => ({
      stage: String(item?.stage ?? ''),
      technique: String(item?.technique ?? ''),
      explanation: String(item?.explanation ?? ''),
    })),
    rewrittenScript: {
      hook: String(rewritten.hook),
      pain: String(rewritten.pain ?? ''),
      method: String(rewritten.method ?? ''),
      close: String(rewritten.close ?? ''),
      fullText: String(rewritten.fullText),
    },
    openingVariants: variants.map(item => ({
      style: String(item?.style ?? '备选'),
      text: String(item?.text ?? ''),
    })).filter(item => item.text),
    safetyNote: String(result.safetyNote ?? '请结合个人情况理性参考，健康问题建议咨询专业人士。'),
  }
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

    const context = [
      body.title ? `视频标题：${String(body.title).slice(0, 300)}` : '',
      body.author ? `作者：${String(body.author).slice(0, 100)}` : '',
      body.videoUrl ? `原视频：${String(body.videoUrl).slice(0, 500)}` : '',
      `待分析文案：\n${copy}`,
    ].filter(Boolean).join('\n\n')

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
    const result = normalizeResult(JSON.parse(content))
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
