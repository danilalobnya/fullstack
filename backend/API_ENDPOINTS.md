 # API Endpoints - Medication Tracker

## Базовая информация

**Base URL:** `http://localhost:8000/api/v1`

**Документация:** `http://localhost:8000/docs` (Swagger UI)

---

## 1. Health Check

### GET `/health`
Проверка работоспособности сервера

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00",
  "service": "fullstack-api"
}
```

### GET `/health/detailed`
Подробная проверка здоровья

---

## 2. Authentication (Авторизация)

### POST `/auth/register`
Регистрация нового пользователя

**Request:**
```json
{
  "phone": "+79001234567",
  "password": "password123",
  "name": "Иван Иванов"
}
```

**Response:**
```json
{
  "id": 1,
  "phone": "+79001234567",
  "name": "Иван Иванов"
}
```

### POST `/auth/login`
Вход в систему

**Request:**
```json
{
  "phone": "+79001234567",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": 1
}
```

### POST `/auth/refresh`
Обновление токена

---

## 3. Users (Пользователи и профиль)

### GET `/users/me`
Получить свой профиль с членами семьи

**Response:**
```json
{
  "user": {
    "id": 1,
    "phone": "+79001234567",
    "name": "Иван Иванов",
    "sms_notifications": true
  },
  "family_members": [
    {
      "id": 2,
      "name": "Мария Иванова",
      "phone": "+79007654321",
      "relation": "wife"
    }
  ]
}
```

### PUT `/users/me`
Обновить свой профиль

**Request:**
```json
{
  "name": "Иван Петров",
  "sms_notifications": false
}
```

### POST `/users/me/family`
Добавить члена семьи

**Request:**
```json
{
  "phone": "+79007654321",
  "name": "Мария Иванова"
}
```

### GET `/users/me/family`
Получить список членов семьи

### DELETE `/users/me/family/{member_id}`
Удалить члена семьи

---

## 4. Medications (Каталог лекарств)

### GET `/medications`
Получить список лекарств

**Query parameters:**
- `search` (optional): Поиск по названию
- `user_id` (optional): ID пользователя

**Example:** `/medications?search=аспирин`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Аспирин",
    "quantity": "10 таблеток",
    "dosage": "100мг",
    "description": "При головной боли",
    "take_with_food": "after"
  }
]
```

### GET `/medications/{medication_id}`
Получить информацию о лекарстве

### POST `/medications`
Создать новое лекарство

**Request:**
```json
{
  "name": "Аспирин",
  "quantity": "10 таблеток",
  "dosage": "100мг",
  "description": "При головной боли",
  "take_with_food": "after"
}
```

### PUT `/medications/{medication_id}`
Обновить информацию о лекарстве

### DELETE `/medications/{medication_id}`
Удалить лекарство

---

## 5. Appointments (Приемы лекарств)

### GET `/appointments/calendar`
Получить календарь приемов

**Query parameters:**
- `user_id` (required): ID пользователя
- `selected_date` (optional): Выбранная дата
- `view_type` (optional): `month` или `week`
- `selected_family_member` (optional): ID члена семьи

**Response:**
```json
{
  "current_date": "2024-01-15",
  "selected_date": "2024-01-15",
  "total_appointments": 4,
  "completed_today": "1/4",
  "appointments": [
    {
      "id": 1,
      "medication_id": 1,
      "medication_name": "Аспирин",
      "date": "2024-01-15",
      "time": "08:00",
      "status": "taken"
    },
    {
      "id": 2,
      "medication_id": 1,
      "medication_name": "Аспирин",
      "date": "2024-01-15",
      "time": "20:00",
      "status": "pending"
    }
  ]
}
```

### GET `/appointments/day/{date}`
Получить приемы на конкретный день

**Response:**
```json
{
  "date": "2024-01-15",
  "appointments": [...],
  "stats": {
    "pending": 1,
    "taken": 2,
    "skipped": 1,
    "total": 4
  }
}
```

### POST `/appointments`
Создать прием лекарства

**Request:**
```json
{
  "medication_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-25",
  "times": ["08:00", "20:00"],
  "period_type": "daily"
}
```

### PUT `/appointments/status`
Обновить статус приема

**Request:**
```json
{
  "appointment_id": 1,
  "status": "taken"
}
```

**Статусы:**
- `pending` - предстоит
- `taken` - принял
- `skipped` - не принял

### DELETE `/appointments/{appointment_id}`
Удалить прием

### GET `/appointments/pdf`
Печать списка приемов в PDF

**Query parameters:**
- `user_id` (required)
- `start_date` (required)
- `end_date` (required)
- `family_member_id` (optional)

---

## 6. Schedules (Расписания)

### POST `/schedules`
Создать расписание приема лекарства

**Request:**
```json
{
  "medication_id": 1,
  "family_member_id": 2,
  "start_date": "2024-01-15",
  "end_date": "2024-01-25",
  "time_slots": [
    {"hour": 8, "minute": 0},
    {"hour": 20, "minute": 0}
  ],
  "period_type": "daily"
}
```

**period_type:**
- `daily` - каждый день
- `every_other_day` - через день

**Response:**
```json
{
  "id": 1,
  "medication_id": 1,
  "medication_name": "Аспирин",
  "family_member_id": 2,
  "family_member_name": "Мария Иванова",
  "start_date": "2024-01-15",
  "end_date": "2024-01-25",
  "time_slots": [
    {"id": 1, "time": "08:00"},
    {"id": 2, "time": "20:00"}
  ],
  "period_type": "daily"
}
```

### GET `/schedules`
Получить список расписаний для члена семьи

**Query parameters:**
- `family_member_id` (required)

### DELETE `/schedules/{schedule_id}`
Удалить расписание

---

## Модели данных

### User (Пользователь)
- `id`: int
- `phone`: str
- `password_hash`: str
- `name`: str
- `sms_notifications`: bool

### FamilyMember (Член семьи)
- `id`: int
- `user_id`: int (владелец)
- `name`: str
- `phone`: str

### Medication (Лекарство)
- `id`: int
- `user_id`: int
- `name`: str
- `quantity`: str
- `dosage`: str
- `description`: str
- `take_with_food`: str (before/with/after)

### Appointment (Прием)
- `id`: int
- `medication_id`: int
- `family_member_id`: int
- `date`: date
- `time`: time
- `status`: str (pending/taken/skipped)

### Schedule (Расписание)
- `id`: int
- `medication_id`: int
- `family_member_id`: int
- `start_date`: date
- `end_date`: date
- `period_type`: str (daily/every_other_day)

### TimeSlot (Слот времени)
- `id`: int
- `schedule_id`: int
- `time`: time

---

## Статусы приема лекарств

- `pending` - предстоит принять
- `taken` - принято
- `skipped` - пропущено

---

## Периоды приема

- `daily` - каждый день
- `every_other_day` - через день

---

## Время приема относительно еды

- `before` - до еды
- `with` - во время еды
- `after` - после еды
