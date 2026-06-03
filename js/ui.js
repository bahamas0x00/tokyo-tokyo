'use strict';
const UI = (() => {
  let _prevStats = null;  // 上次的属性值，用于「数值突变」提示
  let _eventTimer = null; // 突发事件自动消失计时器

  // ── 金钱动画计数器（rAF 平滑追尾）──────────────────────────
  let _animMoney = 0;
  let _animRafId = null;
  function startMoneyAnim(getPlayer) {
    cancelAnimationFrame(_animRafId);
    function frame() {
      const target = getPlayer()?.money ?? 0;
      const diff   = target - _animMoney;
      if (diff < 0) {
        _animMoney = target;              // 花钱立刻跳变
      } else if (diff > 0.1) {
        _animMoney += diff * 0.14;        // 赚钱平滑追尾
      } else {
        _animMoney = target;
      }
      const el = document.getElementById('val-money');
      if (el) el.textContent = fmtMoneyLive(_animMoney);
      _animRafId = requestAnimationFrame(frame);
    }
    frame();
  }

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
    // val-money 由 startMoneyAnim rAF 动画接管，这里不再直接写
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
    if (office) {
      office.classList.toggle('sick',      p.isSick);
      office.classList.toggle('collapsed', p.isCollapsed);
    }
    // 休息状态遮罩 + 倒计时
    const overlay   = document.getElementById('rest-overlay');
    const restIcon  = document.getElementById('rest-icon');
    const restTimer = document.getElementById('rest-timer');
    if (overlay && restIcon && restTimer) {
      const resting = p.isSick || p.isCollapsed;
      overlay.style.display = resting ? '' : 'none';
      if (resting) {
        const until = Math.max(p.sickUntil || 0, p.collapseUntil || 0);
        const secsLeft = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        const mm = String(Math.floor(secsLeft / 60)).padStart(2, '0');
        const ss = String(secsLeft % 60).padStart(2, '0');
        restIcon.textContent  = p.isSick ? '🤒' : '💤';
        restTimer.textContent = `${mm}:${ss}`;
      }
    }
    // 新手点击引导：赚到 ¥500 前显示
    const hint = document.getElementById('click-hint');
    if (hint) hint.style.display = (p.totalEarned < 500) ? '' : 'none';
    // 「自动收益/秒」没有被动收入时隐藏
    const pr = document.getElementById('passive-row');
    if (pr) pr.style.display = p.totalPerSec > 0 ? '' : 'none';
    // 贿赂按钮：未满级才显示，标签带当前贿赂金
    // 贿赂按钮暂时隐藏（数值待调整）
    // const bribeBtn = document.getElementById('btn-bribe');
    // if (bribeBtn) { ... }
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
    // 只在人数变化时重建 DOM，避免每秒重置动画造成闪缩
    if (el.dataset.kohaiCount === String(count)) return;
    el.dataset.kohaiCount = count;
    if (count === 0) {
      el.innerHTML = `<span style="font-size:11px;color:var(--dim)">${t('team.empty')}</span>`;
      return;
    }
    const names = memberNames();
    const statuses = kohaiStatuses();
    const html = Array.from({ length: Math.min(count, 8) }, (_, i) => {
      const name   = names[i % names.length];
      const status = statuses[i % statuses.length];
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
    // 只显示「已拥有」的装备，避免提前剧透未解锁的项
    let html = defs.filter(d => (levels[d.type] || 0) >= 1).map(d => {
      const tier = d.tiers.find(tr => tr.level === (levels[d.type] || 0));
      return `<div class="config-row">
        <span>${tier ? tier.emoji : '·'}</span>
        <span class="neon-cyan" style="font-size:11px">${tf(tier, 'label')}</span>
      </div>`;
    }).join('');
    // 自动产出（自动脚本/後輩，有了才显示）
    AUTO_STAFF.forEach(s => {
      const c = p.autoStaff?.[s.id] || 0;
      if (c > 0) html += `<div class="config-row">
        <span>${s.emoji}</span>
        <span class="neon-cyan" style="font-size:11px">${tf(s, 'label')} ×${c}</span>
      </div>`;
    });
    el.innerHTML = html;
    // 开局未拥有任何设备/AI/自动产出时整栏隐藏，有了才出现
    const ownsStaff = AUTO_STAFF.some(s => (p.autoStaff?.[s.id] || 0) > 0);
    const owns = ['keyboard', 'monitor', 'chair', 'ai'].some(k => (levels[k] || 0) >= 1) || ownsStaff;
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
    const bondsAfford   = p.money >= bondsInv.price;
    const bonds10Afford = p.money >= bondsInv.price * 10;
    const bonds100Afford= p.money >= bondsInv.price * 100;
    const bondsItem   = `<div class="shop-item ${bondsAfford ? '' : 'locked'}">
      <div class="shop-item-header">
        <span>📜 ${tf(bondsInv, 'label')}</span>
        <span class="shop-count">×${bondsQty}</span>
      </div>
      <div class="shop-item-desc">${tf(bondsInv, 'desc')}</div>
      <div class="shop-item-footer inv-footer">
        <span class="shop-yield neon-green">${fmtMoney(bondsInv.basePerSec)}/s ${t('inv.fixed')}</span>
        <div class="buy-btn-group inv-buy-group">
          <button class="shop-btn ${bondsAfford ? '' : 'disabled'}" data-key="bonds" data-qty="1">${fmtMoney(bondsInv.price)}</button>
          <button class="shop-btn shop-btn-bulk ${bonds10Afford ? '' : 'disabled'}" data-key="bonds" data-qty="10">×10</button>
          <button class="shop-btn shop-btn-bulk ${bonds100Afford ? '' : 'disabled'}" data-key="bonds" data-qty="100">×100</button>
        </div>
      </div>
    </div>`;

    // BTC：当前行情价，高收益高风险，可卖
    const btcInv    = INVESTMENTS.btc;
    const btcQty    = p.portfolio.btc?.qty || 0;
    const m         = p.btcMarket || 1;
    const pct       = ((m - 1) * 100).toFixed(0);
    const sign      = m >= 1 ? '+' : '';
    const mCls      = m >= 1 ? 'neon-green' : 'neon-pink';
    const btcMktPrice = Math.round(btcInv.price * m);
    const btcAfford = p.money >= btcMktPrice;
    const btcPerSec = btcInv.basePerSec * m;
    const btcItem   = `<div class="shop-item ${btcAfford ? '' : 'locked'}">
      <div class="shop-item-header">
        <span>₿ ${tf(btcInv, 'label')}</span>
        <span class="shop-count">×${btcQty}</span>
      </div>
      <div class="shop-item-desc">${tf(btcInv, 'desc')}
        <br/><span class="${mCls}" style="font-size:10px">${t('portfolio.market')} ${sign}${pct}% · ${fmtMoney(btcPerSec)}/s</span>
      </div>
      <div class="shop-item-footer inv-footer">
        <span class="shop-yield dim">${t('inv.risk')}</span>
        <div class="buy-btn-group inv-buy-group">
          <button class="shop-btn ${btcAfford ? '' : 'disabled'}" data-key="btc" data-qty="1">${fmtMoney(btcMktPrice)}</button>
          <button class="shop-btn shop-btn-bulk ${p.money >= btcMktPrice * 10 ? '' : 'disabled'}" data-key="btc" data-qty="10">×10</button>
          <button class="shop-btn shop-btn-bulk ${p.money >= btcMktPrice * 100 ? '' : 'disabled'}" data-key="btc" data-qty="100">×100</button>
        </div>
      </div>
    </div>`;

    // 解锁前提：设备全升级 + 已买 AI；之后再按余额接近售价逐步显示
    const gear = p.gearComplete;
    const bondsShown = bondsQty > 0 || (gear && p.isRevealed(bondsInv.price));
    const btcShown   = btcQty   > 0 || (gear && p.isRevealed(btcInv.price));
    el.closest('.panel-section').style.display = (bondsShown || btcShown) ? '' : 'none';
    el.innerHTML = (bondsShown ? bondsItem : '') + (btcShown ? btcItem : '');
    el.querySelectorAll('.shop-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => onBuy(btn.dataset.key, parseInt(btn.dataset.qty || '1')));
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
      const effectKey = { keyboard: 'effect.keyboard', monitor: 'effect.monitor', chair: 'effect.chair' }[def.type];
      const effect    = (next && effectKey) ? t(effectKey) : '';

      return `<div class="shop-item ${disabled ? 'locked' : ''}">
        <div class="shop-item-header">
          <span>${next ? next.emoji : (current ? current.emoji : '⬜')} ${t(def.labelKey)}</span>
          ${statusLabel}
        </div>
        <div class="shop-item-desc">${nextDesc}</div>
        ${effect ? `<div class="shop-effect neon-green">${effect}</div>` : ''}
        <div class="shop-item-footer">
          ${nextBonus ? `<span class="shop-yield neon-cyan">${nextBonus}</span>` : '<span></span>'}
          <button class="shop-btn ${disabled ? 'disabled' : ''}" data-type="${def.type}">${btnLabel}</button>
        </div>
      </div>`;
    }).join('');

    // 自动产出（叠加购买、价格 ×1.15）：自动脚本(早) / 後輩(主任后)
    const staffCard = (id, shown) => {
      const def = AUTO_STAFF.find(s => s.id === id);
      if (!def || !shown) return '';
      const count  = p.autoStaff?.[id] || 0;
      const scriptDef = AUTO_STAFF.find(s => s.id === id);
      const maxed  = (id === 'kohai' && count >= p.kohaiMax) || (scriptDef?.maxCount && count >= scriptDef.maxCount);
      const price  = p.autoStaffPrice(id);
      const afford = !maxed && p.money >= price;
      const capLabel = id === 'kohai' ? `${count}/${p.kohaiMax}` : scriptDef?.maxCount ? `${count}/${scriptDef.maxCount}` : `×${count}`;
      const cap    = `<span class="${id === 'kohai' ? 'dim' : 'shop-count neon-cyan'}" style="font-size:10px">${capLabel}</span>`;
      const btnLabel = maxed ? t('upgrade.maxed') : fmtMoney(price);
      return `<div class="shop-item ${(maxed || !afford) ? 'locked' : ''}">
        <div class="shop-item-header">
          <span>${def.emoji} ${tf(def, 'label')}</span>
          ${cap}
        </div>
        <div class="shop-item-desc">${tf(def, 'desc')}</div>
        <div class="shop-item-footer">
          <span class="shop-yield neon-green">+${def.clicksPerSec} clicks/s</span>
          <button class="shop-btn ${(maxed || !afford) ? 'disabled' : ''}" data-staff="${id}">${btnLabel}</button>
        </div>
      </div>`;
    };
    const scriptCount = p.autoStaff?.script || 0;
    const scriptMaxed = scriptCount >= 20;
    const scriptRetired = p.careerLevel >= 2 && scriptCount === 0; // 升主任前没买过就不再显示
    const scriptHtml = staffCard('script',
      !scriptRetired && !scriptMaxed &&
      (scriptCount > 0 || (p.careerLevel < 2 && p.isRevealed(p.autoStaffPrice('script')))));
    const kohaiHtml  = staffCard('kohai', p.canApplyForKohai);

    el.closest('.panel-section').style.display = (tiersHtml || scriptHtml || kohaiHtml) ? '' : 'none';
    el.innerHTML = scriptHtml + tiersHtml + kohaiHtml;  // 脚本最前(便宜/早)，後輩最后

    el.querySelectorAll('.shop-btn:not(.disabled)').forEach(btn => {
      if (btn.dataset.staff) btn.addEventListener('click', () => onBuy('staff:' + btn.dataset.staff));
      else btn.addEventListener('click', () => onBuy(btn.dataset.type));
    });
  }

  function renderLifeShop(p, onBuy) {
    const el = document.getElementById('life-shop');
    if (!el) return;

    const allItems = SHOP_ITEMS.filter(item => {
      if (!item.unlockNeed) return true;
      const n = item.unlockNeed;
      const minVal = p['min' + n.stat[0].toUpperCase() + n.stat.slice(1)];
      return (minVal ?? p[n.stat] ?? 100) <= n.below;
    });
    el.closest('.panel-section').style.display = allItems.length ? '' : 'none';

    function renderItem(item) {
      const price = item.costFn ? item.costFn(p) : item.cost;
      const canAfford = p.money >= price;
      const onCooldown = !p.canUseShop(item.id, item.cooldown);
      const ch = item.changes || {};
      const statDepleted = (ch.energy    < 0 && p.energy    <= 0) ||
                           (ch.health    < 0 && p.health    <= 0) ||
                           (ch.happiness < 0 && p.happiness <= 0);
      const disabled = !canAfford || onCooldown || statDepleted;
      const cooldownLabel = onCooldown ? t('shop.cooldown') : '';
      return `<div class="shop-item ${disabled ? 'locked' : ''}">
        <div class="shop-item-header">
          <span>${item.emoji} ${tf(item, 'label')}${cooldownLabel}</span>
        </div>
        <div class="shop-item-desc">${tf(item, 'desc')}</div>
        <div class="shop-item-footer">
          <button class="shop-btn ${disabled ? 'disabled' : ''}" data-id="${item.id}">
            ${price === 0 ? t('shop.free') : fmtMoney(price)}
          </button>
        </div>
      </div>`;
    }

    const daily = allItems.filter(i => i.cat === 'daily');
    const fun   = allItems.filter(i => i.cat === 'fun');

    const dailyLabel = t('shop.cat.daily');
    const funLabel   = t('shop.cat.fun');

    el.innerHTML =
      (daily.length ? `<div class="shop-cat-label">${dailyLabel}</div>` + daily.map(renderItem).join('') : '') +
      (fun.length   ? `<div class="shop-cat-label">${funLabel}</div>`   + fun.map(renderItem).join('')   : '');

    el.querySelectorAll('.shop-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => onBuy(btn.dataset.id));
    });
  }

  // ── event popup ────────────────────────────────────────────
  let _tw = null;
  function fmtChanges(changes) {
    if (!changes) return '';
    const parts = [];
    if (changes.money)     parts.push((changes.money > 0 ? '+' : '') + fmtMoney(changes.money));
    if (changes.energy)    parts.push((changes.energy > 0 ? '⚡+' : '⚡') + changes.energy);
    if (changes.health)    parts.push((changes.health > 0 ? '💚+' : '💔') + changes.health);
    if (changes.happiness) parts.push((changes.happiness > 0 ? '😊+' : '😞') + changes.happiness);
    return parts.join('　');
  }

  const EVENT_TIMEOUT = 30000;

  let _slideOutTimer = null;

  function _slideOutPopup(popup) {
    popup.classList.remove('show');
    popup.style.opacity = '0';
    _slideOutTimer = setTimeout(() => {
      popup.classList.add('hidden');
      popup.style.opacity = '';
      _slideOutTimer = null;
    }, 550);
  }

  function showEventPopup(event, onChoice) {
    const popup      = document.getElementById('event-popup');
    const countdown  = document.getElementById('popup-countdown');
    const textEl     = document.getElementById('popup-text');
    const choicesEl  = document.getElementById('popup-choices');
    const resultEl   = document.getElementById('popup-result');

    // 取消任何待执行的 slideOut 回调，防止它把新弹窗藏掉
    if (_slideOutTimer) { clearTimeout(_slideOutTimer); _slideOutTimer = null; }

    // 重置
    clearTimeout(_eventTimer);
    choicesEl.innerHTML = '';
    resultEl.classList.add('hidden');
    resultEl.textContent = '';
    countdown.classList.remove('depleting');
    countdown.style.transition = 'none';
    countdown.style.width = '100%';

    // 滑入（重置 opacity 防止上次 slideOut 留下 opacity:0）
    popup.style.opacity = '';
    popup.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => popup.classList.add('show')));

    const choices = event.choices && event.choices.length ? event.choices
      : [{ label: t('choice.continue'), reply: '', changes: {}, tone: 'neutral' }];

    function commitChoice(c) {
      clearTimeout(_eventTimer);
      choicesEl.innerHTML = '';
      countdown.style.transition = 'none';
      countdown.style.width = '0%';
      const changesStr = fmtChanges(c.changes);
      const finish = () => {
        if (changesStr) {
          resultEl.textContent = changesStr;
          resultEl.className = 'event-popup-result ' + (c.tone || 'neutral');
          resultEl.classList.remove('hidden');
        }
        const closeDelay = c._delay != null ? c._delay : 900;
        setTimeout(() => { _slideOutPopup(popup); resultEl.classList.add('hidden'); onChoice(c); }, closeDelay);
      };
      if (c.reply) typewrite(textEl, c.reply, 18, finish);
      else finish();
    }

    typewrite(textEl, event.text, 15, () => {
      choices.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = c.label;
        btn.addEventListener('click', () => commitChoice(c));
        choicesEl.appendChild(btn);
      });

      // 倒计时条启动
      requestAnimationFrame(() => requestAnimationFrame(() => {
        countdown.style.transition = `width ${EVENT_TIMEOUT}ms linear`;
        countdown.classList.add('depleting');
      }));

      // 超时自动选第一项
      _eventTimer = setTimeout(() => {
        const def = choices.find(c => c.tone === 'neutral') || choices[0];
        commitChoice(def);
      }, EVENT_TIMEOUT);
    });
  }

  function hideEventPopup() {
    clearTimeout(_eventTimer);
    const popup = document.getElementById('event-popup');
    _slideOutPopup(popup);
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
  function spawnFloat(amount, isCombo) {
    const btn = document.getElementById('btn-click');
    if (!btn) return;
    const el  = document.createElement('div');
    el.className = 'float-num' + (isCombo ? ' combo' : '');
    el.textContent = typeof amount === 'number' ? '+¥' + amount.toLocaleString() : amount;
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
    el.style.opacity = '1';
    el.style.transition = '';
    el.classList.remove('hidden');
    setTimeout(() => {
      el.style.transition = 'opacity 1.5s ease';
      el.style.opacity = '0';
      setTimeout(() => {
        el.classList.add('hidden');
        el.style.opacity = '';
        el.style.transition = '';
      }, 1500);
    }, 6500);
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

  function renderAchievements(p) {
    const el = document.getElementById('achievement-display');
    if (!el) return;
    const unlocked = p.achievements || [];
    const section  = el.closest('.panel-section');
    if (!unlocked.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    el.innerHTML = `
      <div class="ach-count dim" style="font-size:12px;text-align:right;margin-bottom:4px">${unlocked.length} / ${ACHIEVEMENTS.length}</div>
      <div class="achievement-grid">
        ${ACHIEVEMENTS.filter(a => unlocked.includes(a.id)).map(a => `
          <div class="achievement-tile" data-tip="${tf(a,'desc')}">
            <span class="ach-emoji">${a.emoji}</span>
            <span class="ach-label">${tf(a,'label')}</span>
          </div>`).join('')}
      </div>`;

    document.querySelectorAll('.ach-tooltip').forEach(t => t.remove());
    let _achTip = null;
    el.querySelectorAll('.achievement-tile').forEach(tile => {
      tile.addEventListener('mouseenter', () => {
        _achTip = document.createElement('div');
        _achTip.className = 'ach-tooltip';
        _achTip.textContent = tile.dataset.tip;
        document.body.appendChild(_achTip);
        const r = tile.getBoundingClientRect();
        _achTip.style.left = Math.max(4, r.left + r.width / 2 - _achTip.offsetWidth / 2) + 'px';
        _achTip.style.top  = (r.top - _achTip.offsetHeight - 6) + 'px';
      });
      tile.addEventListener('mouseleave', () => { _achTip?.remove(); _achTip = null; });
    });
  }

  return {
    show, updateStats, updateClock, startMoneyAnim,
    renderAutoShop, renderInvestShop, renderUpgradeShop, renderLifeShop, renderAchievements,
    showEventPopup, hideEventPopup,
    spawnFloat, spawnAutoFloat, showMarketNews, appendLog, toast,
    showStoryBadge, showStories,
  };
})();
