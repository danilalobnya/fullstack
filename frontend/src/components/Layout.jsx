import { useNavigate, useLocation } from 'react-router-dom'
import './Layout.css'

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = localStorage.getItem('token') // TODO: Использовать контекст

  // Не показываем navbar на страницах авторизации
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register'

  if (hideNavbar) {
    return (
      <div className="App">
        <main>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="App">
      <main>
        {children}
      </main>
    </div>
  )
}

export default Layout

