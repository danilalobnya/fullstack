import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import BottomNav from '../components/BottomNav'
import api from '../services/api'
import type { Medication, MedicationFileMeta, PresignedDownload } from '../types/models'
import './MedicationDetail.css'

function formatBytes(n: number) {
  if (n < 1024) return `${n} Б`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`
}

function errorDetailToString(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const first = detail[0]
    if (typeof first === 'string') return first
    if (first && typeof first === 'object') {
      const msg = (first as { msg?: unknown }).msg
      if (typeof msg === 'string') return msg
    }
    return 'Ошибка валидации запроса'
  }
  if (detail && typeof detail === 'object') {
    const msg = (detail as { msg?: unknown }).msg
    if (typeof msg === 'string') return msg
  }
  return 'Ошибка запроса'
}

function MedicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const medId = id ? parseInt(id, 10) : NaN

  const [medication, setMedication] = useState<Medication | null>(null)
  const [files, setFiles] = useState<MedicationFileMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [filesLoading, setFilesLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    if (!id || Number.isNaN(medId)) {
      setError('Некорректный идентификатор лекарства')
      setLoading(false)
    }
  }, [id, medId])

  const loadMedication = useCallback(async () => {
    if (!id || Number.isNaN(medId)) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<Medication>(`/medications/${medId}`)
      setMedication(data)
    } catch (e: unknown) {
      const st = axios.isAxiosError(e) ? e.response?.status : 0
      if (st === 404) setError('Лекарство не найдено')
      else if (st === 403) setError('Нет доступа к этому лекарству')
      else setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [id, medId])

  const loadFiles = useCallback(async () => {
    if (!id || Number.isNaN(medId)) return
    setFilesLoading(true)
    try {
      const { data } = await api.get<MedicationFileMeta[]>(`/medications/${medId}/files`)
      setFiles(data)
    } catch {
      setFiles([])
    } finally {
      setFilesLoading(false)
    }
  }, [id, medId])

  useEffect(() => {
    void loadMedication()
  }, [loadMedication])

  useEffect(() => {
    if (medication) void loadFiles()
  }, [medication, loadFiles])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || Number.isNaN(medId)) return
    setUploadStatus('uploading')
    setUploadError('')
    const fd = new FormData()
    fd.append('file', file)
    try {
      await api.post(`/medications/${medId}/files`, fd)
      setUploadStatus('done')
      void loadFiles()
    } catch (err: unknown) {
      setUploadStatus('error')
      if (axios.isAxiosError(err)) {
        const st = err.response?.status
        const detail = (err.response?.data as { detail?: unknown })?.detail
        const message = errorDetailToString(detail)
        if (st === 413) setUploadError('Файл слишком большой')
        else if (st === 415) setUploadError(message || 'Недопустимый тип файла')
        else if (st === 403) setUploadError('Нет прав на загрузку')
        else if (st === 422) setUploadError(`Некорректные данные файла: ${message}`)
        else setUploadError(message || 'Ошибка загрузки')
      } else setUploadError('Ошибка загрузки')
    }
  }

  const downloadFile = async (fileId: number) => {
    try {
      const { data } = await api.get<PresignedDownload>(
        `/medications/${medId}/files/${fileId}/download-url`,
      )
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch {
      setUploadError('Не удалось получить ссылку на скачивание')
    }
  }

  const deleteFile = async (fileId: number) => {
    if (!window.confirm('Удалить файл?')) return
    try {
      await api.delete(`/medications/${medId}/files/${fileId}`)
      void loadFiles()
    } catch {
      setUploadError('Не удалось удалить файл')
    }
  }

  const handleDeleteMedication = async () => {
    if (!medication || !window.confirm(`Удалить лекарство «${medication.name}»?`)) return
    try {
      await api.delete(`/medications/${medId}`)
      navigate('/medications')
    } catch {
      setError('Не удалось удалить')
    }
  }

  if (loading) {
    return (
      <div className="medication-detail-page">
        <div className="container">Загрузка...</div>
        <BottomNav />
      </div>
    )
  }

  if (error || !medication) {
    return (
      <div className="medication-detail-page">
        <div className="container">
          <p className="error-message">{error || 'Ошибка'}</p>
          <Link to="/medications">← К каталогу</Link>
        </div>
        <BottomNav />
      </div>
    )
  }

  const foodLabel =
    medication.take_with_food === 'before'
      ? 'До еды'
      : medication.take_with_food === 'after'
        ? 'После еды'
        : medication.take_with_food === 'with'
          ? 'Во время еды'
          : '—'

  return (
    <div className="medication-detail-page">
      <div className="medication-detail-header">
        <Link to="/medications" className="back-link">
          ← Каталог
        </Link>
        <h1>{medication.name}</h1>
      </div>

      <div className="container">
        <div className="detail-card">
          <dl className="detail-dl">
            <dt>Количество</dt>
            <dd>{medication.quantity}</dd>
            <dt>Дозировка</dt>
            <dd>{medication.dosage || '—'}</dd>
            <dt>Приём с едой</dt>
            <dd>{foodLabel}</dd>
            <dt>Описание</dt>
            <dd>{medication.description || '—'}</dd>
          </dl>
          <div className="detail-actions">
            <Link to={`/medications/${medId}/schedule`} className="btn-secondary">
              Расписание
            </Link>
            <button type="button" className="btn-danger" onClick={() => void handleDeleteMedication()}>
              Удалить лекарство
            </button>
          </div>
        </div>

        <section className="files-section">
          <h2>Вложения</h2>
          <p className="files-hint">Допустимы: JPEG, PNG, WebP, PDF. Максимум 5 МБ.</p>

          <label className="upload-label">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => void handleFileChange(e)}
              disabled={uploadStatus === 'uploading'}
            />
            <span className="upload-btn">
              {uploadStatus === 'uploading' ? 'Загрузка…' : 'Выбрать файл'}
            </span>
          </label>
          {uploadStatus === 'done' && <p className="ok-msg">Файл загружен</p>}
          {uploadError && <div className="error-message">{uploadError}</div>}

          {filesLoading ? (
            <p>Загрузка списка файлов…</p>
          ) : files.length === 0 ? (
            <p className="muted">Нет прикреплённых файлов</p>
          ) : (
            <ul className="files-list">
              {files.map((f) => (
                <li key={f.id} className="files-item">
                  <div>
                    <strong>{f.original_filename}</strong>
                    <span className="muted">
                      {' '}
                      · {formatBytes(f.size_bytes)} · {f.content_type}
                    </span>
                  </div>
                  <div className="files-item-actions">
                    <button type="button" className="btn-link" onClick={() => void downloadFile(f.id)}>
                      Скачать / открыть
                    </button>
                    <button type="button" className="btn-link danger" onClick={() => void deleteFile(f.id)}>
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  )
}

export default MedicationDetail
