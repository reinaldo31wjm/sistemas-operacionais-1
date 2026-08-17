/**
 * Kernel Workstation & Simulator v3.5
 * Core Architecture & Scheduler Implementation
 */

// Global Constants & State
const RAM_TOTAL_BLOCKS = 16;
const ramState = new Array(RAM_TOTAL_BLOCKS).fill(null); // Contém PID ou null
let processQueue = [];
let pidSequence = 2000;
let isCpuBusy = false;
let contextSwitchesCount = 0;

const taskNames = [
  'sys_calc', 'http_server', 'disk_writer', 
  'crypto_worker', 'gui_render', 'db_query', 'net_buffer'
];

// DOM Element References
let procTableBody;
let memoryMapEl;
let terminalLog;
let algorithmSelect;
let speedSelect;

// Initialize Workspace on Page Load
document.addEventListener('DOMContentLoaded', () => {
  procTableBody = document.getElementById('procTableBody');
  memoryMapEl = document.getElementById('memoryMap');
  terminalLog = document.getElementById('terminalLog');
  algorithmSelect = document.getElementById('algorithmSelect');
  speedSelect = document.getElementById('speedSelect');

  initMemoryGrid();
  startSystemClock();
  startMetricsLoop();

  // Event Listeners
  document.getElementById('addProcBtn').addEventListener('click', createProcess);
  document.getElementById('clearLogsBtn').addEventListener('click', clearTerminal);
});

// System Clock
function startSystemClock() {
  const clockEl = document.getElementById('systemClock');
  setInterval(() => {
    const now = new Date();
    if (clockEl) {
      clockEl.innerText = now.toLocaleTimeString();
    }
  }, 1000);
}

// Memory Page Grid Initialization
function initMemoryGrid() {
  if (!memoryMapEl) return;
  memoryMapEl.innerHTML = '';
  for (let i = 0; i < RAM_TOTAL_BLOCKS; i++) {
    const block = document.createElement('div');
    block.className = 'mem-block';
    block.id = `mem-block-${i}`;
    block.innerHTML = `<span>B${i}</span><strong id="mem-pid-${i}">-</strong>`;
    memoryMapEl.appendChild(block);
  }
}

// Terminal Logging System
function writeLog(msg, type = 'info') {
  if (!terminalLog) return;
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = 'term-line';
  
  if (type === 'error') line.style.color = 'var(--danger)';
  if (type === 'warn') line.style.color = 'var(--warning)';
  if (type === 'success') line.style.color = 'var(--success)';

  line.innerHTML = `<span class="term-time">[${time}]</span> ${msg}`;
  terminalLog.appendChild(line);
  terminalLog.scrollTop = terminalLog.scrollHeight;
}

function clearTerminal() {
  if (terminalLog) {
    terminalLog.innerHTML = '';
    writeLog('Log do terminal limpo pelo operador.');
  }
}

// Memory Allocation (Paging)
function allocateRAM(pid, blocksNeeded) {
  const freeIndexes = [];
  for (let i = 0; i < RAM_TOTAL_BLOCKS; i++) {
    if (ramState[i] === null) freeIndexes.push(i);
  }

  if (freeIndexes.length < blocksNeeded) return null;

  const allocated = freeIndexes.slice(0, blocksNeeded);
  allocated.forEach(idx => {
    ramState[idx] = pid;
    const el = document.getElementById(`mem-block-${idx}`);
    if (el) {
      el.classList.add('allocated');
      document.getElementById(`mem-pid-${idx}`).innerText = `P${pid}`;
    }
  });

  updateRamMetrics();
  return allocated;
}

function freeRAM(pid) {
  for (let i = 0; i < RAM_TOTAL_BLOCKS; i++) {
    if (ramState[i] === pid) {
      ramState[i] = null;
      const el = document.getElementById(`mem-block-${i}`);
      if (el) {
        el.classList.remove('allocated');
        document.getElementById(`mem-pid-${i}`).innerText = '-';
      }
    }
  }
  updateRamMetrics();
}

function updateRamMetrics() {
  const used = ramState.filter(x => x !== null).length;
  const ramVal = document.getElementById('ramVal');
  const ramBar = document.getElementById('ramBar');
  
  if (ramVal) ramVal.innerText = `${used} / ${RAM_TOTAL_BLOCKS} Blk`;
  if (ramBar) {
    const pct = ((used / RAM_TOTAL_BLOCKS) * 100).toFixed(0);
    ramBar.style.width = `${pct}%`;
  }
}

// Process Creation
function createProcess() {
  const pid = pidSequence++;
  const name = taskNames[Math.floor(Math.random() * taskNames.length)];
  const ramNeeded = Math.floor(Math.random() * 3) + 1; // 1 a 3 blocos
  const duration = Math.floor(Math.random() * 4) + 3; // 3 a 6 segundos

  const blocks = allocateRAM(pid, ramNeeded);
  if (!blocks) {
    writeLog(`ERRO DE ALOCAÇÃO: RAM insuficiente para PID ${pid} (${name}).`, 'error');
    return;
  }

  const proc = {
    pid,
    name,
    ramBlocks: ramNeeded,
    duration,
    remainingTime: duration,
    status: 'READY',
    progress: 0
  };

  processQueue.push(proc);
  writeLog(`Processo criado PID ${pid} (${name}) [Burst: ${duration}s, RAM: ${ramNeeded} Blk]`, 'success');

  appendProcessRow(proc);
  updateProcMetrics();
  runScheduler();
}

// PCB Table DOM Injection
function appendProcessRow(proc) {
  if (!procTableBody) return;
  const tr = document.createElement('tr');
  tr.id = `proc-row-${proc.pid}`;
  tr.innerHTML = `
    <td><strong>${proc.pid}</strong></td>
    <td>${proc.name}</td>
    <td id="proc-status-${proc.pid}"><span class="badge badge-ready">PRONTO</span></td>
    <td>${proc.ramBlocks} Blk</td>
    <td>${proc.duration}s</td>
    <td>
      <div class="proc-bar-wrap">
        <div class="proc-bar-fill" id="proc-bar-${proc.pid}"></div>
      </div>
      <span id="proc-pct-${proc.pid}">0%</span>
    </td>
    <td><button class="btn-kill" onclick="killProcess(${proc.pid})">Matar</button></td>
  `;
  procTableBody.appendChild(tr);
}

function updateProcDOM(proc) {
  const statusTd = document.getElementById(`proc-status-${proc.pid}`);
  const barFill = document.getElementById(`proc-bar-${proc.pid}`);
  const pctTxt = document.getElementById(`proc-pct-${proc.pid}`);

  if (!statusTd) return;

  if (proc.status === 'RUNNING') {
    statusTd.innerHTML = `<span class="badge badge-running">EXECUTANDO</span>`;
  } else if (proc.status === 'DONE') {
    statusTd.innerHTML = `<span class="badge badge-done">CONCLUÍDO</span>`;
  } else if (proc.status === 'KILLED') {
    statusTd.innerHTML = `<span class="badge badge-killed">ABORTADO</span>`;
  } else if (proc.status === 'READY') {
    statusTd.innerHTML = `<span class="badge badge-ready">PRONTO</span>`;
  }

  if (barFill) barFill.style.width = `${proc.progress}%`;
  if (pctTxt) pctTxt.innerText = `${proc.progress}%`;
}

function killProcess(pid) {
  const proc = processQueue.find(p => p.pid === pid);
  if (proc && (proc.status === 'READY' || proc.status === 'RUNNING')) {
    proc.status = 'KILLED';
    freeRAM(pid);
    updateProcDOM(proc);
    writeLog(`SIGKILL enviado. PID ${pid} terminado e RAM desalocada.`, 'warn');
    updateProcMetrics();
  }
}

// CPU Scheduler Core Logic
async function runScheduler() {
  if (isCpuBusy) return;

  const algo = algorithmSelect.value;
  const multiplier = parseFloat(speedSelect.value) || 1;

  // Seleção do processo dependendo do algoritmo
  let nextProc = null;

  if (algo === 'SJF') {
    // Shortest Job First: pega o menor restante pronto
    const readyProcs = processQueue.filter(p => p.status === 'READY');
    readyProcs.sort((a, b) => a.remainingTime - b.remainingTime);
    nextProc = readyProcs[0] || null;
  } else {
    // FCFS e Round Robin pegam o primeiro READY da fila
    nextProc = processQueue.find(p => p.status === 'READY');
  }

  if (!nextProc) {
    isCpuBusy = false;
    document.getElementById('cpuVal').innerText = '0%';
    document.getElementById('cpuBar').style.width = '0%';
    return;
  }

  isCpuBusy = true;
  contextSwitchesCount++;
  document.getElementById('contextSwitchesVal').innerText = contextSwitchesCount;

  document.getElementById('cpuVal').innerText = '92%';
  document.getElementById('cpuBar').style.width = '92%';

  nextProc.status = 'RUNNING';
  updateProcDOM(nextProc);
  writeLog(`Troca de Contexto -> CPU alocada para PID ${nextProc.pid} [${algo}]`);

  if (algo === 'FCFS' || algo === 'SJF') {
    const totalSteps = 40;
    const stepTime = ((nextProc.duration * 1000) / totalSteps) / multiplier;

    for (let i = 1; i <= totalSteps; i++) {
      if (nextProc.status === 'KILLED') break;
      await new Promise(r => setTimeout(r, stepTime));
      nextProc.progress = Math.floor((i / totalSteps) * 100);
      updateProcDOM(nextProc);
    }

    if (nextProc.status !== 'KILLED') {
      nextProc.status = 'DONE';
      freeRAM(nextProc.pid);
      updateProcDOM(nextProc);
      writeLog(`PID ${nextProc.pid} finalizado.`);
    }
  } 
  else if (algo === 'RR') {
    const quantum = 2; // 2s quantum
    const timeToRun = Math.min(nextProc.remainingTime, quantum);
    const steps = 20;
    const stepTime = ((timeToRun * 1000) / steps) / multiplier;

    for (let i = 1; i <= steps; i++) {
      if (nextProc.status === 'KILLED') break;
      await new Promise(r => setTimeout(r, stepTime));
      
      nextProc.remainingTime -= (timeToRun / steps);
      const executedPct = ((nextProc.duration - Math.max(0, nextProc.remainingTime)) / nextProc.duration) * 100;
      nextProc.progress = Math.min(100, Math.floor(executedPct));
      updateProcDOM(nextProc);
    }

    if (nextProc.status !== 'KILLED') {
      if (nextProc.remainingTime <= 0.1) {
        nextProc.status = 'DONE';
        freeRAM(nextProc.pid);
        updateProcDOM(nextProc);
        writeLog(`PID ${nextProc.pid} totalmente concluído no Round Robin.`);
      } else {
        nextProc.status = 'READY';
        updateProcDOM(nextProc);
        writeLog(`Estouro de Quantum para PID ${nextProc.pid}. Retornando à fila.`, 'warn');
        // Preempção: move para final da fila
        processQueue.push(processQueue.splice(processQueue.indexOf(nextProc), 1)[0]);
      }
    }
  }

  updateProcMetrics();
  isCpuBusy = false;
  setTimeout(runScheduler, 150 / multiplier);
}

// Update Process Metrics
function updateProcMetrics() {
  const active = processQueue.filter(p => p.status === 'READY' || p.status === 'RUNNING').length;
  document.getElementById('procCountVal').innerText = active;
  const pct = Math.min(100, active * 20);
  document.getElementById('procBar').style.width = `${pct}%`;
}

// Background System Metrics Simulation
function startMetricsLoop() {
  setInterval(() => {
    if (!isCpuBusy) {
      const idleCpu = Math.floor(Math.random() * 4);
      document.getElementById('cpuVal').innerText = `${idleCpu}%`;
      document.getElementById('cpuBar').style.width = `${idleCpu}%`;
    }
  }, 1200);
}
