import assert from 'node:assert/strict'
import test from 'node:test'

test('uses a device-only DeepSeek key for direct analysis', async () => {
  const storage = new Map([['qingran-deepseek-api-key', 'sk-device-test']])
  globalThis.window = {
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
  }
  const previousFetch = globalThis.fetch
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return {
      ok: true,
      json: async () => ({
        model: 'deepseek-v4-flash',
        choices: [{ message: { content: JSON.stringify({
          hookAnalysis: { type: '反常识', core: '别只看体重', whyItWorks: '制造认知差' },
          retention: [],
          rewrittenScript: { hook: '别只看体重', fullText: '别只看体重，也要观察腰围。' },
          openingVariants: [1, 2, 3, 4, 5].map(index => ({ style: `版本${index}`, text: `开头${index}` })),
          safetyNote: '理性参考。',
        }) } }],
      }),
    }
  }

  const { analyzeCopy } = await import('../src/services/analysisApi.js')
  const result = await analyzeCopy({ copy: '这是一段超过二十个字、用于测试当前设备密钥直连的视频文案。' })

  assert.equal(request.url, 'https://api.deepseek.com/chat/completions')
  assert.equal(request.options.headers.Authorization, 'Bearer sk-device-test')
  assert.equal(result.meta.provider, 'DeepSeek · 当前设备直连')
  globalThis.fetch = previousFetch
  delete globalThis.window
})
