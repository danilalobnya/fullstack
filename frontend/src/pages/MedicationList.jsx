import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import CreateMedicationModal from '../components/CreateMedicationModal'
import api from '../services/api'
import './Medications.css'

function MedicationList() {
  const [medications, setMedications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMedications = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Авторизуйтесь заново')
        setLoading(false)
        return
      }

      const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
      const url = new URL(`${base}/medications/`, window.location.origin)
      if (searchQuery) url.searchParams.set('search', searchQuery)

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      const data = await response.json()
      setMedications(data)
    } catch (err) {
      setError('Не удалось загрузить лекарства')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedications()
  }, [searchQuery])

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMedicationClick = (medication) => {
    setSelectedMedication(medication)
  }

  const handleEdit = (medication, e) => {
    e.stopPropagation()
    setSelectedMedication(medication)
    setShowModal(true)
  }

  const handleDelete = (medication, e) => {
    e.stopPropagation()
    if (window.confirm(`Вы уверены, что хотите удалить "${medication.name}"?`)) {
      api.delete(`/medications/${medication.id}`).then(() => {
        setMedications(prev => prev.filter(m => m.id !== medication.id))
      }).catch(() => setError('Не удалось удалить лекарство'))
    }
  }

  const handleMedicationSaved = () => {
    setSelectedMedication(null)
    setShowModal(false)
    fetchMedications()
  }

  return (
    <div className="medications-page">
      <div className="medications-header">
        <h1>Каталог лекарств</h1>
      </div>

      <div className="container">
        <div className="medications-content">
          <div className="list-header">
            <h2>Список созданных лекарств</h2>
            <button 
              className="add-btn"
              onClick={() => {
                setSelectedMedication(null)
                setShowModal(true)
              }}
            >
              +
            </button>
          </div>

          <div className="search-section">
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="medications-list">
            {loading ? (
              <div>Загрузка...</div>
            ) : filteredMedications.length === 0 ? (
              <div className="empty-state">Лекарств не найдено</div>
            ) : (
              filteredMedications.map((medication) => (
                <div
                  key={medication.id}
                  className={`medication-item ${selectedMedication?.id === medication.id ? 'selected' : ''}`}
                  onClick={() => handleMedicationClick(medication)}
                >
                  <div className="medication-name">{medication.name}, {medication.quantity}</div>
                  <div className="medication-description">{medication.description}</div>
                  <div className="medication-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={(e) => handleEdit(medication, e)}
                    >
                      Редактировать
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={(e) => handleDelete(medication, e)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <CreateMedicationModal
          onClose={() => setShowModal(false)}
          onSaved={handleMedicationSaved}
          medication={selectedMedication}
        />
      )}

      <BottomNav />
    </div>
  )
}

export default MedicationList

