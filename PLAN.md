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
│       ├── contexts/      # AuthContext, MapContext, ToastContext, I18nContext
│       ├── lib/           # API client, helpers
│       └── types/         # TypeScript интерфейсы
├── backend/               # FastAPI
│   ├── app/
│   │   ├── api/           # Роуты (auth, spots, comments, likes, wishlist, etc.)
│   │   ├── core/          # config, security (JWT, hashing)
│   │   ├── db/            # session, Base
│   │   ├── models/        # SQLAlchemy модели (User, Spot, Comment, Like, SavedSpot)
│   │   └── schemas/       # Pydantic схемы
│   ├── tests/             # pytest тесты
│   └── uploads/           # Фото/видео (gitignored)
├── docker-compose.yml     # healthcheck + restart: unless-stopped
└── PLAN.md
```

---

## Текущий статус (Phase 0 — ✅ готово)

### Auth
- Регистрация (email, username, password)
- JWT-логин (OAuth2 form → Bearer token)
- Профиль: GET/PUT `/auth/me`
- Роли: user / admin
- `get_current_user` (required) + `get_optional_current_user`
- i18n RU/EN

### Spots
- CRUD (создание только авторизованными)
- Список с пагинацией: `GET /spots?city=&category=&lat=&lon=&radius=`
- Мои споты: `GET /spots/my`
- Фото: массив `media`, скриншот маршрута `screenshot`
- Модерация: `is_checked` (админ одобряет)
- Сортировка по расстоянию (haversine)
- Obstacle tags (ledge, rail, stairs, hubba, gap, bank, manual_pad, bowl, quarter_pipe, wallride)
- Spot status (active, bust, risky, unknown)
- Ride types (skateboard, rollerblades, bmx, scooter, etc.)
- Видео (ссылка на внешнее видео)

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
- Главная: карта + список (переключение), CitySearch, FilterBar (категория, радиус, препятствия, тип катания)
- Карточка спота: фото, описание, карта, комменты, лайки, статус, препятствия, ride types
- Создание/редактирование спота: карта + форма + загрузка фото (обстаклы, статус, ride types)
- Профиль: аватар, инфо, мои споты, мои комменты, настройки
- Админка: табы (споты на проверку, юзеры, жалобы)
- Регистрация / логин / i18n (RU/EN)
- Тёмная неоновая тема + LanguageSwitcher

### Tests
- Backend: 36 тестов (pytest + httpx + aiosqlite)
- Frontend: 3 теста (Vitest — type-shape)

---

## Phase 1 — Завершено ✅
- [x] 1.1 Obstacle tags
- [x] 1.2 Spot status / condition
- [x] 1.3 Video upload (ссылка)
- [x] 1.4 Obstacle filter UI
- [x] Ride types (skateboard, rollerblades, bmx, scooter, longboard, surfskate, mountainboard, motorcycle, sup, kayak, cycling, running, hiking, other)
- [x] i18n RU/EN
- [x] Деплой на VPS (spotlist.online)

---

## Phase 2 — Growth (активный рост)

> **Стратегия:** превратить визитёра в зарегистрированного пользователя, дать причины возвращаться, создать виральность.

### 2.1 Wishlist / Saved spots ✅

**Суть:** мотивация зарегиться — сохранить спот в коллекцию. Незарегистрированный видит ☆, нажимает → ему предлагают войти/зарегаться. После регистрации сразу показывает сохранённые споты.

**Backend:**
- [x] Модель `SavedSpot` (user_id, spot_id, created_at)
- [x] `POST /wishlist/{spot_id}` — сохранить/удалить
- [x] `GET /wishlist` — мои сохранённые
- [x] `GET /wishlist/check/{spot_id}` — проверка

**Frontend:**
- [x] SaveButton (☆ / ★) на SpotCard и SpotDetail
- [x] Unauthenticated → редирект на /login
- [x] Страница `/wishlist`
- [x] Профиль: вкладка "Сохранённые"

### 2.2 Telegram login ✅

**Суть:** вход в один клик через Telegram — убирает барьер "придумать пароль".

**Backend:**
- [x] Эндпоинты: `POST /auth/telegram`, `POST /auth/telegram/link`, `DELETE /auth/telegram/link`
- [x] Верификация HMAC-SHA256 данных от Telegram Widget
- [x] Автосоздание пользователя при первом входе
- [x] Колонки `telegram_id`, `telegram_username` в User
- [x] JWT после успешного входа

**Frontend:**
- [x] TelegramLoginButton (Telegram Login Widget)
- [x] Страница /login: кнопка "Войти через Telegram"
- [x] Профиль: привязать/отвязать Telegram в настройках
- [x] BotFather: /setdomain настроен (spotlist.online)

### 2.3 PWA + Push-уведомления

**Суть:** иконка на телефоне, push-уведомления — бесплатный канал возврата.

**Frontend:**
- [ ] manifest.json (иконки, splash screen)
- [ ] Service Worker (кэш, offline fallback)
- [ ] Push API: подписка на уведомления
- [ ] Кнопка "Установить на телефон" (beforeinstallprompt)

**Backend:**
- [ ] WebPush endpoint для хранения subscriptions
- [ ] Отправка: "Новый спот в твоём городе"
- [ ] Отправка: "Изменился статус спота"

### 2.4 Геймификация (XP / уровни / лидерборд)

**Суть:** мотивация участвовать — XP за активности, уровни, топ райдеров.

**Backend:**
- [ ] XP колонка в User + level (auto from XP)
- [ ] Начисление: спот (+50), видео (+30), коммент (+10), лайк (+5), статус (+5)
- [ ] Лидерборд: `GET /leaderboard`
- [ ] Ачивки / бейджи (модель + логика)

**Frontend:**
- [ ] Прогресс-бар в профиле (уровень + XP до следующего)
- [ ] Страница `/leaderboard`
- [ ] Бейджи на карточке пользователя
- [ ] Popup "XP +50!" после действий

---

## Phase 3 — Viral & Content

### 3.1 Seed-контент + Шеринг

**Суть:** наполнить карту реальными спотами, сделать каждый спот "расшариваемым".

**Сделано:**
- [x] **ETL-скрипт** `scripts/import_spotmap.py` — импорт с `spotmap.ru` через открытое API
- [x] **369 спотов** импортировано (областные центры РФ, ride types, 1 фото)
- [x] Админ-аккаунт для наполнения контента

**Действия (не код):**
- [ ] Добавить 15-20 спотов в своём городе с фото (вручную)
- [ ] Попросить знакомых райдеров добавить свои
- [ ] Создать Telegram-канал / чат сообщества
- [ ] Наклейки с QR-кодом на реальных спотах

**Frontend:**
- [ ] OG-картинки для каждого спота (Open Graph)
- [ ] Share button (скопировать ссылку, расшарить в соцсети)

### 3.2 SEO

**Суть:** поисковый трафик — долгосрочный канал.

- [ ] SSR для страниц спотов
- [ ] Open Graph мета-теги (title, description, image)
- [ ] sitemap.xml
- [ ] robots.txt
- [ ] ЧПУ (slug вместо id)

### 3.3 Уведомления (доп. сценарии)

- [ ] "Твой спот лайкнули"
- [ ] "Новый комментарий на твоём споте"
- [ ] WebSocket или SSE для live-обновлений

---

## Phase 4 — Strategic (прокачка)

### 4.1 Погода на споте
- Интеграция OpenWeatherMap API
- "Сейчас сухо, можно кататься" / "Мокро, не вариант"

### 4.2 Сессии / Джемы
- Создание встречи на споте: дата, время, описание
- Присоединиться / отписаться
- Страница `/sessions`

### 4.3 Мобильные приложения
- PWA (уже сделано в Phase 2.3)
- В перспективе — React Native / Flutter

### 4.4 Монетизация (не срочно)
- [ ] Buy Me a Coffee / донаты
- [ ] Мерч брендированный
- [ ] Контекстная реклама (Brand safety: скейт/BMX/энергетики)
- [ ] Premium-функции (только если база > 1000 юзеров)

### 4.5 Прокат / аренда инвентаря

**Суть:** точки проката (SUP, скейты, велосипеды) на карте. Владельцы добавляют объявления, райдеры находят прокат рядом со спотом.

**Backend:**
- [ ] Модель `Rental` (name, description, lat, lon, city, items[], prices[], contacts, media)
- [ ] CRUD: `POST/GET/PUT/DELETE /rentals`
- [ ] Список с фильтром по городу, типу инвентаря
- [ ] Привязка к споту (опционально): `rental_id` на споте

**Frontend:**
- [ ] Страница `/rentals` — карта + список точек проката
- [ ] Карточка проката: фото, что сдаётся, цены, контакты (Telegram/телефон)
- [ ] Форма добавления точки проката
- [ ] Фильтр по типу (SUP, скейт, вело, ролики)

**Важно:** сначала без онлайн-оплаты — контакты для связи. Оплату можно добавить позже.

---

## Чеклист реализации

### Phase 1 ✅
- [x] Obstacle tags
- [x] Spot status / condition
- [x] Video upload
- [x] Obstacle filter UI
- [x] Ride types
- [x] i18n RU/EN
- [x] Деплой на spotlist.online

### Phase 2 — Growth ✅
- [x] **2.1 Wishlist / Saved spots**
- [x] 2.2 Telegram login
- [ ] **2.3 PWA + Push** ⬅️
- [ ] 2.4 Геймификация

### Phase 3 — Viral
- [x] 3.1 Seed-контент (369 спотов импортировано)
- [ ] 3.1 Шеринг (OG, Share button)
- [ ] 3.2 SEO
- [ ] 3.3 Уведомления (доп. сценарии)

### Phase 4
- [ ] 4.1 Погода на споте
- [ ] 4.2 Сессии / Джемы
- [ ] 4.4 Монетизация
- [ ] 4.5 Прокат / аренда инвентаря

---

## Что дальше? (на выбор)

### PWA + Push-уведомления (рекомендую)
Иконка на телефоне, push — бесплатный канал возврата.
- manifest.json + Service Worker
- Подписка на уведомления (Push API)
- Бэкенд: хранение subscription + отправка "Новый спот в твоём городе"

### Геймификация
XP, уровни, топ райдеров, ачивки. Мотивирует добавлять контент.
- XP за спот, коммент, лайк
- Лидерборд
- Бейджи в профиле

### Шеринг + SEO
- OG-картинки для ссылок в Telegram/соцсети
- sitemap.xml
- ЧПУ (slug вместо id)

### Погода + Сессии
- Погода на споте (OpenWeatherMap)
- Встречи/джемы с датой и участниками

### Прокат инвентаря
- Точки проката SUP, скейтов, велосипедов на карте
- Владельцы добавляют объявления, цены, контакты
- Привязка к споту — "рядом есть прокат"

---

## Правила

- Миграция: `init_db()` добавляет недостающие колонки через `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (Alembic пока нет)
- Споты публикуются сразу, `is_checked = false` — на проверку админу
- Комменты можно редактировать и удалять (автор или админ)
- Статус спота может менять любой авторизованный пользователь (без истории)
- Загрузка: фото (jpeg/png/webp/gif, до 5MB), видео (mp4/mov, до 50MB)
- Город определяется автоматически (Nominatim), юзер может исправить
- Все новые фичи — в ветку `feature/*`, локальное тестирование → мёрж в master → деплой
- Язык: переключалка RU/EN (i18n Context + JSON-файлы)
