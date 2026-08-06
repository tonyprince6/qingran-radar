import { topics as fallbackTopics } from '../data'

const COLORS = ['#ff4650', '#ff8a2a', '#31bd87']
const PREFERRED_HOOK_TYPES = {
  减脂: '数字结果承诺',
  减肥: '反常识归因',
  体重管理: '痛点提问',
}

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
    const lead = matching.find(video => video.hookType === PREFERRED_HOOK_TYPES[keyword]) ?? matching[0] ?? data.videos[0]
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
      metrics: [`${count}条`, data.source.window, '已同步'],
      metricLabels: ['关联视频', '采集窗口', '数据状态'],
      metricIcons: ['script', 'clock', 'check'],
      chart: buildBuckets(data.videos, keyword),
      xLabels: ['20:00', '21:00', '22:00', '23:00'],
      chartLabel: '关联视频新增量',
      video: lead,
    }
  })
}

export async function loadDouyinData() {
  const response = await fetch('./data/douyin.json', { cache: 'no-store' })
  if (!response.ok) throw new Error('抖音数据快照读取失败')
  const data = await response.json()
  return { data, topics: buildTopics(data) }
}
