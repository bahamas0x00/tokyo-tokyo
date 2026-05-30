# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**東京社畜** — 网页版文字冒险游戏。模拟东京社畜的真实日常，游戏时间与真实东京时间（JST）同步。无结局，无限进行，定时触发随机事件。

## Running

纯静态网页，无需构建。直接在浏览器打开：

```bash
open index.html
# 或用本地服务器避免 CORS（如需 Google Fonts 离线时）：
python3 -m http.server 8080
```

## Architecture

```
tokyo-tokyo/
├── index.html       # 唯一的 HTML，含 4 个 screen div（title/create/game/slots）
├── style.css        # 霓虹赛博朋克风格，CSS 变量统一配色
└── js/
    ├── save.js      # localStorage 3 槽存档（最先加载）
    ├── player.js    # Player class + tokyoDateStr/tokyoHour/currentPhase 时区工具函数
    ├── events.js    # 事件数据库（EVENTS 对象，按 morning/work/evening/night 分组）
    ├── ui.js        # UI 模块（show/typewrite/updateStats/renderChoices/toast 等）
    └── game.js      # 主控制器（最后加载），DOMContentLoaded 后调用 Game.init()
```

### 核心机制：实时东京时间驱动

`currentPhase()` in `player.js` 根据真实 JST 时间返回当前阶段：

| JST 时间 | 阶段 |
|----------|------|
| 06:00–09:00 | `morning`（通勤） |
| 09:00–18:00 | `work`（业务中） |
| 18:00–23:00 | `evening`（夜の部） |
| 23:00–06:00 | `night`（深夜） |

每个阶段每天只能触发一次事件（通过 `player.claimedPhases[date]` 记录）。已完成的阶段显示等待消息，等到下一阶段自动刷新。

### 存档结构

`Player.toJSON()` 输出的对象存入 `localStorage`，key 为 `tokyo_shacho_slot_0/1/2`。关键字段：`claimedPhases`（`{"2024-01-15": ["morning","work"]}`）用于跨会话判断今日进度。

### 添加新事件

在 `js/events.js` 的 `EVENTS[phase]` 数组里追加对象：

```js
{
  text: '事件描述文本（支持 \n 换行）',
  tone: 'good' | 'bad' | 'neutral',
  choices: [
    { label: '按钮文字', reply: '选择后的反馈文字', changes: { energy: -10, happiness: 5 }, tone: 'neutral' },
  ]
}
```

`changes` 支持的字段：`energy`, `health`, `happiness`, `work`（均被 clamp 到 0-100），`savings`, `overtime`（直接累加）。

### 配色变量（style.css）

主要色彩：`--pink #ff2d78`（主交互色）、`--cyan #00f0ff`（信息色）、`--purple #9d00ff`（选项按钮）、`--green #00ff88`（健康/已完成）。修改这几个变量可以整体换肤。
