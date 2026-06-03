# 像素场景重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `.pixel-office` 点击区域的像素场景通过真实时钟 × 体力的 9 种状态组合，加上背景微动画、深夜签名时刻、BTC崩盘叠加、後輩工位，变成有情绪叙事的动态场景。

**Architecture:** `game.js` 1s tick 里调用 `updateSceneState()`，给 `#btn-click` 挂两组状态类（`time-*` + `energy-*`）。CSS 用组合选择器响应状态变化，不需要 JS 操作样式。

**Tech Stack:** 纯静态页面，Vanilla JS + CSS + inline SVG。无构建步骤，浏览器打开 `index.html` 验证。

---

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `index.html` | 修改 `.px-skyline` SVG 窗户（加 class）；新增 `.px-ambient`、`.px-kohai-desk`、`#btc-crash-overlay` |
| `style.css` | 替换 `.pixel-office` 背景渐变；新增所有状态规则和动画 |
| `js/game.js` | 新增 `updateSceneState()`，在 1s loop 末尾调用 |

---

## Task 1：给 `.px-skyline` 窗户加 class

**Files:**
- Modify: `index.html:163-172`（窗户 `<rect>` 块）

**背景：** 当前 `.px-skyline` SVG 里的窗户是纯 `<rect>`，没有 class。签名时刻需要"普通窗几乎全灭，只留签名窗"，所以要给窗户分级打 class。

- [ ] **Step 1：给所有现有窗户 `<rect>` 加 `class="px-win"`**

  在 `index.html:164–172` 的 `<g fill="#ffd76a">` 里，每个 `<rect>` 加 `class="px-win"`：

  ```html
  <g fill="#ffd76a">
    <rect class="px-win" x="3"   y="46" width="2" height="2"/><rect class="px-win" x="9"   y="50" width="2" height="2"/><rect class="px-win" x="14"  y="46" width="2" height="2"/>
    <rect class="px-win" x="25"  y="34" width="2" height="2"/><rect class="px-win" x="31"  y="38" width="2" height="2"/><rect class="px-win" x="25"  y="44" width="2" height="2"/>
    <rect class="px-win" x="66"  y="40" width="2" height="2"/><rect class="px-win" x="72"  y="44" width="2" height="2"/><rect class="px-win" x="78"  y="40" width="2" height="2"/>
    <rect class="px-win" x="90"  y="28" width="2" height="2"/><rect class="px-win" x="96"  y="36" width="2" height="2"/><rect class="px-win" x="90"  y="48" width="2" height="2"/>
    <rect class="px-win" x="135" y="36" width="2" height="2"/><rect class="px-win" x="141" y="44" width="2" height="2"/><rect class="px-win" x="135" y="52" width="2" height="2"/>
    <rect class="px-win" x="180" y="30" width="2" height="2"/><rect class="px-win" x="186" y="38" width="2" height="2"/><rect class="px-win" x="180" y="50" width="2" height="2"/>
    <rect class="px-win" x="220" y="38" width="2" height="2"/><rect class="px-win" x="228" y="46" width="2" height="2"/><rect class="px-win" x="220" y="54" width="2" height="2"/>
  </g>
  ```

- [ ] **Step 2：给 4 个窗户加 `px-win--flicker`（异步闪烁），并附 inline animation-delay**

  把下面 4 个 rect 额外加 `class="px-win px-win--flicker"` 和不同的 `style="animation-delay:-Xs"`（负值让动画即刻错相，不用等第一循环结束）：

  ```html
  <rect class="px-win px-win--flicker" style="animation-delay:0s"   x="31"  y="38" width="2" height="2"/>
  <rect class="px-win px-win--flicker" style="animation-delay:-3s"  x="96"  y="36" width="2" height="2"/>
  <rect class="px-win px-win--flicker" style="animation-delay:-7s"  x="141" y="44" width="2" height="2"/>
  <rect class="px-win px-win--flicker" style="animation-delay:-11s" x="228" y="46" width="2" height="2"/>
  ```

  注意：这 4 个 rect 替换 `<g>` 里对应的原 rect（不要重复）。

- [ ] **Step 3：在 `<g>` 外（`.px-skyline` SVG 内）追加 2 个签名窗**

  这两扇窗默认 `opacity:0`，签名时刻 CSS 会把它们设为 `opacity:1`：

  ```html
  <!-- 签名窗：深夜+低体力时唯一亮着的两扇灯 -->
  <rect class="px-win px-win--signature" x="90" y="36" width="2" height="2" fill="#ffd76a" opacity="0"/>
  <rect class="px-win px-win--signature" x="186" y="30" width="2" height="2" fill="#ffd76a" opacity="0"/>
  ```

- [ ] **Step 4：验证**

  浏览器打开 `index.html`，开 DevTools Console：
  ```js
  document.querySelectorAll('.px-win').length        // > 0 即可
  document.querySelectorAll('.px-win--flicker').length // 应为 4
  document.querySelectorAll('.px-win--signature').length // 应为 2
  ```

- [ ] **Step 5：commit**

  ```bash
  git add index.html
  git commit -m "feat: 给px-skyline窗户加class（px-win/flicker/signature）"
  ```

---

## Task 2：新增 HTML 元素（微动画层 + 後輩工位 + BTC叠加）

**Files:**
- Modify: `index.html:194–247`（`.pixel-office` 内部）

- [ ] **Step 1：在 `.px-skyline` 结束标签（`</svg>`，约 line 194）之后插入 `.px-ambient`**

  ```html
  <!-- 背景微动画层 -->
  <div class="px-ambient">
    <!-- 电车：深夜/傍晚时从左向右划过 -->
    <div class="px-train">
      <svg viewBox="0 0 72 10" width="72" height="10" style="image-rendering:pixelated">
        <rect x="0"  y="2" width="72" height="6" fill="#0d1f3c"/>
        <rect x="0"  y="0" width="10" height="4" fill="#0d1f3c"/>
        <rect x="2"  y="3" width="3"  height="3" fill="#ffe066" opacity="0.8"/>
        <rect x="14" y="3" width="3"  height="3" fill="#ffe066" opacity="0.6"/>
        <rect x="26" y="3" width="3"  height="3" fill="#ffe066" opacity="0.6"/>
        <rect x="38" y="3" width="3"  height="3" fill="#ffe066" opacity="0.5"/>
        <rect x="50" y="3" width="3"  height="3" fill="#ffe066" opacity="0.4"/>
        <rect x="62" y="3" width="3"  height="3" fill="#ffe066" opacity="0.3"/>
        <rect x="4"  y="8" width="4"  height="2" fill="#06101e"/>
        <rect x="24" y="8" width="4"  height="2" fill="#06101e"/>
        <rect x="44" y="8" width="4"  height="2" fill="#06101e"/>
        <rect x="64" y="8" width="4"  height="2" fill="#06101e"/>
      </svg>
    </div>
    <!-- 飞机：缓慢斜穿天空（纯 CSS，无 SVG 内容） -->
    <div class="px-plane"></div>
    <!-- 雨丝（深夜+体力中/低时出现） -->
    <div class="px-rain"></div>
  </div>
  ```

- [ ] **Step 2：在 `.px-setup` 前插入 `.px-kohai-desk`（默认 display:none）**

  找到 `index.html` 中 `<div class="px-setup" id="px-main-worker">` 这一行，在它之前插入：

  ```html
  <!-- 後輩工位：careerLevel>=2 且有後輩时显示 -->
  <div class="px-kohai-desk">
    <svg viewBox="0 0 36 28" width="36" height="28" style="image-rendering:pixelated">
      <!-- 小显示器 -->
      <rect x="4"  y="4"  width="20" height="13" fill="#15151f" stroke="#2b2b40" stroke-width="1"/>
      <rect x="6"  y="6"  width="16" height="9"  fill="#041109"/>
      <text x="7" y="13" font-size="3" fill="#39d353" font-family="monospace">...</text>
      <!-- 底座 -->
      <rect x="12" y="17" width="4"  height="3"  fill="#2b2b40"/>
      <rect x="9"  y="20" width="10" height="2"  fill="#2b2b40"/>
      <!-- 键盘 -->
      <rect x="4"  y="22" width="20" height="5"  fill="#c17a1a" stroke="#7a4000" stroke-width="1"/>
      <!-- 後輩像素人 -->
      <rect x="10" y="0"  width="6"  height="5"  fill="#f0b890"/>
      <rect x="9"  y="-2" width="8"  height="4"  fill="#2b2230"/>
      <rect x="6"  y="5"  width="16" height="3"  fill="#6ba4d4"/>
    </svg>
  </div>
  ```

- [ ] **Step 3：在 `.pixel-office` 结束标签前插入 `#btc-crash-overlay`**

  找到 `</div>` 结束 `.pixel-office`（含 `.click-info` 的那个 `</div>`，约 line 247），在它前面插入：

  ```html
  <!-- BTC崩盘叠加（btcMarket <= 0.15 时激活） -->
  <div id="btc-crash-overlay"></div>
  ```

- [ ] **Step 4：浏览器验证结构**

  打开 `index.html`，在 DevTools Elements 面板确认 `.px-ambient`、`.px-kohai-desk`、`#btc-crash-overlay` 都在 `#btn-click` 内。

- [ ] **Step 5：commit**

  ```bash
  git add index.html
  git commit -m "feat: 新增px-ambient微动画层+後輩工位+BTC叠加层HTML结构"
  ```

---

## Task 3：CSS — 时间段天空背景

**Files:**
- Modify: `style.css:309-311`（`.pixel-office` 背景渐变区域）

**背景：** 当前 `style.css:310` 写死了 `background: linear-gradient(#0a1226 ...)` 和 `:hover` 版本。替换为三个时段专属渐变，`time-day/dusk/night` 类由 JS 实时挂载。没有这些类时默认显示 `time-night` 样式（初始化前的毫秒空窗）。

- [ ] **Step 1：替换 `style.css:309-311` 的背景规则**

  找到：
  ```css
  .pixel-office { position: relative; overflow: hidden;
    background: linear-gradient(#0a1226 0%, #0e1830 55%, #16223e 100%); }
  .pixel-office:hover { background: linear-gradient(#0c1530 0%, #122038 55%, #1a2848 100%); }
  ```

  替换为：
  ```css
  .pixel-office { position: relative; overflow: hidden;
    background: linear-gradient(#030609 0%, #060d1a 100%); } /* 默认深夜，JS加载前不闪 */
  /* 时间段天空 */
  .pixel-office.time-day   { background: linear-gradient(#1a4a8c 0%, #2d6abf 60%, #1e3a80 100%); }
  .pixel-office.time-dusk  { background: linear-gradient(#1a0a2e 0%, #7a2a1a 55%, #c05018 100%); }
  .pixel-office.time-night { background: linear-gradient(#030609 0%, #060d1a 100%); }
  .pixel-office:hover { filter: brightness(1.08); }
  ```

  注：`:hover` 原本是覆盖 background，现在改为 brightness 叠加，避免和时间段渐变冲突。

- [ ] **Step 2：验证**

  浏览器打开，在 DevTools Console 运行：
  ```js
  document.getElementById('btn-click').classList.add('time-day')
  // 场景应变成蓝天
  document.getElementById('btn-click').classList.replace('time-day','time-dusk')
  // 场景应变成橙红
  document.getElementById('btn-click').classList.replace('time-dusk','time-night')
  // 场景应变成极暗深蓝
  ```

- [ ] **Step 3：commit**

  ```bash
  git add style.css
  git commit -m "feat: 时间段天空背景CSS（time-day/dusk/night）"
  ```

---

## Task 4：CSS — 体力状态 + 签名时刻

**Files:**
- Modify: `style.css`（在 `.pixel-office.sick, .pixel-office.collapsed` 规则附近，约 style.css:789）

- [ ] **Step 1：在 `.pixel-office.sick` 规则之前插入体力状态和签名时刻规则**

  ```css
  /* ── 体力状态叠加 ── */
  .pixel-office.energy-mid { filter: brightness(0.85); }
  .pixel-office.energy-low { filter: brightness(0.65) saturate(0.7); }

  /* ── 签名时刻：深夜 × 低体力 ── */
  .pixel-office.time-night.energy-low .px-win { opacity: 0.04; }
  .pixel-office.time-night.energy-low .px-win--signature { opacity: 1 !important; }
  .pixel-office.time-night.energy-low .px-screen {
    box-shadow: 0 0 24px rgba(57,211,83,.5), inset 0 0 12px rgba(57,211,83,.2);
  }
  ```

  注意：`.pixel-office.sick` 已经有 `filter: grayscale(.7) brightness(.6)`，它的 specificity 更高，会覆盖 `energy-*`——这是想要的行为（sick 状态优先）。

- [ ] **Step 2：验证签名时刻**

  浏览器 Console：
  ```js
  const el = document.getElementById('btn-click');
  el.classList.add('time-night', 'energy-low');
  // 普通窗户应几乎全灭；签名窗应亮着；显示器光晕增强
  el.classList.remove('energy-low');
  // 窗户恢复正常亮度
  ```

- [ ] **Step 3：commit**

  ```bash
  git add style.css
  git commit -m "feat: 体力状态CSS（energy-mid/low）+签名时刻规则"
  ```

---

## Task 5：CSS — 微动画（电车 / 飞机 / 雨 / 窗户闪烁）

**Files:**
- Modify: `style.css`（在 `.px-scan` 或 `.px-dancer` 附近新增，约 style.css:256–280）

- [ ] **Step 1：在 `.px-monitor-neck` 规则之前（约 style.css:276）插入微动画规则**

  ```css
  /* ── 微动画层 ── */
  .px-ambient {
    position: absolute; inset: 0; pointer-events: none; z-index: 1; overflow: hidden;
  }

  /* 电车 */
  .px-train {
    position: absolute; bottom: 28%; left: 0;
    opacity: 0; pointer-events: none;
    animation: train-slide 50s linear infinite;
  }
  .time-night .px-train { opacity: 0.75; }
  .time-dusk  .px-train { opacity: 0.35; }
  @keyframes train-slide {
    from { transform: translateX(-80px); }
    to   { transform: translateX(calc(100vw + 80px)); }
  }

  /* 飞机（纯CSS点+尾迹） */
  .px-plane {
    position: absolute; top: 12%; left: 0;
    width: 3px; height: 2px;
    background: #fff;
    opacity: 0.5;
    box-shadow: -4px 1px 0 rgba(255,255,255,.3), -8px 1px 0 rgba(255,255,255,.1);
    animation: plane-fly 90s linear infinite, plane-blink 1.2s steps(1) infinite;
  }
  .time-day .px-plane { opacity: 0.2; }
  @keyframes plane-fly {
    from { transform: translate(-20px, 0); }
    to   { transform: translate(calc(100vw + 20px), -15px); }
  }
  @keyframes plane-blink { 50% { opacity: 0; } }

  /* 雨丝（深夜+体力中/低） */
  .px-rain {
    display: none;
    position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(
      105deg,
      transparent 0, transparent 3px,
      rgba(100,160,255,.12) 3px, rgba(100,160,255,.12) 4px
    );
    animation: rain-fall 0.35s linear infinite;
  }
  .time-night.energy-mid .px-rain,
  .time-night.energy-low .px-rain { display: block; }
  @keyframes rain-fall {
    from { background-position: 0 0; }
    to   { background-position: -20px 40px; }
  }

  /* 窗户异步闪烁 */
  .px-win--flicker { animation: win-blink 9s steps(1) infinite; }
  @keyframes win-blink { 0%,100% { opacity: 1; } 40%,60% { opacity: 0; } }
  ```

- [ ] **Step 2：验证电车**

  浏览器 Console：
  ```js
  document.getElementById('btn-click').classList.add('time-night');
  // 电车应从左向右缓缓划过（50s一次，等5s看是否开始移动）
  ```

- [ ] **Step 3：验证雨**

  浏览器 Console：
  ```js
  const el = document.getElementById('btn-click');
  el.classList.add('time-night', 'energy-mid');
  // 场景上应出现细斜雨丝动画
  el.classList.remove('energy-mid');
  // 雨消失
  ```

- [ ] **Step 4：验证窗户闪烁**

  刷新页面，等 10 秒，观察 `.px-win--flicker` 的 4 个窗户是否在异步亮灭。

- [ ] **Step 5：commit**

  ```bash
  git add style.css
  git commit -m "feat: 微动画CSS（电车/飞机/雨/窗户闪烁）"
  ```

---

## Task 6：CSS — 特殊叠加（BTC崩盘 + 後輩工位）

**Files:**
- Modify: `style.css`

- [ ] **Step 1：在 `style.css` 末尾追加以下规则**

  ```css
  /* ── BTC 崩盘叠加 ── */
  #btc-crash-overlay {
    position: absolute; inset: 0; z-index: 10; pointer-events: none;
    background: rgba(255,30,30,.18);
    display: none;
    animation: btc-flash 0.8s steps(1) infinite;
  }
  @keyframes btc-flash { 50% { opacity: 0.3; } }

  /* ── 後輩工位 ── */
  .px-kohai-desk {
    display: none;
    position: relative; z-index: 2;
    margin-right: 16px;
    align-items: flex-end;
  }
  ```

- [ ] **Step 2：验证 BTC 叠加**

  浏览器 Console：
  ```js
  document.getElementById('btc-crash-overlay').style.display = 'block';
  // 场景上应出现红色半透明闪烁层
  document.getElementById('btc-crash-overlay').style.display = 'none';
  ```

- [ ] **Step 3：验证後輩工位**

  浏览器 Console：
  ```js
  document.querySelector('.px-kohai-desk').style.display = 'flex';
  // 主桌左侧应出现一个小工位+後輩像素人
  document.querySelector('.px-kohai-desk').style.display = 'none';
  ```

- [ ] **Step 4：commit**

  ```bash
  git add style.css
  git commit -m "feat: BTC崩盘叠加+後輩工位CSS"
  ```

---

## Task 7：JS — `updateSceneState()` + 接入游戏循环

**Files:**
- Modify: `js/game.js`

**背景：**
- `player.energy` — 体力值 0–100
- `player.btcMarket` — BTC倍率，正常约 1.0，崩盘时可低至 0.02；`<= 0.15` 视为崩盘显示叠加
- `player.autoStaff.kohai` — 後輩人数（0 = 无人）
- `player.careerLevel` — 职级 0–4，>= 2 为主任（才能有後輩）
- 1s loop 在 `game.js:233`；60s auto-save 在 `game.js:264`

- [ ] **Step 1：在 `startLoop()` 函数定义之前（IIFE 顶层）定义 `updateSceneState`**

  在 `js/game.js` 中找到 `function startLoop() {`（约 line 231），在它**之前**插入（不是函数内部，需要在 `Game.init()` 里也能调用）：

  ```js
  function updateSceneState() {
    const h = new Date().getHours();
    const office = document.getElementById('btn-click');
    if (!office) return;

    // 时间类
    office.classList.remove('time-day', 'time-dusk', 'time-night');
    if      (h >= 6 && h < 18) office.classList.add('time-day');
    else if (h >= 18 && h < 22) office.classList.add('time-dusk');
    else                        office.classList.add('time-night');

    // 体力类
    office.classList.remove('energy-high', 'energy-mid', 'energy-low');
    if      (player.energy > 60) office.classList.add('energy-high');
    else if (player.energy >= 30) office.classList.add('energy-mid');
    else                          office.classList.add('energy-low');

    // BTC 崩盘叠加
    const btcOverlay = document.getElementById('btc-crash-overlay');
    if (btcOverlay) btcOverlay.style.display = player.btcMarket <= 0.15 ? 'block' : 'none';

    // 後輩工位
    const kohaiDesk = document.querySelector('.px-kohai-desk');
    if (kohaiDesk) {
      kohaiDesk.style.display =
        (player.careerLevel >= 2 && (player.autoStaff?.kohai || 0) > 0) ? 'flex' : 'none';
    }

    // 签名时刻：深夜+低体力时屏幕显示真实时间
    const isSignature = office.classList.contains('time-night')
                     && office.classList.contains('energy-low');
    const codeEl = document.querySelector('.px-code');
    if (!codeEl) return;
    if (isSignature && !codeEl.dataset.signature) {
      const hh = String(new Date().getHours()).padStart(2, '0');
      const mm = String(new Date().getMinutes()).padStart(2, '0');
      const txt = `${hh}:${mm} // still here\nまだ頑張ってる…\n\n${hh}:${mm} // still here\nまだ頑張ってる…`;
      codeEl.textContent = txt;
      codeEl.dataset.signature = '1';
    } else if (!isSignature && codeEl.dataset.signature) {
      codeEl.textContent =
        `while(alive){\n push(commit)\n overtime++\n sleep = 0\n // 逃げたい…\n}\ngit push --force\nwhile(alive){\n push(commit)\n overtime++\n sleep = 0\n // 逃げたい…\n}\ngit push --force`;
      delete codeEl.dataset.signature;
    }
  }
  ```

- [ ] **Step 2：在 1s loop 的末尾调用 `updateSceneState()`**

  找到 `game.js` 的 1s `setInterval` 结束处（`checkEvent();` 后、`}, 1000);` 前），在 `checkCrisis()` 后面加一行：

  ```js
  checkCrisis();
  updateSceneState();   // ← 新增
  ```

- [ ] **Step 3：在游戏初始化后立即调用一次（避免首帧用默认样式）**

  找到 `Game.init()` 函数，在 `startLoop()` 调用之后加：

  ```js
  startLoop();
  updateSceneState();   // ← 新增，首帧立刻设置正确时间/体力类
  ```

  `Game.init()` 里的 `startLoop()` 约在 line 117，加在它后面。

- [ ] **Step 4：签名时刻时间戳每分钟更新**

  找到 60s auto-save 的 `setInterval`（`game.js:264`）：
  ```js
  setInterval(() => { save(); UI.toast(t('toast.auto_save'), 1200); }, 60000);
  ```
  改为：
  ```js
  setInterval(() => {
    save();
    UI.toast(t('toast.auto_save'), 1200);
    updateSceneState(); // 签名时刻的时间戳每分钟刷新
  }, 60000);
  ```

- [ ] **Step 5：浏览器全流程验证**

  打开 `index.html`，DevTools Console 逐步测试所有状态组合：

  ```js
  const el = document.getElementById('btn-click');

  // 1. 白天 + 精力满
  el.className = el.className.replace(/time-\S+|energy-\S+/g, '').trim();
  el.classList.add('time-day', 'energy-high');
  // 预期：蓝天背景，正常亮度

  // 2. 傍晚 + 疲惫
  el.classList.replace('time-day', 'time-dusk');
  el.classList.replace('energy-high', 'energy-mid');
  // 预期：橙红背景，亮度 0.85

  // 3. 深夜 + 低体力（签名时刻）
  el.classList.replace('time-dusk', 'time-night');
  el.classList.replace('energy-mid', 'energy-low');
  // 预期：极暗背景，大部分窗灭，显示器发绿光，代码变时间戳

  // 4. BTC 崩盘
  document.getElementById('btc-crash-overlay').style.display = 'block';
  // 预期：红色闪烁叠加

  // 5. 後輩工位
  document.querySelector('.px-kohai-desk').style.display = 'flex';
  // 预期：主桌左侧出现小工位
  ```

- [ ] **Step 6：commit**

  ```bash
  git add js/game.js
  git commit -m "feat: updateSceneState()接入游戏循环，驱动9种时间×体力场景状态"
  ```

---

## 完成检查

所有任务完成后，在浏览器里做一次完整验收：

- [ ] 根据本地时钟，场景背景与预期时段吻合
- [ ] 体力满/中/低时，场景亮度有明显差异
- [ ] 深夜+低体力时，窗户几乎全灭，显示器绿光强，代码显示真实时间
- [ ] 电车偶尔从左向右划过（深夜最明显）
- [ ] 飞机缓慢斜穿天空
- [ ] 深夜+体力中/低：有雨丝动画
- [ ] 4 个窗户在异步闪烁
- [ ] 手动触发 BTC 叠加有红色闪烁效果
- [ ] 手动显示後輩工位，小桌出现在主桌左侧
- [ ] sick/collapsed 状态下，原有的 `.sick/.collapsed` filter 规则依然生效（优先级高于 energy 规则）
