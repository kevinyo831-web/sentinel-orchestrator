import net from 'net';

const HOSTS = [
  { id: 'HO05', ip: '100.119.60.12', port: 80, label: 'HO05' },
];

function checkHost(ip, port, timeout = 4000) {
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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = await Promise.all(
    HOSTS.map(async (h) => {
      const { online, latency } = await checkHost(h.ip, h.port);
      return { id: h.id, ip: h.ip, port: h.port, label: h.label, online, latency, checkedAt: Date.now() };
    })
  );

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ hosts: results });
}
