import { useState } from 'react'
import { Icon } from './Icons'

export default function ScriptDrawer({ topic, onClose }) {
  const [copied, setCopied] = useState(false)
  if (!topic) return null
  const copy = async () => {
    await navigator.clipboard?.writeText(`${topic.hook}\n${topic.angle}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="script-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onMouseDown={e => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose} aria-label="关闭脚本"><Icon name="close" /></button>
        <p className="drawer-topic">{topic.hashtag}</p>
        <h2 id="drawer-title">一条可以马上拍的脚本</h2>
        <div className="script-section"><span>0–3 秒 · 爆点开头</span><p>“{topic.hook}”</p></div>
        <div className="script-section"><span>4–12 秒 · 痛点放大</span><p>很多人一减脂就把一顿饭越吃越少，结果下午更饿、晚上反而控制不住。问题不是吃得多，是搭配错了。</p></div>
        <div className="script-section"><span>13–28 秒 · 方法演示</span><p>{topic.angle}。记住：一掌蛋白质、一拳主食、两拳蔬菜，把酱汁单独放。</p></div>
        <div className="script-section"><span>29–36 秒 · 结果回收</span><p>照这个公式吃七天，先看腰围和精神状态，别只盯体重。收藏起来，下顿直接照着搭。</p></div>
        <button className="copy-button" onClick={copy}><Icon name="check" size={18}/>{copied ? '已复制' : '复制脚本'}</button>
      </aside>
    </div>
  )
}
