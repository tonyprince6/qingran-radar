import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icons'
import { analyzeCopy } from '../../services/analysisApi'

function buildDraft(video) {
  return {
    hook: video?.hook ?? '',
    pain: video ? `很多人遇到同样的问题，却一直把原因归错。用“${video.hookType}”先打破原有认知。` : '',
    method: video ? `${video.title.replace(/\s#.+$/, '')}。把方法拆成三个具体动作，用画面逐个展示。` : '',
    close: video ? `${video.retention}。最后给出可执行动作，并提醒收藏后照着做。` : '',
  }
}

function buildSourceCopy(video) {
  if (!video) return ''
  return [
    `标题：${video.title.replace(/\s#.+$/, '')}`,
    `开头：${video.hook}`,
    `留客结构：${video.retention}`,
  ].join('\n')
}

export default function ScriptsPage({ videos, initialVideo, onNotify }) {
  const initialTitle = initialVideo?.title ?? videos[0]?.title ?? ''
  const [selectedTitle, setSelectedTitle] = useState(initialTitle)
  const selected = useMemo(() => videos.find(video => video.title === selectedTitle) ?? videos[0], [videos, selectedTitle])
  const [draft, setDraft] = useState(() => buildDraft(selected))
  const [sourceCopy, setSourceCopy] = useState(() => buildSourceCopy(selected))
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')

  useEffect(() => {
    if (initialVideo?.title) setSelectedTitle(initialVideo.title)
  }, [initialVideo?.title])

  useEffect(() => {
    setDraft(buildDraft(selected))
    setSourceCopy(buildSourceCopy(selected))
    setAnalysis(null)
    setAnalysisError('')
  }, [selected])

  const update = (field, value) => setDraft(current => ({ ...current, [field]: value }))
  const fullScript = `0–3秒\n${draft.hook}\n\n4–12秒\n${draft.pain}\n\n13–28秒\n${draft.method}\n\n29–40秒\n${draft.close}`

  const runAnalysis = async () => {
    if (!selected || analyzing) return
    if (sourceCopy.trim().length < 20) {
      setAnalysisError('请先输入至少 20 个字的视频文案。')
      return
    }

    setAnalyzing(true)
    setAnalysisError('')
    try {
      const result = await analyzeCopy({
        copy: sourceCopy,
        title: selected.title,
        author: selected.author,
        videoUrl: selected.videoUrl,
      })
      setAnalysis(result)
      setDraft({
        hook: result.rewrittenScript.hook,
        pain: result.rewrittenScript.pain,
        method: result.rewrittenScript.method,
        close: result.rewrittenScript.close,
      })
      onNotify('DeepSeek 已完成实时拆解并写入脚本')
    } catch (error) {
      setAnalysisError(error.name === 'AbortError' ? '请求已取消。' : error.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const useOpening = text => {
    update('hook', text)
    onNotify('已替换爆点开头')
  }

  const save = () => {
    if (!selected) return
    const saved = JSON.parse(localStorage.getItem('qingran-scripts') ?? '{}')
    saved[selected.title] = { ...draft, analysis }
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
      <div className="editor-heading"><div><span>{selected?.hookType ?? '等待数据'}</span><h2>{selected?.title.replace(/\s#.+$/, '') ?? '暂无可拆解样本'}</h2></div><div>{selected?.videoUrl ? <a className="secondary-action" href={selected.videoUrl} target="_blank" rel="noreferrer"><Icon name="external" size={17}/>原视频</a> : null}<button className="secondary-action" onClick={copy} disabled={!selected}><Icon name="copy" size={17}/>复制</button><button className="primary-action" onClick={save} disabled={!selected}><Icon name="check" size={17}/>保存脚本</button></div></div>

      <div className="ai-source-card">
        <div className="ai-source-heading">
          <div><span>DEEPSEEK 实时分析</span><h3>粘贴或补全视频口播文案</h3></div>
          <button className="ai-analyze-button" onClick={runAnalysis} disabled={!selected || analyzing}>
            <Icon name={analyzing ? 'refresh' : 'spark'} size={17}/>{analyzing ? '正在拆解…' : 'AI 实时拆解'}
          </button>
        </div>
        <textarea aria-label="待分析视频文案" rows="5" maxLength="6000" value={sourceCopy} onChange={event => setSourceCopy(event.target.value)} placeholder="请粘贴完整口播文案；文案越完整，爆点和留客结构越准确。"/>
        <div className="ai-source-meta"><span>{sourceCopy.length} / 6000 字</span><small>文案将提交给 DeepSeek，仅用于本次分析</small></div>
        {analysisError ? <div className="ai-error" role="alert">{analysisError}</div> : null}
      </div>

      {analysis ? <div className="ai-results" aria-live="polite">
        <div className="ai-result-card hook-result">
          <div className="ai-result-title"><span>爆点判断</span><strong>{analysis.hookAnalysis.type}</strong></div>
          <h3>{analysis.hookAnalysis.core}</h3>
          <p>{analysis.hookAnalysis.whyItWorks}</p>
        </div>
        <div className="ai-result-card">
          <div className="ai-result-title"><span>留客结构</span><small>{analysis.retention.length} 个节点</small></div>
          <div className="retention-steps">{analysis.retention.map((item, index) => <div key={`${item.stage}-${index}`}><b>{item.stage}</b><strong>{item.technique}</strong><p>{item.explanation}</p></div>)}</div>
        </div>
        <div className="ai-result-card opening-result">
          <div className="ai-result-title"><span>多个开头版本</span><small>点击即可替换</small></div>
          <div className="opening-variants">{analysis.openingVariants.map((item, index) => <button key={`${item.style}-${index}`} onClick={() => useOpening(item.text)}><b>{item.style}</b><span>{item.text}</span></button>)}</div>
        </div>
        <p className="ai-safety-note">健康提示：{analysis.safetyNote}</p>
      </div> : null}

      <div className="editor-sections">
        {[['hook','0–3 秒','爆点开头'],['pain','4–12 秒','痛点放大'],['method','13–28 秒','方法演示'],['close','29–40 秒','结果回收']].map(([field,time,label]) => <label key={field} className="editor-block"><span><b>{time}</b>{label}</span><textarea rows={field === 'hook' ? 2 : 3} value={draft[field]} onChange={event => update(field, event.target.value)}/><small>{draft[field].length} 字</small></label>)}
      </div>
    </section>
  </div>
}
