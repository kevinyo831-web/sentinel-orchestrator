import net from 'net';

// Tailscale 裝置監控
// 優先使用 Tailscale API（Vercel 等外部環境可用），
// 無 TAILSCALE_API_KEY 時退回 TCP 檢測（僅在 tailnet 內的機器上有效）
const WATCH = [
  { hostname: 'kai0831-ho5', ip: '100.124.54.5', label: 'HO5' },
  { hostname: 'kai0831-pro-adl-n-cubi-n-ms-b0a9', ip: '100.84.195.14', label: 'CUBI' },
  { hostname: 'desktop-taop06p', ip: '100.119.60.12', label: 'DESKTOP' },
  { hostname: 'vultr', ip: '100.74.110.57', label: 'VULTR' },
];

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

async function checkViaTailscaleApi(apiKey) {
  const r = await fetch('https://api.tailscale.com/api/v2/tailnet/-/devices', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!r.ok) throw new Error(`Tailscale API ${r.status}`);
  const { devices } = await r.json();

  return WATCH.map((w) => {
    const d = devices.find(
      (dev) => dev.hostname === w.hostname || (dev.addresses || []).includes(w.ip)
    );
    const lastSeen = d?.lastSeen ? new Date(d.lastSeen).getTime() : null;
    const online = d?.online ?? (lastSeen != null && Date.now() - lastSeen < ONLINE_WINDOW_MS);
    return {
      id: w.label, ip: w.ip, label: w.label,
      online: Boolean(online), latency: null, lastSeen,
      checkedAt: Date.now(), source: 'tailscale-api',
    };
  });
}

function tcpCheck(ip, port, timeout = 4000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let done = false;
    const finish = (online) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ online, latency: online ? Date.now() - start : null });
    };
    socket.setTimeout(timeout);
    socket.on('connect', () => finish(true));
    socket.on('timeout', () => finish(false));
    socket.on('error', () => finish(false));
    socket.connect(port, ip);
  });
}

async function checkViaTcp() {
  return Promise.all(
    WATCH.map(async (w) => {
      const { online, latency } = await tcpCheck(w.ip, 80);
      return {
        id: w.label, ip: w.ip, label: w.label,
        online, latency, lastSeen: null,
        checkedAt: Date.now(), source: 'tcp',
      };
    })
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.TAILSCALE_API_KEY;
  let hosts;
  try {
    hosts = apiKey ? await checkViaTailscaleApi(apiKey) : await checkViaTcp();
  } catch {
    hosts = await checkViaTcp();
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ hosts });
}
