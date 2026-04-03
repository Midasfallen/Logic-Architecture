// ===== PUBLICATIONS DETAIL PAGE — TOC, Likes, Copy, Comments, Related, Footnotes =====
(function(){
'use strict';

const article = document.querySelector('article.pub-content');
if (!article) return;

const slug = article.dataset.slug;
const category = article.dataset.category || '';
const API_URL = location.hostname.includes('pages.dev')
    ? 'https://la-api.ravinski-genlawyer.workers.dev'
    : '/api';
const pageLoadTime = Date.now();

// Helper: get i18n text
function t(key, fallback) {
    if (typeof getI18n === 'function') return getI18n(key, fallback);
    return fallback;
}

// ===== TOC =====
function initTOC() {
    const tocEl = document.getElementById('pub-toc');
    if (!tocEl) return;

    const headings = article.querySelectorAll('h2[id], h3[id]');
    if (headings.length < 2) { tocEl.style.display = 'none'; return; }

    // Title
    const title = document.createElement('div');
    title.className = 'pub-toc-title';
    title.textContent = t('pub.toc', 'Содержание');
    title.setAttribute('data-i18n', 'pub.toc');

    // Toggle button (mobile)
    const toggle = document.createElement('button');
    toggle.className = 'pub-toc-toggle';
    toggle.textContent = t('pub.toc', 'Содержание');
    toggle.setAttribute('data-i18n', 'pub.toc');
    toggle.addEventListener('click', function() {
        toggle.classList.toggle('open');
        tocEl.classList.toggle('open');
    });

    // Build list
    const ol = document.createElement('ol');
    headings.forEach(function(h) {
        const li = document.createElement('li');
        if (h.tagName === 'H3') li.className = 'toc-h3';
        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent.replace(/^\d+\.\d*\.?\s*/, '');
        a.addEventListener('click', function(e) {
            e.preventDefault();
            h.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', '#' + h.id);
        });
        li.appendChild(a);
        ol.appendChild(li);
    });

    tocEl.appendChild(title);
    tocEl.appendChild(toggle);
    tocEl.appendChild(ol);

    // Active section tracking
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                ol.querySelectorAll('a').forEach(function(a) {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { rootMargin: '-80px 0px -70% 0px' });
    headings.forEach(function(h) { observer.observe(h); });
}

// ===== LIKES =====
function initLikes() {
    const btn = document.querySelector('.pub-like-btn');
    if (!btn || !slug) return;

    const countEl = btn.querySelector('.pub-like-count');
    const isLiked = localStorage.getItem('liked:' + slug) === '1';
    if (isLiked) btn.classList.add('liked');

    // Load count
    fetch(API_URL + '/likes/' + slug)
        .then(function(r) { return r.json(); })
        .then(function(d) { if (countEl) countEl.textContent = d.count || 0; })
        .catch(function() {});

    btn.addEventListener('click', function() {
        if (btn.classList.contains('liked')) return;
        btn.classList.add('liked');
        localStorage.setItem('liked:' + slug, '1');
        var cur = parseInt(countEl.textContent) || 0;
        countEl.textContent = cur + 1;
        fetch(API_URL + '/likes/' + slug, { method: 'POST' }).catch(function() {});
    });
}

// ===== COPY LINK =====
function initCopyLink() {
    const btn = document.querySelector('.pub-copy-btn');
    if (!btn) return;

    btn.addEventListener('click', function() {
        navigator.clipboard.writeText(window.location.href).then(function() {
            if (typeof showToast === 'function') {
                showToast(t('pub.copy.done', 'Ссылка скопирована'), 'success');
            }
        }).catch(function() {
            // Fallback
            var ta = document.createElement('textarea');
            ta.value = window.location.href;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            if (typeof showToast === 'function') {
                showToast(t('pub.copy.done', 'Ссылка скопирована'), 'success');
            }
        });
    });
}

// ===== COMMENTS =====
function initComments() {
    const section = document.querySelector('.pub-comments');
    if (!section || !slug) return;

    const list = document.getElementById('pub-comments-list');
    const form = section.querySelector('.pub-comment-form');
    const emptyEl = section.querySelector('.pub-comments-empty');

    // Load comments
    fetch(API_URL + '/comments/' + slug)
        .then(function(r) { return r.json(); })
        .then(function(d) {
            if (d.comments && d.comments.length > 0) {
                if (emptyEl) emptyEl.style.display = 'none';
                d.comments.forEach(function(c) { renderComment(c, list); });
            }
        })
        .catch(function() {});

    // Submit form
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var nameInput = form.querySelector('input[name="name"]');
            var bodyInput = form.querySelector('textarea[name="body"]');
            var hpInput = form.querySelector('input[name="website"]');

            if (hpInput && hpInput.value) return;
            if (Date.now() - pageLoadTime < 3000) return;

            var name = (nameInput.value || '').trim();
            var body = (bodyInput.value || '').trim();
            if (!name) { if (typeof showToast === 'function') showToast(t('pub.comments.noname', 'Укажите имя'), 'warning'); return; }
            if (!body) { if (typeof showToast === 'function') showToast(t('pub.comments.nobody', 'Напишите комментарий'), 'warning'); return; }

            // Rate limit
            var rlKey = 'pub_crl';
            var rlTime = localStorage.getItem(rlKey);
            if (rlTime && Date.now() - parseInt(rlTime) < 30000) {
                if (typeof showToast === 'function') showToast(t('pub.comments.ratelimit', 'Подождите перед отправкой'), 'warning');
                return;
            }

            var btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.disabled = true; btn.textContent = '...'; }

            fetch(API_URL + '/comments/' + slug, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, body: body })
            })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.ok) {
                    // Add comment to DOM immediately (postmoderation)
                    var now = new Date().toISOString().replace('T', ' ').slice(0, 16);
                    renderComment({ name: name, body: body, created_at: now }, list, true);
                    if (emptyEl) emptyEl.style.display = 'none';
                    nameInput.value = '';
                    bodyInput.value = '';
                    localStorage.setItem(rlKey, Date.now().toString());
                    if (typeof showToast === 'function') showToast(t('pub.comments.sent', 'Комментарий опубликован'), 'success');
                }
            })
            .catch(function() {
                if (typeof showToast === 'function') showToast(t('pub.comments.error', 'Ошибка отправки'), 'error');
            })
            .finally(function() {
                if (btn) { btn.disabled = false; btn.textContent = t('pub.comments.send', 'Отправить'); }
            });
        });
    }
}

function renderComment(c, container, prepend) {
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'pub-comment';
    var date = c.created_at ? c.created_at.replace('T', ' ').slice(0, 16) : '';
    div.innerHTML =
        '<div class="pub-comment-head">' +
            '<span class="pub-comment-name">' + escHtml(c.name) + '</span>' +
            '<span class="pub-comment-date">' + escHtml(date) + '</span>' +
        '</div>' +
        '<div class="pub-comment-body">' + escHtml(c.body) + '</div>';
    if (prepend) container.insertBefore(div, container.firstChild);
    else container.appendChild(div);
}

function escHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ===== RELATED ARTICLES =====
function initRelated() {
    var grid = document.getElementById('pub-related-grid');
    if (!grid || !slug) return;

    fetch('/publications/publications.json')
        .then(function(r) { return r.json(); })
        .then(function(pubs) {
            var lang = (typeof currentLang !== 'undefined') ? currentLang : 'ru';
            var related = pubs.filter(function(p) {
                return p.slug !== slug && p.category === category && p.lang === lang;
            }).slice(0, 3);
            // If not enough from same category, fill from others
            if (related.length < 3) {
                var more = pubs.filter(function(p) {
                    return p.slug !== slug && p.lang === lang && !related.some(function(r) { return r.slug === p.slug; });
                }).slice(0, 3 - related.length);
                related = related.concat(more);
            }
            if (related.length === 0) {
                grid.closest('.pub-related').style.display = 'none';
                return;
            }
            var langPrefix = lang === 'ru' ? '' : '/' + lang;
            related.forEach(function(p) {
                var a = document.createElement('a');
                a.className = 'pub-card';
                a.href = langPrefix + '/publications/' + p.slug + '/';
                var badgeClass = 'pub-badge cat-' + p.category;
                a.innerHTML =
                    '<span class="' + badgeClass + '">' + escHtml(p.category) + '</span>' +
                    '<h3>' + escHtml(p.title) + '</h3>' +
                    '<time>' + escHtml(p.date) + '</time>';
                grid.appendChild(a);
            });
        })
        .catch(function() {});
}

// ===== FOOTNOTES =====
function initFootnotes() {
    // Find footnote references (superscript numbers linking to footnotes)
    var refs = article.querySelectorAll('sup > a[href^="#fn"], a.fn-ref');
    if (refs.length === 0) return;

    var tip = null;
    function showTip(e) {
        var href = this.getAttribute('href');
        if (!href) return;
        var target = document.querySelector(href);
        if (!target) return;

        if (tip) tip.remove();
        tip = document.createElement('div');
        tip.className = 'pub-fn-tip';
        tip.textContent = target.textContent;

        document.body.appendChild(tip);
        var rect = this.getBoundingClientRect();
        tip.style.left = Math.max(8, rect.left - tip.offsetWidth / 2 + rect.width / 2) + 'px';
        tip.style.top = (rect.top + window.scrollY - tip.offsetHeight - 8) + 'px';
    }
    function hideTip() { if (tip) { tip.remove(); tip = null; } }

    refs.forEach(function(a) {
        a.addEventListener('mouseenter', showTip);
        a.addEventListener('mouseleave', hideTip);
        a.addEventListener('focus', showTip);
        a.addEventListener('blur', hideTip);
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    initTOC();
    initLikes();
    initCopyLink();
    initComments();
    initRelated();
    initFootnotes();
});
})();
