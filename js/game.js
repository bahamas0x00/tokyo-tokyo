'use strict';

const Game = (() => {
  let player = null;
  let locked = false;
  let autoSaveTimer = null;

  // ── init ──────────────────────────────────────────────────
  function init() {
    UI.updateClock();
    setInterval(UI.updateClock, 1000);

    bindTitle();
    bindCreate();
    bindGame();

    if (Save.hasSave()) {
      document.getElementById('btn-continue').disabled = false;
    }
  }

  // ── title ─────────────────────────────────────────────────
  function bindTitle() {
    document.getElementById('btn-new').addEventListener('click', () => UI.show('create'));
    document.getElementById('btn-continue').addEventListener('click', () => {
      const data = Save.read();
      if (data) loadGame(data);
    });
    document.getElementById('btn-export').addEventListener('click', () => {
      const code = Save.exportCode();
      if (!code) return UI.toast('没有存档可导出');
      navigator.clipboard.writeText(code).then(
        () => UI.toast('存档码已复制到剪贴板 ✓'),
        () => prompt('复制这段存档码：', code)
      );
    });
    document.getElementById('btn-import').addEventListener('click', () => {
      const code = prompt('粘贴存档码：');
      if (!code) return;
      if (Save.importCode(code)) {
        UI.toast('存档导入成功 ✓');
        const data = Save.read();
        if (data) { loadGame(data); }
      } else {
        UI.toast('存档码无效');
      }
    });
  }

  // ── create ────────────────────────────────────────────────
  function bindCreate() {
    document.getElementById('btn-start-game').addEventListener('click', startNew);
    document.getElementById('player-name-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') startNew();
    });
  }

  function startNew() {
    const input = document.getElementById('player-name-input');
    const name  = input.value.trim();
    const err   = document.getElementById('create-error');
    if (!name) {
      err.textContent = '请输入你的名字。';
      err.classList.remove('hidden');
      return;
    }
    if (Save.hasSave() && !confirm('已有存档，确定覆盖吗？')) return;
    err.classList.add('hidden');
    player = new Player(name);
    saveGame();
    enterGame();
  }

  // ── load ──────────────────────────────────────────────────
  function loadGame(data) {
    player = Player.fromJSON(data);
    enterGame();
    UI.clearLog();
    player.eventLog.forEach(e => UI.appendLog(e.text, e.tone));
  }

  // ── enter game ────────────────────────────────────────────
  function enterGame() {
    UI.show('game');
    UI.updateStats(player);
    UI.updatePhaseIndicators(player);
    startAutoSave();
    showPhaseEvent();
  }

  // ── auto-save (Cookie Clicker style) ──────────────────────
  function startAutoSave() {
    clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
      saveGame();
      UI.toast('自动存档 ✓', 1200);
    }, 60000);
  }

  function saveGame() {
    if (player) Save.write(player.toJSON());
  }

  // ── game buttons ──────────────────────────────────────────
  function bindGame() {
    document.getElementById('btn-save').addEventListener('click', () => {
      saveGame();
      UI.toast('存档完成 ✓');
    });
    document.getElementById('btn-to-title').addEventListener('click', () => {
      saveGame();
      clearInterval(autoSaveTimer);
      UI.show('title');
      document.getElementById('btn-continue').disabled = false;
    });
  }

  // ── phase logic ───────────────────────────────────────────
  function showPhaseEvent() {
    const phase   = currentPhase();
    const textEl  = document.getElementById('event-text');
    const phaseTag = document.getElementById('event-phase-tag');
    const phaseNames = { morning: '── 通勤 · 朝 ──', work: '── 業務中 ──', evening: '── 夜の部 ──', night: '── 深夜 ──' };
    if (phaseTag) phaseTag.textContent = phaseNames[phase];

    if (player.hasClaimedPhase(phase)) {
      locked = false;
      UI.typewrite(textEl, waitMessage(phase), 18);
      document.getElementById('choice-area').innerHTML = '';
      return;
    }

    locked = true;
    const event = getEvent(phase);
    UI.typewrite(textEl, event.text, 22, () => {
      locked = false;
      UI.renderChoices(event.choices, choice => resolveChoice(phase, event, choice));
    });
  }

  function resolveChoice(phase, event, choice) {
    if (locked) return;
    locked = true;

    player.modify(choice.changes || {});
    player.claimPhase(phase);

    const logText = (choice.reply || event.text).split('\n')[0];
    const tone    = choice.tone || event.tone || 'neutral';
    player.addLog(logText, tone);

    const textEl = document.getElementById('event-text');

    if (choice.reply) {
      UI.typewrite(textEl, choice.reply, 22, () => {
        locked = false;
        UI.appendLog(logText, tone);
        UI.updateStats(player);
        UI.updatePhaseIndicators(player);
        saveGame();
        setTimeout(showPhaseEvent, 500);
      });
    } else {
      locked = false;
      UI.appendLog(logText, tone);
      UI.updateStats(player);
      UI.updatePhaseIndicators(player);
      saveGame();
      setTimeout(showPhaseEvent, 300);
    }
  }

  // ── wait message ──────────────────────────────────────────
  function waitMessage(phase) {
    const h  = tokyoHour();
    const hh = String(h).padStart(2, '0');
    const msgs = {
      morning: [
        `早晨的故事今天已经翻篇了。\n现在是东京时间 ${hh}:── \n等待下一个时段——业务中（09:00 JST）。`,
        `你已经出门了。\n${hh}:── JST，上班的路正在进行中。`,
      ],
      work: [
        `今天的工作时段已经处理完毕。\n${hh}:── JST——等待今晚 18:00 的夜の部。`,
        `已经撑过了今天的业务时间。\n东京时间 ${hh}:──，等待下班。`,
      ],
      evening: [
        `今晚的故事已经发生过了。\n${hh}:── JST——等待深夜时分（23:00）。`,
        `夜の部已结束。\n等待深夜降临。`,
      ],
      night: [
        `今天的最后一幕已经落幕。\n${hh}:── JST——等待明天早晨（06:00）的新一天。`,
        `睡吧，或者继续熬着——\n明天一样会来。`,
      ],
    };
    const pool = msgs[phase];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ── phase auto-refresh ────────────────────────────────────
  function watchPhase() {
    let last = currentPhase();
    setInterval(() => {
      const cur = currentPhase();
      if (cur !== last) {
        last = cur;
        if (player) showPhaseEvent();
      }
    }, 30000);
  }

  return { init, watchPhase };
})();

document.addEventListener('DOMContentLoaded', () => {
  Game.init();
  Game.watchPhase();
});
