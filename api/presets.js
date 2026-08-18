// Vercel Serverless Function: Global Presets Realtime Sync
let globalCollisionBoxes = {
    "Identidade": { x: 0.05, y: 0.00, w: 0.90, h: 1.00 },
    "Aparência":  { x: 0.28, y: 0.00, w: 0.44, h: 0.16 },
    "Busto":      { x: 0.18, y: 0.14, w: 0.64, h: 0.24 },
    "Pernas":     { x: 0.20, y: 0.38, w: 0.60, h: 0.44 },
    "Pés":        { x: 0.24, y: 0.80, w: 0.52, h: 0.20 },
    "Estilo":     { x: 0.10, y: 0.04, w: 0.80, h: 0.90 },
    "Gravação":   { x: 0.05, y: 0.00, w: 0.90, h: 1.00 }
};

let globalViewportCollider = {
    marginLeft: 0.025,
    marginRight: 0.025,
    marginTop: 0.02,
    marginBottom: 0.02
};

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (data && typeof data === 'object') {
                if (data.collisionBoxes) {
                    globalCollisionBoxes = { ...globalCollisionBoxes, ...data.collisionBoxes };
                } else if (data.Identidade || data["Aparência"]) {
                    globalCollisionBoxes = { ...globalCollisionBoxes, ...data };
                }
                if (data.viewportCollider) {
                    globalViewportCollider = { ...globalViewportCollider, ...data.viewportCollider };
                }
                return res.status(200).json({ success: true, collisionBoxes: globalCollisionBoxes, viewportCollider: globalViewportCollider });
            }
        } catch(e) {
            return res.status(400).json({ error: e.message });
        }
    }

    return res.status(200).json({ collisionBoxes: globalCollisionBoxes, viewportCollider: globalViewportCollider });
}
