import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icons'

function buildDraft(video) {
  return {
    hook: video?.hook ?? '',
    pain: video ? `很多人遇到同样的问题，却一直把原因归错。用“${video.hookType}”先打破原有认知。` : '',
    method: video ? `${video.title.replace(/\s#.+$/, '')}。把方法拆成三个具体动作，用画面逐个展示。` : '',
    close: video ? `${video.retention}。最后给出可执行动作，并提醒收藏后照着做。` : '',
  }
}

export default function ScriptsPage({ videos, initialVideo, onNotify }) {
  const initialTitle = initialVideo?.title ?? videos[0]?.title ?? ''
  const [selectedTitle, setSelectedTitle] = useState(initialTitle)
  const selected = useMemo(() => videos.find(video => video.title === selectedTitle) ?? videos[0], [videos, selectedTitle])
  const [draft, setDraft] = useState(() => buildDraft(selected))

  useEffect(() => {
    if (initialVideo?.title) setSelectedTitle(initialVideo.title)
  }, [initialVideo?.title])

  useEffect(() => {
    setDraft(buildDraft(selected))
  }, [selected])

  const update = (field, value) => setDraft(current => ({ ...current, [field]: value }))
  const fullScript = `0–3秒\n${draft.hook}\n\n4–12秒\n${draft.pain}\n\n13–28秒\n${draft.method}\n\n29–36秒\n${draft.close}`

  const save = () => {
    if (!selected) return
    const saved = JSON.parse(localStorage.getItem('qingran-scripts') ?? '{}')
    saved[selected.title] = draft
    localStorage.setItem('qingran-scripts', JSON.stringify(saved))
    onNotify('脚本已保存到本机')
  }

  const copy = async () => {
    if (!selected) return
    await navigator.clipboard?.writeText(fullScript)
    onNotify('完整脚本已复制')
  }

  return <div className="page-grid scripts-page">
    <aside className="page-panel script-sources">
      <div className="section-title"><h2>关联样本</h2><span>{videos.length} 条</span></div>
      {videos.map(video => <button key={video.title} className={selected?.title === video.title ? 'selected' : ''} onClick={() => setSelectedTitle(video.title)}>
        <strong>{video.hookType}</strong><span>{video.title}</span><small>{video.author}</small>
      </button>)}
    </aside>
    <section className="page-panel script-editor">
      <div className="editor-heading"><div><span>{selected?.hookType ?? '等待数据'}</span><h2>{selected?.title.replace(/\s#.+$/, '') ?? '暂无可拆解样本'}</h2></div><div><button className="secondary-action" onClick={copy} disabled={!selected}><Icon name="copy" size={17}/>复制</button><button className="primary-action" onClick={save} disabled={!selected}><Icon name="check" size={17}/>保存脚本</button></div></div>
      <div className="editor-sections">
        {[['hook','0–3 秒','爆点开头'],['pain','4–12 秒','痛点放大'],['method','13–28 秒','方法演示'],['close','29–36 秒','结果回收']].map(([field,time,label]) => <label key={field} className="editor-block"><span><b>{time}</b>{label}</span><textarea rows={field === 'hook' ? 2 : 3} value={draft[field]} onChange={event => update(field, event.target.value)}/><small>{draft[field].length} 字</small></label>)}
      </div>
    </section>
  </div>
}
