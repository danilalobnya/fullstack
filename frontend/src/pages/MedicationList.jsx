import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import CreateMedicationModal from '../components/CreateMedicationModal'
import './Medications.css'

function MedicationList() {
  const navigate = useNavigate()
  const [medications, setMedications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Загрузить лекарства из API
    setMedications([
      { id: 1, name: 'Коллаген морской', quantity: '1 капсула', description: 'описание описание описание описание описание описание описание' },
      { id: 2, name: 'Магния цитрат', quantity: '2 таблетки', description: 'описание описание описание описание описание описание описание' },
      { id: 3, name: 'Omega-3', quantity: '1 капсула', description: 'описание описание описание описание описание описание описание' }
    ])
    setLoading(false)
  }, [])

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMedicationClick = (medication) => {
    // В каталоге только просмотр, редактирование и удаление
    setSelectedMedication(medication)
  }

  const handleEdit = (medication, e) => {
    e.stopPropagation()
    // TODO: Открыть модальное окно редактирования
    alert(`Редактирование: ${medication.name}`)
    setShowModal(true)
  }

  const handleDelete = (medication, e) => {
    e.stopPropagation()
    if (window.confirm(`Вы уверены, что хотите удалить "${medication.name}"?`)) {
      // TODO: Удалить через API
      setMedications(prev => prev.filter(m => m.id !== medication.id))
    }
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
              onClick={() => setShowModal(true)}
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
        <CreateMedicationModal onClose={() => setShowModal(false)} />
      )}

      <BottomNav />
    </div>
  )
}

export default MedicationList

