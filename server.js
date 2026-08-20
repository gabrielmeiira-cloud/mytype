const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3333;
const PRESETS_FILE = path.join(__dirname, 'camera_presets.json');

// Presets padrão caso o arquivo não exista
const defaultPresets = {
    "Identidade": { "scale": 0.79, "panX": 0, "panY": 0, "anchorV": "center", "anchorH": "center" },
    "Aparência":  { "scale": 2.85, "panX": 0, "panY": 480, "anchorV": "top", "anchorH": "center" },
    "Busto":      { "scale": 3.53, "panX": 0, "panY": 260, "anchorV": "center", "anchorH": "center" },
    "Pernas":     { "scale": 1.65, "panX": 0, "panY": -210, "anchorV": "center", "anchorH": "center" },
    "Pés":        { "scale": 2.65, "panX": 0, "panY": -780, "anchorV": "bottom", "anchorH": "center" },
    "Estilo":     { "scale": 1.12, "panX": 0, "panY": 15, "anchorV": "center", "anchorH": "center" },
    "Gravação":   { "scale": 0.92, "panX": 0, "panY": 0, "anchorV": "center", "anchorH": "center" }
};

// Inicializa o arquivo se necessário
if (!fs.existsSync(PRESETS_FILE)) {
    fs.writeFileSync(PRESETS_FILE, JSON.stringify(defaultPresets, null, 4), 'utf8');
}

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const urlPath = req.url.split('?')[0];

    // API de Presets em Tempo Real
    if (urlPath === '/api/presets') {
        if (req.method === 'GET') {
            try {
                const data = fs.readFileSync(PRESETS_FILE, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            } catch(e) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(defaultPresets));
            }
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    let current = {};
                    try { current = JSON.parse(fs.readFileSync(PRESETS_FILE, 'utf8')); } catch(e){}
                    const updated = { ...current, ...parsed };
                    fs.writeFileSync(PRESETS_FILE, JSON.stringify(updated, null, 4), 'utf8');
                    console.log(`[${new Date().toLocaleTimeString()}] 💾 Presets atualizados em tempo real no servidor!`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, presets: updated }));
                } catch(err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: err.message }));
                }
            });
            return;
        }
    }

    // Servir Arquivos Estáticos
    let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

const localIp = getLocalIp();
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
==================================================
🚀 SERVIDOR MYTYPE ATIVO E SINCRONIZADO!
💻 No Computador: http://localhost:${PORT}
📱 No Celular (mesmo Wi-Fi): http://${localIp}:${PORT}
🔗 API de Presets: http://${localIp}:${PORT}/api/presets
==================================================
`);
});
