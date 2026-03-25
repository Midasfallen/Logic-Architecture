const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = path.join(__dirname, '..', 'docs');
const LANGS = ['en', 'vi', 'zh'];

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml; charset=utf-8',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
};

function serve(res, filePath) {
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
        return true;
    } catch {
        return false;
    }
}

http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);

    // Strip language prefix: /en/students -> /students
    let strippedPath = urlPath;
    const match = urlPath.match(/^\/(ru|en|vi|zh)(\/.*)?$/);
    if (match) {
        strippedPath = match[2] || '/';
    }

    // Try exact file
    let filePath = path.join(ROOT, strippedPath);
    if (serve(res, filePath)) return;

    // Try with index.html
    if (serve(res, path.join(filePath, 'index.html'))) return;

    // Try adding .html
    if (serve(res, filePath + '.html')) return;

    // 404
    const notFound = path.join(ROOT, '404.html');
    if (fs.existsSync(notFound)) {
        const data = fs.readFileSync(notFound);
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
    } else {
        res.writeHead(404);
        res.end('404 Not Found');
    }
}).listen(PORT, () => {
    console.log(`Dev server: http://localhost:${PORT}`);
});
