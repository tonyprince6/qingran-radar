import { useState } from 'react'
import { Icon } from './Icons'
import { clearDeviceApiKey, getDeviceApiKey, saveDeviceApiKey } from '../services/deviceApiKey'

export default function SettingsDrawer({ open, onClose, onSave }) {
  const [notifications, setNotifications] = useState(true)
  const [healthNotice, setHealthNotice] = useState(true)
  const [apiKey, setApiKey] = useState(() => getDeviceApiKey())
  const [showApiKey, setShowApiKey] = useState(false)
  if (!open) return null
  const save = () => {
    saveDeviceApiKey(apiKey)
    onSave({notifications, healthNotice})
  }
  const clear = () => {
    clearDeviceApiKey()
    setApiKey('')
  }
  return <div className="drawer-backdrop" onMouseDown={onClose}>
    <aside className="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={event => event.stopPropagation()}>
      <button className="drawer-close" onClick={onClose} aria-label="关闭设置"><Icon name="close"/></button>
      <h2 id="settings-title">工作台设置</h2>
      <p>这些偏好只保存在当前浏览器。</p>
      <div className="api-setting-card">
        <div><span>DeepSeek API 配置</span><strong>{apiKey ? '当前设备已配置' : '当前设备未配置'}</strong></div>
        <label className="api-key-field">
          <span>API Key</span>
          <div><input type={showApiKey ? 'text' : 'password'} value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder="sk-…" autoComplete="off" autoCapitalize="none" spellCheck="false" aria-label="DeepSeek API Key"/><button type="button" onClick={() => setShowApiKey(value => !value)}>{showApiKey ? '隐藏' : '显示'}</button></div>
        </label>
        <p>密钥只保存在这台设备的当前浏览器，分析时通过 HTTPS 直接发送给 DeepSeek，不同步到账号，也不会提交到 GitHub。</p>
        {apiKey ? <button type="button" className="clear-api-key" onClick={clear}>清除此设备的 Key</button> : null}
      </div>
      <label className="setting-row"><span><strong>采集完成提醒</strong><small>每次数据快照更新后显示提醒</small></span><input type="checkbox" checked={notifications} onChange={event => setNotifications(event.target.checked)}/></label>
      <label className="setting-row"><span><strong>健康内容提示</strong><small>生成脚本时保留科学减重与医疗合规提示</small></span><input type="checkbox" checked={healthNotice} onChange={event => setHealthNotice(event.target.checked)}/></label>
      <button className="copy-button" onClick={save}>保存到当前设备</button>
    </aside>
  </div>
}
