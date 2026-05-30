'use strict';
const UI = (() => {

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
  }

  // ── typewriter ────────────────────────────────────────────
  let _tw = null;
  function typewrite(el, text, speed = 24, onDone) {
    if (_tw) clearTimeout(_tw);
    el.textContent = '';
    let i = 0;
    function tick() {
      if (i < text.length) {
        el.textContent = text.slice(0, ++i) + '█';
        _tw = setTimeout(tick, speed);
      } else {
        el.textContent = text;
        if (onDone) onDone();
      }
    }
    tick();
  }

  // ── stats ─────────────────────────────────────────────────
  function updateStats(player) {
    setText('hdr-name',    player.name);
    setText('hdr-title',   player.title);
    setText('hdr-day',     player.day);
    setText('hdr-company', player.company);
    setBar('bar-energy',    player.energy);
    setBar('bar-health',    player.health);
    setBar('bar-happiness', player.happiness);
    setBar('bar-work',      player.work);
    setText('val-energy',    player.energy);
    setText('val-health',    player.health);
    setText('val-happiness', player.happiness);
    setText('val-work',      player.work);
    setText('val-savings',   '¥ ' + player.savings.toLocaleString());
    setText('val-salary',    '¥ ' + player.salary.toLocaleString());
  }

  function setBar(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    const pct = Math.max(0, Math.min(100, val));
    el.style.width = pct + '%';
    el.style.filter = pct <= 20 ? 'hue-rotate(200deg) brightness(1.3)'
                    : pct <= 40 ? 'hue-rotate(80deg) brightness(1.1)'
                    : '';
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── phase indicators ──────────────────────────────────────
  function updatePhaseIndicators(player) {
    const phases = ['morning', 'work', 'evening', 'night'];
    const labels  = { morning: '朝の通勤', work: '業務中', evening: '夜の部', night: '深夜' };
    const today   = tokyoDateStr();
    const claimed = player.claimedPhases[today] || [];
    const active  = currentPhase();
    const el = document.getElementById('phase-indicators');
    if (!el) return;
    el.innerHTML = phases.map(p => {
      const done  = claimed.includes(p);
      const cur   = !done && p === active;
      const cls   = done ? 'done' : cur ? 'active' : '';
      return `<div class="phase-item ${cls}">
        <div class="phase-dot"></div>
        <span>${labels[p]}</span>
      </div>`;
    }).join('');
  }

  // ── clock ─────────────────────────────────────────────────
  function updateClock() {
    const jst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const hh  = String(jst.getHours()).padStart(2, '0');
    const mm  = String(jst.getMinutes()).padStart(2, '0');
    const ss  = String(jst.getSeconds()).padStart(2, '0');
    const phaseNames = { morning: '朝', work: '業務中', evening: '夜', night: '深夜' };
    const phaseTags  = { morning: '── 通勤 · 朝 ──', work: '── 業務中 ──', evening: '── 夜の部 ──', night: '── 深夜 ──' };
    const phase = currentPhase();
    setText('hdr-clock', `${hh}:${mm}`);
    setText('hdr-phase', ` [${phaseNames[phase]}]`);
    setText('event-phase-tag', phaseTags[phase]);
    setText('title-clock', `${hh}:${mm}:${ss}`);
  }

  // ── choices ───────────────────────────────────────────────
  function renderChoices(choices, onPick) {
    const area = document.getElementById('choice-area');
    area.innerHTML = '';
    const list = (choices && choices.length) ? choices
      : [{ label: '── 继续 ──', reply: '', changes: {}, tone: 'neutral' }];
    list.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = c.label;
      btn.addEventListener('click', () => { area.innerHTML = ''; onPick(c); });
      area.appendChild(btn);
    });
  }

  // ── log ───────────────────────────────────────────────────
  function appendLog(text, tone) {
    const log = document.getElementById('event-log');
    if (!log) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${tone}`;
    entry.innerHTML = `<span class="log-time">${tokyoTimeStr()}</span>${text.split('\n')[0]}`;
    log.prepend(entry);
    while (log.children.length > 10) log.removeChild(log.lastChild);
  }

  function clearLog() {
    const el = document.getElementById('event-log');
    if (el) el.innerHTML = '';
  }

  // ── toast ─────────────────────────────────────────────────
  let _toastEl = null;
  let _toastT  = null;
  function toast(msg, ms = 2200) {
    if (!_toastEl) {
      _toastEl = document.createElement('div');
      _toastEl.className = 'toast';
      document.body.appendChild(_toastEl);
    }
    _toastEl.textContent = msg;
    _toastEl.classList.add('show');
    clearTimeout(_toastT);
    _toastT = setTimeout(() => _toastEl.classList.remove('show'), ms);
  }

  return { show, typewrite, updateStats, updatePhaseIndicators, updateClock, renderChoices, appendLog, clearLog, toast };
})();
