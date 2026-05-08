# SPOTLIST

Спот-лист для скейтеров, роллеров и других экстремалов.

## Быстрый старт (Docker)

```bash
cd c:/Projects/spotlist
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Локальная разработка

### Требования

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ с PostGIS

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # или venv\Scripts\activate на Windows
pip install -r requirements.txt

# Настройка БД
createdb spotlist

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Создание админ-пользователя

Через API:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@spotlist.com","username":"admin","password":"admin123"}'
```

Затем в базе данных:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@spotlist.com';
```

---

## Структура

```
spotlist/
├── backend/           # FastAPI
│   ├── app/
│   │   ├── api/      # Роуты
│   │   ├── core/     # Конфиг, auth
│   │   ├── db/       # БД сессия
│   │   ├── models/   # SQLAlchemy модели
│   │   └── schemas/  # Pydantic схемы
│   └── uploads/      # Фото
├── frontend/          # Next.js
│   └── src/
│       ├── app/      # Страницы
│       ├── components/ # UI компоненты
│       ├── contexts/ # React контексты
│       └── lib/      # API клиент
├── docker-compose.yml
└── PLAN.md
```

---

## API эндпоинты

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | /auth/register | Регистрация |
| POST | /auth/login | Вход |
| GET | /auth/me | Профиль |
| GET | /spots | Список спотов |
| POST | /spots | Создать спот |
| GET | /spots/{id} | Детали спота |
| GET | /spots/{id}/comments | Комменты |
| POST | /admin/stats | Статистика (админ) |
| GET | /admin/users | Пользователи (админ) |
| GET | /geo/reverse | Геолокация по координатам |

---

## Дизайн

Тёмная тема + неоновые акценты (#39ff14, #00f5ff, #ff1493)

Шрифт: Outfit (Google Fonts)
Карты: Leaflet + OpenStreetMap