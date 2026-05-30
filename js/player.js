'use strict';

class Player {
  constructor(name) {
    this.name        = name;
    this.day         = 1;
    this.energy      = 80;
    this.health      = 85;
    this.happiness   = 60;
    this.work        = 65;
    this.savings     = 50000;
    this.salary      = 220000;   // monthly
    this.company     = '株式会社ブラック商事';
    this.lastOnline  = Date.now();
    this.nextEventAt = Date.now() + randBetween(3, 8) * 60000; // first event 3-8 min
    this.shopCooldowns = {};   // { shopId: timestamp }
    this.eventLog    = [];
    this.lastSaved   = null;
  }

  get title() {
    if (this.day <  30) return '新卒社員';
    if (this.day <  90) return '平社員';
    if (this.day < 180) return '主任';
    return '係長';
  }

  // hourly income rate
  get hourlyRate() { return Math.round(this.salary / 720); }

  clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }

  modify(ch = {}) {
    if (ch.energy    != null) this.energy    = this.clamp(this.energy    + ch.energy);
    if (ch.health    != null) this.health    = this.clamp(this.health    + ch.health);
    if (ch.happiness != null) this.happiness = this.clamp(this.happiness + ch.happiness);
    if (ch.work      != null) this.work      = this.clamp(this.work      + ch.work);
    if (ch.savings   != null) this.savings   = Math.max(-999999, this.savings + ch.savings);
  }

  // Calculate offline earnings + stat decay since lastOnline
  applyOfflineProgress() {
    const now     = Date.now();
    const elapsed = now - this.lastOnline;   // ms
    const hours   = elapsed / 3_600_000;

    const earned  = Math.floor(hours * this.hourlyRate);
    const daysPassed = Math.floor(elapsed / 86_400_000);

    this.modify({
      savings:   earned,
      happiness: -Math.floor(hours * 1.5),   // -1.5/hr
      health:    -Math.floor(hours * 0.4),   // -0.4/hr
      energy:    Math.floor(hours * 2),      // +2/hr regen (capped)
    });

    this.day += daysPassed;
    this.lastOnline = now;

    return { earned, hours: Math.round(hours * 10) / 10 };
  }

  canUseShop(id, cooldownMs) {
    const last = this.shopCooldowns[id] || 0;
    return Date.now() - last >= cooldownMs;
  }

  useShop(id) { this.shopCooldowns[id] = Date.now(); }

  scheduleNextEvent() {
    this.nextEventAt = Date.now() + randBetween(8, 20) * 60000; // 8-20 min
  }

  addLog(text, tone = 'neutral') {
    this.eventLog.unshift({ time: tokyoTimeStr(), text, tone });
    if (this.eventLog.length > 30) this.eventLog.pop();
  }

  toJSON() { return { ...this, lastSaved: new Date().toISOString() }; }

  static fromJSON(d) {
    const p = new Player(d.name);
    Object.assign(p, d);
    return p;
  }
}

// ── helpers ───────────────────────────────────────────────────
function randBetween(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

function tokyoTimeStr() {
  return new Date().toLocaleTimeString('ja-JP', {
    timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit',
  });
}
function tokyoHour() {
  return parseInt(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', hour12: false }), 10
  );
}
function currentPhaseLabel() {
  const h = tokyoHour();
  if (h >= 6  && h < 9)  return '通勤 · 朝';
  if (h >= 9  && h < 18) return '業務中';
  if (h >= 18 && h < 23) return '夜の部';
  return '深夜';
}
