import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import TrendChart from './components/TrendChart'
import AnalysisPanel from './components/AnalysisPanel'
import ScriptDrawer from './components/ScriptDrawer'
import SettingsDrawer from './components/SettingsDrawer'
import TopicsPage from './components/pages/TopicsPage'
import ScriptsPage from './components/pages/ScriptsPage'
import IdeasPage from './components/pages/IdeasPage'
import TasksPage from './components/pages/TasksPage'
import { Icon } from './components/Icons'
import { topics as fallbackTopics } from './data'
import { loadDouyinData } from './services/douyinData'

const PAGE_META = {
  overview: ['减脂内容雷达', '每 4 小时追踪一次热点、爆点与留客结构'],
  topics: ['热门话题', '搜索和筛选抖音真实关联视频'],
  scripts: ['脚本拆解', '把爆点样本改写成可以直接拍的四段脚本'],
  ideas: ['选题库', '管理待拍、已拍和待发布的减脂选题'],
  tasks: ['采集任务', '查看自动采集配置、运行状态与历史记录'],
}

const AUTO_REFRESH_MS = 60_000

function topicFromVideo(video, index = 0) {
  return {
    id: `video-${index}`,
    name: video.hookType,
    hashtag: `#${video.hookType}`,
    angle: video.retention,
    title: video.title.replace(/\s#.+$/, ''),
    hook: video.hook,
    retention: video.retention,
  }
}

function TopicTable({ topics, activeTopic, onSelect }) {
  return <section className="topic-table" aria-labelledby="rising-title">
    <div className="section-title"><h2 id="rising-title">关联关键词</h2><span>来自抖音创作者中心</span></div>
    <div className="table-head"><span>话题</span><span>热度</span><span>增速</span><span>内容缺口</span></div>
    {topics.map((topic, index) => <button key={topic.id} className={`topic-row ${activeTopic.id === topic.id ? 'selected' : ''}`} onClick={() => onSelect(topic)}>
      <span className="topic-name"><i style={{background: topic.color}}>{index + 1}</i>{topic.hashtag}</span>
      <strong>{topic.heat}</strong><em>{topic.growth === '实时' ? '实时' : `↑ ${topic.growth}`}</em>
      <span className="gap"><i><b style={{width: `${topic.gapValue}%`, background: topic.color}}/></i>{topic.gap}</span>
      <span className="chevron">›</span>
    </button>)}
  </section>
}

function TodayIdeas({ topics, onGenerate }) {
  return <section className="ideas" aria-labelledby="ideas-title">
    <div className="section-title"><h2 id="ideas-title">今天值得拍</h2><span>根据热度与内容缺口推荐</span></div>
    <div className="ideas-head"><span>话题</span><span>切入角度</span><span>操作</span></div>
    {topics.map((topic,index) => <div className="idea-row" key={topic.id}>
      <span className="topic-name"><i style={{background: topic.color}}>{index + 1}</i>{topic.hashtag}</span>
      <p>{topic.angle}</p>
      <button onClick={() => onGenerate(topic)}><Icon name="spark" size={17}/>生成脚本</button>
    </div>)}
  </section>
}

function OverviewPage({ topics, activeTopic, topicId, onSelectTopic, onGenerate }) {
  return <>
    <div className="workspace">
      <div className="overview-column">
        <section className="trend-section">
          <div className="section-title"><h2>关联视频发布节奏</h2><span className="period-static">最近 4 小时</span></div>
          <div className="topic-tabs" role="tablist">
            {topics.map(topic => <button role="tab" aria-selected={topicId === topic.id} key={topic.id} className={topicId === topic.id ? 'active' : ''} onClick={() => onSelectTopic(topic.id)}>{topic.name}</button>)}
          </div>
          <TrendChart topic={activeTopic}/>
        </section>
        <TopicTable topics={topics} activeTopic={activeTopic} onSelect={topic => onSelectTopic(topic.id)}/>
      </div>
      <AnalysisPanel topic={activeTopic} onPreview={onGenerate}/>
    </div>
    <TodayIdeas topics={topics} onGenerate={onGenerate}/>
  </>
}

export default function App() {
  const [activeNav, setActiveNav] = useState('overview')
  const [topics, setTopics] = useState(fallbackTopics)
  const [topicId, setTopicId] = useState(fallbackTopics[0].id)
  const [data, setData] = useState(null)
  const [collecting, setCollecting] = useState(false)
  const [updated, setUpdated] = useState('正在读取抖音数据…')
  const [sourceSummary, setSourceSummary] = useState('抖音创作者中心')
  const [drawerTopic, setDrawerTopic] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState('')
  const lastCapturedAtRef = useRef('')
  const activeTopic = useMemo(() => topics.find(topic => topic.id === topicId) ?? topics[0], [topicId, topics])
  const videos = data?.videos ?? []
  const keywords = data?.keywords ?? ['减脂', '减肥', '体重管理']
  const [pageTitle, pageDescription] = PAGE_META[activeNav]

  const showToast = useCallback(message => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }, [])

  const applyData = useCallback(result => {
    lastCapturedAtRef.current = result.data.source.capturedAt
    setData(result.data)
    setTopics(result.topics)
    setTopicId(current => result.topics.some(topic => topic.id === current) ? current : result.topics[0].id)
    const captured = new Date(result.data.source.capturedAt)
    setUpdated(`抖音数据 · ${captured.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`)
    setSourceSummary(`${result.data.source.name} · ${result.data.keywords.length} 个关键词 · ${result.data.videos.length} 条关联视频`)
  }, [])

  useEffect(() => {
    let active = true
    let refreshing = false
    const refresh = async () => {
      if (refreshing) return
      refreshing = true
      try {
        const result = await loadDouyinData({ cacheBust: true })
        if (!active) return
        const previousCapturedAt = lastCapturedAtRef.current
        if (result.data.source.capturedAt !== previousCapturedAt) {
          applyData(result)
          if (previousCapturedAt) showToast(`已自动同步：${result.data.videos.length} 条抖音关联视频`)
        }
      } catch {
        if (active && !lastCapturedAtRef.current) setUpdated('抖音数据读取失败 · 已显示演示数据')
      } finally {
        refreshing = false
      }
    }

    refresh()
    const intervalId = window.setInterval(refresh, AUTO_REFRESH_MS)
    const refreshOnFocus = () => refresh()
    const refreshOnVisible = () => {
      if (!document.hidden) refresh()
    }
    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnVisible)

    return () => {
      active = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [applyData, showToast])

  const collect = async () => {
    if (collecting) return
    setCollecting(true)
    try {
      const result = await loadDouyinData({ cacheBust: true })
      applyData(result)
      showToast(`同步完成：${result.data.videos.length} 条抖音关联视频`)
    } catch {
      showToast('同步失败：请检查抖音数据快照')
    } finally {
      setCollecting(false)
    }
  }

  const openScript = item => setDrawerTopic(item.metrics ? item : topicFromVideo(item))

  const analyzeVideo = video => {
    setSelectedVideo(video)
    setActiveNav('scripts')
  }

  const saveSettings = settings => {
    localStorage.setItem('qingran-settings', JSON.stringify(settings))
    setSettingsOpen(false)
    showToast('设置已保存')
  }

  let pageContent
  if (activeNav === 'topics') pageContent = <TopicsPage videos={videos} keywords={keywords} onAnalyze={analyzeVideo}/>
  else if (activeNav === 'scripts') pageContent = <ScriptsPage videos={videos} initialVideo={selectedVideo} onNotify={showToast}/>
  else if (activeNav === 'ideas') pageContent = <IdeasPage videos={videos} onGenerate={openScript} onNotify={showToast}/>
  else if (activeNav === 'tasks') pageContent = <TasksPage data={data} collecting={collecting} onRun={collect}/>
  else pageContent = <OverviewPage topics={topics} activeTopic={activeTopic} topicId={topicId} onSelectTopic={setTopicId} onGenerate={openScript}/>

  return <div className="app-shell">
    <Sidebar active={activeNav} onNavigate={setActiveNav} onSettings={() => setSettingsOpen(true)} onTeam={() => { setActiveNav('ideas'); showToast('已打开团队选题库') }}/>
    <main>
      <header className="topbar">
        <div><h1>{pageTitle}</h1><p>{pageDescription}</p><span className="source-summary">{sourceSummary}</span></div>
        <div className="top-actions">
          <span className="updated"><Icon name="clock" size={18}/>{updated}<small>每分钟自动刷新</small></span>
          <button className="api-config-button" onClick={() => setSettingsOpen(true)}><Icon name="settings" size={17}/>API 配置</button>
          <button className="collect-button" onClick={collect} disabled={collecting}><Icon name="refresh" size={18}/>{collecting ? '正在采集…' : '立即采集'}</button>
        </div>
      </header>
      {pageContent}
    </main>
    {toast ? <div className="toast"><Icon name="check" size={18}/>{toast}</div> : null}
    <ScriptDrawer topic={drawerTopic} onClose={() => setDrawerTopic(null)}/>
    <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} onSave={saveSettings}/>
  </div>
}
