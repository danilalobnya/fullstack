# Быстрый старт - Medication Tracker

## Шаг 1: Запуск Backend

Откройте терминал в директории `backend`:

```powershell
# В PowerShell - активация venv
.\venv\Scripts\Activate.ps1

# Если ошибка с политикой выполнения:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Установка зависимостей
pip install -r requirements.txt

# Запуск сервера
python main.py
```

**Backend запустится на:** http://localhost:8000

**Проверка:**
- Откройте http://localhost:8000 - должно вернуть JSON приветствие
- Откройте http://localhost:8000/docs - Swagger документация
- Откройте http://localhost:8000/health - health check

---

## Шаг 2: Запуск Frontend

Откройте **НОВЫЙ** терминал в директории `frontend`:

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev
```

**Frontend запустится на:** http://localhost:3000

**Проверка:**
- Откройте http://localhost:3000 - главная страница приложения
- Откройте http://localhost:3000/health - страница health check

---

## Что должно работать

### Backend
- ✅ http://localhost:8000 - корень API
- ✅ http://localhost:8000/health - простой health check
- ✅ http://localhost:8000/health/detailed - подробный health check
- ✅ http://localhost:8000/docs - Swagger UI со всеми эндпоинтами

### Frontend
- ✅ http://localhost:3000 - главная страница
- ✅ http://localhost:3000/health - страница проверки здоровья
- ✅ Автоматическая проверка подключения к API при загрузке

---

## Тестирование API через Swagger

1. Откройте http://localhost:8000/docs
2. Вы увидите все доступные эндпоинты:
   - Health
   - Authentication
   - Users
   - Medications
   - Appointments
   - Schedules

3. Нажмите на любой эндпоинт (например, GET /health)
4. Нажмите "Try it out" и "Execute"
5. Проверьте ответ

---

## Troubleshooting

### Backend не запускается

1. Проверьте, что Python установлен:
```bash
python --version
```

2. Пересоздайте venv:
```bash
rm -r venv  # или rmdir /s venv на Windows
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend не запускается

1. Проверьте, что Node.js установлен:
```bash
node --version
npm --version
```

2. Очистите node_modules и переустановите:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Порт уже занят

Если порт занят, измените:
- Backend: в `backend/main.py` измените `port=8000`
- Frontend: в `frontend/vite.config.js` измените `port: 3000`

