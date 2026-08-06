import { timeline } from '../data'
import { Icon } from './Icons'

export default function AnalysisPanel({ topic, onPreview }) {
  const metricLabels = topic.metricLabels ?? ['点赞', '评论', '收藏']
  const metricIcons = topic.metricIcons ?? ['heart', 'comment', 'bookmark']
  return (
    <section className="analysis-panel" aria-labelledby="sample-title">
      <div className="panel-heading"><h2 id="sample-title">关联样本 01</h2><span>{topic.video?.publishedAt?.replace('2026年', '') ?? '时长 36s'}</span></div>
      <div className="sample-top">
        <div className="video-cover">
          <img src="./assets/healthy-meal.png" alt="鸡胸肉谷物蔬菜减脂餐短视频封面" />
          <button className="play-button" aria-label="查看样本拆解" onClick={() => onPreview(topic)}><Icon name="play" size={26}/></button>
          <span className="duration">00:36</span>
        </div>
        <div className="sample-summary">
          <h3>{topic.title}</h3>
          <div className="metrics">
            {metricLabels.map((label,i) => <div key={label}><Icon name={metricIcons[i]} size={20}/><strong>{topic.metrics[i]}</strong><small>{label}</small></div>)}
          </div>
          <div className="timeline" aria-label="推演脚本结构">
            {timeline.map(([time, title, detail]) => <div className="timeline-row" key={time}>
              <span className="timeline-dot" />
              <div><b>{time}</b><strong>{title}</strong><p>{detail}</p></div>
            </div>)}
          </div>
        </div>
      </div>
      <div className="hook-block"><span>爆点开头</span><blockquote>“{topic.hook}”</blockquote></div>
      <div className="retention"><span className="target">◎</span><div><small>留客方法总结</small><strong>{topic.retention}</strong></div></div>
    </section>
  )
}
