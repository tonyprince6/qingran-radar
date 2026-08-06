import { useMemo, useState } from 'react'
import { Icon } from '../Icons'

export default function IdeasPage({ videos, onGenerate, onNotify }) {
  const ideas = useMemo(() => videos.slice(0, 8).map((video, index) => ({...video, id:`idea-${index}`})), [videos])
  const [saved, setSaved] = useState(() => new Set())
  const [status, setStatus] = useState({})

  const toggleSaved = id => setSaved(current => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const advance = idea => {
    const current = status[idea.id] ?? '待拍'
    const next = current === '待拍' ? '已拍' : current === '已拍' ? '待发布' : '待拍'
    setStatus(current => ({...current, [idea.id]: next}))
    onNotify(`选题状态已改为“${next}”`)
  }

  return <section className="page-panel idea-library">
    <div className="library-heading"><div><h2>减脂选题库</h2><p>从最新关联视频中提炼，保留原始爆点但重新组织表达。</p></div><div className="library-count"><strong>{ideas.length}</strong><span>个可拍选题</span></div></div>
    <div className="idea-board-head"><span>选题与爆点</span><span>留客结构</span><span>状态</span><span>操作</span></div>
    {ideas.map(idea => <article className="idea-board-row" key={idea.id}>
      <div><button className={`save-idea ${saved.has(idea.id) ? 'saved' : ''}`} aria-label={saved.has(idea.id) ? '取消收藏' : '收藏选题'} onClick={() => toggleSaved(idea.id)}>☆</button><span><strong>{idea.hook}</strong><small>{idea.hookType} · {idea.author}</small></span></div>
      <p>{idea.retention}</p>
      <button className="status-button" onClick={() => advance(idea)}>{status[idea.id] ?? '待拍'}</button>
      <button className="generate-action" onClick={() => onGenerate(idea)}><Icon name="spark" size={17}/>生成脚本</button>
    </article>)}
  </section>
}
