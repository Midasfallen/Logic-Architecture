# План: Переход от SPA к многостраничному сайту + Система публикаций

## Контекст

Сайт Logic Architecture — single-file SPA (`docs/index.html`, ~42KB), где все страницы реализованы как скрытые табы. URL не меняется при навигации, нельзя отправить ссылку на конкретную страницу или язык. Нет раздела публикаций.

**Цель:** Превратить SPA в многостраничный сайт с:
- Чистыми URL: `/services`, `/students`, `/publications/my-article`
- Языковыми префиксами: `/zh/students` — студент из Китая открывает страницу сразу на китайском
- Системой публикации статей через `publish.sh` (pandoc конвертирует .md/.docx → HTML)
- Кастомной 404-страницей

---

## Фаза 1: Извлечение общих ресурсов из index.html

### 1.1 Создать `docs/assets/style.css`
- Извлечь весь блок `<style>` из `index.html` в отдельный CSS-файл
- Добавить стили для `.pub-content` (типографика статей: h1-h6, p, table, blockquote, ol/ul, code)
- Добавить стили для `.pub-card`, `.pub-grid`, `.pub-meta`, `.pub-badge` (карточки публикаций)
- Добавить стили для 404-страницы

### 1.2 Создать `docs/assets/shared.js`
Извлечь из `<script>` блока `index.html`:
- Canvas-анимация (частицы + связи)
- Обработчик скролла хедера
- Модалка `openModal()` / `closeModal()`
- Toast-система `showToast()`
- i18n-движок — **с модификацией**: добавить определение языка из URL
- Форма отправки `submitJoin()`
- API_URL, rate limiting
- Инициализация AOS
- Счётчики

**Ключевое изменение i18n:**
```js
function detectLang() {
    const parts = location.pathname.split('/').filter(Boolean);
    const urlLang = ['en','vi','zh'].includes(parts[0]) ? parts[0] : null;
    if (urlLang) return urlLang;
    return localStorage.getItem('la_lang') || 'ru';
}
```

При переключении языка — навигация на URL с префиксом: `/services` → `/en/services`.
Путь загрузки JSON: абсолютный `/i18n/{lang}.json` (не относительный).

### 1.3 Создать `docs/assets/layout.js`
Инъекция через JS:
- **Футер** — редко виден при загрузке, безопасно через JS
- **Модальное окно** контакта (Telegram)
- **Canvas + orbs** — инициализация

Хедер **НЕ** через JS — вставляется напрямую в HTML каждой страницы (нет мерцания).

---

## Фаза 2: Создание страниц

### Структура файлов
```
docs/
├── index.html                    ← Главная (hero + фичи + метрики)
├── services/index.html           ← Услуги (accordion)
├── students/index.html           ← Студентам (пакеты, включено)
├── tech/index.html               ← Разработчикам
├── investors/index.html          ← Инвесторам
├── about/index.html              ← О нас (timeline, founder)
├── join/index.html               ← Присоединиться (форма)
├── publications/index.html       ← Список публикаций (NEW)
├── publications/publications.json ← Манифест публикаций
├── publications/{slug}/index.html ← Отдельные статьи
├── 404.html                      ← Кастомная 404
├── sitemap.xml                   ← Карта сайта
├── assets/
│   ├── style.css                 ← Общий CSS
│   ├── shared.js                 ← Canvas, i18n, modal, toast, AOS
│   └── layout.js                 ← Инъекция футера и модалки
├── i18n/                         ← Без изменений
│   ├── en.json
│   ├── vi.json
│   └── zh.json
├── logo.jpg                      ← Без изменений
└── founder.jpg                   ← Без изменений
```

### Шаблон каждой страницы
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{Заголовок} — Logic Architecture</title>
    <meta name="description" content="{Описание}">
    <meta property="og:title" content="{OG заголовок}">
    <meta property="og:description" content="{OG описание}">
    <meta property="og:url" content="https://logic-architecture.com/{page}">
    <link rel="canonical" href="https://logic-architecture.com/{page}">
    <link rel="alternate" hreflang="ru" href="https://logic-architecture.com/{page}">
    <link rel="alternate" hreflang="en" href="https://logic-architecture.com/en/{page}">
    <link rel="alternate" hreflang="vi" href="https://logic-architecture.com/vi/{page}">
    <link rel="alternate" hreflang="zh" href="https://logic-architecture.com/zh/{page}">
    <link rel="alternate" hreflang="x-default" href="https://logic-architecture.com/{page}">
    <link rel="icon" href="data:image/svg+xml,...">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css">
    <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
    <canvas id="neural-bg"></canvas>
    <div class="orb orb--1"></div>
    <div class="orb orb--2"></div>
    <div class="orb orb--3"></div>

    <!-- Хедер напрямую в HTML (нет мерцания) -->
    <header class="hdr">
        <a href="/" class="logo">...</a>
        <nav>
            <a href="/services" class="nav-tab" data-i18n="nav.services">Услуги</a>
            <a href="/students" class="nav-tab" data-i18n="nav.students">Студентам</a>
            <a href="/tech" class="nav-tab" data-i18n="nav.tech">Разработчикам</a>
            <a href="/publications" class="nav-tab" data-i18n="nav.publications">Публикации</a>
            <a href="/about" class="nav-tab" data-i18n="nav.about">О нас</a>
            <a href="/join" class="nav-tab" data-i18n="nav.join">Присоединиться</a>
        </nav>
        <div class="lang-sw">...</div>
        <div class="ham">...</div>
    </header>

    <main class="main no-hero">
        <!-- Контент конкретной страницы -->
    </main>

    <div id="site-footer"></div>
    <div id="site-modal"></div>

    <script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>
    <script src="/assets/shared.js"></script>
    <script src="/assets/layout.js"></script>
</body>
</html>
```

### SEO-мета для каждой страницы

| URL | Title | Description |
|-----|-------|-------------|
| `/` | Logic Architecture — Консалтинг, разработка, документация | Консалтинговая и девелоперская компания с собственным AI-стеком |
| `/services` | Услуги — Logic Architecture | Исследования, стратегия, реклама, веб- и мобильная разработка, документация |
| `/students` | Помощь студентам — Logic Architecture | Помощь с подготовкой учебных работ: рефераты, курсовые, дипломы |
| `/tech` | Разработчикам — Logic Architecture | Технологический стек, архитектура и возможности для разработчиков |
| `/investors` | Инвесторам — Logic Architecture | Инвестиционные возможности и партнёрство |
| `/about` | О нас — Logic Architecture | Команда, история и миссия компании |
| `/join` | Присоединиться — Logic Architecture | Вступить в глобальное сообщество Logic Architecture |
| `/publications` | Публикации — Logic Architecture | Статьи, исследования и примеры работ |

### Навигация
- Все `onclick="switchTab('...')"` → `<a href="/...">`
- Все `onclick="openModal()"` — без изменений (модалка через layout.js)
- Хедер: активная ссылка определяется по `window.location.pathname`
- Переключение языка: изменяет URL (добавляет/убирает префикс), а не только localStorage

---

## Фаза 3: Языковая маршрутизация

### Схема URL
| Язык | Главная | Студентам | Публикация |
|------|---------|-----------|------------|
| Русский (по умолч.) | `/` | `/students` | `/publications/my-article` |
| English | `/en/` | `/en/students` | `/en/publications/my-article` |
| Vietnamese | `/vi/` | `/vi/students` | `/vi/publications/my-article` |
| Chinese | `/zh/` | `/zh/students` | `/zh/publications/my-article` |

### Как это работает
- `/en/students` и `/students` отдают **один и тот же** файл `docs/students/index.html`
- JS при загрузке читает язык из URL и применяет перевод
- Не нужны отдельные HTML-файлы для каждого языка

### Конфигурация nginx (`docker/nginx/default.conf`)
```nginx
# Языковые префиксы → тот же файл без префикса
location ~ ^/(en|vi|zh)/(.+)$ {
    try_files /$2/index.html /$2 =404;
}
location ~ ^/(en|vi|zh)/?$ {
    try_files /index.html =404;
}

# Стандартная маршрутизация
location / {
    try_files $uri $uri/index.html $uri/ =404;
}
```

### Конфигурация Cloudflare Pages (`docs/_redirects`)
```
/en/*  /:splat  200
/vi/*  /:splat  200
/zh/*  /:splat  200
```

### 404-страница
- nginx: `error_page 404 /404.html;`
- Cloudflare Pages: автоматически отдаёт `docs/404.html`
- Дизайн: хедер + сообщение + кнопка «На главную» в стиле сайта

---

## Фаза 4: Система публикаций

### Манифест `docs/publications/publications.json`
```json
[
  {
    "slug": "kursovaya-zashita-sobstvennosti",
    "title": "Защита права собственности в гражданском праве",
    "date": "2025-02-08",
    "category": "coursework",
    "lang": "ru",
    "description": "Курсовая работа по теме защиты права собственности"
  }
]
```

### Листинг публикаций (`docs/publications/index.html`)
- Секция-заголовок `.sh` + сетка карточек `.pub-grid`
- JS загружает `publications.json`, рендерит карточки `.pub-card`
- Фильтрация по категориям: все / статьи / курсовые / исследования
- Каждая карточка — ссылка на `/publications/{slug}`

### Скрипт `scripts/publish.sh`
```bash
./scripts/publish.sh input.md "Заголовок" "category" "Описание"
```

Скрипт:
1. Генерирует slug из заголовка (транслитерация)
2. Конвертирует .md/.docx → HTML через pandoc
3. Оборачивает в шаблон страницы сайта (хедер, стили, скрипты)
4. Создаёт `docs/publications/{slug}/index.html`
5. Добавляет запись в `publications.json`
6. Обновляет `sitemap.xml`

**Workflow автора:**
```
1. Пишете статью в .md или .docx
2. ./scripts/publish.sh article.md "Заголовок" "article" "Описание"
3. git add . && git commit -m "Новая статья" && git push
4. Cloudflare Pages автодеплоит, статья на сайте
```

### Конвертация существующих примеров
Перенести файлы из `examples/` в публикации через тот же `publish.sh`:
- `ПРИМЕР_КУРСОВАЯ_ЗАЩИТА_СОБСТВЕННОСТИ.md` → `/publications/kursovaya-zashita-sobstvennosti`
- `КУРСОВАЯ_ПЛАГИАТ_МУЗЫКА.md` → `/publications/kursovaya-plagiat-muzyka`
- `Статья_объективизация_доказывания.md` → `/publications/statya-objektivizatsiya-dokazyvaniya`

---

## Фаза 5: SEO и финальные штрихи

### sitemap.xml
Создать `docs/sitemap.xml` со всеми страницами и языковыми вариантами. Скрипт `publish.sh` автоматически добавляет новые публикации.

### Structured Data (JSON-LD)
- На всех страницах: `Organization` schema
- На публикациях: `Article` schema (author, datePublished, headline)

### hreflang-теги
Автоматически генерируются `layout.js` на основе текущего pathname.

---

## Фаза 6: Обновление i18n

### Новые ключи для перевода
Добавить в `en.json`, `vi.json`, `zh.json`:
- `nav.publications` — «Publications» / «Bài đăng» / «出版物»
- `pub.title` — заголовок раздела
- `pub.filter.all` / `pub.filter.articles` / `pub.filter.coursework`
- `404.title` / `404.text` / `404.button`

---

## Фаза 7: Деплой и тестирование

### Порядок деплоя
1. **Тестовый стенд (Cloudflare Pages):** `git push origin main` → автодеплой на `logic-architecture.pages.dev`
2. Тестировать:
   - Все страницы открываются по прямым URL
   - Языковые URL (`/en/students`, `/zh/publications`) работают
   - Переключение языка меняет URL и контент
   - Публикации отображаются в листинге и открываются
   - 404-страница показывается для несуществующих URL
   - Мобильная версия (гамбургер, responsive)
   - Форма «Присоединиться» отправляет в Telegram
   - Canvas-анимация работает на всех страницах
   - SEO: проверить meta-теги, OG, canonical, sitemap
3. **Прод (VPS):** обновить nginx-конфиг, `docker-compose up -d --build`

### Тестовые кейсы (Chrome MCP)
- Открыть `logic-architecture.pages.dev/students` → страница студентов
- Открыть `logic-architecture.pages.dev/zh/students` → та же страница на китайском
- Открыть `logic-architecture.pages.dev/publications` → список статей
- Кликнуть карточку → открывается полная статья
- Переключить язык EN → URL меняется на `/en/...`
- Открыть несуществующий URL → 404-страница
- Мобильный вид (resize) → гамбургер-меню, карточки в одну колонку

---

## Критические файлы

| Файл | Действие |
|------|----------|
| `docs/index.html` | Рефакторинг: извлечь CSS/JS, оставить только контент главной |
| `docs/assets/style.css` | Создать: весь CSS + новые стили публикаций и 404 |
| `docs/assets/shared.js` | Создать: canvas, i18n (с URL-определением), модалка, toast, формы |
| `docs/assets/layout.js` | Создать: инъекция футера, модалки, hreflang-тегов |
| `docs/services/index.html` | Создать: страница услуг |
| `docs/students/index.html` | Создать: страница студентам |
| `docs/tech/index.html` | Создать: страница разработчикам |
| `docs/investors/index.html` | Создать: страница инвесторам |
| `docs/about/index.html` | Создать: страница о нас |
| `docs/join/index.html` | Создать: страница присоединиться |
| `docs/publications/index.html` | Создать: листинг публикаций |
| `docs/publications/publications.json` | Создать: манифест публикаций |
| `docs/404.html` | Создать: кастомная 404 |
| `docs/sitemap.xml` | Создать: карта сайта |
| `docs/_redirects` | Создать: языковая маршрутизация для Cloudflare Pages |
| `docker/nginx/default.conf` | Изменить: многостраничная + языковая маршрутизация |
| `scripts/publish.sh` | Создать: скрипт публикации статей |
| `docs/i18n/en.json` | Изменить: добавить ключи публикаций, 404, навигации |
| `docs/i18n/vi.json` | Изменить: аналогично |
| `docs/i18n/zh.json` | Изменить: аналогично |

---

## Порядок выполнения

1. Извлечь CSS → `docs/assets/style.css`
2. Извлечь JS → `docs/assets/shared.js` (с модификацией i18n)
3. Создать `docs/assets/layout.js`
4. Создать страницы (services, students, tech, investors, about, join)
5. Рефакторинг `docs/index.html` (только главная)
6. Создать систему публикаций (publications/index.html, publications.json, стили)
7. Создать `scripts/publish.sh`
8. Конвертировать `examples/` → публикации через скрипт
9. Создать 404.html
10. Создать sitemap.xml
11. Обновить `docs/_redirects`
12. Обновить `docker/nginx/default.conf`
13. Обновить i18n JSON-файлы (новые ключи)
14. Тестирование на Cloudflare Pages (тестовый стенд)
15. Деплой на VPS (прод)
