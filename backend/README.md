# Backend API (ЛР 2–6)

FastAPI + PostgreSQL. Покрыты ЛР: 2 (базовый сервер), 3–4 (CRUD), 5–6 (JWT, защита API).

## Установка и запуск
1) Зависимости и venv:
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```
2) `.env` (UTF-8) в каталоге `backend`:
```
DEBUG=false
SECRET_KEY=dev-secret-key-change-me
DATABASE_URL=postgresql://postgres:password@localhost:5432/fullstack_db
VITE_API_URL=http://localhost:8000/api/v1
```
3) Создать БД (пример для psql на Windows):
```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE fullstack_db;"
```
4) Запуск:
```bash
uvicorn app.main:app --reload
```
Документация: http://localhost:8000/docs

## Что реализовано (кратко)
- Health-check (`/health`, `/health/detailed`).
- JWT защита: access + refresh (refresh хранится в БД, ротация при refresh).
- Middleware-зависимость `get_current_user` для защищённых роутов.
- Users: профиль, CRUD членов семьи, проверки принадлежности.
- Medications: CRUD, поиск, проверки владельца.
- Appointments: календарь/день, массовое создание по диапазону и временам, статус, удаление, PDF-заглушка, проверки владельца.
- Schedules: создание/список/удаление расписаний с тайм-слотами, проверки владельца.

Подробные эндпоинты: `../API_ENDPOINTS.md`.
