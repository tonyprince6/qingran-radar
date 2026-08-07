import assert from 'node:assert/strict'
import test from 'node:test'
import { handleAnalyze } from './analyze.js'

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(name, value) { this.headers[name] = value },
    end(body = '') { this.body = body },
  }
}

test('returns a configuration error without a server API key', async () => {
  const previousKey = process.env.DEEPSEEK_API_KEY
  delete process.env.DEEPSEEK_API_KEY
  const response = createResponse()

  await handleAnalyze({ method: 'POST', headers: {}, body: { copy: '这是一段超过二十个字、用于验证接口输入的视频口播测试文案。' } }, response)

  assert.equal(response.statusCode, 503)
  assert.match(JSON.parse(response.body).error, /DEEPSEEK_API_KEY/)
  if (previousKey) process.env.DEEPSEEK_API_KEY = previousKey
})

test('normalizes a valid DeepSeek JSON response', async () => {
  const previousKey = process.env.DEEPSEEK_API_KEY
  const previousFetch = globalThis.fetch
  process.env.DEEPSEEK_API_KEY = 'test-key'
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      model: 'deepseek-v4-flash',
      choices: [{ message: { content: JSON.stringify({
        hookAnalysis: { type: '反常识', core: '体重不是唯一指标', whyItWorks: '纠正常见误区' },
        retention: [{ stage: '0–3秒', technique: '冲突', explanation: '制造认知差' }],
        rewrittenScript: { hook: '别只盯体重', pain: '短期波动很常见', method: '同时记录腰围', close: '收藏并持续观察', fullText: '别只盯体重，短期波动很常见。' },
        openingVariants: Array.from({ length: 5 }, (_, index) => ({ style: `版本${index + 1}`, text: `开头${index + 1}` })),
        safetyNote: '理性参考。',
      }) } }],
    }),
  })
  const response = createResponse()

  await handleAnalyze({ method: 'POST', headers: {}, body: { copy: '这是一段超过二十个字、用于验证接口输入的视频口播测试文案。' } }, response)

  assert.equal(response.statusCode, 200)
  const payload = JSON.parse(response.body)
  assert.equal(payload.hookAnalysis.type, '反常识')
  assert.equal(payload.openingVariants.length, 5)
  assert.equal(payload.meta.provider, 'DeepSeek')
  globalThis.fetch = previousFetch
  if (previousKey) process.env.DEEPSEEK_API_KEY = previousKey
  else delete process.env.DEEPSEEK_API_KEY
})
