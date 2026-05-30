'use strict';

const Game = (() => {
  let player = null;
  let eventActive = false;
  let fujokuVisits = 0;
  let aiTimer = null;      // auto-click interval
  let aiRunEnd = 0;        // timestamp when current AI run ends

  // ── 风俗店故事序列 ────────────────────────────────────────
  const FUJOKU_STORIES = [
    {
      isStory: true, storyTitle: '电梯里的她（一）', storyEmoji: '🏩',
      text: '电梯门打开的时候，你们同时愣了一下。\n\n她比照片里更普通，穿着便服，抱着一个包，\n像是刚下班的OL。\n\n你知道她是谁。她不知道你是谁。\n楼层数字往上走，你们保持着陌生人的距离。',
      choices: [{ label: '什么都没说，盯着门', reply: '她先出了电梯，你跟在后面，走进了同一扇门。\n她转过身，愣了两秒，然后职业性地笑了。\n"啊，是您。"\n你不知道该说什么，也笑了。', changes: {}, tone: 'neutral' }],
    },
    {
      isStory: true, storyTitle: '电梯里的她（二）', storyEmoji: '🏩',
      text: '洗完澡，她没有说话，\n只是侧躺过来，把头靠在你旁边。\n\n像一只猫。\n\n你低下头，吻了她。\n是真的吻，不是那种。\n她没有躲。',
      choices: [{ label: '什么都没说', reply: '这是你来东京以来第一次觉得不孤独。\n你知道这不是真的。\n但今晚不想在意这些。', changes: { happiness: 15 }, tone: 'good' }],
    },
    {
      isStory: true, storyTitle: '她的LINE', storyEmoji: '💬',
      text: '出门前你问她能不能加LINE。\n她把二维码给你扫了。\n\n此后偶尔会有消息。\n"下周四有出勤哦～"  一个笑脸。\n\n她在演戏。你当真了。\n你知道你当真了。\n你没有办法。',
      choices: [
        { label: '回复了一个笑脸', reply: '她秒回了一个"✨"。\n你看着这个符号很久。', changes: { happiness: -5 }, tone: 'neutral' },
        { label: '没有回复，把手机放下', reply: '你知道有些事看清楚了就别再看了。\n你还是留着那条LINE。', changes: { happiness: -10 }, tone: 'bad' },
      ],
    },
  ];

  // ── init ─────────────────────────────────────────────────
  function init() {
    UI.updateClock();
    setInterval(UI.updateClock, 1000);
    if (Save.hasSave()) document.getElementById('btn-continue').disabled = false;

    document.getElementById('btn-new').addEventListener('click', () => UI.show('create'));
    document.getElementById('btn-continue').addEventListener('click', () => {
      const d = Save.read(); if (d) loadGame(d);
    });
    document.getElementById('btn-export').addEventListener('click', () => {
      const c = Save.exportCode();
      if (!c) return UI.toast('没有存档');
      navigator.clipboard.writeText(c).then(
        () => UI.toast('存档码已复制 ✓'),
        () => prompt('复制存档码：', c)
      );
    });
    document.getElementById('btn-import').addEventListener('click', () => {
      const c = prompt('粘贴存档码：');
      if (c && Save.importCode(c)) { UI.toast('导入成功 ✓'); loadGame(Save.read()); }
      else if (c) UI.toast('存档码无效');
    });
    document.getElementById('btn-start-game').addEventListener('click', startNew);
    document.getElementById('player-name-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') startNew();
    });
  }

  // ── new / load ────────────────────────────────────────────
  function startNew() {
    const name = document.getElementById('player-name-input').value.trim();
    const err  = document.getElementById('create-error');
    if (!name) { err.textContent = '请输入名字'; err.classList.remove('hidden'); return; }
    if (Save.hasSave() && !confirm('已有存档，确定覆盖？')) return;
    err.classList.add('hidden');
    player = new Player(name);
    enterGame();
  }

  function loadGame(data) {
    player = Player.fromJSON(data);
    fujokuVisits = data.fujokuVisits || 0;
    enterGame();
  }

  // ── enter game ────────────────────────────────────────────
  function enterGame() {
    UI.show('game');
    renderShops();
    startLoop();
    bindGameButtons();

    // click button
    document.getElementById('btn-click').addEventListener('click', handleClick);
  }

  function bindGameButtons() {
    document.getElementById('btn-stories').addEventListener('click', () => {
      UI.showStories(player.storyLog || []);
    });
    document.getElementById('btn-save').addEventListener('click', () => {
      save(); UI.toast('存档完成 ✓');
    });
    document.getElementById('btn-to-title').addEventListener('click', () => {
      save(); UI.show('title');
    });
  }

  // ── main loop ─────────────────────────────────────────────
  function startLoop() {
    // tick every second
    setInterval(() => {
      player.tick();
      UI.updateStats(player);
      renderShops();
      checkEvent();
      checkMarketEvent();
    }, 1000);

    // auto-save every 60s
    setInterval(() => { save(); UI.toast('自动存档 ✓', 1200); }, 60000);

    // market fluctuation every 5-15 min
    scheduleMarket();
  }

  // ── click ─────────────────────────────────────────────────
  function handleClick() {
    if (player.energy < 1) { UI.toast('体力耗尽，先去休息吧'); return; }
    const earned = player.click();
    UI.spawnFloat(earned);
    UI.updateStats(player);
  }

  // ── shops ─────────────────────────────────────────────────
  function renderShops() {
    UI.renderInvestShop(player, key => {
      if (player.buyInvestment(key)) {
        const inv = INVESTMENTS[key];
        UI.appendLog(`买入 ${inv.emoji} ${inv.label}`, 'good');
        UI.toast(`购入 ${inv.label} ✓`);
        UI.updateStats(player);
        renderShops();
        save();
      } else {
        UI.toast('余额不足');
      }
    });

    UI.renderUpgradeShop(player, type => {
      if (type === 'ai') { showAIConfig(); return; }
      const result = player.buyTierUpgrade(type);
      if (result) {
        UI.appendLog(`${result.emoji} 升级为 ${result.label}`, 'good');
        UI.toast(`${result.label} ✓`);
        resetAITimer();
        UI.updateStats(player);
        renderShops();
        save();
      } else {
        UI.toast('余额不足');
      }
    });

    UI.renderLifeShop(player, id => {
      if (id === 'fujoku') { buyFujoku(); return; }
      const item = SHOP_ITEMS.find(s => s.id === id);
      if (!item) return;
      if (!player.canAfford(item.cost)) { UI.toast('余额不足'); return; }
      if (!player.canUseShop(id, item.cooldown)) { UI.toast('冷却中，稍后再来'); return; }
      player.buyShopItem(id);
      UI.appendLog(`${item.emoji} ${item.reply || item.label}`, item.tone);
      UI.toast(`${item.emoji} ${item.label}`);
      UI.updateStats(player);
      renderShops();
      save();
    });
  }

  // ── 风俗店购买 → 触发故事事件 ────────────────────────────
  function buyFujoku() {
    const item = SHOP_ITEMS.find(s => s.id === 'fujoku');
    if (!player.canAfford(item.cost)) { UI.toast('余额不足'); return; }
    player.money    -= item.cost;
    player.happiness = clamp(player.happiness + 40, 0, 100);
    player.health    = clamp(player.health    - 3,  0, 100);

    const story = FUJOKU_STORIES[fujokuVisits % FUJOKU_STORIES.length];
    fujokuVisits++;
    player.fujokuVisits = fujokuVisits;

    eventActive = true;
    UI.showEventPopup(story, choice => {
      player.modify(choice.changes || {});
      if (story.isStory) {
        player.addStory({ title: story.storyTitle, emoji: story.storyEmoji, text: story.text, reply: choice.reply || '', tone: choice.tone });
        UI.showStoryBadge(player.storyLog.length);
      }
      UI.appendLog('🏩 ' + (choice.reply || '').split('\n')[0], choice.tone);
      UI.updateStats(player);
      renderShops();
      save();
      eventActive = false;
      player.scheduleNextEvent();
    });
  }

  // ── 随机事件 ─────────────────────────────────────────────
  function checkEvent() {
    if (eventActive) return;
    if (Date.now() < player.nextEventAt) return;
    eventActive = true;
    const event = getRandomEvent();
    UI.showEventPopup(event, choice => {
      player.modify(choice.changes || {});
      if (event.isStory) {
        player.addStory({ title: event.storyTitle, emoji: event.storyEmoji, text: event.text, reply: choice.reply || '', tone: choice.tone });
        UI.showStoryBadge(player.storyLog.length);
      }
      UI.appendLog((choice.reply || event.text).split('\n')[0], choice.tone);
      UI.updateStats(player);
      renderShops();
      save();
      eventActive = false;
      player.scheduleNextEvent();
    });
  }

  // ── 市场波动 ─────────────────────────────────────────────
  let marketTimer = null;
  function scheduleMarket() {
    clearTimeout(marketTimer);
    const delay = 5 * 60000 + Math.random() * 10 * 60000; // 5-15分钟
    marketTimer = setTimeout(() => { triggerMarketEvent(); scheduleMarket(); }, delay);
  }

  function checkMarketEvent() {} // handled by scheduleMarket

  function triggerMarketEvent() {
    const ev = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    if (ev.affects === 'all') {
      player.market.bonds  = clamp2(player.market.bonds  * ev.mult, 0.2, 3.0);
      player.market.stocks = clamp2(player.market.stocks * ev.mult, 0.2, 3.0);
      player.market.btc    = clamp2(player.market.btc    * ev.mult, 0.05, 5.0);
    } else {
      player.market[ev.affects] = clamp2(player.market[ev.affects] * ev.mult,
        ev.affects === 'btc' ? 0.05 : 0.2,
        ev.affects === 'btc' ? 5.0  : 3.0
      );
    }
    // 比特币归零事件（极低概率）
    if (ev.affects === 'btc' && player.market.btc < 0.1 && player.portfolio.btc > 0) {
      UI.appendLog('₿ 比特币崩盘！你的持仓几乎归零。', 'bad');
    }
    UI.showMarketNews(ev.text, ev.tone);
    UI.updateStats(player);
  }

  // ── AI 配置弹窗 ───────────────────────────────────────────
  const AI_TOKEN_COST = { 1: 40, 2: 120, 3: 400 }; // ¥/sec 每级 token 消耗
  const AI_EARN_RATE  = { 1: 80, 2: 250, 3: 1000}; // ¥/sec 每级产出（基于 clickValue）

  function showAIConfig() {
    const level = (player.tierLevels && player.tierLevels.ai) || 0;
    if (level === 0) { UI.toast('请先购买 AI 助手升级'); return; }

    const tierDef   = AI_TIERS.find(t => t.level === level);
    const costPerSec = AI_TOKEN_COST[level];
    const earnPerSec = AI_EARN_RATE[level];
    const netPerSec  = earnPerSec - costPerSec;

    const durations = [
      { label: '1 小时',  secs: 3600 },
      { label: '4 小时',  secs: 14400 },
      { label: '8 小时',  secs: 28800 },
      { label: '24 小时', secs: 86400 },
    ];

    // 构建弹窗 HTML
    const popup = document.createElement('div');
    popup.className = 'ai-config-overlay';
    popup.innerHTML = `
      <div class="ai-config-box">
        <div class="ai-config-title neon-cyan">── ${tierDef.emoji} ${tierDef.label} ──</div>
        <div class="ai-config-desc">${tierDef.desc}</div>
        <div class="ai-config-stats">
          <div><span class="dim">Token 消耗：</span><span class="neon-pink">${fmtMoney(costPerSec)}/sec</span></div>
          <div><span class="dim">代码产出：</span><span class="neon-green">${fmtMoney(earnPerSec)}/sec</span></div>
          <div><span class="dim">净收益：</span><span class="neon-green">+${fmtMoney(netPerSec)}/sec</span></div>
        </div>
        <div class="ai-config-label dim">选择运行时长：</div>
        <div class="ai-duration-list">
          ${durations.map(d => {
            const totalCost   = costPerSec * d.secs;
            const totalEarn   = earnPerSec * d.secs;
            const profit      = totalEarn - totalCost;
            const canAfford   = player.money >= totalCost;
            return `<button class="ai-dur-btn ${canAfford ? '' : 'disabled'}" data-secs="${d.secs}" data-cost="${totalCost}">
              <span class="dur-label">${d.label}</span>
              <span class="dur-cost dim">消耗 ${fmtMoney(totalCost)}</span>
              <span class="dur-profit neon-green">+${fmtMoney(profit)}</span>
            </button>`;
          }).join('')}
        </div>
        <button class="menu-btn secondary small" id="ai-config-close">[ 取消 ]</button>
      </div>`;

    document.body.appendChild(popup);
    popup.querySelector('#ai-config-close').addEventListener('click', () => popup.remove());

    popup.querySelectorAll('.ai-dur-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const secs = parseInt(btn.dataset.secs);
        const cost = parseFloat(btn.dataset.cost);
        popup.remove();
        startAIRun(level, secs, cost);
      });
    });
  }

  function startAIRun(level, secs, cost) {
    if (!player.canAfford(cost)) { UI.toast('余额不足'); return; }
    player.money -= cost;
    aiRunEnd = Date.now() + secs * 1000;
    player.aiRunEnd = aiRunEnd;
    resetAITimer();
    UI.appendLog(`🤖 AI 开始运行，时长 ${Math.round(secs/3600)} 小时`, 'good');
    UI.toast(`AI 运行中 ✓`);
    save();
  }

  function resetAITimer() {
    clearInterval(aiTimer);
    aiTimer = null;
    const level = (player.tierLevels && player.tierLevels.ai) || 0;
    const now   = Date.now();
    const runEnd = player.aiRunEnd || 0;
    if (level === 0 || now >= runEnd) return;

    const tierDef = AI_TIERS.find(t => t.level === level);
    if (!tierDef) return;

    aiTimer = setInterval(() => {
      if (Date.now() >= (player.aiRunEnd || 0)) {
        clearInterval(aiTimer);
        aiTimer = null;
        UI.appendLog('🤖 AI 运行结束', 'neutral');
        UI.toast('AI 运行结束');
        return;
      }
      // AI 自动点击（不消耗体力）
      const earned = Math.floor(AI_EARN_RATE[level] * (tierDef.autoClickInterval / 1000));
      player.money       += earned;
      player.totalEarned += earned;
      UI.spawnFloat(earned);
      UI.updateStats(player);
    }, tierDef.autoClickInterval);
  }

  // ── save ─────────────────────────────────────────────────
  function save() {
    if (player) Save.write({ ...player.toJSON(), fujokuVisits });
  }

  return { init };
})();

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function clamp2(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

document.addEventListener('DOMContentLoaded', () => Game.init());
