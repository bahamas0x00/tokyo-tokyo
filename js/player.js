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

    // ── 状态 ──
    this.company   = '株式会社ブラック商事';
    this.lastTick  = Date.now();
    this.nextEventAt = Date.now() + randMs(5, 12); // 5-12分钟后第一个事件
    this.shopCooldowns = {};
    this.eventLog  = [];
    this.lastSaved = null;
  }

  // ── 职级（独立于天数，可贿赂提升）────────────────────────────
  get title() { return ['新卒社員','平社員','主任','係長','課長'][this.careerLevel] || '新卒社員'; }
  get canApplyForKohai() { return this.careerLevel >= 2; } // 主任以上

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
    const bondsQty = this.portfolio.bonds?.qty || 0;
    const btcQty   = this.portfolio.btc?.qty   || 0;
    return bondsQty * INVESTMENTS.bonds.basePerSec
         + btcQty   * INVESTMENTS.btc.basePerSec * this.btcMarket;
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

    // 自动点击累积（後輩 + AI）
    this.autoClickAccum = (this.autoClickAccum || 0) + this.autoClickPerSec * secs;
    let autoClicks = 0;
    while (this.autoClickAccum >= 1) {
      this.autoClickAccum -= 1;
      const earned = this.clickValue;
      this.money       += earned;
      this.totalEarned += earned;
      // 統計後輩貢獻（後輩速率占比）
      const kohaiRate = (this.autoStaff?.kohai || 0) * 0.1;
      const totalRate = this.autoClickPerSec || 1;
      this.kohaiEarned = (this.kohaiEarned || 0) + earned * (kohaiRate / totalRate);
      autoClicks++;
    }

    // 状态缓慢衰减（每小时）
    const hrs = secs / 3600;
    this.energy    = clamp(this.energy    - hrs * 3,   0, 100);
    this.happiness = clamp(this.happiness - hrs * 2,   0, 100);
    this.health    = clamp(this.health    - hrs * 0.5, 0, 100);

    this.day = 1 + Math.floor(this.totalEarned / 500000);

    // 自然晋升（慢，需要工作表现 > 70）
    const naturalThresholds = [30, 90, 180, 365]; // 各职级所需天数
    const nextLevel = this.careerLevel + 1;
    if (nextLevel <= 4 && naturalThresholds[this.careerLevel] &&
        this.day >= naturalThresholds[this.careerLevel] && this.work > 70) {
      this.careerLevel = nextLevel;
    }

    return { autoClicks };
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
    if (type === 'btc') pos.totalCost = (pos.totalCost || 0) + inv.price;
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
    p.lastTick = Date.now();
    return p;
  }
}

// ── 投资定义 ─────────────────────────────────────────────────
const INVESTMENTS = {
  bonds: {
    id: 'bonds', label: '日本国債', emoji: '📜',
    price: 50000,
    basePerSec: 1.5,
    desc: '稳定，无聊，但绝不归零。买了就忘。',
    canSell: false,
  },
  btc: {
    id: 'btc', label: '比特币', emoji: '₿',
    price: 500000,
    basePerSec: 20.0,
    desc: '可能让你财务自由，也可能让你哭着离开东京。',
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
  { level: 1, label: '人間工学キーボード', emoji: '⌨️', bonus: 250, cost: 20000,  statBonus: {}, desc: '手腕不疼了，可以敲更久。一次解锁，永久有效。' },
];

const MONITOR_TIERS = [
  { level: 1, label: 'ウルトラワイド曲面', emoji: '🖥️', bonus: 600, cost: 60000,  statBonus: {}, desc: '视野开阔，bug 也更容易发现了。一次解锁，永久有效。' },
];

const CHAIR_TIERS = [
  { level: 1, label: 'エルゴチェア', emoji: '🪑', bonus: 800, cost: 120000, statBonus: {}, desc: '你开始理解为什么程序员都爱这个。一次解锁，永久有效。' },
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

// ── BTC 市场事件（weight 控制概率）───────────────────────────
const MARKET_EVENTS = [
  // 小涨（常见）
  { text: '₿ 机构买入信号！比特币小幅回升。',      text_en: '₿ Institutional buying signal. BTC recovers.',         text_ja: '₿ 機関投資家の買いシグナル。BTC小幅回復。',     mult: 1.25, weight: 4, tone: 'good' },
  { text: '₿ 比特币突破近期阻力位。',              text_en: '₿ Bitcoin breaks through resistance.',               text_ja: '₿ ビットコインが直近の抵抗線を突破。',           mult: 1.5,  weight: 3, tone: 'good' },
  // 大涨（少见）
  { text: '₿ 某国宣布比特币为法定货币！',          text_en: '₿ A nation adopts Bitcoin as legal tender!',         text_ja: '₿ ある国がビットコインを法定通貨に採用！',       mult: 2.0,  weight: 1, tone: 'good' },
  { text: '₿ 比特币突破历史高点！加密市场狂欢。',  text_en: '₿ Bitcoin breaks all-time high! Crypto euphoria.',   text_ja: '₿ ビットコinが過去最高値を更新！暗号市場が沸く。', mult: 2.5, weight: 1, tone: 'good' },
  // 小跌（常见）
  { text: '₿ 获利了结，比特币小幅回调。',          text_en: '₿ Profit-taking. BTC dips slightly.',               text_ja: '₿ 利益確定売り。BTC小幅下落。',                 mult: 0.8,  weight: 4, tone: 'bad' },
  { text: '₿ 监管消息面偏空，市场情绪谨慎。',      text_en: '₿ Regulatory headwinds. Market cautious.',          text_ja: '₿ 規制ニュース重し。市場は慎重姿勢。',           mult: 0.65, weight: 3, tone: 'bad' },
  // 大跌（少见）
  { text: '₿ 各国监管收紧，比特币暴跌40%！',      text_en: '₿ Global crackdown! Bitcoin -40%.',                 text_ja: '₿ 各国規制強化。ビットコイン40%暴落！',         mult: 0.45, weight: 2, tone: 'bad' },
  { text: '₿ 某交易所疑似跑路，市场恐慌性抛售！', text_en: '₿ Exchange suspected exit scam. Panic selling!',    text_ja: '₿ 取引所が突然閉鎖疑惑。パニック売り！',        mult: 0.28, weight: 2, tone: 'bad' },
  // 崩盘（罕见）
  { text: '₿ 比特币遭遇闪崩！价格暴跌80%。',      text_en: '₿ Bitcoin flash crash! Price down 80%.',           text_ja: '₿ ビットコインがフラッシュクラッシュ！-80%。', mult: 0.15, weight: 1, tone: 'bad', isCrash: true },
  // 归零（极罕见）
  { text: '₿ 比特币归零。一切在一夜之间消失。',    text_en: '₿ Bitcoin collapses to zero. Everything gone overnight.', text_ja: '₿ ビットコインが限りなくゼロへ。一夜にしてすべてが消えた。', mult: 0.03, weight: 0.3, tone: 'bad', isCrash: true },
];

function pickMarketEvent() {
  const total = MARKET_EVENTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of MARKET_EVENTS) { r -= e.weight; if (r <= 0) return e; }
  return MARKET_EVENTS[MARKET_EVENTS.length - 1];
}

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
