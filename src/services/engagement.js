const COUNT_UNITS = [
  [100_000_000, '亿'],
  [10_000, '万'],
]

function asCount(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
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

export function formatCount(value) {
  const count = asCount(value)
  for (const [unit, suffix] of COUNT_UNITS) {
    if (count >= unit) return `${(count / unit).toFixed(count >= unit * 10 ? 0 : 1).replace('.0', '')}${suffix}`
  }
  return String(count)
}
