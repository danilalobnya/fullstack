import { useEffect, useState } from 'react'
import './HealthCheck.css'

function HealthCheck() {
  const [healthData, setHealthData] = useState(null)
  const [detailedHealth, setDetailedHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchHealthData = async () => {
    setLoading(true)
    try {
      const [healthRes, detailedRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/health/detailed')
      ])
      if (!healthRes.ok || !detailedRes.ok) throw new Error('Health check failed')
      const healthJson = await healthRes.json()
      const detailedJson = await detailedRes.json()
      setHealthData(healthJson)
      setDetailedHealth(detailedJson)
    } catch (err) {
      console.error('Ошибка при проверке health:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
  }, [])

  return (
    <div className="health-check">
      <div className="container">
        <div className="header-section">
          <h1>Health Check</h1>
          <p>Проверка работоспособности сервера</p>
          <button onClick={fetchHealthData} className="refresh-btn" disabled={loading}>
            {loading ? 'Проверка...' : 'Обновить'}
          </button>
        </div>

        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <div className="health-results">
            <div className="health-card">
              <h2>Базовый Health Check</h2>
              {healthData && (
                <div className="health-info">
                  <p><strong>Статус:</strong> <span className="status-ok">{healthData.status}</span></p>
                  <p><strong>Сервис:</strong> {healthData.service}</p>
                  <p><strong>Время:</strong> {new Date(healthData.timestamp).toLocaleString('ru-RU')}</p>
                </div>
              )}
            </div>

            <div className="health-card">
              <h2>Подробный Health Check</h2>
              {detailedHealth && (
                <div className="health-info">
                  <p><strong>Статус:</strong> <span className="status-ok">{detailedHealth.status}</span></p>
                  <p><strong>Сервис:</strong> {detailedHealth.service}</p>
                  <p><strong>Время:</strong> {new Date(detailedHealth.timestamp).toLocaleString('ru-RU')}</p>
                  <div className="components">
                    <h3>Компоненты:</h3>
                    <ul>
                      {Object.entries(detailedHealth.components).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> <span className="status-ok">{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HealthCheck
