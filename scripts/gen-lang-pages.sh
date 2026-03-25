#!/bin/bash
# =============================================================================
# gen-lang-pages.sh — Генерирует языковые копии страниц
# Для каждой страницы создаёт /ru/, /en/, /vi/, /zh/ версии
# Каждая версия — копия оригинала (одинаковый HTML, язык определяется из URL)
# =============================================================================

set -e

SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"
ROOTDIR="$(cd "$SCRIPTDIR/.." && pwd)"
DOCSDIR="$ROOTDIR/docs"

LANGS=("ru" "en" "vi" "zh")
# Страницы: путь относительно docs/
PAGES=("index.html" "services/index.html" "students/index.html" "tech/index.html" "investors/index.html" "about/index.html" "join/index.html" "publications/index.html" "404.html")

for lang in "${LANGS[@]}"; do
    LANGDIR="$DOCSDIR/$lang"
    mkdir -p "$LANGDIR"

    for page in "${PAGES[@]}"; do
        SRC="$DOCSDIR/$page"
        if [ ! -f "$SRC" ]; then
            echo "SKIP: $SRC не найден"
            continue
        fi

        # Создать директорию для страницы внутри языковой папки
        DESTDIR="$LANGDIR/$(dirname "$page")"
        mkdir -p "$DESTDIR"
        DEST="$LANGDIR/$page"

        # Копировать файл
        cp "$SRC" "$DEST"
    done

    # Копировать публикации
    if [ -d "$DOCSDIR/publications" ]; then
        for pubdir in "$DOCSDIR/publications"/*/; do
            if [ -d "$pubdir" ] && [ -f "$pubdir/index.html" ]; then
                slug=$(basename "$pubdir")
                mkdir -p "$LANGDIR/publications/$slug"
                cp "$pubdir/index.html" "$LANGDIR/publications/$slug/index.html"
            fi
        done
    fi

    echo "Сгенерировано: /$lang/ ($(echo "${PAGES[@]}" | wc -w) страниц + публикации)"
done

echo ""
echo "Готово. Языковые страницы созданы в docs/ru/, docs/en/, docs/vi/, docs/zh/"
