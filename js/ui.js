'use strict';
const UI = (() => {

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
  }

  // ── stats ──────────────────────────────────────────────────
  function updateStats(p) {
    setText('hdr-name',       p.name);
    setText('hdr-title',      p.title);
    setText('hdr-day',        p.day);
    setText('hdr-clock',      tokyoTimeStr());
    setText('val-money',      fmtMoney(p.money));
    setText('val-total',      fmtMoney(p.totalEarned));
    setText('val-click',      '¥' + p.clickValue);
    setText('val-passive',    fmtMoney(p.passivePerSec) + '/s');
    setText('val-click-rate', '¥' + p.clickValue + '/CLICK');
    setBar('bar-energy',    p.energy);
    setBar('bar-health',    p.health);
    setBar('bar-happiness', p.happiness);
    setText('val-energy',    Math.floor(p.energy));
    setText('val-health',    Math.floor(p.health));
    setText('val-happiness', Math.floor(p.happiness));
    updateConfig(p);
    updatePortfolio(p, window._onSellCallback);
    updateMarket(p);
    updateTeamPanel(p);
  }

  // ── team panel ─────────────────────────────────────────────
  const KOHAI_STATUSES = ['バグ修正中…', 'コードレビュー', '資料作成中', 'ミーティング', '残業中…', 'お茶汲み'];
  const KOHAI_SVG = `<svg class="kohai-char" width="36" height="40" viewBox="0 0 9 10" style="image-rendering:pixelated">
    <rect x="2" y="0" width="5" height="1" fill="#3d2b1f"/>
    <rect x="2" y="1" width="5" height="3" fill="#f7a072"/>
    <rect x="3" y="2" width="1" height="1" fill="#1a1a2e"/>
    <rect x="5" y="2" width="1" height="1" fill="#1a1a2e"/>
    <rect x="1" y="4" width="7" height="3" fill="#54a0ff"/>
    <rect x="3" y="4" width="3" height="3" fill="#feca57"/>
    <rect x="0" y="5" width="1" height="2" fill="#f7a072"/>
    <rect x="8" y="5" width="1" height="2" fill="#f7a072"/>
    <rect x="2" y="7" width="2" height="3" fill="#1a1a2e"/>
    <rect x="5" y="7" width="2" height="3" fill="#1a1a2e"/>
  </svg>`;

  function updateTeamPanel(p) {
    const el = document.getElementById('team-members-display');
    if (!el) return;
    const count = p.autoStaff?.kohai || 0;
    if (count === 0) {
      el.innerHTML = `<span style="font-size:11px;color:var(--dim)">目前只有你一个人……</span>`;
      return;
    }
    const names = ['田中','铃木','佐藤','高桥','渡边','中村','小林','加藤','吉田','山田'];
    const html = Array.from({ length: Math.min(count, 8) }, (_, i) => {
      const name   = names[i % names.length];
      const status = KOHAI_STATUSES[(i + Math.floor(Date.now()/5000)) % KOHAI_STATUSES.length];
      return `<div class="team-member">
        ${KOHAI_SVG}
        <div class="team-member-name">${name}</div>
        <div class="team-member-status">${status}</div>
      </div>`;
    }).join('');
    const more = count > 8 ? `<div class="team-member"><div style="font-family:var(--font-px);font-size:8px;color:var(--dim)">+${count-8}人</div></div>` : '';
    el.innerHTML = html + more;
  }

  function setBar(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    const pct = Math.max(0, Math.min(100, val));
    el.style.width = pct + '%';
    el.style.filter = pct <= 20 ? 'hue-rotate(200deg) brightness(1.4)'
                    : pct <= 40 ? 'hue-rotate(80deg)'
                    : '';
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function updateConfig(p) {
    const el = document.getElementById('config-display');
    if (!el) return;
    const levels = p.tierLevels || {};
    const defs = [
      { type: 'keyboard', tiers: KEYBOARD_TIERS, emptyLabel: '会社のキーボード' },
      { type: 'monitor',  tiers: MONITOR_TIERS,  emptyLabel: '会社のモニター' },
      { type: 'chair',    tiers: CHAIR_TIERS,    emptyLabel: '会社の椅子' },
      { type: 'ai',       tiers: AI_TIERS,       emptyLabel: 'AI未启动' },
    ];
    el.innerHTML = defs.map(d => {
      const lv   = levels[d.type] || 0;
      const tier = d.tiers.find(t => t.level === lv);
      const label = tier ? tier.label : d.emptyLabel;
      const color = tier ? 'neon-cyan' : 'dim';
      return `<div class="config-row">
        <span>${tier ? tier.emoji : '·'}</span>
        <span class="${color}" style="font-size:11px">${label}</span>
      </div>`;
    }).join('');
  }

  function updatePortfolio(p, onSell) {
    const el = document.getElementById('portfolio-display');
    if (!el) return;

    const unrealized = p.unrealizedGain || 0;
    const realized   = p.realizedGains  || 0;

    const hasAny = Object.values(p.portfolio).some(pos => (pos?.qty || 0) > 0);

    const rows = Object.entries(INVESTMENTS).map(([key, inv]) => {
      const pos = p.portfolio[key];
      const qty = pos?.qty || 0;
      if (qty === 0) return '';
      const currentPrice = inv.price * (p.market[key] || 1);
      const totalValue   = currentPrice * qty;
      const cost         = pos.totalCost || 0;
      const gain         = totalValue - cost;
      const gainCls      = gain >= 0 ? 'neon-green' : 'neon-pink';
      const gainSign     = gain >= 0 ? '+' : '';
      const perSec       = qty * inv.basePerSec * (p.market[key] || 1);

      return `<div class="portfolio-card">
        <div class="portfolio-row">
          <span>${inv.emoji} ${inv.label} ×${qty}</span>
          <button class="sell-btn" data-key="${key}">卖出</button>
        </div>
        <div class="portfolio-detail">
          <span class="dim">市值</span><span>${fmtMoney(totalValue)}</span>
          <span class="dim">成本</span><span>${fmtMoney(cost)}</span>
          <span class="dim">浮盈</span><span class="${gainCls}">${gainSign}${fmtMoney(gain)}</span>
          <span class="dim">/s</span><span class="neon-green">${fmtMoney(perSec)}</span>
        </div>
      </div>`;
    }).join('');

    const summary = `<div class="portfolio-summary">
      <div class="portfolio-row">
        <span class="dim">未实现</span>
        <span class="${unrealized >= 0 ? 'neon-green' : 'neon-pink'}">${unrealized >= 0 ? '+' : ''}${fmtMoney(unrealized)}</span>
      </div>
      <div class="portfolio-row">
        <span class="dim">已实现</span>
        <span class="${realized >= 0 ? 'neon-green' : 'neon-pink'}">${realized >= 0 ? '+' : ''}${fmtMoney(realized)}</span>
      </div>
    </div>`;

    el.innerHTML = (hasAny ? rows + summary : '<div class="dim small">尚无投资</div>');

    if (onSell) {
      el.querySelectorAll('.sell-btn').forEach(btn => {
        btn.addEventListener('click', () => onSell(btn.dataset.key));
      });
    }
  }

  function updateMarket(p) {
    const el = document.getElementById('market-display');
    if (!el) return;
    el.innerHTML = Object.entries(INVESTMENTS).map(([key, inv]) => {
      const m   = p.market[key];
      const pct = ((m - 1) * 100).toFixed(0);
      const cls = m >= 1 ? 'neon-green' : 'neon-pink';
      const sign = m >= 1 ? '+' : '';
      return `<div class="market-row">
        <span>${inv.emoji} ${inv.label}</span>
        <span class="${cls}">${sign}${pct}%</span>
      </div>`;
    }).join('');
  }

  // ── shops ──────────────────────────────────────────────────
  function renderAutoShop(p, onBuy) {
    const el = document.getElementById('auto-shop');
    if (!el) return;

    const staffItems = AUTO_STAFF.map(def => {
      const count     = p.autoStaff?.[def.id] || 0;
      const price     = p.autoStaffPrice ? p.autoStaffPrice(def.id) : def.cost;
      const canAfford = p.money >= price;
      return `<div class="shop-item ${canAfford ? '' : 'locked'}">
        <div class="shop-item-header">
          <span>${def.emoji} ${def.label}</span>
          <span class="shop-count neon-cyan">×${count}</span>
        </div>
        <div class="shop-item-desc">${def.desc}</div>
        <div class="shop-item-footer">
          <span class="shop-yield neon-green">${def.clicksPerSec}/s</span>
          <button class="shop-btn ${canAfford ? '' : 'disabled'}" data-id="${def.id}">${fmtMoney(price)}</button>
        </div>
      </div>`;
    }).join('');

    // AI 自动化摘要
    const aiLevel = p.tierLevels?.ai || 0;
    const aiInfo = aiLevel > 0
      ? `<div class="auto-ai-status">
          <span class="dim">🤖 AI Lv${aiLevel} 永久运行中</span>
          <span class="neon-green">+${(p.autoClickPerSec - (p.autoStaff?.kohai || 0) * 0.1).toFixed(1)}/s</span>
         </div>`
      : `<div class="dim small" style="padding:4px 0">购买 AI 助手后自动永久运行</div>`;

    // 合计自动点击率
    const totalRate = p.autoClickPerSec || 0;
    const summary = totalRate > 0
      ? `<div class="auto-summary"><span class="dim">合计自动化：</span><span class="neon-cyan">${totalRate.toFixed(2)} clicks/s ≈ ${fmtMoney(totalRate * (p.clickValue || 100))}/s</span></div>`
      : '';

    el.innerHTML = staffItems + aiInfo + summary;
    el.querySelectorAll('.shop-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => onBuy(btn.dataset.id));
    });
  }

  function renderInvestShop(p, onBuy) {
    const el = document.getElementById('invest-shop');
    if (!el) return;
    el.innerHTML = Object.entries(INVESTMENTS).map(([key, inv]) => {
      const canAfford = p.money >= inv.price;
      const count = p.portfolio[key] || 0;
      return `<div class="shop-item ${canAfford ? '' : 'locked'}">
        <div class="shop-item-header">
          <span>${inv.emoji} ${inv.label}</span>
          <span class="shop-count">×${count}</span>
        </div>
        <div class="shop-item-desc">${inv.desc}</div>
        <div class="shop-item-footer">
          <span class="shop-yield neon-green">${fmtMoney(inv.basePerSec)}/s</span>
          <span class="shop-risk dim">${inv.riskLabel}</span>
          <button class="shop-btn ${canAfford ? '' : 'disabled'}" data-key="${key}">${fmtMoney(inv.price)}</button>
        </div>
      </div>`;
    }).join('');
    el.querySelectorAll('.shop-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => onBuy(btn.dataset.key));
    });
  }

  function renderUpgradeShop(p, onBuy) {
    const el = document.getElementById('upgrade-shop');
    if (!el) return;

    const TIER_DEFS = [
      { type: 'keyboard', label: '键盘',  tiers: KEYBOARD_TIERS },
      { type: 'monitor',  label: '显示器', tiers: MONITOR_TIERS },
      { type: 'chair',    label: '椅子',  tiers: CHAIR_TIERS },
      { type: 'ai',       label: 'AI助手', tiers: AI_TIERS },
    ];

    el.innerHTML = TIER_DEFS.map(def => {
      const currentLevel = (p.tierLevels && p.tierLevels[def.type]) || 0;
      const current = def.tiers.find(t => t.level === currentLevel);
      const next    = def.tiers.find(t => t.level === currentLevel + 1);
      const maxed   = !next;
      const canAfford = next && p.money >= next.cost;
      const disabled  = maxed || !canAfford;

      const statusLabel = current
        ? `<span class="neon-cyan" style="font-size:10px">当前：${current.label}</span>`
        : `<span class="dim" style="font-size:10px">未配置</span>`;

      const btnLabel = maxed ? '已满级 ✓' : next ? fmtMoney(next.cost) : '─';
      const nextDesc = next ? next.desc : (current ? current.desc : '');
      const nextBonus = next
        ? (def.type === 'ai' ? `每${next.autoClickInterval/1000}秒自动敲一次` : `+¥${next.bonus}/click`)
        : '';

      // AI 拥有等级后，额外显示「启动运行」按钮
      const aiRunBtn = (def.type === 'ai' && currentLevel > 0)
        ? `<button class="shop-btn ai-run-btn" data-type="ai-run">▶ 启动运行</button>`
        : '';

      return `<div class="shop-item ${disabled ? 'locked' : ''}">
        <div class="shop-item-header">
          <span>${next ? next.emoji : (current ? current.emoji : '⬜')} ${def.label}</span>
          ${statusLabel}
        </div>
        <div class="shop-item-desc">${nextDesc}</div>
        <div class="shop-item-footer">
          ${nextBonus ? `<span class="shop-yield neon-cyan">${nextBonus}</span>` : '<span></span>'}
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="shop-btn ${disabled ? 'disabled' : ''}" data-type="${def.type}">${btnLabel}</button>
            ${aiRunBtn}
          </div>
        </div>
      </div>`;
    }).join('');

    el.querySelectorAll('.shop-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => onBuy(btn.dataset.type));
    });
    // 「启动运行」按钮单独绑定（不走 disabled 过滤）
    el.querySelectorAll('.ai-run-btn').forEach(btn => {
      btn.addEventListener('click', () => onBuy('ai-run'));
    });
  }

  function renderLifeShop(p, onBuy) {
    const el = document.getElementById('life-shop');
    if (!el) return;
    el.innerHTML = SHOP_ITEMS.map(item => {
      const canAfford = p.money >= item.cost;
      const onCooldown = !p.canUseShop(item.id, item.cooldown);
      const disabled  = !canAfford || onCooldown;
      const cooldownLabel = onCooldown ? ' (冷却中)' : '';
      return `<div class="shop-item ${disabled ? 'locked' : ''}">
        <div class="shop-item-header">
          <span>${item.emoji} ${item.label}${cooldownLabel}</span>
        </div>
        <div class="shop-item-desc">${item.desc}</div>
        <div class="shop-item-footer">
          <button class="shop-btn ${disabled ? 'disabled' : ''}" data-id="${item.id}">
            ${item.cost === 0 ? '免费' : fmtMoney(item.cost)}
          </button>
        </div>
      </div>`;
    }).join('');
    el.querySelectorAll('.shop-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => onBuy(btn.dataset.id));
    });
  }

  // ── event popup ────────────────────────────────────────────
  let _tw = null;
  function showEventPopup(event, onChoice) {
    const popup = document.getElementById('event-popup');
    const textEl = document.getElementById('popup-text');
    const choicesEl = document.getElementById('popup-choices');
    popup.classList.remove('hidden');
    choicesEl.innerHTML = '';
    typewrite(textEl, event.text, 20, () => {
      const choices = event.choices && event.choices.length ? event.choices
        : [{ label: '── 继续 ──', reply: '', changes: {}, tone: 'neutral' }];
      choices.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = c.label;
        btn.addEventListener('click', () => {
          choicesEl.innerHTML = '';
          if (c.reply) {
            typewrite(textEl, c.reply, 20, () => {
              setTimeout(() => { popup.classList.add('hidden'); onChoice(c); }, 1200);
            });
          } else {
            popup.classList.add('hidden');
            onChoice(c);
          }
        });
        choicesEl.appendChild(btn);
      });
    });
  }

  function hideEventPopup() {
    document.getElementById('event-popup').classList.add('hidden');
  }

  function typewrite(el, text, speed = 20, onDone) {
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

  // ── auto-click float（绿色，区分手动）────────────────────────
  function spawnAutoFloat(perClick, count) {
    if (count === 0) return;
    const btn = document.getElementById('btn-click');
    if (!btn) return;
    const total = perClick * count;
    const el    = document.createElement('div');
    el.className = 'float-num auto';
    el.textContent = `🤖 +¥${Math.floor(total).toLocaleString()}`;
    const rect = btn.getBoundingClientRect();
    el.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 80) + 'px';
    el.style.top  = (rect.top - 10) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  // ── floating click number ──────────────────────────────────
  function spawnFloat(amount) {
    const btn = document.getElementById('btn-click');
    if (!btn) return;
    const el  = document.createElement('div');
    el.className = 'float-num';
    el.textContent = '+¥' + amount.toLocaleString();
    const rect = btn.getBoundingClientRect();
    el.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 60) + 'px';
    el.style.top  = (rect.top  - 10) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  // ── market news banner ─────────────────────────────────────
  function showMarketNews(text, tone) {
    const el = document.getElementById('market-news');
    if (!el) return;
    el.textContent = text;
    el.className   = 'market-news ' + tone;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 8000);
  }

  // ── log ────────────────────────────────────────────────────
  function appendLog(text, tone = 'neutral') {
    const log = document.getElementById('event-log');
    if (!log) return;
    const e = document.createElement('div');
    e.className = `log-entry ${tone}`;
    e.innerHTML = `<span class="log-time">${tokyoTimeStr()}</span>${text.split('\n')[0]}`;
    log.prepend(e);
    while (log.children.length > 12) log.removeChild(log.lastChild);
  }

  // ── clock ──────────────────────────────────────────────────
  function updateClock() {
    const jst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const hh  = String(jst.getHours()).padStart(2, '0');
    const mm  = String(jst.getMinutes()).padStart(2, '0');
    const ss  = String(jst.getSeconds()).padStart(2, '0');
    setText('title-clock', `${hh}:${mm}:${ss}`);
    setText('hdr-clock',   `${hh}:${mm}`);
  }

  // ── toast ──────────────────────────────────────────────────
  let _toastEl = null, _toastT = null;
  function toast(msg, ms = 2000) {
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

  // ── story badge ────────────────────────────────────────────
  function showStoryBadge(count) {
    const el = document.getElementById('story-badge');
    if (!el) return;
    el.textContent = count;
    el.classList.remove('hidden');
  }

  // ── story archive modal ────────────────────────────────────
  function showStories(storyLog) {
    const existing = document.getElementById('story-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'story-modal';
    modal.className = 'story-overlay';

    const entries = storyLog.length === 0
      ? '<div class="story-empty dim">还没有记录任何故事。<br/>去游戏里触发它们吧。</div>'
      : storyLog.map((s, i) => `
          <div class="story-card" id="story-${i}">
            <div class="story-card-header">
              <span class="story-emoji">${s.emoji}</span>
              <span class="story-title">${s.title}</span>
              <span class="story-meta dim">Day ${s.day} · ${s.time}</span>
              <button class="story-toggle" data-idx="${i}">展开</button>
            </div>
            <div class="story-body hidden" id="story-body-${i}">
              <div class="story-text">${s.text.replace(/\n/g, '<br/>')}</div>
              ${s.reply ? `<div class="story-reply">${s.reply.replace(/\n/g, '<br/>')}</div>` : ''}
            </div>
          </div>`).join('');

    modal.innerHTML = `
      <div class="story-box">
        <div class="story-box-title neon-cyan">── 物 語 ──</div>
        <div class="story-list">${entries}</div>
        <button class="menu-btn secondary small" id="story-close">[ 关闭 ]</button>
      </div>`;

    document.body.appendChild(modal);

    modal.querySelector('#story-close').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('.story-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx  = btn.dataset.idx;
        const body = document.getElementById(`story-body-${idx}`);
        const open = !body.classList.contains('hidden');
        body.classList.toggle('hidden', open);
        btn.textContent = open ? '展开' : '收起';
      });
    });

    // hide badge
    const badge = document.getElementById('story-badge');
    if (badge) badge.classList.add('hidden');
  }

  return {
    show, updateStats, updateClock,
    renderAutoShop, renderInvestShop, renderUpgradeShop, renderLifeShop,
    showEventPopup, hideEventPopup,
    spawnFloat, showMarketNews, appendLog, toast,
    showStoryBadge, showStories,
  };
})();
