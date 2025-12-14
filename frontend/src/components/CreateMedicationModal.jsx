import { useEffect, useState } from 'react'
import api from '../services/api'
import './CreateMedicationModal.css'

function CreateMedicationModal({ onClose, onSaved, medication }) {
  const [formData, setFormData] = useState({
    name: 'Коллаген морской',
    quantity: '1 капсула',
    dosage: '100 мг',
    description: '',
    takeWithFood: 'with' // before, with, after
  })
  const [error, setError] = useState('')
  const isEditing = !!medication

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name || '',
        quantity: medication.quantity || '',
        dosage: medication.dosage || '',
        description: medication.description || '',
        takeWithFood: medication.take_with_food || 'with',
      })
    }
  }, [medication])

  const quantities = ['1 капсула', '2 капсулы', '1 таблетка', '2 таблетки', '5 мл', '10 мл']
  const dosages = ['100 мг', '200 мг', '500 мг', '1000 мг', '5 мл', '10 мл']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name: formData.name,
      quantity: formData.quantity,
      dosage: formData.dosage,
      description: formData.description,
      take_with_food: formData.takeWithFood,
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Авторизуйтесь заново')
        return
      }

      const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
      const endpoint = isEditing ? `${base}/medications/${medication.id}` : `${base}/medications/`

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.detail || 'failed')
      }

      const data = await response.json()
      onSaved?.(data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось сохранить лекарство')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Добавить лекарство</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Название лекарства:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Количество:</label>
            <select
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="form-select"
            >
              {quantities.map(qty => (
                <option key={qty} value={qty}>{qty}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Дозировка:</label>
            <select
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="form-select"
            >
              {dosages.map(dos => (
                <option key={dos} value={dos}>{dos}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Описание:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Показания по применению:</label>
            <div className="food-buttons">
              <button
                type="button"
                className={`food-btn ${formData.takeWithFood === 'before' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, takeWithFood: 'before' })}
              >
                До еды
              </button>
              <button
                type="button"
                className={`food-btn ${formData.takeWithFood === 'with' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, takeWithFood: 'with' })}
              >
                Во время еды
              </button>
              <button
                type="button"
                className={`food-btn ${formData.takeWithFood === 'after' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, takeWithFood: 'after' })}
              >
                После еды
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Сохранить' : 'Добавить лекарство'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateMedicationModal

