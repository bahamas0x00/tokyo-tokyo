# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**東京社畜** — 网页版「东京打工人」主题的放置/点击游戏（Cookie Clicker 风格）。扮演一个不会日语、被公司外派到东京的程序员，通过**点击敲代码**赚钱，购买设备升级、AI 助手、压榨後輩、做投资，并在随机事件与「物語」剧情里体验东京社畜的孤独日常。无结局，无限进行。界面支持**中 / 日 / 英三语**实时切换。

## Running

纯静态网页，无需构建。直接在浏览器打开：

```bash
open index.html
# 或用本地服务器（推荐，避免某些浏览器对 localStorage / 字体的限制）：
python3 -m http.server 8080
```

没有测试框架、没有打包步骤。环境里也没有 Node 运行时，因此 `node --check` 类语法检查通常不可用——靠浏览器控制台验证。

## Architecture

```
tokyo-tokyo/
├── index.html       # 唯一的 HTML，含 4 个 screen div（lang / title / create / game）
├── style.css        # 像素 + 霓虹赛博朋克风格，CSS 变量统一配色
├── js/
│   ├── i18n.js      # ★最先加载★ 三语字典 I18N + t(key,vars) + setLang/cycleLang/applyI18n
│   ├── save.js      # localStorage 单槽存档 + base64 导入导出
│   ├── player.js    # Player class + 全部游戏数据定义（投资/设备/AI/後輩/消费/市场事件）
│   ├── events.js    # POPUP_EVENTS 随机事件库 + 本地化辅助函数
│   ├── ui.js        # UI 模块（渲染各面板/商店/弹窗/日志/飘字）
│   └── game.js      # ★最后加载★ 主控制器 IIFE，DOMContentLoaded 后 applyI18n() + Game.init()
└── pixel/           # 独立的像素原型实验（index.html 不引用，与主游戏无关）
```

脚本加载顺序（见 index.html 末尾）必须保持：`i18n → save → player → events → ui → game`。各模块通过全局变量耦合（`I18N`/`t`、`Save`、`Player` 及各数据常量、`UI`、`Game`），没有模块系统。

### 核心循环（game.js）

`Game.startLoop()` 启动几个 `setInterval`：

| 周期 | 作用 |
|------|------|
| 1s   | `player.tick()`（被动收入 + 自动点击结算 + 状态衰减）→ 刷新 UI → 重渲染商店 → `checkEvent()` |
| 60s  | 自动存档 |
| 5–15min（随机） | `triggerMarketEvent()` BTC 行情波动 |

点击 `#btn-click`（像素办公室区域）→ `player.click()` 即时赚 `clickValue`，并触发主角打字动画 + 飘字。

### 收益与机制（player.js）

- **点击收益** `clickValue` = `(baseClickValue 100 + 设备 bonus) × 体力系数`。体力 >60 满额，30–60 ×0.7，<30 ×0.4。
- **设备升级** 键盘 / 显示器 / 椅子，各 3 档（`*_TIERS`），**替换式**只保留当前级，加点击 bonus。
- **AI 助手** `AI_TIERS` 3 档，点击频率 5s→2s→0.5s。购买后通过 AI 配置弹窗按时长付费运行（消耗 token、产出代码，见 `AI_TOKEN_COST`/`AI_EARN_RATE`），AI 自动点击**不消耗体力**。
- **後輩（kohai）** 需晋升到「主任」（`careerLevel >= 2`）后才能向 HR 申请（`submitHRApplication`）：付 ¥50k → 45s 审核 → 70% 批准入职 / 30% 拒绝退款，5min 冷却。後輩按 `0.1 clicks/sec` 自动点击，产出累计进 `kohaiEarned`。
- **职级** 新卒社員→平社員→主任→係長→課長（`careerLevel` 0–4）。按天数 + `work>70` 自然晋升。`day = 1 + floor(totalEarned / 500000)`，由累计收入推进，**不是真实日期**。
- **投资** `INVESTMENTS`：日本国债（稳定被动收入，不可卖）+ 比特币（受 `btcMarket` 行情倍率影响，可崩盘/归零，可卖出结算 `realizedGains`）。
- **生活消费** `SHOP_ITEMS`：休息/便利店/拉面/居酒屋/健身房/风俗店，改状态，带冷却。风俗店特殊：触发 `FUJOKU_STORIES` 剧情序列（game.js 内）。

### 存档（save.js）

单槽，key = `tokyo_shacho_save`。`Save.write/read/remove/hasSave`，外加 `exportCode/importCode`（base64 编码的存档码，供标题页导出/导入按钮）。

`Player.toJSON()` 存整个实例 + `fujokuVisits`。`Player.fromJSON()` 含**旧存档迁移逻辑**（portfolio 数字→对象、旧 stocks→bonds、旧 market→btcMarket）——改动存档结构时注意维护这段迁移。

### 国际化（i18n.js）

- **语言选择界面**（Cookie Clicker 式）：首次加载（`langChosen()` 为 false，即 `localStorage.tokyo_lang` 未设置）显示 `#screen-lang` 让玩家选中/日/英，选完才进标题页。已选过则启动时直接 `UI.show('title')`。标题页的「🌐 语言」按钮（`#btn-lang`）可重新打开该界面；游戏内不再提供切换按钮。
- 当前语言存 `localStorage.tokyo_lang`，默认 zh。
- `t(key, vars)`：查当前语言字典，缺失回退到 zh 再回退到 key 本身；`vars` 用 `{name}` 占位符插值。
- **静态文案** 在 HTML 上标 `data-i18n="key"` / `data-i18n-placeholder` / `data-i18n-value`，`applyI18n()` 批量刷新 DOM（注意用 `innerHTML`，文案里可含 `<br/>`）。
- **动态文案**（JS 里生成的 toast / 日志 / 商店）直接调 `t('...')`。
- **事件/剧情文案** 不走 I18N 字典，而是数据对象自带 `text_en`/`text_ja`、`label_en`/`reply_en` 等字段，由 events.js 的 `localizeEvent()` 按当前语言挑选。
- 切语言后，game.js 的语言按钮回调会重渲染商店和状态面板。

### 添加新随机事件（events.js）

往 `POPUP_EVENTS` 数组追加对象，每条都应提供三语字段：

```js
{
  text: '中文描述（支持 \n 换行）', text_en: '...', text_ja: '...',
  tone: 'good' | 'bad' | 'neutral',
  // 可选：isStory + storyTitle/storyTitle_en/storyTitle_ja + storyEmoji
  //       → 选择后会存进 player.storyLog，可在「物語」里回看
  choices: [
    { label: '按钮', label_en: '...', label_ja: '...',
      reply: '反馈文字', reply_en: '...', reply_ja: '...',
      changes: { energy: -10, happiness: 5 }, tone: 'neutral' },
  ],
}
```

`changes` 支持字段：`energy` / `health` / `happiness`（clamp 0–100）、`money`（直接累加，正数同时计入 `totalEarned`）。见 `Player.modify()`。

### 配色变量（style.css）

主要色彩：`--pink #ff2d78`（主交互色）、`--cyan #00f0ff`（信息色）、`--purple #9d00ff`（选项按钮）、`--green #00ff88`（健康/已完成）、霓虹金 `neon-gold`（金钱）。修改这几个变量可整体换肤。像素角色是内联 SVG（见 index.html `#px-main-worker`）。
