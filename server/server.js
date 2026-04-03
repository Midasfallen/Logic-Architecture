const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { getLikes, addLike, getComments, addComment, deleteComment } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://logic-architecture.com';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || origin === ALLOWED_ORIGIN || ALLOWED_ORIGIN === '*') {
            cb(null, true);
        } else {
            cb(null, false);
        }
    },
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-Admin-Token']
}));

// Rate limiting — in-memory
const likeRates = new Map(); // key: "ip:slug" → timestamp
const commentRates = new Map(); // key: ip → [timestamps]

function cleanupRates() {
    const now = Date.now();
    for (const [k, v] of likeRates) { if (now - v > 86400000) likeRates.delete(k); }
    for (const [k, arr] of commentRates) {
        const fresh = arr.filter(t => now - t < 3600000);
        if (fresh.length === 0) commentRates.delete(k); else commentRates.set(k, fresh);
    }
}
setInterval(cleanupRates, 600000); // cleanup every 10 min

function getIP(req) {
    return req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
}

// Validate slug: only lowercase letters, digits, hyphens
function validSlug(s) { return typeof s === 'string' && /^[a-z0-9-]{1,200}$/.test(s); }

// Health check
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ===== LIKES =====
app.get('/likes/:slug', (req, res) => {
    if (!validSlug(req.params.slug)) return res.status(400).json({ error: 'Invalid slug' });
    res.json({ count: getLikes(req.params.slug) });
});

app.post('/likes/:slug', (req, res) => {
    const { slug } = req.params;
    if (!validSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });
    const ip = getIP(req);
    const key = `${ip}:${slug}`;
    if (likeRates.has(key) && Date.now() - likeRates.get(key) < 86400000) {
        return res.json({ ok: false, count: getLikes(slug), limited: true });
    }
    const count = addLike(slug);
    likeRates.set(key, Date.now());
    res.json({ ok: true, count });
});

// ===== COMMENTS =====
app.get('/comments/:slug', (req, res) => {
    if (!validSlug(req.params.slug)) return res.status(400).json({ error: 'Invalid slug' });
    res.json({ comments: getComments(req.params.slug) });
});

app.post('/comments/:slug', async (req, res) => {
    const { slug } = req.params;
    if (!validSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });

    const { name, body, website } = req.body;
    // Honeypot
    if (website) return res.json({ ok: true });
    // Validate
    if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
        return res.status(400).json({ error: 'Name required (1-100 chars)' });
    }
    if (!body || typeof body !== 'string' || body.trim().length < 1 || body.trim().length > 2000) {
        return res.status(400).json({ error: 'Comment required (1-2000 chars)' });
    }

    const ip = getIP(req);
    // Rate limit: max 5 comments per hour per IP
    const now = Date.now();
    const history = (commentRates.get(ip) || []).filter(t => now - t < 3600000);
    if (history.length >= 5) {
        return res.status(429).json({ error: 'Too many comments. Try again later.' });
    }

    try {
        const id = addComment(slug, name.trim(), body.trim(), ip);
        history.push(now);
        commentRates.set(ip, history);

        // Telegram notification
        const time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        const text = `💬 <b>Новый комментарий</b>\n━━━━━━━━━━━━━━━━━\n📄 <b>Статья:</b> ${esc(slug)}\n👤 <b>Имя:</b> ${esc(name.trim())}\n📝 <b>Текст:</b>\n<i>${esc(body.trim().slice(0, 500))}</i>\n\n🗑 <code>DELETE /api/comments/${id}</code>\n⏰ <code>${time} МСК</code>`;
        sendTelegram(text).catch(() => {});

        res.json({ ok: true, id });
    } catch (err) {
        console.error('Comment error:', err.message);
        res.status(500).json({ error: 'Internal error' });
    }
});

app.delete('/comments/:id', (req, res) => {
    const token = req.headers['x-admin-token'];
    if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const ok = deleteComment(id);
    res.json({ ok });
});

// ===== EXISTING: ORDER =====
app.post('/order', async (req, res) => {
    try {
        const data = req.body;
        if (data.website) return res.json({ ok: true }); // Honeypot
        const text = formatOrder(data);
        const ok = await sendTelegram(text);
        res.json({ ok });
    } catch (err) {
        console.error('Order error:', err.message);
        res.status(500).json({ ok: false, error: 'Internal error' });
    }
});

// ===== EXISTING: JOIN =====
app.post('/join', async (req, res) => {
    try {
        const data = req.body;
        if (data.website) return res.json({ ok: true }); // Honeypot
        const text = formatJoin(data);
        const ok = await sendTelegram(text);
        res.json({ ok });
    } catch (err) {
        console.error('Join error:', err.message);
        res.status(500).json({ ok: false, error: 'Internal error' });
    }
});

// Send message to Telegram Bot API
async function sendTelegram(text) {
    const url = `https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: process.env.TG_CHAT_ID,
            text,
            parse_mode: 'HTML'
        })
    });
    return resp.ok;
}

// Format functions (ported from worker/worker.js)
function formatOrder(d) {
    const bizTypes = ['Проектная', 'Техническая', 'Тестовая', 'Документация для пользователей', 'Юридическая', 'Pitch Deck'];
    const isBiz = bizTypes.some(t => (d.workType || '').includes(t));
    const badge = isBiz ? '🏢 B2B' : '🎓 B2C';
    const time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    return `🔔 <b>Новая заявка — Logic Architecture</b>\n━━━━━━━━━━━━━━━━━\n${badge}\n\n` +
        `👤 <b>Имя:</b> ${esc(d.name)}\n📱 <b>Контакт:</b> ${esc(d.contact)}\n` +
        `📋 <b>Тип:</b> ${esc(d.workType || '—')}\n💬 <b>Комментарий:</b>\n<i>${esc(d.comment || '—')}</i>\n\n⏰ <code>${time} МСК</code>`;
}

function formatJoin(d) {
    const time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    return `🌐 <b>Заявка на присоединение</b>\n━━━━━━━━━━━━━━━━━\n\n` +
        `👤 <b>Имя:</b> ${esc(d.name || '—')}\n\n` +
        `📝 <b>О себе:</b>\n<i>${esc(d.about || '—')}</i>\n\n💻 <b>Опыт:</b>\n<i>${esc(d.experience || '—')}</i>\n\n` +
        `🎯 <b>Хобби:</b>\n<i>${esc(d.hobbies || '—')}</i>\n\n📱 <b>Контакт:</b> ${esc(d.contact)}\n\n⏰ <code>${time} МСК</code>`;
}

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Logic Architecture API running on port ${PORT}`);
});
