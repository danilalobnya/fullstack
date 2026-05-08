import { Link } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'

function NotFound() {
  useSeo({
    title: 'Страница не найдена | Medication Tracker',
    description: 'Запрошенная страница не существует.',
    robots: 'noindex, nofollow',
    canonicalPath: '/404',
  })

  return (
    <main className="container" style={{ padding: '2rem 1rem' }}>
      <h1>404 — Страница не найдена</h1>
      <p>Проверьте адрес страницы или вернитесь на главную.</p>
      <p>
        <Link to="/">На главную</Link>
      </p>
    </main>
  )
}

export default NotFound
