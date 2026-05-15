# SPOTLIST — Development Roadmap

Веб-приложение для скейтеров, роллеров и экстремалов. Поиск, добавление и обсуждение спотов (мест для катания) на карте.

---

## Стек

| Компонент | Технология |
|-----------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 (тёмная + неон) |
| Backend | FastAPI, Python 3.11+, SQLAlchemy async |
| Database | PostgreSQL + PostGIS (prod), SQLite + aiosqlite (tests) |
| Auth | JWT (python-jose + bcrypt), OAuth2PasswordBearer |
| Map | React-Leaflet + OpenStreetMap + Nominatim |
| Files | `backend/uploads/` (локально) |
| Infra | Docker Compose (dev), healthcheck + restart policy |
| Tests | pytest + httpx + aiosqlite (backend), Vitest (frontend) |

---

## Структура

```
c:/Projects/spotlist/
├── frontend/              # Next.js 16 (Turbopack)
│   └── src/
│       ├── app/           # Страницы (маршруты)
│       ├── contexts/      # AuthContext, MapContext, ToastContext
│       ├── lib/           # API client, helpers
│       └── types/         # TypeScript интерфейсы
├── backend/               # FastAPI
│   ├── app/
│   │   ├── api/           # Роуты (auth, spots, comments, etc.)
│   │   ├── core/          # config, security (JWT, hashing)
│   │   ├── db/            # session, Base
│   │   ├── models/        # SQLAlchemy модели
│   │   └── schemas/       # Pydantic схемы
│   ├── tests/             # pytest тесты (29 шт.)
│   └── uploads/           # Фото/видео (gitignored)
├── docker-compose.yml     # healthcheck + restart: unless-stopped
└── PLAN.md
```

---

## Текущие возможности (Phase 0 — ✅ готово)

### Auth
- Регистрация (email, username, password)
- JWT-логин (OAuth2 form → Bearer token)
- Профиль: GET/PUT `/auth/me`
- Роли: user / admin
- `get_current_user` (required) + `get_optional_current_user`

### Spots
- CRUD (создание только авторизованными)
- Список с пагинацией: `GET /spots?city=&category=&lat=&lon=&radius=`
- Мои споты: `GET /spots/my`
- Фото: массив `media`, скриншот маршрута `screenshot`
- Модерация: `is_checked` (админ одобряет)
- Сортировка по расстоянию (haversine)

### Comments
- CRUD, threaded replies (`parent_id`)
- Список по споту: `GET /spots/{id}/comments`
- Мои комменты: `GET /comments/user` (с `spot_name`)
- Жалобы: `POST /comments/{id}/report`
- Админ: жалобы + игнор

### Likes
- Тоггл лайка спота: `POST /likes/{spot_id}`
- Тоггл лайка коммента: `POST /likes/comment/{comment_id}`
- Список лайкнутых спотов: `GET /likes`

### Admin
- Статистика: споты, юзеры, комменты, жалобы
- Управление пользователями: бан/разбан
- Модерация спотов: одобрить/удалить
- Обработка жалоб

### Geo
- Forward geocoding: `GET /geo/search?q=`
- Reverse geocoding: `GET /geo/reverse?lat=&lon=`

### Uploads
- Загрузка файлов (jpeg, png, webp, gif; макс 5MB)
- `POST /uploads` → `{url: "/api/v1/uploads/filename"}`
- Раздача статики: `GET /uploads/{filename}`

### Frontend
- Главная: карта + список (переключение), CitySearch, FilterBar (категория, радиус)
- Карточка спота: фото, описание, карта, комменты, лайки
- Создание спота: карта + форма + загрузка фото
- Профиль: аватар, инфо, мои споты, мои комменты, настройки
- Админка: табы (споты на проверку, юзеры, жалобы)
- Регистрация / логин
- Темная неоновая тема

### Tests
- Backend: 36 тестов (pytest + httpx + aiosqlite)
- Frontend: 3 теста (Vitest — type-shape)

---

## Фаза 1 — Priority features (перед деплоем)

### 1.1 Obstacle tags ✅

**Суть:** детальные теги препятствий на споте: ledge, rail, stairs, hubba, gap, bank, manual_pad, bowl, quarter_pipe, wallride. Для stairs — количество ступеней. Фильтр по типу препятствия + числу ступеней.

**Backend:**
- ✅ `ObstacleType` enum в models/spot.py
- ✅ `obstacles: JSON` колонка в Spot
- ✅ SpotCreate/SpotUpdate: `obstacles: Optional[List[Obstacle]]`
- ✅ SpotResponse: `obstacles: List[Obstacle]`
- ✅ `GET /spots?obstacle_type=&stair_count=`

**Frontend:**
- ✅ `Obstacle` type + `obstacles` поле в Spot
- ✅ CreateSpot: мультиселект препятствий + число ступеней
- ✅ SpotCard: иконки препятствий
- ✅ SpotDetail: блок "Препятствия"
- ✅ FilterBar: селект типа + ввод ступеней

### 1.2 Spot status / condition ✅

**Суть:** пользователи отмечают состояние спота — "Всё ок", "Bust (застроили/закрыли)", "Risky (охрана/опасно)", "Неизвестно". Помогает не тратить время на мёртвые споты.

**Backend:**
- ✅ `SpotStatus` enum (active, bust, risky, unknown)
- ✅ `status: String(20)` колонка (default=unknown)
- ✅ `last_status_at: DateTime` колонка
- ✅ `PATCH /spots/{id}/status` — любой авторизованный меняет статус
- ✅ SpotResponse: `status`, `last_status_at`

**Frontend:**
- ✅ SpotDetail: набор кнопок статуса + активный бейдж
- ✅ SpotCard: цветной индикатор (зелёный/красный/жёлтый/серый)
- ❌ Filter: "показать только active" (отложено)

### 1.3 Video upload ✅

**Суть:** загрузка короткого видео-клипа трюка на споте.

**Backend:**
- ❌ Расширить uploads: разрешить `video/mp4`, `video/quicktime`, макс 50MB (отложено — сейчас только ссылка на внешнее видео)
- ✅ `video: String(500)` колонка в Spot (URL)
- ✅ SpotCreate/SpotUpdate: `video: Optional[str]`
- ✅ SpotResponse: `video`

**Frontend:**
- ❌ CreateSpot: drag-n-drop зона для видео (отложено — сейчас текстовый ввод ссылки)
- ✅ SpotDetail: HTML5 `<video>` плеер
- ✅ SpotCard: иконка "есть видео"

### 1.4 Obstacle filter UI 🔍

**Суть:** удобный фильтр на главной по типу препятствия.

**Frontend:**
- ✅ FilterBar: выпадающий список с иконками препятствий
- ✅ Числовой ввод "ступеней" (для stairs)
- ✅ Активный фильтр подсвечен

---

## Фаза 2 — Growth (после деплоя, параллельно маркетингу)

### 2.1 Геймификация (XP / уровни / лидерборд)
- Начисление XP: спот (+50), видео (+30), коммент (+10), лайк (+5), статус (+5)
- Лидерборд топ-райтеров
- Прогресс-бар в профиле
- Ачивки / бейджи

### 2.2 Wishlist / Bucket list
- Кнопка "сохранить" на карточке и детальной странице
- Страница `/wishlist`

### 2.3 Уведомления
- "Новый спот в твоём городе"
- "Изменился статус спота"
- WebSocket или SSE + Service Worker

### 2.4 SEO
- SSR для страниц спотов
- Open Graph мета-теги
- sitemap.xml

---

## Фаза 3 — Strategic (прокачка)

### 3.1 Погода на споте
- Интеграция OpenWeatherMap API
- "Сейчас сухо, можно кататься" / "Мокро, не вариант"

### 3.2 Сессии / Джемы
- Создание встречи на споте: дата, время, описание
- Присоединиться / отписаться
- Страница `/sessions`

### 3.3 Мобильные приложения
- PWA (иконка на телефоне + push)
- В перспективе — React Native / Flutter

---

## Этапы реализации

- [x] Phase 0: Текущий MVP (все базовые фичи)
- [x] Phase 1.1: Obstacle tags
- [x] Phase 1.2: Spot status / condition
- [x] Phase 1.3: Video upload (ссылка, drag-n-drop отложен)
- [x] Phase 1.4: Obstacle filter UI
- [x] Phase 1: Smoke test + Docker rebuild
- [ ] Phase 1: **Деплой**
- [ ] Phase 2.1: Геймификация
- [ ] Phase 2.2: Wishlist
- [ ] Phase 2.3: Уведомления
- [ ] Phase 2.4: SEO
- [ ] Phase 3: Погода, сессии, PWA

---

## Правила

- Миграция: `init_db()` добавляет недостающие колонки через `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (Alembic пока нет)
- Споты публикуются сразу, `is_checked = false` — на проверку админу
- Комменты можно редактировать и удалять (автор или админ)
- Статус спота может менять любой авторизованный пользователь (без истории)
- Загрузка: фото (jpeg/png/webp/gif, до 5MB), видео (mp4/mov, до 50MB)
- Город определяется автоматически (Nominatim), юзер может исправить
