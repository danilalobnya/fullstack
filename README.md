# Fullstack проект - ЛР 2–6

ЛР 2: развёртывание сервера, базовая маршрутизация, health-check.  
ЛР 3–4: CRUD по ключевым сущностям, базовая валидация, обработка ошибок.  
ЛР 5–6: клиентская авторизация и защита API (JWT, middleware, refresh в БД).

## Структура проекта

```
fullstack/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── routers/     # Роутеры API
│   │   ├── main.py      # Главный файл приложения
│   │   ├── config.py    # Конфигурация
│   │   └── database.py  # Настройки БД
│   ├── main.py          # Точка входа
│   └── requirements.txt # Зависимости Python
├── frontend/            # React frontend
│   ├── src/
│   │   ├── pages/      # Страницы
│   │   ├── services/   # API сервисы
│   │   └── App.jsx     # Главный компонент
│   └── package.json    # Зависимости npm
└── README.md
```

## Требования
- Python 3.11+
- PostgreSQL 13+
- Node.js 18+ / npm

## Быстрый запуск
### Backend
1. Создать/активировать venv и поставить зависимости:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```
2. Создать `.env` (UTF-8) в `backend/`:
   ```
   DEBUG=false
   SECRET_KEY=dev-secret-key-change-me
   DATABASE_URL=postgresql://postgres:password@localhost:5432/fullstack_db
   VITE_API_URL=http://localhost:8000/api/v1
   ```
3. Создать БД (psql):
   ```powershell
   & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE fullstack_db;"
   ```
   (если прав нет — дайте их или создайте через pgAdmin).
4. Запуск:
   ```bash
   uvicorn app.main:app --reload
   ```
   Документация: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
UI по умолчанию: http://localhost:5173 (или показанный Vite порт).

## Краткий итог по ЛР
- ЛР2: базовая структура FastAPI, health-check (`/health`, `/health/detailed`), CORS.
- ЛР3–4: CRUD для users/family, medications, appointments, schedules; валидация и ошибки; PDF-заглушка.
- ЛР5–6: JWT защита, middleware-зависимость `get_current_user`, access/refresh токены, хранение refresh в БД, ротация refresh, проверки принадлежности ресурсов.

## Основные модули
1. Auth `/api/v1/auth` — register/login (access+refresh), refresh.
2. Users `/api/v1/users` — профиль, семья CRUD.
3. Medications `/api/v1/medications` — CRUD + поиск.
4. Appointments `/api/v1/appointments` — календарь/день, создание сериями, статус, удаление, PDF-заглушка.
5. Schedules `/api/v1/schedules` — расписания, тайм-слоты, периодичность.
6. Health `/health` — basic/detailed.

Подробности: `backend/API_ENDPOINTS.md`.
