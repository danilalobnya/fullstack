import { useEffect, useState } from 'react'
import './AdminPanel.css'
import BottomNav from '../components/BottomNav'
import type { AdminUser } from '../types/models'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [revokingId, setRevokingId] = useState<number | null>(null)

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Нет токена авторизации')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE}/users`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      const data = (await response.json()) as AdminUser[]
      setUsers(data)
    } catch {
      setError('Не удалось загрузить список пользователей')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      setUpdatingId(userId)
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Нет токена авторизации')
        return
      }

      const response = await fetch(`${API_BASE}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      const updated = (await response.json()) as AdminUser
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch {
      setError('Не удалось обновить роль пользователя')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRevokeSessions = async (userId: number) => {
    if (!window.confirm('Отозвать все сессии этого пользователя?')) return

    try {
      setRevokingId(userId)
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Нет токена авторизации')
        return
      }

      const response = await fetch(`${API_BASE}/users/${userId}/revoke-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      setError('')
    } catch {
      setError('Не удалось отозвать сессии пользователя')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Панель администратора</h1>
        <p>Управление ролями пользователей</p>
      </div>

      <div className="admin-content">
        {loading ? (
          <div>Загрузка...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Телефон</th>
                <th>Имя</th>
                <th>Роль</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.phone}</td>
                  <td>{user.name}</td>
                  <td>
                    <select
                      value={user.role}
                      disabled={updatingId === user.id}
                      onChange={(e) => void handleChangeRole(user.id, e.target.value)}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={revokingId === user.id}
                      onClick={() => void handleRevokeSessions(user.id)}
                    >
                      {revokingId === user.id ? 'Сброс...' : 'Сбросить сессии'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default AdminPanel
