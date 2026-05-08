# SPOTLIST - План MVP

## Описание

Веб-приложение для скейтеров, роллеров и других экстремалов. Позволяет находить споты (места для катания) в любом городе, добавлять новые, делиться впечатлениями через комментарии.

---

## Стек

| Компонент | Технология |
|-----------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS (тёмная + неон) |
| Backend | FastAPI, Python 3.11, SQLAlchemy |
| Database | PostgreSQL + PostGIS |
| Auth | JWT токены (email + пароль) |
| Map | React-Leaflet + OpenStreetMap + Nominatim |
| Files | Локально `backend/uploads/` |

---

## Структура проекта

```
c:/Projects/spotlist/
├── frontend/              # Next.js
├── backend/              # FastAPI
│   ├── app/
│   │   ├── api/          # Роуты
│   │   ├── core/         # Конфиг, auth
│   │   ├── db/           # БД
│   │   ├── models/       # SQLAlchemy модели
│   │   ├── schemas/      # Pydantic
│   │   └── services/     # Бизнес-логика
│   └── uploads/          # Фото
├── docker-compose.yml
└── PLAN.md
```

---

## Модель данных

### Users
- `id` - UUID, PK
- `email` - str, unique
- `username` - str
- `password_hash` - str
- `role` - enum (user/admin)
- `is_active` - bool
- `created_at` - datetime

### Spots
- `id` - UUID, PK
- `name` - str
- `description` - text
- `latitude` - float
- `longitude` - float
- `address` - str
- `city` - str (автоопределение + юзер может исправить)
- `category` - enum (park/street/roller/routes)
- `media` - JSON array (пути к фото)
- `screenshot` - str (nullable, скриншот маршрута)
- `author_id` - FK -> User
- `is_checked` - bool (false = на проверке, true = одобрен)
- `created_at` - datetime

### Comments
- `id` - UUID, PK
- `spot_id` - FK -> Spot
- `user_id` - FK -> User
- `content` - text
- `is_reported` - bool
- `created_at` - datetime
- `updated_at` - datetime (nullable)

### Reports (жалобы на комменты)
- `id` - UUID, PK
- `comment_id` - FK -> Comment
- `reporter_id` - FK -> User
- `reason` - str
- `created_at` - datetime

---

## API эндпоинты

### Auth
- `POST /auth/register` - регистрация (email, username, password)
- `POST /auth/login` - login, возвращает JWT токен
- `GET /auth/me` - получить текущего юзера

### Spots
- `GET /spots` - список (фильтры: category, lat, lon, radius_km)
- `GET /spots/{id}` - детали спота
- `POST /spots` - создать спот (требует авторизации)
- `PUT /spots/{id}` - редактировать (автор)
- `DELETE /spots/{id}` - удалить (автор или админ)

### Comments
- `GET /spots/{id}/comments` - комменты спота
- `POST /spots/{id}/comments` - добавить коммент
- `PUT /comments/{id}` - редактировать (автор)
- `DELETE /comments/{id}` - удалить (автор)
- `POST /comments/{id}/report` - пожаловаться на коммент

### Admin (требует role=admin)
- `GET /admin/spots` - все споты (включая непроверенные)
- `GET /admin/users` - список юзеров
- `PATCH /admin/users/{id}/ban` - забанить/разбанить юзера
- `PATCH /admin/spots/{id}/check` - пометить проверенным
- `DELETE /admin/spots/{id}` - удалить липовый спот
- `GET /admin/reports` - список жалоб на комменты

### Geo
- `GET /geo/reverse?lat=X&lon=Y` - Nominatim: получить город по координатам

### Files
- `GET /uploads/{filename}` - получить файл (фото)

---

## Frontend страницы

| Маршрут | Описание |
|---------|----------|
| `/` | Главная: карта + список спотов рядом, фильтры |
| `/spots/[id]` | Карточка спота: инфо, фото, комменты |
| `/spots/new` | Добавить спот (авто-город, категория, загрузка фото) |
| `/login` | Авторизация |
| `/register` | Регистрация |
| `/profile` | Профиль юзера (свои споты, комменты) |
| `/admin` | Админка: споты на проверку, юзеры, баны |

---

## Фильтры на главной

- **Категория**: Все / Парк / Стрит / Роллер-дром / Маршруты
- **Дистанция**: 1км / 5км / 10км / 25км / 50км
- **Вид**: Список / Карта (переключение)

---

## Функционал админки

1. **Споты на проверку** - таблица новых спотов, кнопка "Одобрить"
2. **Пользователи** - список, бан/разбан
3. **Жалобы** - комменты, помеченные как reported
4. **Статистика** - всего спотов, юзеров, комментов

---

## Этапы реализации

- [x] 1. Создать структуру проекта и PLAN.md
- [x] 2. Backend: requirements.txt, конфиг, БД
- [x] 3. Backend: модели User, Spot, Comment
- [x] 4. Backend: CRUD эндпоинты для спотов
- [x] 5. Backend: auth (register, login, JWT)
- [x] 6. Backend: комменты
- [x] 7. Backend: admin + geo (Nominatim)
- [x] 8. Frontend: setup Next.js + Tailwind
- [x] 9. Frontend: главная + карта
- [x] 10. Frontend: карточка + комменты
- [x] 11. Frontend: добавление спота
- [x] 12. Frontend: фильтры + профиль
- [x] 13. Frontend: админка
- [ ] 14. Docker + тесты локально
- [ ] 15. VPS деплой

---

## Правила

- Споты публикуются сразу, но попадают на проверку админу
- Комменты можно редактировать и удалять (автор)
- Кнопка "Пожаловаться" на комменты
- Город определяется автоматически через Nominatim, юзер может исправить
- Маршруты - скриншот из стороннего приложения (как фото)