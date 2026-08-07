export const SYSTEM_PROMPT = `你是一名资深中文短视频编导，专注减脂、减肥和体重管理内容。
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

export function buildAnalysisContext(body) {
  return [
    body.title ? `视频标题：${String(body.title).slice(0, 300)}` : '',
    body.author ? `作者：${String(body.author).slice(0, 100)}` : '',
    body.videoUrl ? `原视频：${String(body.videoUrl).slice(0, 500)}` : '',
    `待分析文案：\n${body.copy.trim()}`,
  ].filter(Boolean).join('\n\n')
}

export function normalizeAnalysisResult(result) {
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
