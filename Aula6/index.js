const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const REFRESH_INTERVAL_MS = 5000;
const CPU_SAMPLE_INTERVAL_MS = 1000;
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('A variável PORT deve ser um número inteiro entre 1 e 65535.');
}

const corsOptions = allowedOrigins.length === 0
  ? { origin: isProduction ? false : '*' }
  : {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
    };

app.disable('x-powered-by');
app.use(cors(corsOptions));

let previousCpuSnapshot = null;
let latestCpuUsagePercent = 0;

function round(value) {
  return Math.round(value);
}

function roundOneDecimal(value) {
  return Number(value.toFixed(1));
}

function toMegabytes(bytes) {
  return round(bytes / 1024 / 1024);
}

function toMinutes(seconds) {
  return round(seconds / 60);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readCpuSnapshot() {
  return (os.cpus() || []).reduce(
    (snapshot, cpu) => {
      const times = cpu.times;
      snapshot.user += times.user;
      snapshot.nice += times.nice;
      snapshot.system += times.sys;
      snapshot.idle += times.idle;
      snapshot.irq += times.irq;
      return snapshot;
    },
    { user: 0, nice: 0, system: 0, idle: 0, irq: 0 },
  );
}

function getCpuUsagePercent() {
  const current = readCpuSnapshot();
  const currentTotal = Object.values(current).reduce((total, value) => total + value, 0);

  if (!previousCpuSnapshot) {
    previousCpuSnapshot = { ...current, total: currentTotal };
    return 0;
  }

  const elapsedTotal = currentTotal - previousCpuSnapshot.total;
  const elapsedIdle = current.idle - previousCpuSnapshot.idle;
  previousCpuSnapshot = { ...current, total: currentTotal };

  if (elapsedTotal <= 0) return 0;

  const busyPercent = ((elapsedTotal - elapsedIdle) / elapsedTotal) * 100;
  return roundOneDecimal(Math.min(Math.max(busyPercent, 0), 100));
}

function updateCpuUsage() {
  latestCpuUsagePercent = getCpuUsagePercent();
}

const cpuSampler = setInterval(updateCpuUsage, CPU_SAMPLE_INTERVAL_MS);
cpuSampler.unref();
updateCpuUsage();

function getProcessMemory() {
  const memory = process.memoryUsage();

  return {
    rssBytes: memory.rss,
    heapTotalBytes: memory.heapTotal,
    heapUsedBytes: memory.heapUsed,
    externalBytes: memory.external,
    arrayBuffersBytes: memory.arrayBuffers,
    rssMB: toMegabytes(memory.rss),
    heapTotalMB: toMegabytes(memory.heapTotal),
    heapUsedMB: toMegabytes(memory.heapUsed),
    externalMB: toMegabytes(memory.external),
    arrayBuffersMB: toMegabytes(memory.arrayBuffers),
  };
}

function getSystemSnapshot() {
  const totalMemoryBytes = os.totalmem();
  const freeMemoryBytes = os.freemem();
  const usedMemoryBytes = Math.max(totalMemoryBytes - freeMemoryBytes, 0);
  const uptimeSeconds = round(os.uptime());

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    cpus: (os.cpus() || []).length,
    cpuUsagePercent: latestCpuUsagePercent,
    memory: {
      totalBytes: totalMemoryBytes,
      freeBytes: freeMemoryBytes,
      usedBytes: usedMemoryBytes,
      totalMB: toMegabytes(totalMemoryBytes),
      freeMB: toMegabytes(freeMemoryBytes),
      usedMB: toMegabytes(usedMemoryBytes),
      usedPercent: totalMemoryBytes > 0
        ? roundOneDecimal((usedMemoryBytes / totalMemoryBytes) * 100)
        : 0,
    },
    processMemory: getProcessMemory(),
    processUptimeSeconds: round(process.uptime()),
    uptimeSeconds,
    uptimeMinutes: toMinutes(uptimeSeconds),
    measuredAt: new Date().toISOString(),
  };
}

function renderDashboard() {
  const snapshot = getSystemSnapshot();
  const number = new Intl.NumberFormat('pt-BR');
  const memoryBarWidth = Math.min(Math.max(snapshot.memory.usedPercent, 0), 100);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Dashboard de informações do sistema operacional e do processo Node.js">
  <title>Cloud SO App — Monitor do sistema</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1020;
      --panel: rgba(19, 28, 52, .88);
      --text: #edf4ff;
      --muted: #9fb0cc;
      --accent: #62d8ff;
      --accent-2: #9b8cff;
      --success: #65e6a2;
      --warning: #ffcf70;
      --border: rgba(164, 191, 232, .18);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; color: var(--text); background: radial-gradient(circle at top right, #223871 0, transparent 40%), var(--bg); }
    main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 48px 0 64px; }
    header { display: flex; justify-content: space-between; gap: 24px; align-items: end; margin-bottom: 28px; }
    h1 { font-size: clamp(2rem, 5vw, 4.1rem); line-height: .98; margin: 0 0 14px; letter-spacing: -.05em; }
    .eyebrow { color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: .15em; font-size: .78rem; }
    .intro { color: var(--muted); max-width: 720px; line-height: 1.6; margin: 0; }
    .status { display: inline-flex; align-items: center; gap: 8px; color: var(--success); font-weight: 700; white-space: nowrap; }
    .status.offline { color: #ff7b8a; }
    .status::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: currentColor; box-shadow: 0 0 16px currentColor; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .card { background: linear-gradient(145deg, var(--panel), rgba(17, 26, 49, .65)); border: 1px solid var(--border); border-radius: 22px; padding: 22px; box-shadow: 0 18px 50px rgba(0,0,0,.18); }
    .card-wide { grid-column: span 2; }
    .label { color: var(--muted); font-size: .85rem; margin: 0 0 10px; }
    .value { font-size: clamp(1.4rem, 3vw, 2.2rem); font-weight: 800; letter-spacing: -.04em; margin: 0; overflow-wrap: anywhere; }
    .value small { color: var(--muted); font-size: .75em; font-weight: 600; }
    .bar { height: 12px; border-radius: 999px; background: #273655; overflow: hidden; margin-top: 17px; }
    .bar > span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-2)); border-radius: inherit; transition: width .4s ease; }
    .meta { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); font-size: .85rem; margin-top: 10px; }
    footer { color: var(--muted); font-size: .86rem; line-height: 1.6; margin-top: 22px; }
    code { color: var(--accent); }
    @media (max-width: 760px) { header { display: block; } .status { margin-top: 18px; } .grid { grid-template-columns: 1fr; } .card-wide { grid-column: span 1; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <div class="eyebrow">cloud-so-app / observabilidade</div>
        <h1>Monitor do sistema operacional</h1>
        <p class="intro">Uma visão atualizada do ambiente que executa este processo Node.js. Em nuvem, os valores representam o host virtualizado ou container disponibilizado pela plataforma.</p>
      </div>
      <div class="status" aria-live="polite">Servidor online</div>
    </header>

    <section class="grid" aria-label="Métricas do sistema e do processo">
      <article class="card card-wide"><p class="label">Nome do host</p><p class="value" id="hostname">${escapeHtml(snapshot.hostname)}</p></article>
      <article class="card"><p class="label">Plataforma</p><p class="value" id="platform">${escapeHtml(snapshot.platform)}</p></article>
      <article class="card"><p class="label">Arquitetura</p><p class="value" id="architecture">${escapeHtml(snapshot.architecture)}</p></article>
      <article class="card"><p class="label">CPUs lógicas</p><p class="value" id="cpus">${number.format(snapshot.cpus)}</p></article>
      <article class="card"><p class="label">Uso real de CPU</p><p class="value"><span id="cpuUsage">${snapshot.cpuUsagePercent}</span> <small>%</small></p></article>
      <article class="card"><p class="label">Tempo de atividade</p><p class="value" id="uptime">${number.format(snapshot.uptimeMinutes)} <small>min</small></p></article>
      <article class="card card-wide"><p class="label">Memória do sistema utilizada</p><p class="value"><span id="usedMemory">${number.format(snapshot.memory.usedMB)}</span> <small>MB</small> <span id="usedPercent">(${snapshot.memory.usedPercent}%)</span></p><div class="bar" role="progressbar" aria-label="Memória do sistema utilizada" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${snapshot.memory.usedPercent}"><span id="memoryBar" style="width: ${memoryBarWidth}%"></span></div><div class="meta"><span>Total: <strong id="totalMemory">${number.format(snapshot.memory.totalMB)} MB</strong></span><span>Livre: <strong id="freeMemory">${number.format(snapshot.memory.freeMB)} MB</strong></span></div></article>
      <article class="card card-wide"><p class="label">Memória do processo Node.js</p><p class="value"><span id="processRss">${number.format(snapshot.processMemory.rssMB)}</span> <small>MB RSS</small></p><div class="meta"><span>Heap usado: <strong id="heapUsed">${number.format(snapshot.processMemory.heapUsedMB)} MB</strong></span><span>Heap total: <strong id="heapTotal">${number.format(snapshot.processMemory.heapTotalMB)} MB</strong></span></div></article>
    </section>

    <footer>Última medição: <time id="measuredAt">${escapeHtml(snapshot.measuredAt)}</time>. Atualização automática a cada ${REFRESH_INTERVAL_MS / 1000} segundos. API: <code>/api/status</code> · Health check: <code>/health</code></footer>
  </main>
  <script>
    const number = new Intl.NumberFormat('pt-BR');
    const status = document.querySelector('.status');
    const measuredAt = document.querySelector('#measuredAt');
    const memoryBar = document.querySelector('#memoryBar');
    const progressbar = document.querySelector('[role="progressbar"]');

    async function refreshDashboard() {
      try {
        const response = await fetch('/api/status', { cache: 'no-store' });
        if (!response.ok) throw new Error('Falha ao consultar a API');
        const data = await response.json();
        document.querySelector('#hostname').textContent = data.hostname;
        document.querySelector('#platform').textContent = data.platform;
        document.querySelector('#architecture').textContent = data.architecture;
        document.querySelector('#cpus').textContent = number.format(data.cpus);
        document.querySelector('#cpuUsage').textContent = data.cpuUsagePercent;
        document.querySelector('#uptime').innerHTML = number.format(data.uptimeMinutes) + ' <small>min</small>';
        document.querySelector('#usedMemory').textContent = number.format(data.memory.usedMB);
        document.querySelector('#usedPercent').textContent = '(' + data.memory.usedPercent + '%)';
        document.querySelector('#totalMemory').textContent = number.format(data.memory.totalMB) + ' MB';
        document.querySelector('#freeMemory').textContent = number.format(data.memory.freeMB) + ' MB';
        document.querySelector('#processRss').textContent = number.format(data.processMemory.rssMB);
        document.querySelector('#heapUsed').textContent = number.format(data.processMemory.heapUsedMB) + ' MB';
        document.querySelector('#heapTotal').textContent = number.format(data.processMemory.heapTotalMB) + ' MB';
        const memoryBarWidth = Math.min(Math.max(data.memory.usedPercent, 0), 100);
        memoryBar.style.width = memoryBarWidth + '%';
        progressbar.setAttribute('aria-valuenow', memoryBarWidth);
        measuredAt.textContent = data.measuredAt;
        status.classList.remove('offline');
        status.textContent = 'Servidor online';
      } catch (error) {
        status.classList.add('offline');
        status.textContent = 'Atualização indisponível';
      }
    }

    refreshDashboard();
    window.setInterval(refreshDashboard, ${REFRESH_INTERVAL_MS});
  </script>
</body>
</html>`;
}

app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(renderDashboard());
});

app.get('/api/status', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(getSystemSnapshot());
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cloud-so-app', uptimeSeconds: round(process.uptime()) });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.originalUrl });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const server = app.listen(PORT, () => {
  console.log(`cloud-so-app ouvindo na porta ${PORT}`);
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} recebido; encerrando servidor...`);

  const forceExitTimer = setTimeout(() => {
    console.error('Tempo limite de encerramento excedido; forçando saída.');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }

  server.close(() => {
    clearTimeout(forceExitTimer);
    clearInterval(cpuSampler);
    console.log('Servidor encerrado com segurança.');
    process.exit(0);
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
