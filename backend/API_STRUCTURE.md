# Структура API - Medication Tracker

## Обзор

API для приложения-трекера приема лекарств с поддержкой семейных аккаунтов.

**Base URL:** `http://localhost:8000/api/v1`

**Документация Swagger:** `http://localhost:8000/docs`

---

## Архитектура

### Структура модулей

```
backend/app/
├── main.py                 # Точка входа приложения
├── config.py              # Конфигурация
├── database.py            # Подключение к БД
└── routers/               # Модули API
    ├── health.py         # Health check
    ├── auth.py           # Авторизация
    ├── users.py          # Пользователи и профиль
    ├── medications.py    # Каталог лекарств
    ├── appointments.py   # Приемы лекарств
    └── schedules.py      # Расписания
```

---

## Модули API

### 1. Health Check (`/health`)
**Файл:** `routers/health.py`

Проверка работоспособности сервера.

**Эндпоинты:**
- `GET /health` - Базовый health check
- `GET /health/detailed` - Подробная информация о системе

---

### 2. Authentication (`/auth`)
**Файл:** `routers/auth.py`

Авторизация и регистрация пользователей.

**Эндпоинты:**
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `POST /auth/refresh` - Обновление токена

**Аутентификация:** JWT токены

---

### 3. Users (`/users`)
**Файл:** `routers/users.py`

Управление профилем пользователя и членами семьи.

**Эндпоинты:**
- `GET /users/me` - Получить профиль
- `PUT /users/me` - Обновить профиль
- `POST /users/me/family` - Добавить члена семьи
- `GET /users/me/family` - Список членов семьи
- `DELETE /users/me/family/{member_id}` - Удалить члена семьи

**Функции:**
- Управление настройками SMS уведомлений
- Управление семейным профилем

---

### 4. Medications (`/medications`)
**Файл:** `routers/medications.py`

Каталог лекарств пользователя.

**Эндпоинты:**
- `GET /medications` - Список лекарств (с поиском)
- `GET /medications/{id}` - Информация о лекарстве
- `POST /medications` - Создать лекарство
- `PUT /medications/{id}` - Обновить лекарство
- `DELETE /medications/{id}` - Удалить лекарство

**Поля лекарства:**
- Название
- Количество
- Дозировка
- Описание
- Время приема относительно еды (до/во время/после)

---

### 5. Appointments (`/appointments`)
**Файл:** `routers/appointments.py`

Приемы лекарств и календарь.

**Эндпоинты:**
- `GET /appointments/calendar` - Календарь приемов
- `GET /appointments/day/{date}` - Приемы на день
- `POST /appointments` - Создать прием
- `PUT /appointments/status` - Обновить статус
- `DELETE /appointments/{id}` - Удалить прием
- `GET /appointments/pdf` - Экспорт в PDF

**Функции:**
- Просмотр календаря (месяц/неделя)
- Переключение между членами семьи
- Статусы: pending/taken/skipped
- Статистика приемов
- Печать в PDF

---

### 6. Schedules (`/schedules`)
**Файл:** `routers/schedules.py`

Расписание регулярного приема лекарств.

**Эндпоинты:**
- `POST /schedules` - Создать расписание
- `GET /schedules` - Список расписаний
- `DELETE /schedules/{id}` - Удалить расписание

**Функции:**
- Выбор времени приема
- Периодичность (каждый день/через день)
- Диапазон дат

---

## Модели данных

### User (Пользователь)
```python
{
    "id": int,
    "phone": str,
    "name": str,
    "sms_notifications": bool
}
```

### FamilyMember (Член семьи)
```python
{
    "id": int,
    "name": str,
    "phone": str,
    "relation": str
}
```

### Medication (Лекарство)
```python
{
    "id": int,
    "name": str,
    "quantity": str,
    "dosage": str,
    "description": str,
    "take_with_food": str  # before/with/after
}
```

### Appointment (Прием)
```python
{
    "id": int,
    "medication_id": int,
    "medication_name": str,
    "date": date,
    "time": str,
    "status": str  # pending/taken/skipped
}
```

### Schedule (Расписание)
```python
{
    "id": int,
    "medication_id": int,
    "family_member_id": int,
    "start_date": date,
    "end_date": date,
    "time_slots": [
        {"id": int, "time": str}
    ],
    "period_type": str  # daily/every_other_day
}
```

---

## Статусы и типы

### Статусы приема
- `pending` - предстоит принять
- `taken` - принято
- `skipped` - пропущено

### Периодичность
- `daily` - каждый день
- `every_other_day` - через день

### Время приема
- `before` - до еды
- `with` - во время еды
- `after` - после еды

### Режим просмотра календаря
- `month` - месяц
- `week` - неделя

---

## Аутентификация

### Использование JWT токенов

Все защищенные эндпоинты требуют заголовок:
```
Authorization: Bearer <token>
```

### Получение токена

```bash
POST /auth/login
{
    "phone": "+79001234567",
    "password": "password123"
}

# Response
{
    "access_token": "eyJ...",
    "token_type": "bearer",
    "user_id": 1
}
```

---

## Примеры запросов

### Регистрация
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79001234567",
    "password": "password123",
    "name": "Иван Иванов"
  }'
```

### Создание лекарства
```bash
curl -X POST http://localhost:8000/api/v1/medications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Аспирин",
    "quantity": "10 таблеток",
    "dosage": "100мг",
    "description": "При головной боли",
    "take_with_food": "after"
  }'
```

### Получение календаря
```bash
curl -X GET "http://localhost:8000/api/v1/appointments/calendar?user_id=1&view_type=month" \
  -H "Authorization: Bearer <token>"
```

---

## Следующие шаги

1. Реализовать подключение к БД (PostgreSQL)
2. Создать модели SQLAlchemy
3. Реализовать бизнес-логику в каждом роутере
4. Добавить валидацию данных
5. Реализовать middleware для аутентификации
6. Добавить обработку ошибок
7. Написать тесты
