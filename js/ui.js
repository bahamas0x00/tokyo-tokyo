'use strict';
const UI = (() => {
  let _prevStats = null;  // 上次的属性值，用于「数值突变」提示

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
  }

  // ── stats ──────────────────────────────────────────────────
  function updateStats(p) {
    // 後輩产出统计
    const kohaiEl = document.getElementById('val-kohai-earned');
    if (kohaiEl) kohaiEl.textContent = fmtMoney(p.kohaiEarned || 0);

    setText('hdr-name',       p.name);
    setText('hdr-title',      p.title);
    setText('hdr-day',        p.day);
    setText('hdr-clock',      tokyoTimeStr());
    setText('val-money',      fmtMoney(p.money));
    setText('val-total',      fmtMoney(p.totalEarned));
    setText('val-click',      '¥' + p.clickValue);
    setText('val-passive',    fmtMoney(p.totalPerSec) + '/s');  // 总收入=投资+自动化
    setText('val-click-rate', '¥' + p.clickValue + '/CLICK');
    setBar('bar-energy',    p.energy);
    setBar('bar-health',    p.health);
    setBar('bar-happiness', p.happiness);
    setText('val-energy',    Math.floor(p.energy));
    setText('val-health',    Math.floor(p.health));
    setText('val-happiness', Math.floor(p.happiness));
    // 数值突变提示（事件/消费/危机的明显增减；缓慢衰减不触发）
    if (_prevStats) {
      ['energy', 'health', 'happiness'].forEach(k => {
        const d = p[k] - _prevStats[k];
        if (Math.abs(d) >= 3) spawnStatFloat(k, d);
      });
    }
    _prevStats = { energy: p.energy, health: p.health, happiness: p.happiness };
    // 低值预警 + 病倒视觉
    ['energy', 'health', 'happiness'].forEach(k => {
      const bar = document.getElementById('bar-' + k);
      if (bar) bar.classList.toggle('low', p[k] < 25);
    });
    const office = document.getElementById('btn-click');
    if (office) office.classList.toggle('sick', p.isSick);
    // 新手点击引导：赚到 ¥500 前显示
    const hint = document.getElementById('click-hint');
    if (hint) hint.style.display = (p.totalEarned < 500) ? '' : 'none';
    // 空状态栏隐藏：後輩累计行 / 市场行情栏（无内容不显示）
    const ker = document.getElementById('kohai-earned-row');
    if (ker) ker.style.display = ((p.autoStaff?.kohai || 0) > 0 || (p.kohaiEarned || 0) > 0) ? '' : 'none';
    const md = document.getElementById('market-display');
    if (md) md.closest('.panel-section').style.display = md.children.length ? '' : 'none';
    updateConfig(p);
    updatePortfolio(p, window._onSellCallback);
    updateTeamPanel(p);
  }

  // ── team panel ─────────────────────────────────────────────
  // 後輩工作状态/姓名按语言取自 i18n.js（kohaiStatuses() / memberNames()）
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
      el.innerHTML = `<span style="font-size:11px;color:var(--dim)">${t('team.empty')}</span>`;
      return;
    }
    const names = memberNames();
    const statuses = kohaiStatuses();
    const html = Array.from({ length: Math.min(count, 8) }, (_, i) => {
      const name   = names[i % names.length];
      const status = statuses[(i + Math.floor(Date.now()/5000)) % statuses.length];
      return `<div class="team-member">
        ${KOHAI_SVG}
        <div class="team-member-name">${name}</div>
        <div class="team-member-status">${status}</div>
      </div>`;
    }).join('');
    const more = count > 8 ? `<div class="team-member"><div style="font-family:var(--font-px);font-size:8px;color:var(--dim)">${t('team.more', { n: count-8 })}</div></div>` : '';
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
      { type: 'keyboard', tiers: KEYBOARD_TIERS, emptyKey: 'config.keyboard.empty' },
      { type: 'monitor',  tiers: MONITOR_TIERS,  emptyKey: 'config.monitor.empty' },
      { type: 'chair',    tiers: CHAIR_TIERS,    emptyKey: 'config.chair.empty' },
      { type: 'ai',       tiers: AI_TIERS,       emptyKey: 'config.ai.empty' },
    ];
    let html = defs.map(d => {
      const lv   = levels[d.type] || 0;
      const tier = d.tiers.find(tr => tr.level === lv);
      const label = tier ? tf(tier, 'label') : t(d.emptyKey);
      const color = tier ? 'neon-cyan' : 'dim';
      return `<div class="config-row">
        <span>${tier ? tier.emoji : '·'}</span>
        <span class="${color}" style="font-size:11px">${label}</span>
      </div>`;
    }).join('');
    // 後輩团队（有了才显示）
    const kohaiCount = p.autoStaff?.kohai || 0;
    if (kohaiCount > 0) {
      html += `<div class="config-row">
        <span>${AUTO_STAFF[0].emoji}</span>
        <span class="neon-cyan" style="font-size:11px">${tf(AUTO_STAFF[0], 'label')} ×${kohaiCount}</span>
      </div>`;
    }
    el.innerHTML = html;
    // 开局未拥有任何设备/AI/後輩时整栏隐藏，有了才出现
    const owns = ['keyboard', 'monitor', 'chair', 'ai'].some(k => (levels[k] || 0) >= 1) || kohaiCount > 0;
    el.closest('.panel-section').style.display = owns ? '' : 'none';
  }

  function updatePortfolio(p, onSell) {
    const el = document.getElementById('portfolio-display');
    if (!el) return;

    const bondsQty = p.portfolio.bonds?.qty || 0;
    const btcQty   = p.portfolio.btc?.qty   || 0;
    const hasBonds = bondsQty > 0;
    const hasBtc   = btcQty   > 0;

    if (!hasBonds && !hasBtc) {
      el.innerHTML = '';
      el.closest('.panel-section').style.display = 'none';  // 无投资时整栏隐藏
      return;
    }
    el.closest('.panel-section').style.display = '';

    let html = '';

    // 国債行（简单展示）
    if (hasBonds) {
      const perSec = bondsQty * INVESTMENTS.bonds.basePerSec;
      html += `<div class="portfolio-card">
        <div class="portfolio-row">
          <span>📜 ${tf(INVESTMENTS.bonds, 'label')} ×${bondsQty}</span>
          <span class="neon-green" style="font-size:11px">${fmtMoney(perSec)}/s</span>
        </div>
      </div>`;
    }

    // BTC 行（含行情 + 卖出）
    if (hasBtc) {
      const m        = p.btcMarket || 1;
      const pct      = ((m - 1) * 100).toFixed(0);
      const sign     = m >= 1 ? '+' : '';
      const trendCls = m >= 1 ? 'neon-green' : 'neon-pink';
      const trendIcon= m >= 1.05 ? '📈' : m <= 0.95 ? '📉' : '─';
      const sellVal  = p.btcCurrentValue;
      const gain     = p.btcUnrealizedGain;
      const gainCls  = gain >= 0 ? 'neon-green' : 'neon-pink';
      const gainSign = gain >= 0 ? '+' : '';
      const perSec   = btcQty * INVESTMENTS.btc.basePerSec * m;
      const isCrash  = m <= 0.1;

      html += `<div class="portfolio-card ${isCrash ? 'btc-crash' : ''}">
        <div class="portfolio-row">
          <span>₿ ${tf(INVESTMENTS.btc, 'label')} ×${btcQty}</span>
          <button class="sell-btn" id="btc-sell-btn">${t('sell.btn')}</button>
        </div>
        <div class="portfolio-detail">
          <span class="dim">${t('portfolio.market')}</span>
          <span class="${trendCls}">${trendIcon} ${sign}${pct}%</span>
          <span class="dim">${t('portfolio.gain')}</span>
          <span class="${gainCls}">${gainSign}${fmtMoney(gain)}</span>
          <span class="dim">${t('portfolio.sellprice')}</span>
          <span>${fmtMoney(sellVal)}</span>
          <span class="dim">/s</span>
          <span class="neon-green">${fmtMoney(perSec)}</span>
        </div>
        ${isCrash ? `<div style="color:var(--pink);font-size:10px;padding:4px 0">${t('portfolio.crash_warn')}</div>` : ''}
      </div>`;
    }

    el.innerHTML = html;

    if (onSell) {
      const btn = el.querySelector('#btc-sell-btn');
      if (btn) btn.addEventListener('click', onSell);
    }
  }

  // ── shops ──────────────────────────────────────────────────
  function renderAutoShop(p, onBuy) {
    const el = document.getElementById('auto-shop');
    if (!el) return;

    const count = p.autoStaff?.kohai || 0;

    if (!p.canApplyForKohai) {
      var staffItems = `<div class="shop-item locked">
        <div class="shop-item-header"><span>👥 ${tf(AUTO_STAFF[0], 'label')}</span><span class="shop-count">×${count}</span></div>
        <div class="shop-item-desc" style="color:var(--pink)">${t('kohai.locked')}<br/>${t('kohai.locked.cur', { title: p.title, day: p.day })}</div>
      </div>`;
    } else if (p.hrPending) {
      const remaining = Math.max(0, Math.ceil((p.hrPendingEnd - Date.now()) / 1000));
      var staffItems = `<div class="shop-item">
        <div class="shop-item-header"><span>${t('kohai.hr.pending')}</span><span class="shop-count neon-gold">×${count}</span></div>
        <div class="shop-item-desc" style="color:var(--gold)">${t('kohai.hr.eta')}<br/>${t('kohai.hr.remaining', { n: remaining })}</div>
        <div class="shop-item-footer"><span class="shop-yield dim">...</span></div>
      </div>`;
    } else {
      const onCooldown = Date.now() < (p.hrCooldown || 0);
      const coolSecs   = onCooldown ? Math.ceil(((p.hrCooldown || 0) - Date.now()) / 1000) : 0;
      const canAfford  = p.money >= 50000;
      const disabled   = onCooldown || !canAfford;
      var staffItems = `<div class="shop-item ${disabled ? 'locked' : ''}">
        <div class="shop-item-header">
          <span>👥 ${tf(AUTO_STAFF[0], 'label')}</span>
          <span class="shop-count neon-cyan">×${count}</span>
        </div>
        <div class="shop-item-desc">${count === 0 ? t('kohai.recruit.first') : t('kohai.recruit.more', { n: count })}
        ${onCooldown ? `<br/><span style="color:var(--pink)">${t('kohai.hr.cooldown', { n: coolSecs })}</span>` : ''}
        ${!canAfford && !onCooldown ? `<br/><span style="color:var(--pink)">${t('kohai.hr.nofund')}</span>` : ''}
        </div>
        <div class="shop-item-footer">
          <span class="shop-yield neon-green">+0.1 clicks/s</span>
          <button class="shop-btn ${disabled ? 'disabled' : ''}" data-id="kohai-apply">
            ${t('kohai.hr.btn')}
          </button>
        </div>
      </div>`;
    }

    const aiLevel = p.tierLevels?.ai || 0;
    const aiInfo = aiLevel > 0
      ? `<div class="auto-ai-status">
          <span class="dim">${t('ai.running', { n: aiLevel })}</span>
          <span class="neon-green">+${(p.autoClickPerSec - (p.autoStaff?.kohai || 0) * 0.1).toFixed(1)}/s</span>
         </div>`
      : `<div class="dim small" style="padding:4px 0">${t('auto.ai.off')}</div>`;

    const totalRate = p.autoClickPerSec || 0;
    const summary = totalRate > 0
      ? `<div class="auto-summary"><span class="dim">${t('auto.total')}</span><span class="neon-cyan">${totalRate.toFixed(2)} clicks/s ≈ ${fmtMoney(totalRate * (p.clickValue || 100))}/s</span></div>`
      : '';

    el.innerHTML = staffItems + aiInfo + summary;
    el.querySelectorAll('.shop-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => onBuy(btn.dataset.id));
    });
  }

  function renderInvestShop(p, onBuy) {
    const el = document.getElementById('invest-shop');
    if (!el) return;

    // 国債：固定价格，稳定收益，不可卖
    const bondsInv    = INVESTMENTS.bonds;
    const bondsQty    = p.portfolio.bonds?.qty || 0;
    const bondsAfford = p.money >= bondsInv.price;
    const bondsItem   = `<div class="shop-item ${bondsAfford ? '' : 'locked'}">
      <div class="shop-item-header">
        <span>📜 ${tf(bondsInv, 'label')}</span>
        <span class="shop-count">×${bondsQty}</span>
      </div>
      <div class="shop-item-desc">${tf(bondsInv, 'desc')}</div>
      <div class="shop-item-footer">
        <span class="shop-yield neon-green">${fmtMoney(bondsInv.basePerSec)}/s ${t('inv.fixed')}</span>
        <button class="shop-btn ${bondsAfford ? '' : 'disabled'}" data-key="bonds">${fmtMoney(bondsInv.price)}</button>
      </div>
    </div>`;

    // BTC：当前行情价，高收益高风险，可卖
    const btcInv    = INVESTMENTS.btc;
    const btcQty    = p.portfolio.btc?.qty || 0;
    const m         = p.btcMarket || 1;
    const pct       = ((m - 1) * 100).toFixed(0);
    const sign      = m >= 1 ? '+' : '';
    const mCls      = m >= 1 ? 'neon-green' : 'neon-pink';
    const btcAfford = p.money >= btcInv.price;
    const btcPerSec = btcInv.basePerSec * m;
    const btcItem   = `<div class="shop-item ${btcAfford ? '' : 'locked'}">
      <div class="shop-item-header">
        <span>₿ ${tf(btcInv, 'label')}</span>
        <span class="shop-count">×${btcQty}</span>
      </div>
      <div class="shop-item-desc">${tf(btcInv, 'desc')}
        <br/><span class="${mCls}" style="font-size:10px">${t('portfolio.market')} ${sign}${pct}% · ${fmtMoney(btcPerSec)}/s</span>
      </div>
      <div class="shop-item-footer">
        <span class="shop-yield dim">${t('inv.risk')}</span>
        <button class="shop-btn ${btcAfford ? '' : 'disabled'}" data-key="btc">${fmtMoney(btcInv.price)}</button>
      </div>
    </div>`;

    // 解锁前提：设备全升级 + 已买 AI；之后再按余额接近售价逐步显示
    const gear = p.gearComplete;
    const bondsShown = bondsQty > 0 || (gear && p.isRevealed(bondsInv.price));
    const btcShown   = btcQty   > 0 || (gear && p.isRevealed(btcInv.price));
    el.closest('.panel-section').style.display = (bondsShown || btcShown) ? '' : 'none';
    el.innerHTML = (bondsShown ? bondsItem : '') + (btcShown ? btcItem : '');
    el.querySelectorAll('.shop-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => onBuy(btn.dataset.key));
    });
  }

  function renderUpgradeShop(p, onBuy) {
    const el = document.getElementById('upgrade-shop');
    if (!el) return;

    const TIER_DEFS = [
      { type: 'keyboard', labelKey: 'upgrade.keyboard', tiers: KEYBOARD_TIERS },
      { type: 'monitor',  labelKey: 'upgrade.monitor',  tiers: MONITOR_TIERS },
      { type: 'chair',    labelKey: 'upgrade.chair',    tiers: CHAIR_TIERS },
      { type: 'ai',       labelKey: 'upgrade.ai',       tiers: AI_TIERS },
    ];

    // 只显示「还能买的下一级」：买满(一次性设备购入/AI满级)即从本栏消失
    //（已拥有的会在左侧「当前配置」体现），余额接近售价才出现
    const visibleDefs = TIER_DEFS.filter(def => {
      const lv  = (p.tierLevels && p.tierLevels[def.type]) || 0;
      const nxt = def.tiers.find(tr => tr.level === lv + 1);
      return nxt && p.isRevealed(nxt.cost);
    });
    const tiersHtml = visibleDefs.map(def => {
      const currentLevel = (p.tierLevels && p.tierLevels[def.type]) || 0;
      const current = def.tiers.find(tr => tr.level === currentLevel);
      const next    = def.tiers.find(tr => tr.level === currentLevel + 1);
      const maxed   = !next;
      const canAfford = next && p.money >= next.cost;
      const disabled  = maxed || !canAfford;

      const statusLabel = current
        ? `<span class="neon-cyan" style="font-size:10px">${tf(current, 'label')}</span>`
        : `<span class="dim" style="font-size:10px">${t('config.empty')}</span>`;

      const btnLabel = maxed ? (def.type === 'ai' ? t('upgrade.maxed') : t('upgrade.owned'))
                             : next ? fmtMoney(next.cost) : '─';
      const nextDesc = next ? tf(next, 'desc') : (current ? tf(current, 'desc') : '');
      const nextBonus = next
        ? (def.type === 'ai' ? `${next.autoClickInterval/1000}s/click` : `+¥${next.bonus}/click`)
        : '';

      return `<div class="shop-item ${disabled ? 'locked' : ''}">
        <div class="shop-item-header">
          <span>${next ? next.emoji : (current ? current.emoji : '⬜')} ${t(def.labelKey)}</span>
          ${statusLabel}
        </div>
        <div class="shop-item-desc">${nextDesc}</div>
        <div class="shop-item-footer">
          ${nextBonus ? `<span class="shop-yield neon-cyan">${nextBonus}</span>` : '<span></span>'}
          <button class="shop-btn ${disabled ? 'disabled' : ''}" data-type="${def.type}">${btnLabel}</button>
        </div>
      </div>`;
    }).join('');

    // 後輩(kohai)：晋升到主任后并入本栏（直接购买，价格递增 ×1.15）
    let kohaiHtml = '';
    if (p.canApplyForKohai) {
      const def    = AUTO_STAFF[0];
      const count  = p.autoStaff?.kohai || 0;
      const price  = p.autoStaffPrice('kohai');
      const afford = p.money >= price;
      kohaiHtml = `<div class="shop-item ${afford ? '' : 'locked'}">
        <div class="shop-item-header">
          <span>${def.emoji} ${tf(def, 'label')}</span>
          <span class="shop-count neon-cyan">×${count}</span>
        </div>
        <div class="shop-item-desc">${tf(def, 'desc')}</div>
        <div class="shop-item-footer">
          <span class="shop-yield neon-green">+0.1 clicks/s</span>
          <button class="shop-btn ${afford ? '' : 'disabled'}" data-kohai="1">${fmtMoney(price)}</button>
        </div>
      </div>`;
    }

    el.closest('.panel-section').style.display = (tiersHtml || kohaiHtml) ? '' : 'none';
    el.innerHTML = tiersHtml + kohaiHtml;

    el.querySelectorAll('.shop-btn:not(.disabled)').forEach(btn => {
      if (btn.dataset.kohai) btn.addEventListener('click', () => onBuy('kohai-buy'));
      else btn.addEventListener('click', () => onBuy(btn.dataset.type));
    });
  }

  function renderLifeShop(p, onBuy) {
    const el = document.getElementById('life-shop');
    if (!el) return;
    // 按需求解锁：无 unlockNeed 的(趴一会/便利店)始终显示；
    // 有的当对应属性「曾跌破阈值」后永久出现（用历史最低值 minXxx，单调不增）
    const items = SHOP_ITEMS.filter(item => {
      if (!item.unlockNeed) return true;
      const n = item.unlockNeed;
      const minVal = p['min' + n.stat[0].toUpperCase() + n.stat.slice(1)];
      return (minVal ?? p[n.stat] ?? 100) <= n.below;
    });
    el.closest('.panel-section').style.display = items.length ? '' : 'none';
    el.innerHTML = items.map(item => {
      const canAfford = p.money >= item.cost;
      const onCooldown = !p.canUseShop(item.id, item.cooldown);
      const disabled  = !canAfford || onCooldown;
      const cooldownLabel = onCooldown ? t('shop.cooldown') : '';
      return `<div class="shop-item ${disabled ? 'locked' : ''}">
        <div class="shop-item-header">
          <span>${item.emoji} ${tf(item, 'label')}${cooldownLabel}</span>
        </div>
        <div class="shop-item-desc">${tf(item, 'desc')}</div>
        <div class="shop-item-footer">
          <button class="shop-btn ${disabled ? 'disabled' : ''}" data-id="${item.id}">
            ${item.cost === 0 ? t('shop.free') : fmtMoney(item.cost)}
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
        : [{ label: t('choice.continue'), reply: '', changes: {}, tone: 'neutral' }];
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

  // 属性数值突变提示：在对应状态条旁飘 +N(绿)/−N(红)
  function spawnStatFloat(key, d) {
    const bar = document.getElementById('bar-' + key);
    const row = bar && bar.closest('.stat-row');
    if (!row) return;
    const el = document.createElement('div');
    el.className = 'stat-float ' + (d < 0 ? 'down' : 'up');
    el.textContent = (d < 0 ? '−' : '+') + Math.round(Math.abs(d));
    row.appendChild(el);
    setTimeout(() => el.remove(), 1100);
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
  function toast(msg, ms = 2800) {
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
      ? `<div class="story-empty dim">${t('story.empty')}</div>`
      : storyLog.map((s, i) => `
          <div class="story-card" id="story-${i}">
            <div class="story-card-header">
              <span class="story-emoji">${s.emoji}</span>
              <span class="story-title">${s.title}</span>
              <span class="story-meta dim">Day ${s.day} · ${s.time}</span>
              <button class="story-toggle" data-idx="${i}">${t('story.expand')}</button>
            </div>
            <div class="story-body hidden" id="story-body-${i}">
              <div class="story-text">${s.text.replace(/\n/g, '<br/>')}</div>
              ${s.reply ? `<div class="story-reply">${s.reply.replace(/\n/g, '<br/>')}</div>` : ''}
            </div>
          </div>`).join('');

    modal.innerHTML = `
      <div class="story-box">
        <div class="story-box-title neon-cyan">${t('story.title')}</div>
        <div class="story-list">${entries}</div>
        <button class="menu-btn secondary small" id="story-close">${t('story.close')}</button>
      </div>`;

    document.body.appendChild(modal);

    modal.querySelector('#story-close').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('.story-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx  = btn.dataset.idx;
        const body = document.getElementById(`story-body-${idx}`);
        const open = !body.classList.contains('hidden');
        body.classList.toggle('hidden', open);
        btn.textContent = open ? t('story.expand') : t('story.collapse');
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
    spawnFloat, spawnAutoFloat, showMarketNews, appendLog, toast,
    showStoryBadge, showStories,
  };
})();
