#!/usr/bin/env python3
"""Generate publication HTML files for the series 'Sposobny li zhenshchiny lyubit'"""
import subprocess, os, re, sys

DOCS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")
import tempfile
SERIES_DIR = os.path.join(tempfile.gettempdir(), "series")

slugs = [
    'sposobny-li-zhenshchiny-lyubit-01-pochemu',
    'sposobny-li-zhenshchiny-lyubit-02-geny',
    'sposobny-li-zhenshchiny-lyubit-03-primaty',
    'sposobny-li-zhenshchiny-lyubit-04-mozg',
    'sposobny-li-zhenshchiny-lyubit-05-okhotniki-sobirateli',
    'sposobny-li-zhenshchiny-lyubit-06-razvody',
    'sposobny-li-zhenshchiny-lyubit-07-mify',
    'sposobny-li-zhenshchiny-lyubit-08-isklyucheniya',
    'sposobny-li-zhenshchiny-lyubit-09-mashinnyj-raj',
    'sposobny-li-zhenshchiny-lyubit-10-determinizm',
    'sposobny-li-zhenshchiny-lyubit-11-raspoznat',
]

titles = [
    'Почему мы вообще об этом говорим',
    'Что говорят гены',
    'Наши ближайшие родственники',
    'Мозг влюблённого',
    'Что говорят охотники-собиратели и матриархаты',
    'Статистика разводов: что она реально показывает',
    'Мифы о любви: мужские и женские',
    'Исключения: от Марии Кюри до жён декабристов',
    'Машинный рай и ведро с крабами',
    'Детерминизм vs. свобода: можно ли выбрать любовь?',
    'Как распознать женщину, способную любить по-настоящему',
]

descriptions = [
    'Введение в серию: почему вопрос об асимметрии привязанности между полами заслуживает научного анализа',
    'Генетика привязанности: AVPR1A, OXTR, DRD4 и почему ген любви не существует',
    'Приматология: от шимпанзе и бонобо до гиббонов — что говорят о любви наши ближайшие родственники',
    'Нейровизуализация: fMRI-данные о том, как работает мозг влюблённого мужчины и женщины',
    'Антропология: что говорят охотники-собиратели Калахари, матриархат Мосо и 166 культур',
    'Статистика разводов с контекстом: что она реально показывает и что скрывает',
    'Мифология любви: мужские и женские архетипы от Орфея до Алкестиды',
    'Исторические исключения: от Марии Кюри до жён декабристов',
    'Что делает с любовью изобилие: машинный рай, парадокс выбора и ведро с крабами',
    'Детерминизм против свободы: можно ли выбрать любовь или мы заложники эволюции',
    'Практическая модель: пять уровней безусловной привязанности',
]

SERIES_NAME = "Способны ли женщины любить?"
DATE = "2026-04-03"
TOTAL = len(slugs)


def convert_md_to_html(md_file):
    result = subprocess.run(
        ['pandoc', md_file, '-t', 'html5', '--wrap=none'],
        capture_output=True, text=True, encoding='utf-8'
    )
    html = result.stdout
    # Remove the top-level h1 (post title)
    html = re.sub(r'<h1[^>]*>.*?</h1>\s*', '', html, count=1)
    # Remove subtitle line "Серия: ..."
    html = re.sub(r'<p><strong>Серия:.*?</strong></p>\s*', '', html)
    # Remove leading <hr>
    html = re.sub(r'^\s*<hr\s*/?\s*>\s*', '', html)
    return html


def make_series_nav(idx):
    prev_html = ''
    next_html = ''
    if idx > 0:
        prev_html = (
            f'<a href="/publications/{slugs[idx-1]}/" class="series-prev">'
            f'<span class="series-label">\u2190 \u041f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0438\u0439</span>'
            f'\u041f\u043e\u0441\u0442 {idx}: {titles[idx-1]}</a>'
        )
    if idx < TOTAL - 1:
        next_html = (
            f'<a href="/publications/{slugs[idx+1]}/" class="series-next">'
            f'<span class="series-label">\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u2192</span>'
            f'\u041f\u043e\u0441\u0442 {idx+2}: {titles[idx+1]}</a>'
        )
    return f'<nav class="pub-series-nav">{prev_html}{next_html}</nav>'


TEMPLATE_TOP = '''<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{full_title} \u2014 {series} \u2014 Logic Architecture</title>
    <meta name="description" content="{desc}">
    <meta property="og:title" content="{full_title} \u2014 Logic Architecture">
    <meta property="og:description" content="{desc}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://logic-architecture.com/publications/{slug}">
    <meta property="og:locale" content="ru_RU">
    <link rel="canonical" href="https://logic-architecture.com/publications/{slug}">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234f7df5' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2L2 7l10 5 10-5-10-5z'/><path d='M2 17l10 5 10-5'/><path d='M2 12l10 5 10-5'/></svg>">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css">
    <link rel="stylesheet" href="/assets/style.css">
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "{full_title}",
        "datePublished": "{date}",
        "author": {{"@type": "Organization", "name": "Logic Architecture"}},
        "publisher": {{"@type": "Organization", "name": "Logic Architecture", "url": "https://logic-architecture.com"}}
    }}
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
        <a href="/" class="nav-tab" data-i18n="nav.home">\u0413\u043b\u0430\u0432\u043d\u0430\u044f</a>
        <a href="/services" class="nav-tab" data-i18n="nav.services">\u0423\u0441\u043b\u0443\u0433\u0438</a>
        <a href="/students" class="nav-tab" data-i18n="nav.students">\u0421\u0442\u0443\u0434\u0435\u043d\u0442\u0430\u043c</a>
        <a href="/tech" class="nav-tab" data-i18n="nav.tech">\u0420\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a\u0430\u043c</a>
        <a href="/publications" class="nav-tab" data-i18n="nav.publications">\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438</a>
        <a href="/about" class="nav-tab" data-i18n="nav.about">\u041e \u043d\u0430\u0441</a>
        <a href="/join" class="nav-tab" data-i18n="nav.join">\u041f\u0440\u0438\u0441\u043e\u0435\u0434\u0438\u043d\u0438\u0442\u044c\u0441\u044f</a>
    </nav>
    <div class="lang-sw" id="langSw">
        <button class="lang-btn" onclick="toggleLangMenu()"><span id="langCurrent">RU</span><span class="lang-arrow">\u25be</span></button>
        <div class="lang-menu" id="langMenu">
            <div class="lang-opt active" data-lang="ru" onclick="setLang('ru')">RU <span class="lang-name">\u0420\u0443\u0441\u0441\u043a\u0438\u0439</span></div>
            <div class="lang-opt" data-lang="en" onclick="setLang('en')">EN <span class="lang-name">English</span></div>
            <div class="lang-opt" data-lang="vi" onclick="setLang('vi')">VI <span class="lang-name">Ti\u1ebfng Vi\u1ec7t</span></div>
            <div class="lang-opt" data-lang="zh" onclick="setLang('zh')">ZH <span class="lang-name">\u4e2d\u6587</span></div>
        </div>
    </div>
    <a href="javascript:void(0)" class="btn btn--gold hcta" onclick="openModal()" data-i18n="nav.cta">\u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441 \u043d\u0430\u043c\u0438</a>
</header>

<main class="main no-hero">
<div class="pub-layout">
    <aside id="pub-toc" class="pub-toc"></aside>
    <article class="pub-content" data-slug="{slug}" data-category="series">
        <div class="pub-meta">
            <a href="/publications" class="pub-back">\u2190 \u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438</a>
            <time datetime="{date}">{date}</time>
            <span class="pub-cat cat-series">series</span>
        </div>
        <h1>{full_title}</h1>
        <p style="color:var(--green);font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:24px">\u0421\u0435\u0440\u0438\u044f: {series} \u00b7 \u041f\u043e\u0441\u0442 {num} \u0438\u0437 {total}</p>
'''

TEMPLATE_BOTTOM = '''        {series_nav}
        <!-- Engagement bar -->
        <div class="pub-engage">
            <button class="pub-like-btn" aria-label="Like">
                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span class="pub-like-count">0</span>
            </button>
            <button class="pub-copy-btn" data-i18n="pub.copy.link">
                <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                \u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443
            </button>
        </div>
    </article>
</div>

<!-- Related articles -->
<section class="pub-related">
    <h2 class="pub-related-title" data-i18n="pub.related">\u0427\u0438\u0442\u0430\u0439\u0442\u0435 \u0442\u0430\u043a\u0436\u0435</h2>
    <div class="pub-related-grid" id="pub-related-grid"></div>
</section>

<!-- Comments -->
<section class="pub-comments">
    <h2 class="pub-comments-title" data-i18n="pub.comments">\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0438</h2>
    <form class="pub-comment-form" autocomplete="off">
        <input type="text" name="name" placeholder="\u0412\u0430\u0448\u0435 \u0438\u043c\u044f" data-i18n-ph="pub.comments.name" required maxlength="100">
        <textarea name="body" placeholder="\u0412\u0430\u0448 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439" data-i18n-ph="pub.comments.text" required maxlength="2000"></textarea>
        <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off">
        <button type="submit" class="btn btn--blue" data-i18n="pub.comments.send">\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c</button>
    </form>
    <div id="pub-comments-list"></div>
    <div class="pub-comments-empty" data-i18n="pub.comments.empty">\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0435\u0432. \u0411\u0443\u0434\u044c\u0442\u0435 \u043f\u0435\u0440\u0432\u044b\u043c!</div>
</section>

</main>

<div id="site-footer"></div>
<div id="site-modal"></div>

<script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>
<script src="/assets/shared.js"></script>
<script src="/assets/layout.js"></script>
<script src="/assets/publications.js"></script>
</body>
</html>
'''

LANG_DIRS = ['', 'ru/', 'en/', 'vi/', 'zh/']

for i in range(TOTAL):
    md_file = os.path.join(SERIES_DIR, f'post_{i+1:02d}.md')
    body_html = convert_md_to_html(md_file)
    series_nav = make_series_nav(i)

    full_title = f'\u041f\u043e\u0441\u0442 {i+1}: {titles[i]}'

    top = TEMPLATE_TOP.format(
        full_title=full_title,
        series=SERIES_NAME,
        desc=descriptions[i],
        slug=slugs[i],
        date=DATE,
        num=i+1,
        total=TOTAL,
    )
    bottom = TEMPLATE_BOTTOM.format(series_nav=series_nav)

    page_html = top + body_html + bottom

    for lang_dir in LANG_DIRS:
        out_dir = os.path.join(DOCS, lang_dir, 'publications', slugs[i])
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, 'index.html')
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(page_html)

    print(f"  Post {i+1}: {slugs[i]} -> 5 files")

print(f"\nDone: {TOTAL * len(LANG_DIRS)} files created")
