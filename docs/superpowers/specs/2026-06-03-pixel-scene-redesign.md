# 像素场景重设计

**日期**：2026-06-03  
**范围**：`index.html`（`.pixel-office` 区域）、`style.css`、`game.js`

---

## 目标

让点击区域的像素场景从「静态背景」变成「会说话的场景」——通过真实时钟 × 玩家体力的 9 种状态组合，加上背景微动画、深夜签名时刻、BTC 崩盘叠加、後輩工位，让玩家在每次打开游戏时都能感受到时间感和情绪叙事。

---

## 状态机

`.pixel-office`（`#btn-click`）上始终挂两组 CSS 类，由 `game.js` 1s tick 内的 `updateSceneState()` 维护。

### 时间类（读浏览器真实时钟）

| 类名 | 时段 | 天空基调 |
|------|------|---------|
| `time-day` | 06:00–18:00 | 蓝天、日光、窗户反蓝光 |
| `time-dusk` | 18:00–22:00 | 橙红夕阳、楼群剪影变暗 |
| `time-night` | 22:00–06:00 | 极暗深蓝、霓虹招牌亮起 |

### 体力类（读 `player.energy`，与现有三段收益逻辑对应）

| 类名 | 阈值 | 视觉叠加 |
|------|------|---------|
| `energy-high` | > 60 | 默认亮度，无特殊处理 |
| `energy-mid` | 30–60 | `filter: brightness(0.85)` |
| `energy-low` | < 30 | `filter: brightness(0.65) saturate(0.7)` |

### 附加类

| 条件 | 类/元素 | 效果 |
|------|---------|------|
| `btcMarket ≤ 0.1` | `#btn-click.btc-crash` | 红色半透明闪烁叠加 |
| `careerLevel >= 2 && kohai > 0` | `.px-kohai-desk` display:block | 後輩工位出现 |

---

## HTML 结构变更

在现有 `.pixel-office` 内，于 `.px-skyline` 与 `.px-setup` 之间插入微动画层；末尾添加 BTC 叠加层和後輩工位。

```
.pixel-office
├── .px-skyline (SVG，窗户加 class)       ← 修改
├── .px-ambient (NEW)
│   ├── .px-train (SVG 电车)
│   ├── .px-plane (飞机闪灯)
│   └── .px-rain  (雨丝覆盖层)
├── #combo-display                         ← 不变
├── #rest-overlay                          ← 不变
├── .px-kohai-desk (NEW, default hidden)
├── .px-setup#px-main-worker               ← 不变
├── .click-info                            ← 不变
└── #btc-crash-overlay (NEW, default hidden)
```

### `.px-skyline` SVG 内部调整

- 现有楼层窗户 `<rect>` 加 class `px-win`
- 部分窗户加 `px-win--flicker`（CSS 不同 delay 异步闪烁）
- 新增 2–3 个 `px-win--signature` 窗（签名时刻专用，其余全灭时唯一亮着的）

---

## CSS 规则

### 天空背景（替换现有写死的渐变）

```css
.pixel-office.time-day   { background: linear-gradient(#1a4a8c 0%, #2d6abf 60%, #1e3a80 100%); }
.pixel-office.time-dusk  { background: linear-gradient(#1a0a2e 0%, #7a2a1a 55%, #c05018 100%); }
.pixel-office.time-night { background: linear-gradient(#030609 0%, #060d1a 100%); }
```

### 微动画

```css
/* 电车 */
.px-train { opacity: 0; animation: train-slide 50s linear infinite; pointer-events: none; }
.time-night .px-train { opacity: 0.75; }
.time-dusk  .px-train { opacity: 0.35; }
@keyframes train-slide { from { transform: translateX(-80px); } to { transform: translateX(110%); } }

/* 飞机 */
.px-plane { animation: plane-fly 90s linear infinite; opacity: 0.5; }
.time-day .px-plane { opacity: 0.2; }
@keyframes plane-fly { from { transform: translate(-20px, 0); } to { transform: translate(110%, -20px); } }

/* 雨（深夜 + 体力中/低时出现） */
.px-rain { display: none; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(105deg, transparent 0, transparent 3px,
    rgba(100,160,255,.15) 3px, rgba(100,160,255,.15) 4px);
  animation: rain-fall 0.4s linear infinite; }
.time-night.energy-mid .px-rain,
.time-night.energy-low .px-rain { display: block; }
@keyframes rain-fall { from { background-position: 0 0; } to { background-position: -20px 40px; } }

/* 窗户异步闪烁：SVG rect 不支持 nth-of-type，改为 inline style animation-delay */
/* 实现时在每个 px-win--flicker rect 上加 style="animation-delay:-Xs" */
.px-win--flicker { animation: win-blink 9s steps(1) infinite; }
@keyframes win-blink { 0%,100% { opacity: 1; } 40%,60% { opacity: 0; } }
```

### 签名时刻（`.time-night.energy-low`）

```css
/* 普通窗户几乎全灭 */
.time-night.energy-low .px-win { opacity: 0.04; }
/* 只留签名窗 */
.time-night.energy-low .px-win--signature { opacity: 1; }
/* 显示器光晕增强，成为场景最亮点 */
.time-night.energy-low .px-screen {
  box-shadow: 0 0 24px rgba(57,211,83,.5), inset 0 0 12px rgba(57,211,83,.2);
}
```

### BTC 崩盘叠加

```css
#btc-crash-overlay {
  position: absolute; inset: 0; z-index: 10; pointer-events: none;
  background: rgba(255,30,30,.18); display: none;
  animation: btc-flash 0.8s steps(1) infinite;
}
@keyframes btc-flash { 50% { opacity: 0.3; } }
```

### 後輩工位

```css
.px-kohai-desk {
  display: none; position: relative; z-index: 2;
  margin-right: 12px; /* 主桌左侧 */
}
```

---

## JS 变更（game.js）

新增 `updateSceneState()` 函数，在 1s 游戏循环中调用：

```js
function updateSceneState() {
  const h = new Date().getHours();
  const office = document.getElementById('btn-click');

  // 时间类
  office.classList.remove('time-day', 'time-dusk', 'time-night');
  if (h >= 6 && h < 18)       office.classList.add('time-day');
  else if (h >= 18 && h < 22) office.classList.add('time-dusk');
  else                         office.classList.add('time-night');

  // 体力类
  office.classList.remove('energy-high', 'energy-mid', 'energy-low');
  if (player.energy > 60)      office.classList.add('energy-high');
  else if (player.energy >= 30) office.classList.add('energy-mid');
  else                          office.classList.add('energy-low');

  // BTC 崩盘
  const btcOverlay = document.getElementById('btc-crash-overlay');
  btcOverlay.style.display = (player.btcMarket <= 0.1) ? 'block' : 'none';

  // 後輩工位（player.js 里的後輩字段名需实现时对照确认，可能是 kohaiList.length 或 kohai）
  const kohaiDesk = document.querySelector('.px-kohai-desk');
  if (kohaiDesk) {
    kohaiDesk.style.display =
      (player.careerLevel >= 2 && player.kohai > 0) ? 'flex' : 'none';
  }

  // 签名时刻：屏幕显示真实时间
  const isSignature = office.classList.contains('time-night')
                   && office.classList.contains('energy-low');
  const codeEl = document.querySelector('.px-code');
  if (isSignature && codeEl && !codeEl.dataset.signature) {
    const t = new Date().toLocaleTimeString('ja-JP', {hour:'2-digit', minute:'2-digit'});
    codeEl.textContent = `${t} // still here\nまだ頑張ってる…\n\n${t} // still here\nまだ頑張ってる…`;
    codeEl.dataset.signature = '1';
  } else if (!isSignature && codeEl && codeEl.dataset.signature) {
    // 离开签名时刻，恢复原始代码文案
    codeEl.textContent = `while(alive){\n push(commit)\n overtime++\n sleep = 0\n // 逃げたい…\n}\ngit push --force\nwhile(alive){\n push(commit)\n overtime++\n sleep = 0\n // 逃げたい…\n}\ngit push --force`;
    delete codeEl.dataset.signature;
  }
}
```

签名时刻的时间戳每分钟需要更新——在现有 60s 自动存档的 interval 里顺带调用一次 `updateSceneState()` 即可（或单独加一个 60s interval）。

---

## 素材清单（需新增的 SVG/HTML 片段）

| 元素 | 描述 | 所在位置 |
|------|------|---------|
| `.px-train` | 像素电车剪影（约 72×10 px），5节车厢，黄色亮窗 | `index.html` |
| `.px-plane` | 1–2px 闪烁点 + 尾迹，用纯 CSS 实现即可 | `index.html` |
| `.px-rain` | 纯 CSS，无额外 HTML 内容 | `index.html` |
| `.px-kohai-desk` | 小型显示器 + 键盘 + 16×13 像素人，比主角小 | `index.html` |
| `px-win--signature` | 2–3 个特定坐标窗户 rect，加在 `.px-skyline` SVG 里 | `index.html` |

---

## 不在本次范围内

- 桌面叙事（随天数堆积咖啡杯）——可作后续彩蛋
- 5档体力 / 5段时间——留作后期精雕
- 声音/音效
