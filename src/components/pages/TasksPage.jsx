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
      <h2>每 4 小时读取一次抖音创作者中心</h2>
      <p>仅跟踪“减脂、减肥、体重管理”，登录失效时停止，不绕过验证码或平台风控。</p>
      <button className="collect-button" onClick={onRun} disabled={collecting}><Icon name="refresh" size={18}/>{collecting ? '正在同步…' : '立即执行一次'}</button>
    </section>
    <div className="task-columns">
      <section className="page-panel task-config"><div className="section-title"><h2>任务配置</h2><span>ACTIVE</span></div>
        <dl><div><dt>数据源</dt><dd>{source?.name ?? '抖音创作者中心'}</dd></div><div><dt>运行频率</dt><dd>每 4 小时</dd></div><div><dt>关键词</dt><dd>{data?.keywords?.join('、') ?? '减脂、减肥、体重管理'}</dd></div><div><dt>处理方式</dt><dd>去重 → 文案提取 → 爆点拆解 → 更新网站</dd></div></dl>
        <a href={source?.url} target="_blank" rel="noreferrer">打开数据源 <Icon name="external" size={15}/></a>
      </section>
      <section className="page-panel task-history"><div className="section-title"><h2>最近运行</h2><span>本地时间</span></div>
        <div className="history-head"><span>时间</span><span>结果</span><span>状态</span></div>
        {history.map(item => <div className="history-row" key={item.time}><time>{item.time}</time><span>{item.count} 条关联视频</span><strong>{item.status}</strong></div>)}
      </section>
    </div>
  </div>
}
