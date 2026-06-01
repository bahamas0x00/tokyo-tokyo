'use strict';

const REVEAL_RATIO = 0.7;  // 余额达到售价的 70% 时，道具出现在商店里
const DAY_SECONDS  = 20;             // 真实秒数 / 1 在职天（年功序列推进速度，可调）
const PROMO_DAYS   = [15, 45, 110, 220];  // 各级晋升所需在职天数（→平社員/主任/係長/課長）

class Player {
  constructor(name) {
    this.name      = name;
    this.day       = 1;
    this.tenureSec = 0;           // 累计在职时长（秒）→ day（年功序列，与收入脱钩）
    this.energy    = 100;         // 新角色满状态
    this.health    = 100;
    this.happiness = 100;
    this.sickUntil = 0;           // 病倒结束时间戳（>now = 正在强制休息）
    this.minEnergy    = 100;      // 历史最低值（生活消费「按需求」解锁用，单调不增）
    this.minHealth    = 100;
    this.minHappiness = 100;
    this.crisisShown  = false;    // 离职危机是否已弹（快乐回升后重置）
    this.money     = 0;           // 当前余额
    this.totalEarned = 0;         // 累计赚过的钱
    this.peakMoney = 0;           // 历史最高余额（渐进解锁用，单调不减）

    // ── 点击系统 ──
    this.baseClickValue = 100;    // ¥/click 基础值
    this.clickUpgrades  = {};     // { upgradeId: count }

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
  get isSick() { return Date.now() < (this.sickUntil || 0); }

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

    // 自动点击累积（後輩 + AI）—— 病倒时暂停工作产出
    const sick = this.isSick;
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
    this.energy    = clamp(this.energy    - hrs * 3   * dm.energy, 0, 100);
    this.happiness = clamp(this.happiness - hrs * 2,              0, 100);
    this.health    = clamp(this.health    - hrs * 0.5 * dm.health, 0, 100);

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
      }
    }

    // 年功序列：在职天数到阈值 → 该触发人事考课（由 game.js 弹窗确认晋升）
    // 不在此直接升级；reviewDue 每 tick 都会返回直到 careerLevel 真正提升（game.js 去重）
    const nextLevel = this.careerLevel + 1;
    const reviewDue = (nextLevel <= 4 && PROMO_DAYS[this.careerLevel] &&
                       this.day >= PROMO_DAYS[this.careerLevel]) ? nextLevel : null;

    return { autoClicks, sickStarted, reviewDue };
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
  // 渐进解锁：历史最高余额达到售价的 REVEAL_RATIO 即显示（之后不再隐藏）
  isRevealed(cost) { return (this.peakMoney || 0) >= cost * REVEAL_RATIO; }
  // 投资解锁前提：键盘/显示器/椅子全升级 + 已买 AI（引导玩家先升级设备再投资）
  get gearComplete() {
    const t = this.tierLevels || {};
    return (t.keyboard >= 1) && (t.monitor >= 1) && (t.chair >= 1) && (t.ai >= 1);
  }
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
    p.peakMoney = Math.max(p.peakMoney || 0, p.money || 0);  // 渐进解锁基准
    // 属性系统新字段（旧档兼容）
    if (p.sickUntil    == null) p.sickUntil    = 0;
    if (p.minEnergy    == null) p.minEnergy    = p.energy;
    if (p.minHealth    == null) p.minHealth    = p.health;
    if (p.minHappiness == null) p.minHappiness = p.happiness;
    if (p.crisisShown  == null) p.crisisShown  = false;
    if (p.tenureSec    == null) p.tenureSec    = 0;   // 旧档：从 0 开始累在职时长
    p.lastTick = Date.now();
    return p;
  }
}

// ── 投资定义 ─────────────────────────────────────────────────
const INVESTMENTS = {
  bonds: {
    id: 'bonds', label: '日本国债', label_ja: '日本国債', label_en: 'JGB Bond', emoji: '📜',
    price: 50000,
    basePerSec: 1.5,
    desc:    '稳定，无聊，但绝不归零。买了就忘。',
    desc_ja: '安定、退屈、でもゼロにはならない。買って忘れる。',
    desc_en: 'Stable, boring, but never zero. Buy and forget.',
    canSell: false,
  },
  btc: {
    id: 'btc', label: '比特币', label_ja: 'ビットコイン', label_en: 'Bitcoin', emoji: '₿',
    price: 500000,
    basePerSec: 20.0,
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
  { level: 1, label: '人体工学键盘', label_ja: '人間工学キーボード', label_en: 'Ergonomic Keyboard', emoji: '⌨️', bonus: 250, cost: 10000,  statBonus: {},
    desc:    '手腕不疼了，可以敲更久。一次解锁，永久有效。',
    desc_ja: '手首が痛くない、もっと長く打てる。一度解放、永久有効。',
    desc_en: 'Wrists stop aching, type longer. One-time unlock, permanent.' },
];

const MONITOR_TIERS = [
  { level: 1, label: '带鱼屏曲面显示器', label_ja: 'ウルトラワイド曲面', label_en: 'Ultrawide Curved', emoji: '🖥️', bonus: 600, cost: 60000,  statBonus: {},
    desc:    '视野开阔，bug 也更容易发现了。一次解锁，永久有效。',
    desc_ja: '視野が広い、バグも見つけやすい。一度解放、永久有効。',
    desc_en: 'Wide view, bugs easier to spot. One-time unlock, permanent.' },
];

const CHAIR_TIERS = [
  { level: 1, label: '人体工学椅', label_ja: 'エルゴチェア', label_en: 'Ergonomic Chair', emoji: '🪑', bonus: 800, cost: 120000, statBonus: {},
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
    clicksPerSec: 0.3,   // 升主任后压榨后辈，每个 = 3 个脚本，比买 AI 爽
    desc:    '刚毕业的后辈，被你安排敲代码。压榨起来比买 AI 爽多了。',
    desc_ja: '新卒の後輩。コードを書かせる。AIを買うよりずっと爽快だ。',
    desc_en: 'A fresh-grad junior you put to work. Far more satisfying than buying AI.',
    costScale: 1.15,     // 每多买一个，价格×1.15
  },
];

// ── 生活消费定义 ─────────────────────────────────────────────
const SHOP_ITEMS = [
  { id: 'rest', label: '工位趴一会', label_ja: '仮眠（デスク）', label_en: 'Desk nap', emoji: '😴', cost: 0, cooldown: 1_800_000, changes: { energy: 12 },
    desc: '体力+12', desc_ja: '体力+12', desc_en: 'Energy+12',
    reply:    '你趴在键盘上眯了十分钟。醒来时，脸上印着 Enter 键。',
    reply_ja: 'キーボードに突っ伏して十分の仮眠。起きたら頬にEnterキーの跡。',
    reply_en: 'Ten minutes face-down on the keyboard. You wake with an Enter key printed on your cheek.', tone: 'neutral' },
  { id: 'conbini', label: '便利店', label_ja: 'コンビニ', label_en: 'Convenience store', emoji: '🏪', cost: 350, cooldown: 1_800_000, changes: { energy: 10, happiness: 5 },
    desc: '体力+10，快乐+5', desc_ja: '体力+10 幸福+5', desc_en: 'Energy+10 Mood+5',
    reply:    '饭团还是饭团。"ありがとうございます"，今天听到最清晰的一句话。',
    reply_ja: 'おにぎり、またおにぎり。「ありがとうございます」、今日いちばんはっきり聞こえた言葉。',
    reply_en: 'Onigiri, again. "Arigatou gozaimasu" — the clearest words you heard all day.', tone: 'neutral' },
  { id: 'ramen', label: '拉面', label_ja: 'ラーメン', label_en: 'Ramen', emoji: '🍜', cost: 950, cooldown: 7_200_000, changes: { energy: 25, happiness: 18 }, unlockNeed: { stat: 'energy', below: 40 },
    desc: '体力+25，快乐+18', desc_ja: '体力+25 幸福+18', desc_en: 'Energy+25 Mood+18',
    reply:    '豚骨拉面。你对着白烟发了很久的呆。没有人跟你说话。没关系。',
    reply_ja: '豚骨ラーメン。湯気をぼんやり眺める。誰も話しかけてこない。それでいい。',
    reply_en: 'Tonkotsu ramen. You stare into the steam. Nobody talks to you. That\'s fine.', tone: 'good' },
  { id: 'izakaya', label: '居酒屋', label_ja: '居酒屋', label_en: 'Izakaya', emoji: '🍺', cost: 3000, cooldown: 14_400_000, changes: { energy: -8, happiness: 30 }, unlockNeed: { stat: 'happiness', below: 50 },
    desc: '快乐+30，体力-8', desc_ja: '幸福+30 体力-8', desc_en: 'Mood+30 Energy-8',
    reply:    '生啤，枝豆。你听不懂旁边桌在说什么，但热闹的声音已经够了。',
    reply_ja: '生ビール、枝豆。隣の席の会話は分からないけど、賑やかな音だけで十分。',
    reply_en: 'Draft beer, edamame. You can\'t follow the next table, but the lively noise is enough.', tone: 'good' },
  { id: 'gym', label: '健身房', label_ja: 'ジム', label_en: 'Gym', emoji: '💪', cost: 1000, cooldown: 86_400_000, changes: { health: 20, energy: -10 }, unlockNeed: { stat: 'health', below: 60 },
    desc: '健康+20，体力-10', desc_ja: '健康+20 体力-10', desc_en: 'Health+20 Energy-10',
    reply:    '哑铃的重量是世界语言，不需要日语。',
    reply_ja: 'ダンベルの重さは世界共通言語。日本語はいらない。',
    reply_en: 'The weight of a dumbbell is a universal language. No Japanese needed.', tone: 'good' },
  { id: 'gohome', label: '回家睡一觉', label_ja: '家でぐっすり', label_en: 'Sleep at home', emoji: '🛏️', cost: 2500, cooldown: 28_800_000, changes: { energy: 35, health: 10 }, unlockNeed: { stat: 'energy', below: 35 },
    desc: '体力+35，健康+10', desc_ja: '体力+35 健康+10', desc_en: 'Energy+35 Health+10',
    reply:    '你赶上了末班车，久违地躺在自己的床上。明天还要上班，但今晚是你的。',
    reply_ja: '終電に間に合った。久しぶりに自分のベッドで眠る。明日も仕事。でも今夜は自分のものだ。',
    reply_en: 'You catch the last train and lie in your own bed for once. Work again tomorrow — but tonight is yours.', tone: 'good' },
  { id: 'fujoku', label: '风俗店', label_ja: '風俗店', label_en: 'Nightlife', emoji: '🏩', cost: 12000, cooldown: 0, changes: { happiness: 40, health: -3 }, unlockNeed: { stat: 'happiness', below: 30 },
    desc: '快乐+40，健康-3', desc_ja: '幸福+40 健康-3', desc_en: 'Mood+40 Health-3',
    reply: null, tone: 'neutral' },
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
