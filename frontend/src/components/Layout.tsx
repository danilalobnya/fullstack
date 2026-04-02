import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import './Layout.css'

function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register'

  if (hideNavbar) {
    return (
      <div className="App">
        <main>{children}</main>
      </div>
    )
  }

  return (
    <div className="App">
      <main>{children}</main>
    </div>
  )
}

export default Layout
