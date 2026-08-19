// Vercel Serverless Function: Global Presets Realtime Sync
let globalCollisionBoxes = {
    "Identidade": { x: 0.05, y: 0.011, w: 0.90, h: 0.989 },
    "Aparência":  { x: 0.35, y: 0.000, w: 0.297, h: 0.270 },
    "Busto":      { x: 0.375, y: 0.175, w: 0.248, h: 0.164 },
    "Pernas":     { x: 0.20, y: 0.380, w: 0.600, h: 0.440 },
    "Pés":        { x: 0.24, y: 0.800, w: 0.520, h: 0.200 },
    "Estilo":     { x: 0.10, y: 0.040, w: 0.800, h: 0.900 },
    "Gravação":   { x: 0.05, y: 0.000, w: 0.900, h: 1.000 }
};

let globalViewportCollider = {
    marginLeft: 0.02210982658959538,
    marginRight: 0.027890173410404624,
    marginTop: 0.015910020449897755,
    marginBottom: 0.005685071574642124
};

let globalUiScale = 100;

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
                if (data.uiScale !== undefined) {
                    globalUiScale = Number(data.uiScale) || 100;
                }
                return res.status(200).json({ 
                    success: true, 
                    collisionBoxes: globalCollisionBoxes, 
                    viewportCollider: globalViewportCollider,
                    uiScale: globalUiScale
                });
            }
        } catch(e) {
            return res.status(400).json({ error: e.message });
        }
    }

    return res.status(200).json({ 
        collisionBoxes: globalCollisionBoxes, 
        viewportCollider: globalViewportCollider,
        uiScale: globalUiScale
    });
}
