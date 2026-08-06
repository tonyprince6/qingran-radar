import { navItems } from '../data'
import { Icon, PulseMark } from './Icons'

export default function Sidebar({ active, onNavigate, onSettings, onTeam }) {
  return (
    <aside className="sidebar">
      <div className="brand"><PulseMark /><span>轻燃雷达</span></div>
      <nav aria-label="主导航">
        {navItems.map(([id, label, icon]) => (
          <button key={id} className={`nav-item ${active === id ? 'active' : ''}`} onClick={() => onNavigate(id)} aria-current={active === id ? 'page' : undefined}>
            <Icon name={icon} size={21} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="team" onClick={onTeam}><span className="avatar">轻</span><span>轻燃创作团队</span></button>
        <button className="nav-item" onClick={onSettings}><Icon name="settings" size={21}/><span>设置</span></button>
      </div>
    </aside>
  )
}
