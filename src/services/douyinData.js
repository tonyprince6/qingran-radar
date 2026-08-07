import { topics as fallbackTopics } from '../data'
import { engagementScore, formatCount, hasEngagement, rankByEngagement } from './engagement'

const COLORS = ['#ff4650', '#ff8a2a', '#31bd87']
function parseHour(value) {
  const match = value.match(/\s(\d{1,2}):/)
  return match ? Number(match[1]) : null
}

function buildBuckets(videos, keyword) {
  const matching = videos.filter(video => `${video.title} ${video.author}`.includes(keyword))
  const hours = [20, 21, 22, 23]
  return hours.map(hour => matching.filter(video => parseHour(video.publishedAt) === hour).length)
}

export function buildTopics(data) {
  if (!data?.videos?.length || !data?.keywords?.length) return fallbackTopics

  return data.keywords.map((keyword, index) => {
    const matching = data.videos.filter(video => `${video.title} ${video.author}`.includes(keyword))
    const ranked = rankByEngagement(matching)
    const lead = ranked.find(video => video.videoUrl && hasEngagement(video))
      ?? ranked.find(video => video.videoUrl)
      ?? matching[0]
      ?? data.videos[0]
    const isIndexKeyword = keyword === data.source.index.keyword
    const count = matching.length

    return {
      id: `douyin-${index}`,
      name: keyword,
      hashtag: `#${keyword}`,
      heat: isIndexKeyword ? data.source.index.searchAverage : `${count}条`,
      growth: isIndexKeyword ? data.source.index.monthOverMonth.replace('+', '') : '实时',
      gap: count >= 8 ? '高' : '中',
      gapValue: Math.min(94, 48 + count * 5),
      color: COLORS[index] ?? COLORS[0],
      angle: `${lead.hookType}：${lead.hook}`,
      title: lead.title.replace(/\s#.+$/, ''),
      hook: lead.hook,
      retention: lead.retention,
      metrics: hasEngagement(lead)
        ? [formatCount(lead.likeCount), formatCount(lead.commentCount), formatCount(lead.favoriteCount)]
        : ['待采集', '待采集', '待采集'],
      metricLabels: ['点赞', '评论', '收藏'],
      metricIcons: ['heart', 'comment', 'bookmark'],
      popularityScore: engagementScore(lead),
      rankingBasis: hasEngagement(lead) ? '真实互动排序' : '等待互动数据',
      chart: buildBuckets(data.videos, keyword),
      xLabels: ['20:00', '21:00', '22:00', '23:00'],
      chartLabel: '关联视频新增量',
      video: lead,
    }
  })
}

export async function loadDouyinData({ cacheBust = false } = {}) {
  const suffix = cacheBust ? `?refresh=${Date.now()}` : ''
  const response = await fetch(`./data/douyin.json${suffix}`, { cache: 'no-store' })
  if (!response.ok) throw new Error('抖音数据快照读取失败')
  const data = await response.json()
  return { data, topics: buildTopics(data) }
}
