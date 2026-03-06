import { Link, useLocation } from 'react-router-dom'
import './BottomNav.css'

function BottomNav() {
  const location = useLocation()
  const role = localStorage.getItem('user_role') || 'user'

  const isActive = (path) => {
    // Точное совпадение
    if (path === location.pathname) return true
    
    // Для страницы расписания лекарств - должна подсвечиваться на всех страницах с /schedule
    if (path === '/medications/schedule') {
      // Подсвечиваем на /medications/schedule и /medications/:id/schedule
      return location.pathname === '/medications/schedule' || 
             (location.pathname.startsWith('/medications/') && location.pathname.endsWith('/schedule'))
    }
    
    // Для каталога лекарств - только точное совпадение /medications (без schedule)
    if (path === '/medications') {
      return location.pathname === '/medications'
    }
    
    return false
  }

  const navItems = [
    { path: '/', label: 'главная', icon: '📊' },
    { path: '/medications/schedule', label: 'лекарства', icon: '💊' },
    { path: '/medications', label: 'каталог лекарств', icon: '📋' },
    { path: '/profile', label: 'профиль', icon: '👤' }
  ]

  if (role === 'admin') {
    navItems.push({ path: '/admin', label: 'админ', icon: '🛠️' })
  }

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path + item.label}
          to={item.path}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default BottomNav

