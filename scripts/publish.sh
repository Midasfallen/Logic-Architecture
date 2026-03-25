#!/bin/bash
# =============================================================================
# publish.sh — Публикация статей на сайт Logic Architecture
# Конвертирует .md/.docx/.pdf в HTML и оборачивает в шаблон сайта
#
# Использование:
#   ./scripts/publish.sh <файл> "<заголовок>" "<категория>" "<описание>"
#
# Примеры:
#   ./scripts/publish.sh examples/article.md "Защита собственности" "coursework" "Курсовая по праву"
#   ./scripts/publish.sh ~/Documents/paper.docx "Название статьи" "article" "Описание"
#
# Категории: article, coursework, research
# =============================================================================

set -e

INPUT="$1"
TITLE="$2"
CATEGORY="${3:-article}"
DESC="$4"
DATE=$(date +%Y-%m-%d)

# Проверка аргументов
if [ -z "$INPUT" ] || [ -z "$TITLE" ]; then
    echo "Использование: $0 <файл> \"<заголовок>\" [категория] [описание]"
    echo "  файл:       путь к .md, .docx или .pdf"
    echo "  заголовок:  название публикации"
    echo "  категория:  article (по умолч.), coursework, research"
    echo "  описание:   краткое описание для карточки"
    exit 1
fi

if [ ! -f "$INPUT" ]; then
    echo "Ошибка: файл '$INPUT' не найден"
    exit 1
fi

# Проверка pandoc
if ! command -v pandoc &> /dev/null; then
    echo "Ошибка: pandoc не установлен. Установите: https://pandoc.org/installing.html"
    exit 1
fi

# Генерация slug из заголовка (транслитерация через python)
SLUG=$(python -c "
import re
t = '$TITLE'
tr = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'}
r = ''
for c in t.lower():
    r += tr.get(c, c)
s = re.sub(r'[^a-z0-9]+', '-', r).strip('-')
print(s)
")

SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"
ROOTDIR="$(cd "$SCRIPTDIR/.." && pwd)"
OUTDIR="$ROOTDIR/docs/publications/$SLUG"
MANIFEST="$ROOTDIR/docs/publications/publications.json"

# Создание директории
mkdir -p "$OUTDIR"

echo "Конвертация: $INPUT → $OUTDIR/index.html"

# Конвертация в HTML
pandoc "$INPUT" -t html5 --no-highlight -o "$OUTDIR/_body.html"

# Шаблон страницы
cat > "$OUTDIR/index.html" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
HTMLEOF

cat >> "$OUTDIR/index.html" << HTMLEOF
    <title>${TITLE} — Logic Architecture</title>
    <meta name="description" content="${DESC:-$TITLE}">
    <meta property="og:title" content="${TITLE} — Logic Architecture">
    <meta property="og:description" content="${DESC:-$TITLE}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://logic-architecture.com/publications/${SLUG}">
    <meta property="og:locale" content="ru_RU">
    <link rel="canonical" href="https://logic-architecture.com/publications/${SLUG}">
HTMLEOF

cat >> "$OUTDIR/index.html" << 'HTMLEOF'
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234f7df5' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2L2 7l10 5 10-5-10-5z'/><path d='M2 17l10 5 10-5'/><path d='M2 12l10 5 10-5'/></svg>">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css">
    <link rel="stylesheet" href="/assets/style.css">
    <script type="application/ld+json">
HTMLEOF

cat >> "$OUTDIR/index.html" << HTMLEOF
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${TITLE}",
        "datePublished": "${DATE}",
        "author": {"@type": "Organization", "name": "Logic Architecture"},
        "publisher": {"@type": "Organization", "name": "Logic Architecture", "url": "https://logic-architecture.com"}
    }
HTMLEOF

cat >> "$OUTDIR/index.html" << 'HTMLEOF'
    </script>
</head>
<body>
<canvas id="neural-bg"></canvas>
<div class="orb orb--1"></div>
<div class="orb orb--2"></div>
<div class="orb orb--3"></div>

<header class="header" id="header">
    <a href="/" class="logo">
        <div class="logo-icon">
            <img src="/logo.jpg" alt="Logic Architecture" width="32" height="32">
        </div>
        <span class="logo-text">LOGIC ARCHITECTURE</span>
        <span class="logo-text-short">LA</span>
    </a>
    <div class="ham" id="ham"><span></span><span></span><span></span></div>
    <nav class="nav" id="nav">
        <a href="/" class="nav-tab" data-i18n="nav.home">Главная</a>
        <a href="/services" class="nav-tab" data-i18n="nav.services">Услуги</a>
        <a href="/students" class="nav-tab" data-i18n="nav.students">Студентам</a>
        <a href="/tech" class="nav-tab" data-i18n="nav.tech">Разработчикам</a>
        <a href="/publications" class="nav-tab" data-i18n="nav.publications">Публикации</a>
        <a href="/about" class="nav-tab" data-i18n="nav.about">О нас</a>
        <a href="/join" class="nav-tab" data-i18n="nav.join">Присоединиться</a>
    </nav>
    <div class="lang-sw" id="langSw">
        <button class="lang-btn" onclick="toggleLangMenu()"><span id="langCurrent">RU</span><span class="lang-arrow">▾</span></button>
        <div class="lang-menu" id="langMenu">
            <div class="lang-opt active" data-lang="ru" onclick="setLang('ru')">RU <span class="lang-name">Русский</span></div>
            <div class="lang-opt" data-lang="en" onclick="setLang('en')">EN <span class="lang-name">English</span></div>
            <div class="lang-opt" data-lang="vi" onclick="setLang('vi')">VI <span class="lang-name">Tiếng Việt</span></div>
            <div class="lang-opt" data-lang="zh" onclick="setLang('zh')">ZH <span class="lang-name">中文</span></div>
        </div>
    </div>
    <a href="javascript:void(0)" class="btn btn--gold hcta" onclick="openModal()" data-i18n="nav.cta">Связаться с нами</a>
</header>

<main class="main no-hero">
    <article class="pub-content">
        <div class="pub-meta">
            <a href="/publications" class="pub-back">← Публикации</a>
HTMLEOF

cat >> "$OUTDIR/index.html" << HTMLEOF
            <time datetime="${DATE}">${DATE}</time>
            <span class="pub-cat">${CATEGORY}</span>
        </div>
        <h1>${TITLE}</h1>
HTMLEOF

# Вставить сконвертированный HTML
cat "$OUTDIR/_body.html" >> "$OUTDIR/index.html"

cat >> "$OUTDIR/index.html" << 'HTMLEOF'
    </article>
</main>

<div id="site-footer"></div>
<div id="site-modal"></div>

<script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>
<script src="/assets/shared.js"></script>
<script src="/assets/layout.js"></script>
</body>
</html>
HTMLEOF

# Удалить временный файл
rm -f "$OUTDIR/_body.html"

# Обновить publications.json
if [ -f "$MANIFEST" ]; then
    # Проверить, что slug ещё не существует
    if grep -q "\"$SLUG\"" "$MANIFEST" 2>/dev/null; then
        echo "Публикация '$SLUG' уже существует в манифесте — обновляю HTML"
    else
        # Добавить запись в JSON
        # Если файл пустой или содержит пустой массив
        CONTENT=$(cat "$MANIFEST")
        if [ "$CONTENT" = "[]" ] || [ -z "$CONTENT" ]; then
            cat > "$MANIFEST" << JSONEOF
[
  {
    "slug": "${SLUG}",
    "title": "${TITLE}",
    "date": "${DATE}",
    "category": "${CATEGORY}",
    "lang": "ru",
    "description": "${DESC:-$TITLE}"
  }
]
JSONEOF
        else
            # Вставить перед последней ]
            ENTRY=$(cat << JSONEOF
  ,{
    "slug": "${SLUG}",
    "title": "${TITLE}",
    "date": "${DATE}",
    "category": "${CATEGORY}",
    "lang": "ru",
    "description": "${DESC:-$TITLE}"
  }
JSONEOF
)
            # Убрать последнюю ] и добавить запись + ]
            sed -i '$ s/]$//' "$MANIFEST"
            echo "$ENTRY" >> "$MANIFEST"
            echo "]" >> "$MANIFEST"
        fi
        echo "Добавлено в publications.json"
    fi
else
    cat > "$MANIFEST" << JSONEOF
[
  {
    "slug": "${SLUG}",
    "title": "${TITLE}",
    "date": "${DATE}",
    "category": "${CATEGORY}",
    "lang": "ru",
    "description": "${DESC:-$TITLE}"
  }
]
JSONEOF
fi

echo ""
echo "Публикация создана:"
echo "  URL:  https://logic-architecture.com/publications/$SLUG"
echo "  Файл: docs/publications/$SLUG/index.html"
echo ""
echo "Следующие шаги:"
echo "  git add docs/publications/$SLUG docs/publications/publications.json"
echo "  git commit -m \"Новая публикация: $TITLE\""
echo "  git push"
