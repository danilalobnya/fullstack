# Backend API

FastAPI backend для fullstack проекта.

## Установка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
```

2. Активируйте виртуальное окружение:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

5. Настройте переменные окружения в `.env`

## Запуск

```bash
python main.py
```

Или через uvicorn:
```bash
uvicorn app.main:app --reload
```

API будет доступен по адресу: http://localhost:8000

Документация API: http://localhost:8000/docs

## Эндпоинты

- `GET /` - Главная страница
- `GET /health` - Проверка здоровья сервера
- `GET /health/detailed` - Подробная проверка здоровья
- `GET /api/v1/` - Информация об API
