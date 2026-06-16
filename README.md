# SCRUMS

Веб-сервис для анализа плановых и фактических трудозатрат по заявкам, спринтам и участникам команды транспортной логистики компании ООО "ЭФКО ЦР". Данные загружаются из шаблонного Excel-файла.

## Запуск интерфейса

```bash
npm i
npm run dev
```

## Запуск сервера

```bash
docker compose up --build
docker compose exec backend alembic upgrade head
```

Документация API доступна по адресу `http://localhost:8000/docs`.

Описание Excel-шаблона: `GET /api/v1/projects/import-template/spec`.
