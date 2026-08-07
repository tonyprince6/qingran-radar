import { useState } from 'react'
import { Icon } from './Icons'

export default function SettingsDrawer({ open, onClose, onSave }) {
  const [notifications, setNotifications] = useState(true)
  const [healthNotice, setHealthNotice] = useState(true)
  if (!open) return null
  return <div className="drawer-backdrop" onMouseDown={onClose}>
    <aside className="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={event => event.stopPropagation()}>
      <button className="drawer-close" onClick={onClose} aria-label="关闭设置"><Icon name="close"/></button>
      <h2 id="settings-title">工作台设置</h2>
      <p>这些偏好只保存在当前浏览器。</p>
      <div className="api-setting-card">
        <div><span>DeepSeek API</span><strong>仅在服务端录入</strong></div>
        <code>DEEPSEEK_API_KEY</code>
        <p>本机填写项目根目录的 <b>.env.local</b>；公网填写部署平台的服务端环境变量。不要把密钥写进网页或提交到 GitHub。</p>
      </div>
      <label className="setting-row"><span><strong>采集完成提醒</strong><small>每次数据快照更新后显示提醒</small></span><input type="checkbox" checked={notifications} onChange={event => setNotifications(event.target.checked)}/></label>
      <label className="setting-row"><span><strong>健康内容提示</strong><small>生成脚本时保留科学减重与医疗合规提示</small></span><input type="checkbox" checked={healthNotice} onChange={event => setHealthNotice(event.target.checked)}/></label>
      <button className="copy-button" onClick={() => onSave({notifications, healthNotice})}>保存设置</button>
    </aside>
  </div>
}
