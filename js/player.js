'use strict';

class Player {
  constructor(name) {
    this.name      = name;
    this.day       = 1;
    this.energy    = 80;
    this.health    = 85;
    this.happiness = 60;
    this.money     = 0;           // 当前余额
    this.totalEarned = 0;         // 累计赚过的钱

    // ── 点击系统 ──
    this.baseClickValue = 100;    // ¥/click 基础值
    this.clickUpgrades  = {};     // { upgradeId: count }

    // ── 设备等级 ──
    this.tierLevels = { keyboard: 0, monitor: 0, chair: 0, ai: 0 };

    // ── 自动化（Cookie Clicker 式，可叠加）──
    this.autoStaff = { kohai: 0 };   // 後輩人数
    this.autoClickAccum = 0;          // 累积小数点击

    // ── 投资组合 { qty, totalCost } ──
    this.portfolio = {
      bonds:  { qty: 0, totalCost: 0 },
      stocks: { qty: 0, totalCost: 0 },
      btc:    { qty: 0, totalCost: 0 },
    };

    // ── 市场行情 (multiplier, 基础1.0) ──
    this.market = {
      bonds:  1.0,
      stocks: 1.0,
      btc:    1.0,
    };

    this.realizedGains = 0;   // 累计已实现收益

    // ── 故事档案（只存真实经历）──
    this.storyLog  = [];   // [{ title, emoji, text, reply, day, time, tone }]

    // ── 状态 ──
    this.company   = '株式会社ブラック商事';
    this.lastTick  = Date.now();
    this.nextEventAt = Date.now() + randMs(5, 12); // 5-12分钟后第一个事件
    this.shopCooldowns = {};
    this.eventLog  = [];
    this.lastSaved = null;
  }

  // ── 点击收益（受体力影响）────────────────────────────────────
  get clickValue() {
    const base = this.baseClickValue + this.upgradeBonus;
    const energyMult = this.energy > 60 ? 1.0
                     : this.energy > 30 ? 0.7
                     : 0.4;
    return Math.floor(base * energyMult);
  }

  get upgradeBonus() {
    return this.getTierBonus ? this.getTierBonus() : 0;
  }

  // ── 自动点击速率 clicks/sec ──────────────────────────────────
  get autoClickPerSec() {
    let rate = (this.autoStaff?.kohai || 0) * 0.1;  // 後輩每人 0.1 clicks/sec
    const ai = this.tierLevels?.ai || 0;
    if (ai >= 1) rate += 0.2;   // AI Lv1: +0.2/sec（每5秒1次）
    if (ai >= 2) rate += 0.3;   // AI Lv2: 累计 0.5/sec（每2秒1次）
    if (ai >= 3) rate += 1.5;   // AI Lv3: 累计 2/sec
    return rate;
  }

  // ── 被动收益 / 秒 ────────────────────────────────────────────
  get passivePerSec() {
    return Object.entries(INVESTMENTS).reduce((sum, [key, inv]) => {
      const qty = this.portfolio[key]?.qty || 0;
      return sum + qty * inv.basePerSec * (this.market[key] || 1);
    }, 0);
  }

  // ── 未实现收益（纸面盈亏）────────────────────────────────────
  get unrealizedGain() {
    return Object.entries(INVESTMENTS).reduce((sum, [key, inv]) => {
      const pos = this.portfolio[key];
      if (!pos || pos.qty === 0) return sum;
      const currentPrice = inv.price * (this.market[key] || 1);
      return sum + (currentPrice * pos.qty - pos.totalCost);
    }, 0);
  }

  // ── 当前市值 ──────────────────────────────────────────────────
  positionValue(type) {
    const pos = this.portfolio[type];
    if (!pos || pos.qty === 0) return 0;
    return INVESTMENTS[type].price * (this.market[type] || 1) * pos.qty;
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

    // 自动点击累积（後輩 + AI）
    this.autoClickAccum = (this.autoClickAccum || 0) + this.autoClickPerSec * secs;
    let autoClicks = 0;
    while (this.autoClickAccum >= 1) {
      this.autoClickAccum -= 1;
      const earned = this.clickValue;  // 享受设备加成，但不消耗体力
      this.money       += earned;
      this.totalEarned += earned;
      autoClicks++;
    }

    // 状态缓慢衰减（每小时）
    const hrs = secs / 3600;
    this.energy    = clamp(this.energy    - hrs * 3,   0, 100);
    this.happiness = clamp(this.happiness - hrs * 2,   0, 100);
    this.health    = clamp(this.health    - hrs * 0.5, 0, 100);

    this.day = 1 + Math.floor(this.totalEarned / 500000);
    return { autoClicks }; // 告知 game.js 是否要显示浮动数字
  }

  // ── 点击 ─────────────────────────────────────────────────────
  click() {
    const earned = this.clickValue;
    this.money       += earned;
    this.totalEarned += earned;
    // 点击消耗体力
    this.energy = clamp(this.energy - 0.05, 0, 100);
    return earned;
  }

  // ── 购买 ─────────────────────────────────────────────────────
  canAfford(cost) { return this.money >= cost; }

  buyInvestment(type) {
    const inv = INVESTMENTS[type];
    if (!inv || !this.canAfford(inv.price)) return false;
    this.money -= inv.price;
    const pos = this.portfolio[type];
    pos.qty++;
    pos.totalCost += inv.price;   // 记录买入成本
    return true;
  }

  sellInvestment(type) {
    const pos = this.portfolio[type];
    const inv = INVESTMENTS[type];
    if (!pos || pos.qty === 0) return null;
    const currentValue = this.positionValue(type);
    const gain         = currentValue - pos.totalCost;
    this.money        += currentValue;
    this.realizedGains += gain;
    pos.qty       = 0;
    pos.totalCost = 0;
    return { gain, value: currentValue, qty: pos.qty };
  }

  autoStaffPrice(id) {
    const def   = AUTO_STAFF.find(a => a.id === id);
    const count = (this.autoStaff?.[id] || 0);
    return Math.round(def.cost * Math.pow(def.costScale, count));
  }

  buyAutoStaff(id) {
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

  getAIInterval() {
    const level = this.tierLevels.ai || 0;
    const tier  = AI_TIERS.find(t => t.level === level);
    return tier ? tier.autoClickInterval : null;
  }

  buyShopItem(id) {
    const item = SHOP_ITEMS.find(s => s.id === id);
    if (!item) return false;
    if (!this.canAfford(item.cost)) return false;
    if (!this.canUseShop(id, item.cooldown)) return false;
    this.money -= item.cost;
    this.modify(item.changes);
    this.shopCooldowns[id] = Date.now();
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

  addStory({ title, emoji, text, reply, tone }) {
    this.storyLog.unshift({
      title, emoji, text, reply, tone,
      day:  this.day,
      time: tokyoTimeStr(),
      id:   Date.now(),
    });
  }

  toJSON() { return { ...this, lastSaved: new Date().toISOString() }; }

  static fromJSON(d) {
    const p = new Player(d.name);
    Object.assign(p, d);
    // 旧存档兼容：portfolio 值为数字时迁移为对象格式
    for (const key of ['bonds', 'stocks', 'btc']) {
      if (typeof p.portfolio[key] === 'number') {
        const qty = p.portfolio[key];
        p.portfolio[key] = { qty, totalCost: qty * (INVESTMENTS[key]?.price || 0) };
      }
    }
    p.lastTick = Date.now();
    return p;
  }
}

// ── 投资定义 ─────────────────────────────────────────────────
const INVESTMENTS = {
  bonds: {
    id: 'bonds', label: '日本国債', emoji: '📜',
    price: 50000,
    basePerSec: 1.5,   // ¥/sec per unit (≈¥5,400/hr)
    desc: '稳定，无聊，但不会让你破产。',
    riskLabel: '低风险',
  },
  stocks: {
    id: 'stocks', label: '株式（日経）', emoji: '📈',
    price: 200000,
    basePerSec: 8.0,   // ¥/sec per unit (≈¥28,800/hr)
    desc: '有涨有跌。市场就是这样。',
    riskLabel: '中风险',
  },
  btc: {
    id: 'btc', label: '比特币', emoji: '₿',
    price: 500000,
    basePerSec: 25.0,  // ¥/sec per unit (≈¥90,000/hr) but very volatile
    desc: '它可能让你财务自由，也可能让你哭着离开东京。',
    riskLabel: '高风险',
  },
};

// ── 点击升级定义 ──────────────────────────────────────────────
// 分级升级：键盘 / 显示器（每级替换上一级，只保留当前等级）
const KEYBOARD_TIERS = [
  { level: 1, label: 'メカニカルキーボード', emoji: '⌨️', bonus: 80,   cost: 5000,   desc: '敲起来有感觉了，效率提升。' },
  { level: 2, label: '人間工学キーボード',   emoji: '⌨️', bonus: 250,  cost: 20000,  desc: '手腕不疼了，可以敲更久。' },
  { level: 3, label: '静電容量無接点キーボード', emoji: '⌨️', bonus: 700, cost: 80000, desc: '打字声音很好听，你感觉自己很厉害。' },
];

const MONITOR_TIERS = [
  { level: 1, label: '4Kモニター',           emoji: '🖥️', bonus: 200,  cost: 15000,  desc: '代码看起来更贵了。' },
  { level: 2, label: 'ウルトラワイド曲面',   emoji: '🖥️', bonus: 600,  cost: 60000,  desc: '视野开阔，bug 也更容易发现了。' },
  { level: 3, label: 'デュアル4K',           emoji: '🖥️', bonus: 1500, cost: 200000, desc: '两块屏幕。你终于感觉像个真正的程序员了。' },
];

const CHAIR_TIERS = [
  { level: 1, label: 'ゲーミングチェア',  emoji: '🪑', bonus: 300,  cost: 30000,  desc: '比公司的椅子好多了。腰不疼了。' },
  { level: 2, label: 'エルゴチェア',      emoji: '🪑', bonus: 800,  cost: 120000, desc: '你开始理解为什么程序员都爱这个。' },
  { level: 3, label: 'ハーマンミラー',    emoji: '🪑', bonus: 2000, cost: 500000, desc: '¥50万的椅子。坐上去的第一秒你觉得值了。' },
];

// AI 自动点击（分级，每级加快点击频率）
const AI_TIERS = [
  { level: 1, label: '基本AIアシスト',   emoji: '🤖', autoClickInterval: 5000, cost: 200000,   desc: '每5秒自动敲一次代码。你还是需要在的。' },
  { level: 2, label: '上位AIアシスト',   emoji: '🤖', autoClickInterval: 2000, cost: 800000,   desc: '每2秒。你开始怀疑自己存在的意义。' },
  { level: 3, label: 'AGIアシスト',      emoji: '🤖', autoClickInterval: 500,  cost: 5000000,  desc: '你只是在看它工作。这就是社畜的终点站吗？' },
];

// ── 自动化员工（可叠加购买）──────────────────────────────────
const AUTO_STAFF = [
  {
    id: 'kohai', label: '後輩エンジニア', emoji: '👨‍💻',
    cost: 30000,
    clicksPerSec: 0.1,   // 每10秒1次
    desc: '刚毕业的后辈，帮你敲一些代码。速度有限，但总比没有强。',
    costScale: 1.15,     // 每多买一个，价格×1.15
  },
];

// ── 生活消费定义 ─────────────────────────────────────────────
const SHOP_ITEMS = [
  { id: 'rest',     label: '回家休息',  emoji: '🛋️', cost: 0,     cooldown: 3_600_000, changes: { energy: 25, health: 5  }, desc: '体力+25，健康+5',  reply: '你换上睡衣躺下来。最好的几分钟。',                          tone: 'good' },
  { id: 'conbini',  label: '便利店',    emoji: '🏪', cost: 350,   cooldown: 1_800_000, changes: { energy: 10, happiness: 5  }, desc: '体力+10，快乐+5',  reply: '饭团还是饭团。"ありがとうございます"，今天听到最清晰的一句话。', tone: 'neutral' },
  { id: 'ramen',    label: '拉面',      emoji: '🍜', cost: 950,   cooldown: 7_200_000, changes: { energy: 25, happiness: 18 }, desc: '体力+25，快乐+18', reply: '豚骨拉面。你对着白烟发了很久的呆。没有人跟你说话。没关系。',     tone: 'good' },
  { id: 'izakaya',  label: '居酒屋',    emoji: '🍺', cost: 3000,  cooldown: 14_400_000,changes: { energy: -8, happiness: 30 }, desc: '快乐+30，体力-8',  reply: '生啤，枝豆。你听不懂旁边桌在说什么，但热闹的声音已经够了。',     tone: 'good' },
  { id: 'gym',      label: '健身房',    emoji: '💪', cost: 1000,  cooldown: 86_400_000,changes: { health: 20, energy: -10  }, desc: '健康+20，体力-10', reply: '哑铃的重量是世界语言，不需要日语。',                          tone: 'good' },
  { id: 'fujoku',   label: '风俗店',    emoji: '🏩', cost: 12000, cooldown: 0,          changes: { happiness: 40, health: -3  }, desc: '快乐+40，健康-3',  reply: null, tone: 'neutral' },
];

// ── 市场事件 ─────────────────────────────────────────────────
const MARKET_EVENTS = [
  { text: '📉 日経暴落！株式市場が急落しています。', affects: 'stocks', mult: 0.6, tone: 'bad' },
  { text: '📈 日経が年初来高値を更新！', affects: 'stocks', mult: 1.5, tone: 'good' },
  { text: '🏦 日銀が追加利上げを決定。国債利回り上昇。', affects: 'bonds', mult: 1.3, tone: 'good' },
  { text: '₿ 比特币突破历史高点！加密市场狂欢。', affects: 'btc', mult: 2.2, tone: 'good' },
  { text: '₿ 各国加密货币监管收紧，比特币暴跌40%。', affects: 'btc', mult: 0.5, tone: 'bad' },
  { text: '₿ 某交易所疑似跑路，比特币急剧下跌。', affects: 'btc', mult: 0.3, tone: 'bad' },
  { text: '🌍 全球经济衰退预期升温，市场整体下行。', affects: 'all', mult: 0.75, tone: 'bad' },
  { text: '🎉 央行放水！流动性充裕，市场普涨。', affects: 'all', mult: 1.3, tone: 'good' },
];

// ── helpers ───────────────────────────────────────────────────
function clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }
function randMs(minMin, maxMin) { return (minMin + Math.random() * (maxMin - minMin)) * 60000; }
function fmtMoney(n) {
  if (n >= 1_000_000) return '¥' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return '¥' + Math.floor(n / 1000) + 'k';
  return '¥' + Math.floor(n);
}
function tokyoTimeStr() {
  return new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' });
}
function tokyoHour() {
  return parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', hour12: false }), 10);
}
