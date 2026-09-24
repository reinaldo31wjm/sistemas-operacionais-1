# Manual técnico: `cloud-so-app`

> Este manual acompanha o projeto implementado em `index.js`. Além da página HTML, a aplicação possui a API `/api/status`, o health check `/health`, atualização automática, CORS configurável por `CORS_ORIGIN`, percentual de memória com uma casa decimal, indicador visual de falha e encerramento gracioso com limite de segurança.

## 1. Objetivo

Este manual documenta a criação, execução, teste e publicação de uma aplicação web desenvolvida com **Node.js** e **Express.js**. A aplicação exibe informações do sistema operacional que executa o processo do servidor: nome do host, plataforma, arquitetura, quantidade de CPUs, memória total, memória livre e tempo de atividade do sistema.

O experimento tem dois ambientes de execução:

1. **Ambiente local**, no computador utilizado durante o desenvolvimento.
2. **Ambiente de nuvem**, publicado como um Web Service no Render.

### Arquivos da entrega

| Arquivo ou diretório | Finalidade |
|---|---|
| `index.js` | Servidor Express, dashboard, API, health check e encerramento gracioso. |
| `package.json` | Metadados, scripts e dependências. |
| `package-lock.json` | Versões resolvidas das dependências. |
| `README.md` | Guia rápido de execução e endpoints. |
| `docs/` | Fontes Mermaid e imagens do mapa mental, fluxograma e arquitetura. |
| `.env.example` | Modelo de configuração para `PORT` e `CORS_ORIGIN`. |
| `MANUAL.md` | Este manual técnico completo. |

A comparação entre os ambientes demonstra que a aplicação não coleta informações do dispositivo que acessa a página. Ela coleta informações do sistema operacional hospedeiro do processo Node.js. Portanto, após a publicação, os valores exibidos representam a infraestrutura disponibilizada pelo Render.

> **Resultado principal:** a aplicação funciona como uma fotografia do estado do sistema no instante de cada requisição HTTP. Ela não realiza monitoramento contínuo nem armazena histórico das medições.

---

## 2. Conceitos utilizados

A atividade relaciona desenvolvimento web com conceitos de Sistemas Operacionais e Computação em Nuvem.

| Conceito | Como aparece na aplicação |
|---|---|
| Processo | O comando `node index.js` cria um processo Node.js mantido pelo sistema operacional. |
| Sistema operacional hospedeiro | O módulo nativo `os` consulta o sistema operacional onde o servidor está executando. |
| Gerenciamento de memória | `os.totalmem()` e `os.freemem()` consultam a memória informada pelo sistema operacional. |
| Uso de CPU | `os.cpus().length` informa a quantidade de CPUs lógicas visíveis ao processo. |
| Uptime | `os.uptime()` informa há quanto tempo o sistema está ativo. |
| Virtualização | No ambiente cloud, os recursos podem ser apresentados por uma máquina virtual ou por um container. |
| Computação em nuvem | O Render fornece a infraestrutura e a plataforma de execução pela internet. |
| Backend | O servidor recebe requisições HTTP, executa lógica e envia respostas HTML. |
| Web service | A aplicação fica acessível por uma URL e se comunica por HTTP/HTTPS. |
| PaaS | O Render gerencia parte da infraestrutura e do runtime, enquanto o desenvolvedor fornece o código. |

---

## 3. Pré-requisitos

Instale ou tenha acesso às seguintes ferramentas:

- **Node.js**, que inclui o runtime JavaScript e o npm;
- **Visual Studio Code** ou outro editor;
- **Git**;
- uma conta no **GitHub**;
- uma conta no **Render**;
- um navegador web.

Verifique a instalação no terminal:

```bash
node --version
npm --version
git --version
```

No ambiente usado para validar o projeto, foram observados:

```text
Node.js v22.13.0
Express 5.2.1
CORS 2.8.6
```

As versões podem ser diferentes no computador do estudante. O arquivo `package-lock.json` deve ser utilizado para reproduzir as versões resolvidas pelo npm.

---

## 4. Criação do projeto

Abra o terminal e crie uma pasta para a aplicação:

```bash
mkdir cloud-so-app
cd cloud-so-app
```

Inicialize um projeto Node.js:

```bash
npm init -y
```

Instale o Express e o pacote CORS:

```bash
npm install express cors
```

O Express é utilizado para criar o servidor e declarar as rotas HTTP. O CORS permite chamadas feitas por aplicações hospedadas em origens diferentes. A origem é lida de `process.env.CORS_ORIGIN`; quando a lista está vazia, `*` é usado somente fora de produção. Em produção, defina `NODE_ENV=production` e configure uma origem específica no Render.

Crie o arquivo principal:

```bash
touch index.js
```

No Windows PowerShell, pode ser usado:

```powershell
New-Item index.js
```

---

## 5. Código da aplicação

O bloco abaixo é o código-fonte final do `index.js`.

```js
const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const REFRESH_INTERVAL_MS = 5000;
const CPU_SAMPLE_INTERVAL_MS = 1000;
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('A variável PORT deve ser um número inteiro entre 1 e 65535.');
}

const corsOptions = allowedOrigins.length === 0
  ? { origin: '*' }
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
```
### 5.1. Explicação da implementação final

O servidor importa `express`, `cors` e o módulo nativo `os`. A variável `CORS_ORIGIN` é dividida por vírgulas, tem os espaços removidos e forma uma lista de origens permitidas. Quando a lista está vazia, o middleware usa `*` fora de produção e bloqueia CORS em produção; quando possui valores, aceita apenas origens presentes na lista.

A função `readCpuSnapshot()` soma os tempos de usuário, nice, sistema, idle e interrupções de todas as CPUs lógicas. `getCpuUsagePercent()` compara duas leituras consecutivas. A diferença entre o tempo total e o tempo ocioso representa o trabalho realizado no intervalo. O resultado é limitado entre 0 e 100 e formatado com uma casa decimal. Na primeira leitura, o valor é zero porque ainda não existe intervalo anterior para comparação.

`getProcessMemory()` usa `process.memoryUsage()` para separar o consumo do próprio processo Node.js da memória total do sistema. O campo `rss` representa a memória residente do processo; `heapUsed` e `heapTotal` representam o heap gerenciado pelo V8; `external` e `arrayBuffers` representam outras áreas associadas ao processo.

A rota `/` gera o dashboard HTML. A rota `/api/status` retorna o snapshot em JSON e a rota `/health` informa se o serviço está disponível. O script do navegador chama `refreshDashboard()` imediatamente após o carregamento e também a cada cinco segundos. Se a requisição falhar, o indicador recebe a classe `offline`.

O código usa `(os.cpus() || [])` para tolerar ambientes restritos, limita a largura visual da barra de memória entre 0 e 100, inclui `processUptimeSeconds` para distinguir o processo do uptime do sistema e chama `server.closeAllConnections()` quando esse recurso existe antes de concluir o encerramento HTTP.
## 6. Organização recomendada do `package.json`

O `package.json` deve conter a configuração completa abaixo:

```json
{
  "name": "cloud-so-app",
  "version": "1.0.0",
  "private": true,
  "description": "Dashboard Node.js e Express.js para métricas do sistema e do processo",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js",
    "check": "node --check index.js"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": ["nodejs", "express", "system-monitor", "cloud-computing"],
  "dependencies": {
    "cors": "^2.8.6",
    "express": "^5.2.1"
  }
}
```

Depois de alterar o arquivo, atualize o lockfile:

```bash
npm install
```

O script permite iniciar o projeto com:

```bash
npm start
```

Também é possível executar diretamente:

```bash
node index.js
```

O projeto possui os scripts `start`, `dev` e `check`. O script `start` facilita a execução local e permite configurar o Render com o comando padrão `npm start`; `dev` usa `node --watch`; `check` verifica a sintaxe sem iniciar o servidor.

O arquivo `.env.example` documenta as variáveis aceitas pela aplicação. O Node.js não carrega arquivos `.env` automaticamente por padrão; para testes, defina as variáveis no terminal ou na ferramenta de desenvolvimento. No Render, cadastre `PORT` e `CORS_ORIGIN` na área de variáveis de ambiente do serviço.

---

## 7. Teste local

Inicie a aplicação:

```bash
npm start
```

O terminal deve exibir uma mensagem semelhante a:

```text
cloud-so-app ouvindo na porta 3000
```

Abra o navegador em:

```text
http://localhost:3000/
```

A página deve mostrar os campos de monitoramento.

Também é possível testar pelo terminal:

```bash
curl -i http://localhost:3000/
```

Uma resposta correta deve possuir o status:

```text
HTTP/1.1 200 OK
```

E deve conter o título:

```text
<title>Cloud SO App — Monitor do sistema</title>
<h1>Monitor do sistema operacional</h1>
```

### 7.1. Validação realizada

Na validação local do projeto, a rota retornou `HTTP 200 OK` e exibiu os elementos do dashboard, incluindo:

```text
Hostname: 0f5379ece420
Plataforma: linux
Arquitetura: x64
Memória Total: 8034 MB
Memória Livre: 6783 MB
CPUs lógicas: 6
Uso real de CPU: variável entre 0 e 100%
Memória do processo Node.js: RSS, heap usado e heap total
Tempo de atividade: variável conforme o sistema hospedeiro
```

Esses valores pertencem ao ambiente em que o teste foi executado. Eles não devem ser usados como os valores pessoais do computador do estudante, pois podem representar um container ou ambiente virtualizado.

### 7.2. O que testar no navegador

Verifique os seguintes pontos:

1. `http://localhost:3000/` carrega a página.
2. O título aparece corretamente.
3. Todos os campos possuem valores.
4. O navegador não exibe erro de conexão.
5. Ao atualizar a página, memória livre e uptime podem mudar.
6. `http://localhost:3000/rota-inexistente` retorna erro `404`, pois não há rota definida para esse caminho.

Para encerrar o servidor no terminal, pressione:

```text
Ctrl + C
```

### 7.3. Recursos implementados

O dashboard atual é uma página HTML responsiva. A largura inicial da barra de memória é aplicada diretamente no elemento `#memoryBar`; depois, o navegador atualiza essa largura a partir da resposta da API. A página consulta `/api/status` automaticamente a cada cinco segundos.

Se a consulta falhar, o elemento de status recebe a classe `.offline`, muda para uma cor de alerta e exibe `Atualização indisponível`. Quando a consulta volta a funcionar, o status retorna para `Servidor online`.

Teste os endpoints adicionais:

```bash
curl -i http://localhost:3000/api/status
curl -i http://localhost:3000/health
```

`/api/status` retorna JSON com hostname, plataforma, arquitetura, CPUs, memória em bytes e megabytes, percentual de memória utilizada com uma casa decimal, uptime e horário da medição. `/health` retorna o estado do processo da aplicação e é útil para verificar disponibilidade no Render.

### 7.4. Diagramas para a apresentação

Os diagramas estão versionados em `docs/`:

- [Mapa mental em Mermaid](docs/mapa-mental.mmd) e [PNG](docs/mapa-mental.png);
- [Fluxograma em Mermaid](docs/fluxograma.mmd) e [PNG](docs/fluxograma.png);
- [Arquitetura em Mermaid](docs/arquitetura.mmd) e [PNG](docs/arquitetura.png).

---

## 8. Relacionamento com Sistemas Operacionais

### 8.1. Processo

Ao executar `node index.js`, o sistema operacional cria um processo para o runtime Node.js. Esse processo contém o código da aplicação, as bibliotecas carregadas e os dados utilizados durante a execução.

O processo permanece ativo porque `app.listen()` abre um socket de escuta e o event loop do Node.js continua aguardando novas conexões. Ele só termina quando recebe uma interrupção, ocorre uma falha não tratada ou o ambiente encerra o serviço.

### 8.2. Gerenciamento de memória

As funções `os.totalmem()` e `os.freemem()` solicitam ao sistema operacional informações sobre memória. O sistema operacional controla quais regiões estão disponíveis, quais estão ocupadas por processos e quais podem ser reutilizadas.

A aplicação não gerencia diretamente páginas de memória nem aloca blocos de baixo nível. Ela consulta uma abstração fornecida pelo Node.js, que por sua vez consulta o sistema operacional.

Além da memória do sistema, o próprio processo Node possui memória interna para objetos JavaScript, módulos, buffers e estruturas do Express. A aplicação exibe essa separação em `processMemory`, obtida com `process.memoryUsage()`. O campo `rss` representa a memória residente do processo; `heapUsed` e `heapTotal` representam o heap gerenciado pelo V8.

### 8.3. CPU

`os.cpus().length` informa a quantidade de CPUs lógicas visíveis. O uso real é calculado continuamente no servidor. `readCpuSnapshot()` soma os tempos de usuário, nice, sistema, idle e interrupções de todas as CPUs. A cada segundo, `getCpuUsagePercent()` compara a leitura atual com a anterior; a fração não ociosa do intervalo é convertida em percentual, limitada entre 0 e 100 e arredondada para uma casa decimal.

Esse amostrador em segundo plano mantém um único valor atualizado, que é somente lido pelas rotas. Dessa forma, requisições simultâneas não alteram o estado da amostragem nem produzem deltas artificiais. O valor inicial é zero até que exista o primeiro intervalo de comparação.

### 8.4. Sistema operacional hospedeiro

As informações exibidas pertencem ao sistema operacional onde o Node.js está executando. Se o navegador estiver em um notebook e o Node estiver em um servidor remoto, a página exibirá dados do servidor, não do notebook.

Essa separação é essencial para interpretar corretamente o experimento local e o experimento no Render.

### 8.5. Virtualização e containers

Em um ambiente cloud, o processo pode executar em uma máquina virtual ou em um container. Uma máquina virtual apresenta um sistema operacional convidado sobre um hypervisor. Um container isola processos e arquivos, mas compartilha o kernel do sistema operacional hospedeiro.

Como consequência, `os.hostname()`, `os.cpus()` e os valores de memória podem refletir a visão de recursos disponibilizada ao serviço. Eles não precisam corresponder ao servidor físico completo do provedor.

### 8.6. Computação em nuvem

O Render fornece recursos de execução sob demanda por meio da internet. O estudante publica o código, define como instalá-lo e como iniciá-lo, enquanto a plataforma cuida de parte da infraestrutura, rede e execução do serviço.

Esse modelo se aproxima de **PaaS — Platform as a Service**. O desenvolvedor concentra-se no código e na configuração do serviço, sem administrar diretamente o servidor físico, o hypervisor ou toda a camada de sistema operacional.

---

## 9. Versionamento com Git

Dentro da pasta do projeto, inicialize o repositório:

```bash
git init
git branch -M main
```

Crie um arquivo `.gitignore` para não enviar dependências instaladas localmente:

```gitignore
node_modules/
.env
npm-debug.log*
.DS_Store
```

O diretório `node_modules` não precisa ser versionado, porque pode ser recriado com `npm install` ou `npm ci` a partir do `package.json` e do `package-lock.json`.

Registre os arquivos:

```bash
git add index.js package.json package-lock.json .gitignore .env.example README.md MANUAL.md docs
git commit -m "docs: adiciona manual técnico e documentação visual"
```

---

## 10. Criação do repositório no GitHub

1. Acesse [GitHub](https://github.com) e entre na conta.
2. Selecione **New repository**.
3. Use o nome `cloud-so-app`.
4. Escolha público ou privado conforme a orientação da disciplina.
5. Não gere outro `README` se o projeto já possuir arquivos locais que serão enviados.
6. Crie o repositório.

Associe o repositório remoto, substituindo `SEU_USUARIO` pelo nome real da conta:

```bash
git remote add origin https://github.com/SEU_USUARIO/cloud-so-app.git
git push -u origin main
```

Confirme o envio:

```bash
git remote -v
git log --oneline -1
```

Acesse no navegador:

```text
https://github.com/SEU_USUARIO/cloud-so-app
```

O repositório deve conter pelo menos:

```text
index.js
package.json
package-lock.json
.gitignore
```

O manual pode ser salvo no próprio repositório ou no repositório da disciplina, conforme a orientação da turma.

---

## 11. Publicação no Render

### 11.1. Preparação

Antes do deploy, confirme que:

- o projeto está no GitHub;
- `package.json` contém o script `start`;
- o código usa `process.env.PORT || 3000`;
- o projeto inicia localmente sem erros;
- `node_modules` não está no GitHub.

### 11.2. Criação do Web Service

1. Acesse [Render](https://render.com) e crie uma conta ou entre na conta existente.
2. No painel, selecione **New**.
3. Escolha **Web Service**.
4. Conecte a conta do GitHub.
5. Selecione o repositório `cloud-so-app`.
6. Escolha a branch `main`.
7. Defina o ambiente como Node.
8. Configure o comando de instalação/build como:

```bash
npm install
```

9. Configure o comando de inicialização como:

```bash
npm start
```

Se o script `start` não tiver sido criado, use:

```bash
node index.js
```

10. Escolha o plano permitido pela conta e pela atividade.
11. Clique em **Create Web Service** ou equivalente.
12. Aguarde os logs de instalação e inicialização.

A orientação da aula apresenta `node index.js` como comando de inicialização. Tecnicamente, `node` sozinho não é um comando de build; o build pode usar `npm install`, enquanto o start deve executar `node index.js` ou `npm start`.

### 11.3. Validação no Render

Quando o deploy terminar, o Render fornecerá uma URL semelhante a:

```text
https://cloud-so-app.onrender.com
```

Acesse a URL no navegador. A página deve exibir os mesmos campos da execução local.

Teste também pelo terminal:

```bash
curl -i https://SEU-ENDERECO.onrender.com/
```

O resultado esperado é uma resposta `200 OK` com o HTML do monitor.

Em planos gratuitos ou ambientes com suspensão por inatividade, a primeira requisição após um período sem acesso pode demorar mais, porque o serviço precisa ser iniciado novamente. Esse comportamento não significa necessariamente erro no código.

---

## 12. Comparação entre local e cloud

Preencha a tabela com uma captura de cada ambiente. Os valores abaixo são exemplos de estrutura, não resultados universais.

| Informação | Execução local | Execução no Render | Interpretação |
|---|---:|---:|---|
| Hostname | preencher | preencher | Identifica ambientes diferentes. |
| Plataforma | preencher | preencher | Pode ser `win32`, `darwin` ou `linux` localmente; o Render normalmente executa Linux. |
| Arquitetura | preencher | preencher | Depende da arquitetura disponibilizada ao processo. |
| CPUs | preencher | preencher | Representa CPUs lógicas visíveis, não necessariamente o total físico do provedor. |
| Memória total | preencher | preencher | O cloud pode apresentar uma quantidade limitada pela instância ou container. |
| Memória livre | preencher | preencher | Varia continuamente conforme os processos de cada ambiente. |
| Uptime | preencher | preencher | Mede o sistema hospedeiro, e não o tempo desde que a página foi aberta. |

Para uma comparação mais confiável, acesse cada ambiente duas ou três vezes e registre o horário. A memória livre pode mudar rapidamente. O uptime também pode mudar entre requisições.

### 12.1. Diferenças esperadas

A máquina local pode ter hostname personalizado, mais memória e uma quantidade diferente de CPUs. O Render executa o código em infraestrutura remota e virtualizada. Por isso, o hostname muda e os recursos exibidos correspondem ao ambiente de hospedagem.

A plataforma local depende do computador do estudante. No Render, a aplicação é executada em uma plataforma gerenciada, normalmente sobre Linux. A arquitetura e os limites de recursos dependem da configuração do serviço.

A memória livre não é uma medida de desempenho da aplicação. Ela descreve o estado momentâneo do ambiente inteiro visível ao processo. O valor pode variar devido ao sistema operacional, ao runtime, a outros serviços e ao ciclo de inicialização da plataforma.

---

## 13. Testes realizados

### Teste 1 — inicialização local

Comando:

```bash
npm start
```

Resultado esperado: o processo permanece ativo e informa a porta no terminal.

### Teste 2 — acesso à rota principal

URL:

```text
http://localhost:3000/
```

Resultado esperado: página HTML com todos os indicadores.

### Teste 3 — resposta HTTP

Comando:

```bash
curl -i http://localhost:3000/
```

Resultado esperado: status `200 OK`, tipo `text/html` e corpo contendo o título do monitor.

### Teste 4 — rota inexistente

URL:

```text
http://localhost:3000/nao-existe
```

Resultado esperado: erro `404 Not Found`.

### Teste 5 — deploy

URL:

```text
https://SEU-ENDERECO.onrender.com/
```

Resultado esperado: mesma estrutura HTML da execução local, mas com dados do ambiente cloud.

### Teste 6 — atualização dos dados

Atualize a página algumas vezes. Memória livre e uptime podem variar. Essa variação confirma que as consultas são realizadas no processamento de cada requisição.

---

## 14. Problemas comuns e correções

### `Cannot find module 'express'`

Execute:

```bash
npm install
```

Verifique se o comando foi executado dentro da pasta que contém `package.json`.

### Porta já utilizada

No Linux ou macOS:

```bash
PORT=3001 npm start
```

No PowerShell:

```powershell
$env:PORT=3001
npm start
```

Acesse a nova porta:

```text
http://localhost:3001/
```

### O Render não inicia a aplicação

Confira:

- se o repositório contém `package.json`;
- se o Start Command é `npm start` ou `node index.js`;
- se `index.js` está na raiz;
- se o código usa `process.env.PORT || 3000`;
- os logs de build e de execução.

### O serviço inicia, mas a URL não responde

Verifique se o processo está escutando na porta fornecida pelo Render. O código correto precisa utilizar a variável `PORT`; não deve fixar somente a porta `3000`.

### A página cloud mostra valores diferentes

Isso é esperado. Os valores pertencem ao sistema operacional hospedeiro do serviço cloud, não à máquina local que acessa a URL.

---

## 15. Melhorias futuras

O projeto possui dashboard responsivo, API JSON, health check, atualização automática, uso real de CPU por delta, memória do processo Node.js e CORS com múltiplas origens. Como extensões futuras, podem ser adicionados histórico em banco de dados, autenticação, alertas, logs estruturados, testes automatizados e coleta distribuída.

---

## 16. Conclusão

O projeto `cloud-so-app` demonstra como uma aplicação backend simples pode expor informações do sistema operacional através de HTTP. O Node.js fornece acesso às informações por meio do módulo nativo `os`, enquanto o Express organiza a rota e envia a resposta ao navegador.

A execução local evidencia a relação entre processo, CPU, memória e sistema operacional hospedeiro. A publicação no Render acrescenta os conceitos de virtualização, plataforma como serviço e computação em nuvem. Depois do deploy, o código continua essencialmente o mesmo, mas é executado em outro ambiente operacional, com outros limites de CPU, memória, hostname e uptime.

A principal conclusão experimental é que a aplicação mede o ambiente do servidor. O dispositivo do usuário apenas envia a requisição e exibe a resposta. Assim, a comparação local/cloud não compara diretamente o notebook com a nuvem pelo navegador; ela compara dois sistemas hospedeiros diferentes executando o mesmo processo Node.js.

---

## 17. Checklist de entrega

- [ ] Node.js instalado e validado com `node --version`.
- [ ] Projeto criado com o nome `cloud-so-app`.
- [ ] `express` instalado.
- [ ] `cors` instalado, quando solicitado pela atividade.
- [ ] `index.js` criado com as consultas do módulo `os`.
- [ ] Script `npm start` configurado.
- [ ] Aplicação testada em `http://localhost:3000/`.
- [ ] Rota inexistente testada com resposta `404`.
- [ ] Repositório criado no GitHub.
- [ ] Código enviado para a branch `main`.
- [ ] Web Service criado no Render.
- [ ] Start Command configurado como `npm start` ou `node index.js`.
- [ ] URL pública testada.
- [ ] Tabela local/cloud preenchida com os valores observados.
- [ ] Observações de processos, memória, CPU, virtualização e cloud registradas.
- [ ] Este manual salvo no repositório da disciplina.

---

## Referências essenciais

1. [1] [Node.js OS module](https://nodejs.org/api/os.html)
2. [2] [Express.js documentation](https://expressjs.com/)
3. [3] [Deploy Node.js and Express on Render](https://render.com/docs/deploy-node-express-app)
4. [4] [NIST cloud computing definition](https://csrc.nist.gov/pubs/sp/800/145/final)

**Projeto:** `cloud-so-app`  
**Documento principal:** Manual técnico de desenvolvimento, testes e publicação.

> Antes da entrega, substitua `SEU_USUARIO` e `SEU-ENDERECO` pelos dados reais do GitHub e do Render. Preencha também a tabela de comparação com as medições do computador local e do serviço publicado.
