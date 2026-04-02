import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import CreateMedicationModal from '../components/CreateMedicationModal'
import type { Medication } from '../types/models'
import './Medications.css'

function MedicationList() {
  const navigate = useNavigate()
  const [medications, setMedications] = useState<Medication[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMedications([
      {
        id: 1,
        name: 'Коллаген морской',
        quantity: '1 капсула',
        description:
          'описание описание описание описание описание описание описание',
      },
      {
        id: 2,
        name: 'Магния цитрат',
        quantity: '2 таблетки',
        description:
          'описание описание описание описание описание описание описание',
      },
      {
        id: 3,
        name: 'Omega-3',
        quantity: '1 капсула',
        description:
          'описание описание описание описание описание описание описание',
      },
    ])
    setLoading(false)
  }, [])

  const filteredMedications = medications.filter((med) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleMedicationClick = (medication: Medication) => {
    setSelectedMedication(medication)
    navigate(`/medications/${medication.id}/schedule`)
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
            <button className="add-btn" onClick={() => setShowModal(true)}>
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
                  <div className="medication-name">
                    {medication.name}, {medication.quantity}
                  </div>
                  <div className="medication-description">{medication.description}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && <CreateMedicationModal onClose={() => setShowModal(false)} />}

      <BottomNav />
    </div>
  )
}

export default MedicationList
