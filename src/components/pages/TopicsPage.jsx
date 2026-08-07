import { useMemo, useState } from 'react'
import { Icon } from '../Icons'
import { engagementScore, formatCount, growth24hMode, growth24hScore, hasEngagement, rankVideos, sampleCount, trackingStatus } from '../../services/engagement'

const SORT_OPTIONS = [
  ['measured', '实测增长'],
  ['coldStart', '冷启动观察'],
  ['engagement', '综合热度'],
  ['likes', '点赞最多'],
  ['latest', '最新发布'],
]

export default function TopicsPage({ videos, keywords, capturedAt, onAnalyze }) {
  const [query, setQuery] = useState('')
  const [keyword, setKeyword] = useState('全部')
  const [sortMode, setSortMode] = useState('coldStart')

  const filtered = useMemo(() => rankVideos(videos.filter(video => {
    const text = `${video.title} ${video.author}`
    return (keyword === '全部' || text.includes(keyword)) && text.toLowerCase().includes(query.trim().toLowerCase())
  }), sortMode, capturedAt), [videos, keyword, query, sortMode, capturedAt])

  const selected = filtered[0]

  return <div className="page-grid topics-page">
    <section className="page-panel topic-browser">
      <div className="page-toolbar">
        <label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索标题或作者" aria-label="搜索标题或作者"/></label>
        <div className="filter-tabs" role="tablist" aria-label="关键词筛选">
          {['全部', ...keywords].map(item => <button key={item} role="tab" aria-selected={keyword === item} className={keyword === item ? 'active' : ''} onClick={() => setKeyword(item)}>{item}</button>)}
        </div>
      </div>
      <div className="sort-toolbar"><span>排序</span><div role="group" aria-label="视频排序方式">{SORT_OPTIONS.map(([id, label]) => <button key={id} className={sortMode === id ? 'active' : ''} aria-pressed={sortMode === id} onClick={() => setSortMode(id)}>{label}</button>)}</div><small>{sortMode === 'measured' ? '至少 2 个采样点 · 真实增量/小时' : sortMode === 'coldStart' ? '近 24 小时新视频与待匹配样本' : '基于当前采集快照'}</small></div>
      <div className="video-table-head"><span>视频文案</span><span>作者</span><span>{sortMode === 'measured' ? '实测速度 / 点赞' : sortMode === 'coldStart' ? '速度 / 跟踪状态' : '热度分 / 点赞'}</span><span>发布时间</span><span>来源</span></div>
      <div className="video-list">
        {filtered.map((video, index) => <div className={`video-row ${selected?.title === video.title ? 'selected' : ''}`} key={video.title}>
          <button className="video-row-main" aria-label={`拆解视频：${video.title}`} onClick={() => onAnalyze(video)}>
            <span className="video-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="video-copy"><strong>{video.title}</strong><small>{video.hookType} · {video.retention} · 点击查看拆解</small></span>
            <span>{video.author}</span><span className={`video-engagement status-${trackingStatus(video)}`}>{hasEngagement(video) ? <><strong>{sortMode === 'measured' || sortMode === 'coldStart' ? `${growth24hScore(video, capturedAt).toFixed(1)}/h` : engagementScore(video)}</strong><small>赞 {formatCount(video.likeCount)} · {growth24hMode(video, capturedAt)} · {sampleCount(video)}次</small></> : <><strong>—</strong><small>{trackingStatus(video)}</small></>}</span><time>{video.publishedAt.replace('2026年', '')}</time>
          </button>
          {video.videoUrl ? <a className="video-source-link" href={video.videoUrl} target="_blank" rel="noreferrer" aria-label={`打开${video.author}的抖音原视频`}><Icon name="external" size={15}/>原视频</a> : <span className="video-source-missing">待补</span>}
        </div>)}
        {filtered.length === 0 ? <div className="empty-state">{sortMode === 'measured' ? '还没有满 2 个采样点的视频；20 分钟刷新后会自动进入实测榜。' : '没有匹配的视频，换个筛选条件试试。'}</div> : null}
      </div>
    </section>
    <aside className="page-panel insight-rail">
      <div className="rail-kicker">当前样本</div>
      <h2>{selected?.hookType ?? '等待选择'}</h2>
      <blockquote>“{selected?.hook ?? '请选择一条视频'}”</blockquote>
      <div className="insight-definition"><span>为什么能留人</span><p>{selected?.retention ?? '选择样本后显示留客拆解。'}</p></div>
      <div className="insight-definition"><span>原始文案</span><p>{selected?.title ?? '—'}</p></div>
      <div className="insight-definition"><span>跟踪状态</span><p>{selected ? `${trackingStatus(selected)} · ${sampleCount(selected)} 个互动采样点` : '—'}</p></div>
      {selected?.videoUrl ? <a className="rail-source-link" href={selected.videoUrl} target="_blank" rel="noreferrer"><Icon name="external" size={16}/>查看抖音原视频</a> : null}
      <button className="primary-inline" disabled={!selected} onClick={() => onAnalyze(selected)}><Icon name="script" size={18}/>进入脚本拆解</button>
    </aside>
  </div>
}
