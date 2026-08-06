import { useMemo, useState } from 'react'
import { Icon } from '../Icons'

export default function TopicsPage({ videos, keywords, onAnalyze }) {
  const [query, setQuery] = useState('')
  const [keyword, setKeyword] = useState('全部')
  const [selectedTitle, setSelectedTitle] = useState(videos[0]?.title ?? '')

  const filtered = useMemo(() => videos.filter(video => {
    const text = `${video.title} ${video.author}`
    return (keyword === '全部' || text.includes(keyword)) && text.toLowerCase().includes(query.trim().toLowerCase())
  }), [videos, keyword, query])

  const selected = filtered.find(video => video.title === selectedTitle) ?? filtered[0]

  return <div className="page-grid topics-page">
    <section className="page-panel topic-browser">
      <div className="page-toolbar">
        <label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索标题或作者" aria-label="搜索标题或作者"/></label>
        <div className="filter-tabs" role="tablist" aria-label="关键词筛选">
          {['全部', ...keywords].map(item => <button key={item} role="tab" aria-selected={keyword === item} className={keyword === item ? 'active' : ''} onClick={() => setKeyword(item)}>{item}</button>)}
        </div>
      </div>
      <div className="video-table-head"><span>视频文案</span><span>作者</span><span>发布时间</span><span>来源</span></div>
      <div className="video-list">
        {filtered.map((video, index) => <div className={`video-row ${selected?.title === video.title ? 'selected' : ''}`} key={video.title}>
          <button className="video-row-main" onClick={() => setSelectedTitle(video.title)}>
            <span className="video-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="video-copy"><strong>{video.title}</strong><small>{video.hookType} · {video.retention}</small></span>
            <span>{video.author}</span><time>{video.publishedAt.replace('2026年', '')}</time>
          </button>
          {video.videoUrl ? <a className="video-source-link" href={video.videoUrl} target="_blank" rel="noreferrer" aria-label={`打开${video.author}的抖音原视频`}><Icon name="external" size={15}/>原视频</a> : <span className="video-source-missing">待补</span>}
        </div>)}
        {filtered.length === 0 ? <div className="empty-state">没有匹配的视频，换个关键词试试。</div> : null}
      </div>
    </section>
    <aside className="page-panel insight-rail">
      <div className="rail-kicker">当前样本</div>
      <h2>{selected?.hookType ?? '等待选择'}</h2>
      <blockquote>“{selected?.hook ?? '请选择一条视频'}”</blockquote>
      <div className="insight-definition"><span>为什么能留人</span><p>{selected?.retention ?? '选择样本后显示留客拆解。'}</p></div>
      <div className="insight-definition"><span>原始文案</span><p>{selected?.title ?? '—'}</p></div>
      {selected?.videoUrl ? <a className="rail-source-link" href={selected.videoUrl} target="_blank" rel="noreferrer"><Icon name="external" size={16}/>查看抖音原视频</a> : null}
      <button className="primary-inline" disabled={!selected} onClick={() => onAnalyze(selected)}><Icon name="script" size={18}/>进入脚本拆解</button>
    </aside>
  </div>
}
