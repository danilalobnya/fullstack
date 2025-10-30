# Frontend - Health Check

Минималистичное React приложение с одной страницей для проверки health-check эндпоинтов.

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Сборка

```bash
npm run build
```

## Структура

```
src/
├── pages/
│   └── HealthCheck.jsx    # Страница проверки здоровья API
├── services/
│   └── api.js              # API клиент
├── App.jsx                 # Главный компонент
└── main.jsx                # Точка входа
```

## Возможности

- ✅ Проверка базового health-check
- ✅ Проверка подробного health-check
- ✅ Отображение статуса подключения к API
- ✅ Красивый UI
