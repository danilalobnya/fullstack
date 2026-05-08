import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import BottomNav from '../components/BottomNav'
import CreateMedicationModal from '../components/CreateMedicationModal'
import api from '../services/api'
import { useSeo } from '../hooks/useSeo'
import type {
  ExternalDrugInfoResponse,
  ImportDrugInfoPayload,
  Medication,
  MedicationSortField,
  PaginatedMedications,
  SortOrder,
} from '../types/models'
import './Medications.css'

type FilterForm = {
  q: string
  take_with_food: string
  quantity_contains: string
  dosage_contains: string
  sort_by: MedicationSortField
  sort_order: SortOrder
  page: number
  page_size: number
}

function readFilters(sp: URLSearchParams): FilterForm {
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get('page_size') || '10', 10) || 10))
  const sb = (sp.get('sort_by') || 'id') as MedicationSortField
  const so = (sp.get('sort_order') || 'desc') as SortOrder
  const sort_by = ['id', 'name', 'dosage', 'quantity'].includes(sb) ? sb : 'id'
  const sort_order = so === 'asc' ? 'asc' : 'desc'
  return {
    q: sp.get('q') ?? '',
    take_with_food: sp.get('take_with_food') ?? '',
    quantity_contains: sp.get('quantity_contains') ?? '',
    dosage_contains: sp.get('dosage_contains') ?? '',
    sort_by,
    sort_order,
    page,
    page_size: pageSize,
  }
}

function filtersToParams(f: FilterForm): Record<string, string | number> {
  const p: Record<string, string | number> = {
    page: f.page,
    page_size: f.page_size,
    sort_by: f.sort_by,
    sort_order: f.sort_order,
  }
  if (f.q.trim()) {
    p.q = f.q.trim()
    // Backward compatibility: старый API использует параметр search.
    p.search = f.q.trim()
  }
  if (f.take_with_food) p.take_with_food = f.take_with_food
  if (f.quantity_contains.trim()) p.quantity_contains = f.quantity_contains.trim()
  if (f.dosage_contains.trim()) p.dosage_contains = f.dosage_contains.trim()
  return p
}

function MedicationList() {
  useSeo({
    title: 'Каталог лекарств | Medication Tracker',
    description: 'Каталог лекарств с фильтрами, поиском, сортировкой и постраничным выводом.',
    robots: 'noindex, nofollow',
    canonicalPath: '/medications',
  })
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState<FilterForm>(() => readFilters(searchParams))
  const [data, setData] = useState<PaginatedMedications | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [externalQuery, setExternalQuery] = useState('')
  const [externalLoading, setExternalLoading] = useState(false)
  const [externalData, setExternalData] = useState<ExternalDrugInfoResponse | null>(null)
  const [externalError, setExternalError] = useState('')
  const [importingTitle, setImportingTitle] = useState<string | null>(null)

  useEffect(() => {
    setForm(readFilters(searchParams))
  }, [searchParams])

  const fetchMedications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const f = readFilters(searchParams)
      const { data: body } = await api.get<PaginatedMedications | Medication[]>('/medications/', {
        params: filtersToParams(f),
      })
      if (Array.isArray(body)) {
        // Backward compatibility: старый API возвращал просто список и
        // не всегда умел серверные фильтры/сортировку/пагинацию.
        const q = f.q.trim().toLowerCase()
        let prepared = body.filter((m) => {
          if (f.take_with_food && (m.take_with_food || '') !== f.take_with_food) return false
          if (
            f.quantity_contains.trim() &&
            !(m.quantity || '').toLowerCase().includes(f.quantity_contains.trim().toLowerCase())
          )
            return false
          if (
            f.dosage_contains.trim() &&
            !(m.dosage || '').toLowerCase().includes(f.dosage_contains.trim().toLowerCase())
          )
            return false
          if (q) {
            const hay = `${m.name || ''} ${m.description || ''} ${m.dosage || ''}`.toLowerCase()
            if (!hay.includes(q)) return false
          }
          return true
        })

        prepared = prepared.sort((a, b) => {
          const order = f.sort_order === 'asc' ? 1 : -1
          if (f.sort_by === 'id') return ((a.id ?? 0) - (b.id ?? 0)) * order
          const av = String(a[f.sort_by] ?? '').toLowerCase()
          const bv = String(b[f.sort_by] ?? '').toLowerCase()
          return av.localeCompare(bv) * order
        })

        const total = prepared.length
        const page = f.page
        const pageSize = f.page_size
        const start = (page - 1) * pageSize
        const sliced = prepared.slice(start, start + pageSize)
        setData({
          items: sliced,
          total,
          page,
          page_size: pageSize,
          pages: Math.max(1, Math.ceil(total / pageSize)),
        })
      } else {
        setData(body)
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setError('Сессия истекла — войдите снова')
      } else {
        setError('Не удалось загрузить лекарства')
      }
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    void fetchMedications()
  }, [fetchMedications])

  const applyToUrl = (f: FilterForm, resetPage = true) => {
    const next = { ...f, page: resetPage ? 1 : f.page }
    const entries = Object.entries(filtersToParams(next)).map(([k, v]) => [k, String(v)] as [string, string])
    setSearchParams(new URLSearchParams(entries), { replace: false })
  }

  const setPage = (p: number) => {
    const f = readFilters(searchParams)
    f.page = Math.max(1, p)
    const entries = Object.entries(filtersToParams(f)).map(([k, v]) => [k, String(v)] as [string, string])
    setSearchParams(new URLSearchParams(entries), { replace: false })
  }

  const handleDelete = (medication: Medication, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm(`Удалить «${medication.name}»?`)) {
      api
        .delete(`/medications/${medication.id}`)
        .then(() => void fetchMedications())
        .catch(() => setError('Не удалось удалить'))
    }
  }

  const handleMedicationSaved = () => {
    setSelectedMedication(null)
    setShowModal(false)
    void fetchMedications()
  }

  const searchExternal = async () => {
    const q = externalQuery.trim()
    if (q.length < 2) {
      setExternalError('Введите минимум 2 символа')
      return
    }
    setExternalLoading(true)
    setExternalError('')
    try {
      const { data } = await api.get<ExternalDrugInfoResponse>('/external/drug-info', {
        params: { query: q },
      })
      setExternalData(data)
      if (!data.source_available) {
        setExternalError('Внешний API временно недоступен, попробуйте позже')
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 429) {
        setExternalError('Слишком много запросов к внешнему API, повторите позже')
      } else {
        setExternalError('Не удалось получить данные из внешнего API')
      }
      setExternalData(null)
    } finally {
      setExternalLoading(false)
    }
  }

  const importExternalDrug = async (payload: ImportDrugInfoPayload) => {
    setImportingTitle(payload.title)
    try {
      await api.post('/external/drug-info/import', {
        title: payload.title,
        indication: payload.indication ?? null,
        warnings: payload.warnings ?? null,
      })
      setError('')
      await fetchMedications()
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        setError('Это лекарство уже есть в вашем каталоге')
      } else {
        setError('Не удалось импортировать лекарство')
      }
    } finally {
      setImportingTitle(null)
    }
  }

  const items = data?.items ?? []

  return (
    <div className="medications-page">
      <div className="medications-header">
        <h1>Каталог лекарств</h1>
      </div>

      <div className="container">
        <div className="medications-content">
          <div className="list-header">
            <h2>Список</h2>
            <button
              type="button"
              className="add-btn"
              onClick={() => {
                setSelectedMedication(null)
                setShowModal(true)
              }}
            >
              +
            </button>
          </div>

          <section className="filters-panel" aria-label="Фильтры и поиск">
            <div className="filters-grid">
              <label className="filter-field">
                <span>Поиск (название, описание, дозировка)</span>
                <input
                  type="text"
                  value={form.q}
                  onChange={(e) => setForm((prev) => ({ ...prev, q: e.target.value }))}
                  placeholder="Введите запрос…"
                  className="form-input"
                />
              </label>
              <label className="filter-field">
                <span>Приём с едой</span>
                <select
                  value={form.take_with_food}
                  onChange={(e) => setForm((prev) => ({ ...prev, take_with_food: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Любой</option>
                  <option value="before">До еды</option>
                  <option value="with">Во время еды</option>
                  <option value="after">После еды</option>
                </select>
              </label>
              <label className="filter-field">
                <span>Количество содержит</span>
                <input
                  type="text"
                  value={form.quantity_contains}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity_contains: e.target.value }))}
                  className="form-input"
                />
              </label>
              <label className="filter-field">
                <span>Дозировка содержит</span>
                <input
                  type="text"
                  value={form.dosage_contains}
                  onChange={(e) => setForm((prev) => ({ ...prev, dosage_contains: e.target.value }))}
                  className="form-input"
                />
              </label>
              <label className="filter-field">
                <span>Сортировка</span>
                <select
                  value={form.sort_by}
                  onChange={(e) => {
                    const base = readFilters(searchParams)
                    const next = { ...base, sort_by: e.target.value as MedicationSortField, page: 1 }
                    setForm(next)
                    applyToUrl(next, false)
                  }}
                  className="form-select"
                >
                  <option value="id">По ID</option>
                  <option value="name">По названию</option>
                  <option value="dosage">По дозировке</option>
                  <option value="quantity">По количеству</option>
                </select>
              </label>
              <label className="filter-field">
                <span>Порядок</span>
                <select
                  value={form.sort_order}
                  onChange={(e) => {
                    const base = readFilters(searchParams)
                    const next = { ...base, sort_order: e.target.value as SortOrder, page: 1 }
                    setForm(next)
                    applyToUrl(next, false)
                  }}
                  className="form-select"
                >
                  <option value="asc">По возрастанию</option>
                  <option value="desc">По убыванию</option>
                </select>
              </label>
              <label className="filter-field">
                <span>На странице</span>
                <select
                  value={form.page_size}
                  onChange={(e) => {
                    const base = readFilters(searchParams)
                    const next = {
                      ...base,
                      page_size: parseInt(e.target.value, 10),
                      page: 1,
                    }
                    setForm(next)
                    applyToUrl(next, false)
                  }}
                  className="form-select"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="filters-actions">
              <button type="button" className="btn-primary" onClick={() => applyToUrl(form, true)}>
                Применить фильтры
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const cleared: FilterForm = {
                    q: '',
                    take_with_food: '',
                    quantity_contains: '',
                    dosage_contains: '',
                    sort_by: 'id',
                    sort_order: 'desc',
                    page: 1,
                    page_size: 10,
                  }
                  setForm(cleared)
                  applyToUrl(cleared, true)
                }}
              >
                Сбросить
              </button>
            </div>
            <p className="filters-url-hint">
              Параметры сохраняются в адресе страницы — можно поделиться ссылкой или использовать «Назад» в
              браузере.
            </p>
          </section>

          <section className="filters-panel" aria-label="Импорт из внешнего API">
            <h3 style={{ marginTop: 0 }}>Добавить из внешнего API</h3>
            <div className="filters-actions">
              <input
                type="text"
                className="form-input"
                placeholder="Например: Aspirin"
                value={externalQuery}
                onChange={(e) => setExternalQuery(e.target.value)}
                style={{ minWidth: 260, flex: 1 }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => void searchExternal()}
                disabled={externalLoading}
              >
                {externalLoading ? 'Поиск…' : 'Искать во внешнем API'}
              </button>
            </div>
            {externalError ? <div className="error-message">{externalError}</div> : null}

            {externalData && externalData.items.length > 0 ? (
              <div className="medications-list" style={{ marginTop: '0.75rem' }}>
                {externalData.items.some((it) => it.source === 'rxnav') ? (
                  <p className="muted" style={{ marginBottom: '0.5rem' }}>
                    RxNorm: только варианты названия из справочника NIH; тексты инструкции как у OpenFDA не
                    подгружаются.
                  </p>
                ) : null}
                {externalData.items.map((it, idx) => (
                  <div className="medication-item" key={`${it.title}-${idx}`}>
                    <div className="medication-name">
                      {it.title}
                      <span className="muted" style={{ marginLeft: '0.35rem', fontSize: '0.85em' }}>
                        ({it.source === 'rxnav' ? 'RxNorm' : 'OpenFDA'})
                      </span>
                    </div>
                    {(it.source !== 'rxnav' || it.indication) && (
                      <div className="medication-description">
                        {it.source === 'rxnav'
                          ? it.indication
                          : it.indication || 'Показания не указаны'}
                      </div>
                    )}
                    <div className="medication-actions">
                      <button
                        type="button"
                        className="action-btn edit-btn"
                        onClick={() =>
                          void importExternalDrug({
                            title: it.title,
                            indication: it.indication,
                            warnings: it.warnings,
                          })
                        }
                        disabled={importingTitle === it.title}
                      >
                        {importingTitle === it.title ? 'Добавление…' : 'Добавить в каталог'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : externalData && !externalLoading ? (
              <p className="pagination-summary">По внешнему API ничего не найдено</p>
            ) : null}
          </section>

          {error && <div className="error-message">{error}</div>}

          {data && (
            <p className="pagination-summary">
              Всего: {data.total} · страница {data.page} из {data.pages || 1}
            </p>
          )}

          <div className="medications-list">
            {loading ? (
              <div>Загрузка...</div>
            ) : items.length === 0 ? (
              <div className="empty-state">Лекарств не найдено</div>
            ) : (
              items.map((medication) => (
                <div key={medication.id} className="medication-item">
                  <Link to={`/medications/${medication.id}`} className="medication-item-link">
                    <div className="medication-name">
                      {medication.name}, {medication.quantity}
                    </div>
                    <div className="medication-description">{medication.description}</div>
                  </Link>
                  <div className="medication-actions">
                    <Link to={`/medications/${medication.id}`} className="action-btn">
                      Просмотр
                    </Link>
                    <button
                      type="button"
                      className="action-btn edit-btn"
                      onClick={() => {
                        setSelectedMedication(medication)
                        setShowModal(true)
                      }}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
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

          {data && data.pages > 1 && (
            <nav className="pagination-nav" aria-label="Страницы">
              <button
                type="button"
                disabled={form.page <= 1}
                onClick={() => setPage(form.page - 1)}
                className="page-btn"
              >
                ← Назад
              </button>
              <span className="page-info">
                {form.page} / {data.pages}
              </span>
              <button
                type="button"
                disabled={form.page >= data.pages}
                onClick={() => setPage(form.page + 1)}
                className="page-btn"
              >
                Вперёд →
              </button>
            </nav>
          )}
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
