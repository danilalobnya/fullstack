import { useState } from 'react'
import './CreateMedicationModal.css'

function CreateMedicationModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: 'Коллаген морской',
    quantity: '1 капсула',
    dosage: '100 мг',
    description: '',
    takeWithFood: 'with' // before, with, after
  })

  const quantities = ['1 капсула', '2 капсулы', '1 таблетка', '2 таблетки', '5 мл', '10 мл']
  const dosages = ['100 мг', '200 мг', '500 мг', '1000 мг', '5 мл', '10 мл']

  const handleSubmit = async (e) => {
    e.preventDefault()
    // TODO: Отправить данные на API
    // await api.post('/medications', formData)
    alert('Лекарство добавлено!')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Добавить лекарство</h2>
        <form onSubmit={handleSubmit}>
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
              Добавить лекарство
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateMedicationModal

