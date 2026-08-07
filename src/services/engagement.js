const COUNT_UNITS = [
  [100_000_000, '亿'],
  [10_000, '万'],
]

function asCount(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function publishedTimestamp(value) {
  const match = String(value ?? '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s+(\d{1,2}):(\d{2})/)
  if (!match) return Number.NaN
  const [, year, month, day, hour, minute] = match.map(Number)
  return new Date(year, month - 1, day, hour, minute).getTime()
}

export function hasEngagement(video) {
  return ['likeCount', 'commentCount', 'favoriteCount', 'shareCount']
    .some(key => Number.isFinite(Number(video?.[key])))
}

export function engagementScore(video) {
  if (!hasEngagement(video)) return -1
  return Math.round(
    asCount(video.likeCount)
    + asCount(video.commentCount) * 3
    + asCount(video.favoriteCount) * 4
    + asCount(video.shareCount) * 5
  )
}

export function rankByEngagement(videos) {
  return videos.map((video, index) => ({ video, index, score: engagementScore(video) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.video)
}

export function growth24hScore(video, capturedAt) {
  if (!hasEngagement(video)) return -1
  const captured = new Date(capturedAt).getTime()
  if (!Number.isFinite(captured)) return -1
  const history = Array.isArray(video.engagementHistory) ? video.engagementHistory
    .map(sample => ({ sample, time: new Date(sample.capturedAt).getTime() }))
    .filter(item => Number.isFinite(item.time) && item.time < captured && captured - item.time <= 86_400_000)
    .sort((a, b) => a.time - b.time) : []
  if (history.length) {
    const baseline = history[0]
    const elapsedHours = Math.max(1, (captured - baseline.time) / 3_600_000)
    return Math.max(0, engagementScore(video) - engagementScore(baseline.sample)) / elapsedHours
  }
  const publishedAt = publishedTimestamp(video.publishedAt)
  if (!Number.isFinite(publishedAt)) return -1
  const ageHours = Math.max(1, (captured - publishedAt) / 3_600_000)
  if (ageHours > 24) return -1
  return engagementScore(video) / ageHours
}

export function growth24hMode(video, capturedAt) {
  const captured = new Date(capturedAt).getTime()
  const hasBaseline = Array.isArray(video.engagementHistory) && video.engagementHistory.some(sample => {
    const time = new Date(sample.capturedAt).getTime()
    return Number.isFinite(time) && time < captured && captured - time <= 86_400_000
  })
  if (hasBaseline) return '实测'
  return growth24hScore(video, capturedAt) >= 0 ? '估算' : ''
}

export function rankVideos(videos, mode = 'engagement', capturedAt = new Date().toISOString()) {
  const ranked = videos.map((video, index) => ({
    video,
    index,
    engagement: engagementScore(video),
    growth: growth24hScore(video, capturedAt),
    published: publishedTimestamp(video.publishedAt),
  }))
  if (mode === 'growth24h') return ranked.filter(item => item.growth >= 0)
    .sort((a, b) => b.growth - a.growth || b.engagement - a.engagement || a.index - b.index)
    .map(item => item.video)
  if (mode === 'likes') return ranked.sort((a, b) => asCount(b.video.likeCount) - asCount(a.video.likeCount) || b.engagement - a.engagement || a.index - b.index).map(item => item.video)
  if (mode === 'latest') return ranked.sort((a, b) => b.published - a.published || a.index - b.index).map(item => item.video)
  return ranked.sort((a, b) => b.engagement - a.engagement || a.index - b.index).map(item => item.video)
}

export function formatCount(value) {
  const count = asCount(value)
  for (const [unit, suffix] of COUNT_UNITS) {
    if (count >= unit) return `${(count / unit).toFixed(count >= unit * 10 ? 0 : 1).replace('.0', '')}${suffix}`
  }
  return String(count)
}
