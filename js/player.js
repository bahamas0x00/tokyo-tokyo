'use strict';

const REVEAL_RATIO = 0.7;  // 余额达到售价的 70% 时，道具出现在商店里
const DAY_SECONDS  = 60;             // 真实秒数 / 1 在职天（年功序列推进速度，可调）
const PROMO_DAYS   = [15, 45, 110, 220];  // 各级晋升所需在职天数（→平社員/主任/係長/課長）

class Player {
  constructor(name) {
    this.name      = name;
    this.day       = 1;
    this.tenureSec = 0;           // 累计在职时长（秒）→ day（年功序列，与收入脱钩）
    this.energy    = 100;         // 新角色满状态
    this.health    = 100;
    this.happiness = 100;
    this.sickUntil     = 0;       // 病倒结束时间戳（>now = 正在强制休息）
    this.collapseUntil = 0;       // 体力归零趴桌昏睡结束时间戳
    this.seenEvents    = [];      // 已见普通事件 key（全见完后重洗）
    this.collapseCount = 0;       // 累计趴桌次数
    this.shopUseCounts = {};      // 各生活消费使用次数
    this.maxCombo      = 0;       // 历史最高连击数
    this.btcPeak       = 1.0;    // BTC历史最高倍率
    this.btcValley     = 1.0;    // BTC历史最低倍率
    this.minEnergy    = 100;      // 历史最低值（生活消费「按需求」解锁用，单调不增）
    this.minHealth    = 100;
    this.minHappiness = 100;
    this.crisisShown  = false;    // 离职危机是否已弹（快乐回升后重置）
    this.warnCount    = 0;        // 嘴硬警告累计次数（第3次触发 HR 约谈）
    this.money     = 0;           // 当前余额
    this.totalEarned = 0;         // 累计赚过的钱
    this.peakMoney = 0;           // 历史最高余额（渐进解锁用，单调不减）

    // ── 点击系统 ──
    this.baseClickValue = 100;    // ¥/click 基础值
    this.clickUpgrades  = {};     // { upgradeId: count }
    this.comboCount     = 0;      // 当前连击数
    this.comboLastClick = 0;      // 上次点击时间戳（ms）

    // ── 设备等级 ──
    this.tierLevels = { keyboard: 0, monitor: 0, chair: 0, ai: 0 };

    // ── 自动化（Cookie Clicker 式，可叠加）──
    this.autoStaff = { script: 0, kohai: 0 };   // 自动脚本 / 後輩人数
    this.autoClickAccum  = 0;         // 累积小数点击
    this.kohaiEarned     = 0;         // 後輩累计产出（统计压榨成果）

    // ── 职级 ──
    this.careerLevel  = 0;            // 0=新卒 1=平社員 2=主任 3=係長 4=課長
    this.bribeCooldown = 0;           // 贿赂冷却时间戳

    // ── HR 申请系统 ──
    this.hrPending    = false;
    this.hrPendingEnd = 0;
    this.hrCooldown   = 0;

    // ── 投资组合 ──
    this.portfolio = {
      bonds: { qty: 0 },                    // 买入不可卖，只记张数
      btc:   { qty: 0, totalCost: 0 },      // 可卖出，记成本
    };

    // ── BTC 市场行情 (multiplier, 基础1.0) ──
    this.btcMarket = 1.0;

    this.realizedGains = 0;

    // ── 故事档案（只存真实经历）──
    this.storyLog  = [];   // [{ title, emoji, text, reply, day, time, tone }]

    // ── 成就 ──
    this.achievements  = [];   // 已解锁成就 id 列表
    this.everCollapsed = false; // 曾经趴桌
    this.everSick      = false; // 曾经病倒

    // ── 状态 ──
    this.company   = '株式会社ブラック商事';
    this.lastTick  = Date.now();
    this.nextEventAt = Date.now() + randMs(5, 12); // 5-12分钟后第一个事件
    this.shopCooldowns = {};
    this.eventLog  = [];
    this.lastSaved = null;
  }

  // ── 职级（独立于天数，可贿赂提升）────────────────────────────
  get title() {
    return (typeof careerTitle === 'function')
      ? careerTitle(this.careerLevel)
      : (['新卒社員','平社員','主任','係長','課長'][this.careerLevel] || '新卒社員');
  }
  get canApplyForKohai() { return this.careerLevel >= 2; } // 主任以上

  // ── 心情士气倍率（影响一切「工作」收益：点击 + 自动点击）──
  get moodFactor() {
    const h = this.happiness;
    return h > 70 ? 1.1 : h > 40 ? 1.0 : h > 20 ? 0.85 : 0.7;
  }
  get isSick()      { return Date.now() < (this.sickUntil     || 0); }
  get isCollapsed() { return Date.now() < (this.collapseUntil || 0); }

  // ── 点击收益（受体力 + 心情影响）────────────────────────────
  get clickValue() {
    const base = this.baseClickValue + this.upgradeBonus;
    const e = this.energy;
    const energyMult = e > 60 ? 1.0 : e > 40 ? 0.8 : e > 20 ? 0.5 : 0.25;
    return Math.floor(base * energyMult * this.moodFactor);
  }

  get upgradeBonus() {
    return this.getTierBonus ? this.getTierBonus() : 0;
  }

  // ── 自动点击速率 clicks/sec ──────────────────────────────────
  get autoClickPerSec() {
    let rate = 0;  // 各类自动产出（自动脚本/後輩）按各自 clicksPerSec 累加
    for (const s of AUTO_STAFF) rate += (this.autoStaff?.[s.id] || 0) * s.clicksPerSec;
    const ai = this.tierLevels?.ai || 0;
    if (ai >= 1) rate += 0.2;   // AI Lv1: +0.2/sec（每5秒1次）
    if (ai >= 2) rate += 0.3;   // AI Lv2: 累计 0.5/sec（每2秒1次）
    if (ai >= 3) rate += 0.5;   // AI Lv3: 累计 1/sec（AGI也只是加速工具，不是印钞机）
    return rate;
  }

  // ── 被动收益 / 秒（投资收益）────────────────────────────────────
  get passivePerSec() {
    const bondsQty = this.portfolio.bonds?.qty || 0;
    const btcQty   = this.portfolio.btc?.qty   || 0;
    return bondsQty * INVESTMENTS.bonds.basePerSec
         + btcQty   * INVESTMENTS.btc.basePerSec * this.btcMarket;
  }

  // ── 每秒总收入（投资被动 + 自动点击）─────────────────────────
  // 财务面板「/sec」用它，避免与自动化面板的产出重复/矛盾
  get totalPerSec() {
    return this.passivePerSec + this.autoClickPerSec * this.clickValue;
  }

  // ── BTC 当前卖出总价 ─────────────────────────────────────────
  get btcCurrentValue() {
    const qty = this.portfolio.btc?.qty || 0;
    return qty * INVESTMENTS.btc.price * this.btcMarket;
  }

  // ── BTC 浮盈 ─────────────────────────────────────────────────
  get btcUnrealizedGain() {
    const pos = this.portfolio.btc;
    if (!pos || pos.qty === 0) return 0;
    return this.btcCurrentValue - (pos.totalCost || 0);
  }

  // ── 每秒 tick（被动收入 + 状态衰减）──────────────────────────
  tick() {
    const now  = Date.now();
    const secs = (now - this.lastTick) / 1000;
    this.lastTick = now;

    // 投资被动收入
    const passiveEarned = this.passivePerSec * secs;
    if (passiveEarned > 0) {
      this.money       += passiveEarned;
      this.totalEarned += passiveEarned;
    }

    // 自动点击累积（後輩 + AI）—— 病倒/趴桌时暂停工作产出
    const sick = this.isSick || this.isCollapsed;
    let autoClicks = 0;
    if (!sick) {
      this.autoClickAccum = (this.autoClickAccum || 0) + this.autoClickPerSec * secs;
      while (this.autoClickAccum >= 1) {
        this.autoClickAccum -= 1;
        const earned = this.clickValue;
        this.money       += earned;
        this.totalEarned += earned;
        // 統計後輩貢獻（後輩速率占比）
        const kohaiRate = (this.autoStaff?.kohai || 0) * 0.3;  // 与 AUTO_STAFF kohai.clicksPerSec 一致
        const totalRate = this.autoClickPerSec || 1;
        this.kohaiEarned = (this.kohaiEarned || 0) + earned * (kohaiRate / totalRate);
        autoClicks++;
      }
    }

    // 状态缓慢衰减（每小时）
    const hrs = secs / 3600;
    const dm  = this.decayMod;  // 设备减缓衰减
    const prevEnergy = this.energy;
    this.energy    = clamp(this.energy    - hrs * 3   * dm.energy, 0, 100);
    this.happiness = clamp(this.happiness - hrs * 20,             0, 100);
    this.health    = clamp(this.health    - hrs * 2   * dm.health, 0, 100);
    let collapseStarted = false;
    if (prevEnergy > 0 && this.energy <= 0 && !this.isCollapsed) {
      this.collapseUntil = now + (2 + Math.random() * 2) * 60000;
      collapseStarted = true;
      this.everCollapsed = true;
      this.collapseCount = (this.collapseCount || 0) + 1;
    }

    this.peakMoney = Math.max(this.peakMoney || 0, this.money);  // 渐进解锁
    // DAY = 在职天数（年功序列）：随真实在职时长推进，与收入脱钩
    this.tenureSec = (this.tenureSec || 0) + secs;
    this.day = 1 + Math.floor(this.tenureSec / DAY_SECONDS);

    // 历史最低值（生活消费「按需求」解锁用，单调不增）
    this.minEnergy    = Math.min(this.minEnergy    ?? this.energy,    this.energy);
    this.minHealth    = Math.min(this.minHealth    ?? this.health,    this.health);
    this.minHappiness = Math.min(this.minHappiness ?? this.happiness, this.happiness);

    // 病倒：健康 < 15 时按概率触发强制休息（5–10 分钟）
    let sickStarted = false;
    if (!sick && this.health < 15) {
      const prob = 1 - Math.pow(1 - 0.012, secs); // ≈1.2%/秒，已折算离线时长
      if (Math.random() < prob) {
        this.sickUntil = now + (5 + Math.random() * 5) * 60000;
        sickStarted = true;
        this.everSick = true;
      }
    }

    // 年功序列：在职天数到阈值 → 该触发人事考课（由 game.js 弹窗确认晋升）
    // 不在此直接升级；reviewDue 每 tick 都会返回直到 careerLevel 真正提升（game.js 去重）
    const nextLevel = this.careerLevel + 1;
    const reviewDue = (nextLevel <= 4 && PROMO_DAYS[this.careerLevel] &&
                       this.day >= PROMO_DAYS[this.careerLevel]) ? nextLevel : null;

    return { autoClicks, sickStarted, reviewDue, collapseStarted };
  }

  // ── 点击 ─────────────────────────────────────────────────────
  // 连击倍率：3秒内持续点击累积，停下即重置
  get comboMult() {
    const c = this.comboCount;
    if (c >= 30) return 2.0;
    if (c >= 15) return 1.5;
    if (c >= 5)  return 1.2;
    return 1.0;
  }

  click() {
    const now = Date.now();
    if (now - this.comboLastClick > 3000) {
      this.comboCount = 1;
    } else {
      this.comboCount++;
    }
    this.comboLastClick = now;
    this.maxCombo = Math.max(this.maxCombo || 0, this.comboCount);

    const mult   = this.comboMult;
    const earned = Math.floor(this.clickValue * mult);
    this.money       += earned;
    this.totalEarned += earned;
    this.peakMoney    = Math.max(this.peakMoney || 0, this.money);
    this.energy    = clamp(this.energy    - 0.05 * mult, 0, 100);
    this.happiness = clamp(this.happiness - 0.03,        0, 100);
    return { value: earned, combo: this.comboCount, mult };
  }

  // ── 购买 ─────────────────────────────────────────────────────
  canAfford(cost) { return this.money >= cost; }
  // 渐进解锁：历史最高余额达到售价的 REVEAL_RATIO 即显示（之后不再隐藏）
  isRevealed(cost) { return (this.peakMoney || 0) >= cost * REVEAL_RATIO; }
  // 投资解锁前提：键盘/显示器/椅子全升级 + 已买 AI（引导玩家先升级设备再投资）
  get gearComplete() {
    const t = this.tierLevels || {};
    return (t.keyboard >= 1) && (t.monitor >= 1) && (t.chair >= 1) && (t.ai >= 1);
  }
  // 贿赂上司买官：花钱跳过熬资历直接晋升（玩梗·有冷却·小概率翻车）
  get bribeCost() {
    return [500000, 2000000, 8000000, 30000000][this.careerLevel] || 0; // 升下一级的贿赂金
  }
  get canBribe() { return this.careerLevel < 4 && Date.now() >= (this.bribeCooldown || 0); }

  // 设备 statBonus = 减缓相关属性衰减（好装备 = 可持续地肝）
  get decayMod() {
    const t = this.tierLevels || {};
    let energy = 1, health = 1;
    if (t.keyboard >= 1) energy *= 0.90;             // 人体工学键盘：体力衰减 −10%
    if (t.chair    >= 1) { energy *= 0.85; health *= 0.95; } // 人体工学椅：体力 −15% / 健康 −5%
    if (t.monitor  >= 1) health *= 0.85;             // 带鱼屏护眼：健康衰减 −15%
    return { energy, health };
  }

  buyInvestment(type) {
    const inv = INVESTMENTS[type];
    const mktPrice = type === 'btc' ? Math.round(inv.price * (this.btcMarket || 1)) : inv.price;
    if (!inv || !this.canAfford(mktPrice)) return false;
    this.money -= mktPrice;
    const pos = this.portfolio[type];
    pos.qty++;
    if (type === 'btc') pos.totalCost = (pos.totalCost || 0) + mktPrice;
    return true;
  }

  sellBtc() {
    const pos = this.portfolio.btc;
    if (!pos || pos.qty === 0) return null;
    const sellValue = this.btcCurrentValue;
    const gain      = sellValue - (pos.totalCost || 0);
    this.money        += sellValue;
    this.realizedGains = (this.realizedGains || 0) + gain;
    pos.qty       = 0;
    pos.totalCost = 0;
    return { gain, value: sellValue };
  }

  autoStaffPrice(id) {
    const def   = AUTO_STAFF.find(a => a.id === id);
    const count = (this.autoStaff?.[id] || 0);
    return Math.round(def.cost * Math.pow(def.costScale, count));
  }

  // 後輩招募上限：随职级解锁，不能无限压榨
  get kohaiMax() {
    return [0, 0, 1, 3, 6][this.careerLevel] || 0;
  }

  buyAutoStaff(id) {
    if (id === 'kohai' && (this.autoStaff?.kohai || 0) >= this.kohaiMax) return false;
    const price = this.autoStaffPrice(id);
    if (!this.canAfford(price)) return false;
    this.money -= price;
    this.autoStaff[id] = (this.autoStaff?.[id] || 0) + 1;
    return true;
  }

  // 分级升级：type = 'keyboard'|'monitor'|'chair'|'ai'
  buyTierUpgrade(type) {
    const tiers = { keyboard: KEYBOARD_TIERS, monitor: MONITOR_TIERS, chair: CHAIR_TIERS, ai: AI_TIERS }[type];
    if (!tiers) return false;
    const current = this.tierLevels[type] || 0;
    const next = tiers.find(t => t.level === current + 1);
    if (!next || !this.canAfford(next.cost)) return false;
    this.money -= next.cost;
    this.tierLevels[type] = next.level;
    if (next.statBonus) this.modify(next.statBonus); // 解锁时一次性结算体力/健康/开心加成（数值待定）
    return next;
  }

  getTierBonus() {
    const types = ['keyboard', 'monitor', 'chair'];
    return types.reduce((sum, type) => {
      const tiers = { keyboard: KEYBOARD_TIERS, monitor: MONITOR_TIERS, chair: CHAIR_TIERS }[type];
      const level = this.tierLevels[type] || 0;
      const tier  = tiers.find(t => t.level === level);
      return sum + (tier ? tier.bonus : 0);
    }, 0);
  }


  buyShopItem(id) {
    const item = SHOP_ITEMS.find(s => s.id === id);
    if (!item) return false;
    if (!this.canAfford(item.cost)) return false;
    if (!this.canUseShop(id, item.cooldown)) return false;
    const ch = item.changes || {};
    if (ch.energy    < 0 && this.energy    <= 0) return false;
    if (ch.health    < 0 && this.health    <= 0) return false;
    if (ch.happiness < 0 && this.happiness <= 0) return false;
    this.money -= item.cost;
    this.modify(item.changes);
    this.shopCooldowns[id] = Date.now();
    this.shopUseCounts = this.shopUseCounts || {};
    this.shopUseCounts[id] = (this.shopUseCounts[id] || 0) + 1;
    return true;
  }

  canUseShop(id, cooldownMs) {
    return Date.now() - (this.shopCooldowns[id] || 0) >= cooldownMs;
  }

  modify(ch = {}) {
    if (ch.energy    != null) this.energy    = clamp(this.energy    + ch.energy,    0, 100);
    if (ch.health    != null) this.health    = clamp(this.health    + ch.health,    0, 100);
    if (ch.happiness != null) this.happiness = clamp(this.happiness + ch.happiness, 0, 100);
    if (ch.money     != null) { this.money += ch.money; if (ch.money > 0) this.totalEarned += ch.money; }
  }

  scheduleNextEvent() {
    this.nextEventAt = Date.now() + randMs(8, 20);
  }

  addLog(text, tone = 'neutral') {
    this.eventLog.unshift({ time: tokyoTimeStr(), text, tone });
    if (this.eventLog.length > 20) this.eventLog.pop();
  }

  unlockAchievement(id) {
    if (!this.achievements) this.achievements = [];
    if (this.achievements.includes(id)) return false;
    this.achievements.push(id);
    return true;
  }

  addStory({ title, emoji, text, reply, tone, key }) {
    this.storyLog.unshift({
      title, emoji, text, reply, tone, key,
      day:  this.day,
      time: tokyoTimeStr(),
      id:   Date.now(),
    });
  }

  toJSON() { return { ...this, lastSaved: new Date().toISOString() }; }

  static fromJSON(d) {
    const p = new Player(d.name);
    Object.assign(p, d);
    // 设备改为一次性解锁：旧存档里 keyboard/monitor/chair 的 lv2/lv3 统一降为 lv1
    if (p.tierLevels) {
      ['keyboard', 'monitor', 'chair'].forEach(k => {
        if (p.tierLevels[k] > 1) p.tierLevels[k] = 1;
      });
    }
    // 迁移旧存档
    const port = p.portfolio;
    if (typeof port.bonds === 'number') port.bonds = { qty: port.bonds };
    if (!port.bonds) port.bonds = { qty: 0 };
    if (typeof port.btc === 'number') port.btc = { qty: port.btc, totalCost: port.btc * INVESTMENTS.btc.price };
    if (!port.btc) port.btc = { qty: 0, totalCost: 0 };
    // 迁移旧 stocks 持仓 → 换算成 bonds
    if (port.stocks?.qty > 0) {
      port.bonds.qty += Math.floor(port.stocks.qty * 200000 / INVESTMENTS.bonds.price);
    }
    delete port.stocks;
    // 迁移旧 market 对象 → btcMarket
    if (d.market?.btc && !d.btcMarket) p.btcMarket = d.market.btc;
    if (!p.btcMarket) p.btcMarket = 1.0;
    delete p.market;
    p.peakMoney = Math.max(p.peakMoney || 0, p.money || 0);  // 渐进解锁基准
    // 属性系统新字段（旧档兼容）
    if (p.sickUntil      == null) p.sickUntil      = 0;
    if (p.collapseUntil  == null) p.collapseUntil  = 0;
    if (p.minEnergy    == null) p.minEnergy    = p.energy;
    if (p.minHealth    == null) p.minHealth    = p.health;
    if (p.minHappiness == null) p.minHappiness = p.happiness;
    if (p.crisisShown  == null) p.crisisShown  = false;
    if (p.warnCount    == null) p.warnCount    = 0;
    if (p.tenureSec      == null) p.tenureSec      = 0;
    if (!p.achievements)         p.achievements   = [];
    if (p.everCollapsed  == null) p.everCollapsed  = false;
    if (p.everSick       == null) p.everSick       = false;
    if (!Array.isArray(p.seenEvents))   p.seenEvents   = [];
    if (p.collapseCount  == null) p.collapseCount  = 0;
    if (!p.shopUseCounts)         p.shopUseCounts  = {};
    if (p.maxCombo       == null) p.maxCombo       = 0;
    if (p.btcPeak        == null) p.btcPeak        = p.btcMarket || 1.0;
    if (p.btcValley      == null) p.btcValley      = p.btcMarket || 1.0;
    p.lastTick = Date.now();
    return p;
  }
}

// ── 投资定义 ─────────────────────────────────────────────────
const INVESTMENTS = {
  bonds: {
    id: 'bonds', label: '日本国债', label_ja: '日本国債', label_en: 'JGB Bond', emoji: '📜',
    price: 50000,
    basePerSec: 5,
    desc:    '稳定，无聊，但绝不归零。买了就忘。',
    desc_ja: '安定、退屈、でもゼロにはならない。買って忘れる。',
    desc_en: 'Stable, boring, but never zero. Buy and forget.',
    canSell: false,
  },
  btc: {
    id: 'btc', label: '比特币', label_ja: 'ビットコイン', label_en: 'Bitcoin', emoji: '₿',
    price: 200000,
    basePerSec: 4.0,
    desc:    '可能让你财务自由，也可能让你哭着离开东京。',
    desc_ja: '経済的自由をくれるかも。泣きながら東京を去るかも。',
    desc_en: 'Could set you free, or send you home crying.',
    canSell: true,
  },
};

// ── 点击升级定义 ──────────────────────────────────────────────
// 键盘 / 显示器 / 椅子：一次性解锁（买一次即拥有，不再重复购买）
//   bonus    = ¥/点击 加成（永久）
//   statBonus= 体力/健康/开心 加成占位（数值待定）。买入时一次性结算，
//              想好后填入即可，例：椅子 statBonus: { health: 10 }。
//              若要改成「持续被动」效果，在 Player.tick() 里另行处理。
const KEYBOARD_TIERS = [
  { level: 1, label: '人体工学键盘', label_ja: '人間工学キーボード', label_en: 'Ergonomic Keyboard', emoji: '⌨️', bonus: 10, cost: 10000,  statBonus: {},
    desc:    '手腕不疼了，可以敲更久。一次解锁，永久有效。',
    desc_ja: '手首が痛くない、もっと長く打てる。一度解放、永久有効。',
    desc_en: 'Wrists stop aching, type longer. One-time unlock, permanent.' },
];

const MONITOR_TIERS = [
  { level: 1, label: '带鱼屏曲面显示器', label_ja: 'ウルトラワイド曲面', label_en: 'Ultrawide Curved', emoji: '🖥️', bonus: 20, cost: 60000,  statBonus: {},
    desc:    '视野开阔，bug 也更容易发现了。一次解锁，永久有效。',
    desc_ja: '視野が広い、バグも見つけやすい。一度解放、永久有効。',
    desc_en: 'Wide view, bugs easier to spot. One-time unlock, permanent.' },
];

const CHAIR_TIERS = [
  { level: 1, label: '人体工学椅', label_ja: 'エルゴチェア', label_en: 'Ergonomic Chair', emoji: '🪑', bonus: 25, cost: 120000, statBonus: {},
    desc:    '你开始理解为什么程序员都爱这个。一次解锁，永久有效。',
    desc_ja: 'なぜエンジニアが愛するのか分かってきた。一度解放、永久有効。',
    desc_en: 'You get why devs love these. One-time unlock, permanent.' },
];

// AI 自动点击（分级，每级加快点击频率）
const AI_TIERS = [
  { level: 1, label: '基础AI助手', label_ja: '基本AIアシスト', label_en: 'Basic AI Assist',   emoji: '🤖', autoClickInterval: 5000, cost: 80000,
    desc:    '每5秒自动敲一次代码。你还是需要在的。',
    desc_ja: '5秒ごとに自動でコードを書く。まだ君が必要。',
    desc_en: 'Auto-types code every 5s. Still needs you around.' },
  { level: 2, label: '高级AI助手', label_ja: '上位AIアシスト', label_en: 'Pro AI Assist',   emoji: '🤖', autoClickInterval: 2000, cost: 800000,
    desc:    '每2秒。你开始怀疑自己存在的意义。',
    desc_ja: '2秒ごと。自分の存在意義を疑い始める。',
    desc_en: 'Every 2s. You start questioning your purpose.' },
  { level: 3, label: 'AGI助手', label_ja: 'AGIアシスト', label_en: 'AGI Assist',      emoji: '🤖', autoClickInterval: 500,  cost: 5000000,
    desc:    '你只是在看它工作。这就是社畜的终点站吗？',
    desc_ja: 'ただ眺めているだけ。これが社畜の終着駅か？',
    desc_en: 'You just watch it work. Is this the end of the line?' },
];

// ── 自动化员工（可叠加购买）──────────────────────────────────
const AUTO_STAFF = [
  {
    id: 'script', label: '自动脚本', label_ja: 'オートスクリプト', label_en: 'Auto-script', emoji: '🖱️',
    cost: 1000,
    clicksPerSec: 0.1,   // 廉价早期自动产出（Cookie Clicker Cursor 式）
    desc:    '你写的挂机脚本，自动敲点代码。便宜，前期就能挂上。',
    desc_ja: '放置スクリプト。勝手にコードを叩く。安くて序盤から回せる。',
    desc_en: 'An idle macro that types code for you. Cheap, runs from the start.',
    costScale: 1.15,
  },
  {
    id: 'kohai', label: '后辈工程师', label_ja: '後輩エンジニア', label_en: 'Junior Engineer', emoji: '👨‍💻',
    cost: 30000,
    clicksPerSec: 0.15,  // 升主任后压榨后辈，每个 ≈ 1.5 个脚本
    desc:    '刚毕业的后辈，被你安排敲代码。压榨起来比买 AI 爽多了。',
    desc_ja: '新卒の後輩。コードを書かせる。AIを買うよりずっと爽快だ。',
    desc_en: 'A fresh-grad junior you put to work. Far more satisfying than buying AI.',
    costScale: 1.15,     // 每多买一个，价格×1.15
  },
];

// ── 生活消费定义 ─────────────────────────────────────────────
const SHOP_ITEMS = [
  { id: 'rest', label: '工位趴一会', label_ja: '仮眠（デスク）', label_en: 'Desk nap', emoji: '😴', cost: 0, cooldown: 300_000, changes: { energy: 12 },
    desc: '体力+12', desc_ja: '体力+12', desc_en: 'Energy+12',
    reply:    '你趴在键盘上眯了十分钟。醒来时，脸上印着 Enter 键。',
    reply_ja: 'キーボードに突っ伏して十分の仮眠。起きたら頬にEnterキーの跡。',
    reply_en: 'Ten minutes face-down on the keyboard. You wake with an Enter key printed on your cheek.', tone: 'neutral' },
  { id: 'conbini', label: '便利店', label_ja: 'コンビニ', label_en: 'Convenience store', emoji: '🏪', cost: 1000, cooldown: 0, changes: { energy: 10, happiness: 5 },
    desc: '体力+10，快乐+5', desc_ja: '体力+10 幸福+5', desc_en: 'Energy+10 Mood+5',
    reply:    '又是饭团。¥200，热量380kcal，服务全程不需要说日语。\n便利店是外国人在东京的救命稻草。',
    reply_ja: 'またおにぎり。200円、カロリー380kcal、日本語不要。\nコンビニは東京在住外国人の命綱だ。',
    reply_en: 'Onigiri again. ¥200, 380kcal, zero Japanese required.\nConvenience stores are a foreign resident\'s best friend.', tone: 'good' },
  { id: 'ramen', label: '拉面', label_ja: 'ラーメン', label_en: 'Ramen', emoji: '🍜', cost: 2500, cooldown: 0, changes: { energy: 25, happiness: 18 }, unlockNeed: { stat: 'energy', below: 82 },
    desc: '体力+25，快乐+18', desc_ja: '体力+25 幸福+18', desc_en: 'Energy+25 Mood+18',
    reply:    '豚骨拉面，¥2500，热量：不算了。\n汤有点咸，但一滴没剩——这叫尊重厨师。\n值。',
    reply_ja: '豚骨ラーメン、2500円、カロリー：数えない。\nスープちょっとしょっぱい、でも完飲——これが職人へのリスペクト。\n最高。',
    reply_en: 'Tonkotsu ramen, ¥2500, calories: not counting.\nA bit salty, but you finish every drop — that\'s how you respect the chef.\nWorth it.', tone: 'good' },
  { id: 'izakaya', label: '居酒屋', label_ja: '居酒屋', label_en: 'Izakaya', emoji: '🍺', cost: 3000, cooldown: 0, changes: { energy: -8, happiness: 30 }, unlockNeed: { stat: 'happiness', below: 80 },
    desc: '快乐+30，体力-8', desc_ja: '幸福+30 体力-8', desc_en: 'Mood+30 Energy-8',
    reply:    '生啤+枝豆，居酒屋入门套餐。旁边那桌聊什么完全听不懂，\n但笑声能听懂，够了。',
    reply_ja: '生ビールと枝豆、居酒屋の基本セット。隣の会話は全然わからない、\nでも笑い声はわかる。それで十分。',
    reply_en: 'Draft beer + edamame. The izakaya starter pack. No idea what the next table is saying,\nbut laughter needs no translation. Good enough.', tone: 'good' },

  { id: 'gohome', label: '回家睡一觉', label_ja: '家でぐっすり', label_en: 'Sleep at home', emoji: '🛏️', cost: 8000, cooldown: 0, changes: { energy: 100, health: 10 }, unlockNeed: { stat: 'energy', below: 70 },
    desc: '体力全回，健康+10', desc_ja: '体力全回 健康+10', desc_en: 'Energy full restore · Health+10',
    reply:    '赶上末班车，倒在自己床上。明天继续，今晚先关机。\n这已经很好了。',
    reply_ja: '終電に間に合って自分のベッドに倒れ込む。明日もある、今夜はシャットダウン。\n十分すぎる。',
    reply_en: 'Made the last train. Collapse into your own bed. Work tomorrow, shutdown tonight.\nThis is plenty.', tone: 'good' },
  { id: 'fujoku', label: '风俗店', label_ja: '風俗店', label_en: 'Nightlife', emoji: '🏩', cost: 35000, cooldown: 0, changes: { happiness: 15, health: -12, energy: -60 }, unlockNeed: { stat: 'happiness', below: 80 },
    desc: '快乐+15，体力-60，健康-12', desc_ja: '幸福+15 体力-60 健康-12', desc_en: 'Mood+15 Energy-60 Health-12',
    reply: null, tone: 'neutral' },
];

// ── BTC 市场事件（weight 控制概率）───────────────────────────
const MARKET_EVENTS = [
  // 中涨（常见）
  { text: '₿ 机构大量买入，比特币强势反弹。',       text_en: '₿ Institutions accumulate. BTC surges.',              text_ja: '₿ 機関が大量購入。BTC急反発。',                 mult: 1.8,  weight: 5, tone: 'good' },
  { text: '₿ 比特币突破关键阻力，多头爆发。',       text_en: '₿ Bulls break resistance. BTC rockets.',             text_ja: '₿ 重要な抵抗線を突破。強気相場爆発。',           mult: 2.2,  weight: 4, tone: 'good' },
  // 暴涨（少见）
  { text: '₿ 某国宣布比特币为法定货币！全网狂欢！', text_en: '₿ Nation adopts BTC as legal tender! Market euphoria!', text_ja: '₿ ある国がBTCを法定通貨に！市場が沸騰！',       mult: 3.5,  weight: 2, tone: 'good' },
  { text: '₿ 比特币突破历史高点！散户全面入场！',   text_en: '₿ BTC all-time high! Retail FOMO kicks in!',         text_ja: '₿ BTCが過去最高値を更新！個人投資家が殺到！',   mult: 5.0,  weight: 1, tone: 'good' },
  // 中跌（常见）
  { text: '₿ 获利了结，比特币大幅回调。',           text_en: '₿ Mass profit-taking. BTC corrects sharply.',        text_ja: '₿ 大規模な利益確定。BTC急落。',                 mult: 0.55, weight: 4, tone: 'bad' },
  { text: '₿ 监管重锤落地，市场信心崩溃。',         text_en: '₿ Regulatory crackdown crushes confidence.',         text_ja: '₿ 規制の鉄槌。市場の信頼が崩壊。',               mult: 0.4,  weight: 3, tone: 'bad' },
  // 暴跌（少见）
  { text: '₿ 巨鲸集体出货，比特币雪崩！',           text_en: '₿ Whales dump hard. BTC avalanche!',                 text_ja: '₿ クジラが一斉に売却。BTC大暴落！',             mult: 0.2,  weight: 2, tone: 'bad', isCrash: true },
  { text: '₿ 某交易所疑似跑路，全网踩踏！',         text_en: '₿ Exchange exit scam. Panic stampede!',              text_ja: '₿ 取引所が逃亡疑惑。パニック売り殺到！',         mult: 0.1,  weight: 1, tone: 'bad', isCrash: true },
  // 归零（极罕见）
  { text: '₿ 比特币归零。一切在一夜之间消失。',     text_en: '₿ Bitcoin collapses to zero. Everything gone overnight.', text_ja: '₿ BTCがゼロへ。一夜にしてすべてが消えた。',  mult: 0.03, weight: 0.2, tone: 'bad', isCrash: true },
];

function pickMarketEvent(mkt = 1) {
  // 均值回归：行情极低时只抽涨的事件，避免永久趴底
  const pool = mkt < 0.3 ? MARKET_EVENTS.filter(e => e.mult >= 1) : MARKET_EVENTS;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of pool) { r -= e.weight; if (r <= 0) return e; }
  return pool[pool.length - 1];
}

// ── helpers ───────────────────────────────────────────────────
function clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }
function randMs(minMin, maxMin) { return (minMin + Math.random() * (maxMin - minMin)) * 60000; }
function fmtMoney(n) {
  if (n >= 1_000_000) return '¥' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 10_000)    return '¥' + (n / 1000).toFixed(1) + 'k';
  return '¥' + Math.floor(n);
}
// 动画专用：小数更细，让数字一直在跳
function fmtMoneyLive(n) {
  if (n >= 1_000_000) return '¥' + (n / 1_000_000).toFixed(3) + 'M';
  if (n >= 10_000)    return '¥' + (n / 1000).toFixed(2) + 'k';
  return '¥' + Math.floor(n);
}
function tokyoTimeStr() {
  return new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' });
}
function tokyoHour() {
  return parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', hour12: false }), 10);
}

// ── 成就定义 ─────────────────────────────────────────────────
const ACHIEVEMENTS = [
  // 财务
  { id: 'earn_10k',     emoji: '💴', label: '第一桶金',   label_en: 'First Earnings',       label_ja: '初めての稼ぎ',     desc: '累计收入 ¥10,000',       desc_en: 'Total earnings ¥10,000',       desc_ja: '累計¥10,000' },
  { id: 'earn_100k',    emoji: '💵', label: '越来越熟练', label_en: 'Getting the Hang',     label_ja: 'だんだん慣れてきた', desc: '累计收入 ¥100,000',      desc_en: 'Total earnings ¥100,000',      desc_ja: '累計¥100,000' },
  { id: 'earn_1m',      emoji: '💰', label: '百万社畜',   label_en: 'Million Drone',        label_ja: '百万社畜',           desc: '累计收入 ¥1,000,000',    desc_en: 'Total earnings ¥1,000,000',    desc_ja: '累計¥1,000,000' },
  { id: 'earn_10m',     emoji: '🏦', label: '千万打工人', label_en: 'Ten-Million Grind',    label_ja: '千万社畜',           desc: '累计收入 ¥10,000,000',   desc_en: 'Total earnings ¥10,000,000',   desc_ja: '累計¥10,000,000' },
  { id: 'earn_100m',    emoji: '👑', label: '资本家雏形', label_en: 'Proto-Capitalist',     label_ja: '資本家の卵',         desc: '累计收入 ¥100,000,000',  desc_en: 'Total earnings ¥100,000,000',  desc_ja: '累計¥1億' },
  // 设备
  { id: 'got_keyboard', emoji: '⌨️', label: '键盘侠',     label_en: 'Keyboard Warrior',     label_ja: 'キーボード戦士',     desc: '购买人体工学键盘',        desc_en: 'Bought an ergonomic keyboard', desc_ja: '人間工学キーボードを購入' },
  { id: 'got_monitor',  emoji: '🖥️', label: '护眼人士',   label_en: 'Eye Care',             label_ja: '目を労わる',         desc: '购买曲面显示器',          desc_en: 'Bought a curved monitor',      desc_ja: '曲面モニターを購入' },
  { id: 'got_chair',    emoji: '💺', label: '腰椎自救',   label_en: 'Lumbar Support',       label_ja: '腰を守れ',           desc: '购买人体工学椅',          desc_en: 'Bought an ergonomic chair',    desc_ja: '人間工学チェアを購入' },
  { id: 'got_ai',       emoji: '🤖', label: 'AI依赖症',   label_en: 'AI Dependent',         label_ja: 'AI依存症',           desc: '购买AI助手',              desc_en: 'Bought an AI assistant',       desc_ja: 'AIアシスタントを購入' },
  // 职级
  { id: 'promoted_1',   emoji: '📋', label: '不再是新人', label_en: 'No Longer New',        label_ja: '新人じゃなくなった', desc: '晋升至平社員',            desc_en: 'Promoted to regular employee', desc_ja: '平社員に昇格' },
  { id: 'promoted_2',   emoji: '🗂️', label: '开始管人了', label_en: 'First Command',        label_ja: '部下ができた',       desc: '晋升至主任',              desc_en: 'Promoted to team lead',        desc_ja: '主任に昇格' },
  // 自动化
  { id: 'got_kohai',    emoji: '👥', label: '前辈的自觉', label_en: 'Senpai Mode',          label_ja: '先輩の自覚',         desc: '招募第一个後輩',          desc_en: 'Hired your first junior',      desc_ja: '後輩を初採用' },
  { id: 'got_script',   emoji: '🖥️', label: '第一个脚本', label_en: 'First Automation',     label_ja: '初めての自動化',     desc: '购买自动化脚本',          desc_en: 'Bought your first auto-script', desc_ja: '初めて自動スクリプトを購入' },
  // 投资
  { id: 'invested',     emoji: '📈', label: '理财入门',   label_en: 'Investor',             label_ja: '投資家の卵',         desc: '购买第一支日本国债',      desc_en: 'Bought your first JGB bond',   desc_ja: '初めての国債購入' },
  { id: 'btc_holder',   emoji: '₿',  label: '数字资产',   label_en: 'HODL',                 label_ja: 'HODL',               desc: '购买比特币',              desc_en: 'Bought Bitcoin',               desc_ja: 'ビットコインを購入' },
  // 生存
  { id: 'collapsed',       emoji: '💤', label: '社畜极限',     label_en: 'Burnout',            label_ja: '社畜の限界',       desc: '第一次体力耗尽趴桌',           desc_en: 'Collapsed at your desk',          desc_ja: '初めて机に倒れた' },
  { id: 'got_sick',        emoji: '🤒', label: '职业病',       label_en: 'Occupational Hazard',label_ja: '職業病',           desc: '第一次因健康透支病倒',         desc_en: 'Sick from overwork',              desc_ja: '初めて過労で倒れた' },
  { id: 'first_fujoku',    emoji: '🏩', label: '东京夜晚',     label_en: 'Tokyo Night',        label_ja: '東京の夜',         desc: '第一次去风俗店',               desc_en: 'Your first nightlife visit',      desc_ja: '初めて風俗店に行った' },
  // 在职里程碑
  { id: 'day_100',         emoji: '💼', label: 'お疲れ様でした',label_en: 'Veteran',           label_ja: 'お疲れ様でした',   desc: '在职满100天',                  desc_en: '100 days on the job',             desc_ja: '在職100日達成' },
  { id: 'promoted_3',      emoji: '📁', label: '係長になった', label_en: 'Section Chief',      label_ja: '係長になった',     desc: '晋升至係長',                   desc_en: 'Promoted to section chief',       desc_ja: '係長に昇格' },
  { id: 'promoted_4',      emoji: '🏢', label: '課長になった', label_en: 'Department Head',    label_ja: '課長になった',     desc: '晋升至課長',                   desc_en: 'Promoted to department head',     desc_ja: '課長に昇格' },
  // 装备 & 自动化
  { id: 'full_gear',       emoji: '✅', label: 'LGTM',         label_en: 'LGTM',               label_ja: 'LGTM',             desc: '购齐全套人体工学装备',         desc_en: 'Full ergonomic setup unlocked',   desc_ja: '人間工学フルセット完備' },
  { id: 'full_auto',       emoji: '⚡', label: '全自动化',     label_en: 'Full Auto',          label_ja: '全自動化',         desc: '同时拥有AI、脚本和後輩',       desc_en: 'AI + script + junior all active', desc_ja: 'AI・スクリプト・後輩全保有' },
  // 行为梗
  { id: 'triple_collapse', emoji: '🛋️', label: '躺平三连',     label_en: 'Triple Burnout',     label_ja: '三連倒れ',         desc: '趴桌三次',                     desc_en: 'Collapsed at your desk 3 times',  desc_ja: '机に三回倒れた' },
  { id: 'rest_master',     emoji: '🐟', label: '摸鱼达人',     label_en: 'Slack Master',       label_ja: '怠け者の達人',     desc: '工位趴了5次',                  desc_en: 'Desk napped 5 times',             desc_ja: 'デスク仮眠5回' },
  { id: 'ramen_lover',     emoji: '🍜', label: '孤独的美食家', label_en: 'Solo Gourmet',       label_ja: '孤独のグルメ',     desc: '独自吃了5次拉面',              desc_en: 'Ate ramen alone 5 times',         desc_ja: '一人でラーメン5回' },
  { id: 'max_combo',       emoji: '🔥', label: '内卷冠军',     label_en: 'Grind King',         label_ja: '内巻き王',         desc: '达到最高连击倍率（×2.0）',    desc_en: 'Reached max combo ×2.0',          desc_ja: '最大コンボ倍率×2.0達成' },
  // 财务梗
  { id: 'cash_rich',       emoji: '💴', label: '现金为王',     label_en: 'Cash is King',       label_ja: '現金は王様',       desc: '手持余额达到¥10,000,000',      desc_en: 'Balance reached ¥10,000,000',     desc_ja: '残高¥1000万達成' },
  { id: 'btc_moon',        emoji: '🚀', label: 'To the Moon',  label_en: 'To the Moon',        label_ja: 'To the Moon',      desc: 'BTC涨到历史最高5倍',           desc_en: 'BTC peaked at 5× original price', desc_ja: 'BTCが最高値5倍に達した' },
  { id: 'btc_zero',        emoji: '💀', label: '归零了',       label_en: 'Rekt',               label_ja: '帰零',             desc: '亲历BTC崩盘至5%以下',          desc_en: 'Watched BTC crash to near zero',  desc_ja: 'BTCが5%以下に暴落' },
];
