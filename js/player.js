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

    // ── 投资组合 ──
    this.portfolio = {
      bonds:  0,   // 日本国債
      stocks: 0,   // 株式
      btc:    0,   // 比特币
    };

    // ── 市场行情 (multiplier, 基础1.0) ──
    this.market = {
      bonds:  1.0,
      stocks: 1.0,
      btc:    1.0,
    };

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
    const UP = UPGRADES;
    return Object.entries(this.clickUpgrades).reduce((sum, [id, count]) => {
      const u = UP.find(u => u.id === id);
      return sum + (u ? u.bonus * count : 0);
    }, 0);
  }

  // ── 被动收益 / 秒 ────────────────────────────────────────────
  get passivePerSec() {
    const b = INVESTMENTS;
    return (
      this.portfolio.bonds  * b.bonds.basePerSec  * this.market.bonds  +
      this.portfolio.stocks * b.stocks.basePerSec * this.market.stocks +
      this.portfolio.btc    * b.btc.basePerSec    * this.market.btc
    );
  }

  // ── 每秒 tick（被动收入 + 状态衰减）──────────────────────────
  tick() {
    const now  = Date.now();
    const secs = (now - this.lastTick) / 1000;
    this.lastTick = now;

    const earned = this.passivePerSec * secs;
    if (earned > 0) {
      this.money       += earned;
      this.totalEarned += earned;
    }

    // 状态缓慢衰减（每小时）
    const hrs = secs / 3600;
    this.energy    = clamp(this.energy    - hrs * 3,  0, 100);
    this.happiness = clamp(this.happiness - hrs * 2,  0, 100);
    this.health    = clamp(this.health    - hrs * 0.5, 0, 100);

    // 每24小时 day +1
    this.day = 1 + Math.floor(this.totalEarned / 500000); // 每50万升一天（象征性）
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
    this.portfolio[type]++;
    return true;
  }

  buyUpgrade(id) {
    const u = UPGRADES.find(u => u.id === id);
    if (!u || !this.canAfford(u.cost)) return false;
    this.money -= u.cost;
    this.clickUpgrades[id] = (this.clickUpgrades[id] || 0) + 1;
    return true;
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

  toJSON() { return { ...this, lastSaved: new Date().toISOString() }; }

  static fromJSON(d) {
    const p = new Player(d.name);
    Object.assign(p, d);
    p.lastTick = Date.now(); // reset tick on load
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
const UPGRADES = [
  { id: 'keyboard', label: '人間工学キーボード', emoji: '⌨️', bonus: 80,  cost: 5000,   desc: '手腕不疼了，效率提升。' },
  { id: 'monitor',  label: '4Kモニター',        emoji: '🖥️', bonus: 200, cost: 20000,  desc: '代码看起来更贵了。' },
  { id: 'chair',    label: 'エルゴチェア',      emoji: '🪑', bonus: 500, cost: 80000,  desc: '坐着不累，可以敲更久。' },
  { id: 'ai',       label: 'AIコードアシスト',  emoji: '🤖', bonus: 1500,cost: 300000, desc: '其实你只是在检查AI写的代码。' },
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
