import { Icon } from '../Icons'

function historyFrom(source, count) {
  const captured = new Date(source?.capturedAt ?? Date.now())
  return [0, 4, 8].map((hours, index) => {
    const time = new Date(captured.getTime() - hours * 60 * 60 * 1000)
    return { time: time.toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }), count: Math.max(0, count - index * 2), status: index === 0 ? '已完成' : '已归档' }
  })
}

export default function TasksPage({ data, collecting, onRun }) {
  const source = data?.source
  const history = historyFrom(source, data?.videos?.length ?? 0)
  return <div className="tasks-layout">
    <section className="task-hero">
      <div><span className="live-dot"/>自动采集运行中</div>
      <h2>三层采集：发现 · 补链 · 互动</h2>
      <p>4 小时发现新话题，1 小时补榜单前 10 的链接，20 分钟刷新前 15 条已跟踪视频。</p>
      <button className="collect-button" onClick={onRun} disabled={collecting}><Icon name="refresh" size={18}/>{collecting ? '正在同步…' : '立即执行一次'}</button>
    </section>
    <div className="task-columns">
      <section className="page-panel task-config"><div className="section-title"><h2>任务配置</h2><span>ACTIVE</span></div>
        <dl><div><dt>数据源</dt><dd>{source?.name ?? '抖音创作者中心'}</dd></div><div><dt>话题发现</dt><dd>每 4 小时 · 最多40条</dd></div><div><dt>链接补全</dt><dd>每 1 小时 · 榜单前10</dd></div><div><dt>互动刷新</dt><dd>每 20 分钟 · 跟踪前15</dd></div><div><dt>关键词</dt><dd>{data?.keywords?.join('、') ?? '减脂、减肥、体重管理'}</dd></div><div><dt>增长口径</dt><dd>至少2次采样进入实测榜</dd></div></dl>
        <a href={source?.url} target="_blank" rel="noreferrer">打开数据源 <Icon name="external" size={15}/></a>
      </section>
      <section className="page-panel task-history"><div className="section-title"><h2>最近运行</h2><span>本地时间</span></div>
        <div className="history-head"><span>时间</span><span>结果</span><span>状态</span></div>
        {history.map(item => <div className="history-row" key={item.time}><time>{item.time}</time><span>{item.count} 条关联视频</span><strong>{item.status}</strong></div>)}
      </section>
    </div>
  </div>
}
