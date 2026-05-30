'use strict';

// ── constants ────────────────────────────────────────────────
const COLS = 22;
const ROWS = 15;
const gameW = window.innerWidth;
const gameH = window.innerHeight;
// tile size 略大于格子，确保填满窗口无黑边
const T = Math.ceil(Math.max(gameW / COLS, gameH / ROWS));

// ── palette ──────────────────────────────────────────────────
const C = {
  bg:       0x0a0a0f,
  building: 0x0d0d1a,
  buildEdge:0x1a1a3a,
  road:     0x10101e,
  roadLine: 0x0d0d18,
  pink:     0xff2d78,
  cyan:     0x00f0ff,
  orange:   0xff8c00,
  green:    0x00ff88,
  purple:   0x9d00ff,
  dim:      0x2a2a4a,
  text:     0xc8c8e8,
};

// ── map (0=building, 1=walkable) ─────────────────────────────
const MAP = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,0],
  [0,0,1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,0],
  [0,0,1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,0],
  [0,0,1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ── story data ───────────────────────────────────────────────
const LOCATIONS = [
  {
    id:    'apt',
    name:  'アパート 201',
    color: C.pink,
    col: 3, row: 2,
    stories: [
      [
        '酒店的房间很干净，早餐也不错。',
        '公司每天给补贴。\n你觉得东京也许没那么难。',
        '然后HR发来一封邮件——\n\n「入住期限为30天，之后将转为房补形式，\n  请自行安排住所。」',
        '你打开了Suumo。\n页面全是日语。',
        '你不会日语。',
        '倒计时：30天。',
      ],
      [
        '下楼取快递，邻居正好出门。',
        '你对视了一秒，笑了笑，\n用英语说了句「good morning」。',
        '他礼貌地点了点头，\n走了。',
        '你站在走廊里，\n快递盒子抱在手上，\n没有人可以说话。',
        '你回了房间，关上门。\n打开电脑，打开公司的Slack，\n这是今天说过话的全部地方。',
        '发消息给F国的朋友——\n时差九小时，对方在睡觉。',
      ],
    ],
  },
  {
    id:    'conbini',
    name:  'セブンイレブン',
    color: C.cyan,
    col: 10, row: 6,
    stories: [
      [
        '便利店的灯光永远是亮的。',
        '店员礼貌地说「いらっしゃいませ」。',
        '你指着饭团比划，他点点头。',
        '这是今天唯一一次和人类的交流。',
        '你走出去，一边走一边吃，\n连味道都没尝出来。',
      ],
      [
        '超市的半额便当区。\n晚上八点，还有几个剩下的，\n贴着黄色标签。',
        '你前辈说过：\n半额便当是社畜的尊严。',
        '你拿了两个。',
        '今天吃饱了，明天的也解决了。\n省了钱，没有尊严，\n心满意足。',
      ],
    ],
  },
  {
    id:    'fuzoku',
    name:  'ホテル 🏩',
    color: C.purple,
    col: 16, row: 9,
    stories: [
      [
        '电梯门打开的时候，\n你们同时愣了一下。',
        '她比照片里更普通，\n穿着便服，抱着一个包，\n像是刚下班的OL。',
        '你们沉默地站在电梯里，\n看着楼层数字一格一格往上走。',
        '她不知道你是她的顾客。',
        '进了房间，她换了衣服，\n换了表情，换了声音。',
        '但你一直记得电梯里那几秒钟。\n那时候她只是一个人。',
      ],
      [
        '洗完澡，她没有说话，\n只是侧躺过来，把头靠在你旁边。',
        '像一只猫。',
        '你看着她，不知道从什么时候开始，\n这个房间里的事情变得不一样了。',
        '你低下头，吻了她。\n是真的吻，不是那种。',
        '她没有躲。',
      ],
      [
        '出门前你问她能不能加LINE。\n你以为她会拒绝。\n她把二维码给你扫了。',
        '此后偶尔会有消息。\n「下周四有出勤哦～」\n一个笑脸。',
        '你知道这是她的工作。\n通知顾客，维持回头率，专业的。',
        '但你还是会在看到消息的时候，\n停下来，\n看很久。',
        '她在演戏。\n你当真了。\n你知道你当真了。\n你没有办法。',
      ],
    ],
  },
  {
    id:    'company',
    name:  '株式会社ブラック商事',
    color: C.orange,
    col: 10, row: 13,
    stories: [
      [
        '你推开公司的大门。',
        '所有人都在工作。\n或者假装在工作。',
        '你坐下来，打开电脑，\n开始假装在工作。',
        '会议从10点开到了下午2点。\n没有任何结论。',
        '上司说「よくできました」。',
      ],
      [
        '上司把一份新项目的方案扔在你桌上。\n截止日期：明天早上九点。\n他没有多解释，转身走了。',
        '你用Google翻译读完了整份文件。\n三十页。',
        '没有人告诉你\n在日本公司里「明天早上」\n意味着今晚不能回家。',
        '你做好了准备，\n还是没有做好准备。',
      ],
      [
        '月曜日の朝。\n又是新的一周。',
        '你不会日语。\n开会的时候，大家说了很多。',
        '你点头。\n你不知道在点什么。',
        '会后田中悄悄发给你一段总结。\n你不确定他是同情你\n还是只是顺手。',
        '你回复了一个「ありがとう」。\n这是你会的少数几个日语之一。',
      ],
    ],
  },
];

// ── visit counter ─────────────────────────────────────────────
const visited = {};

// ── main scene ────────────────────────────────────────────────
class TokyoScene extends Phaser.Scene {
  constructor() { super('TokyoScene'); }

  create() {
    const W = COLS * T;
    const H = ROWS * T;

    // ── draw map ──
    const g = this.add.graphics();
    this.drawMap(g);

    // ── walls (static physics bodies) ──
    this.walls = this.physics.add.staticGroup();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (MAP[r][c] === 0) {
          const w = this.walls.create(c * T + T / 2, r * T + T / 2, null);
          w.setVisible(false);
          w.body.setSize(T, T);
          w.refreshBody();
        }
      }
    }

    // ── location glows + labels ──
    const glowG = this.add.graphics();
    LOCATIONS.forEach(loc => this.drawLocationGlow(glowG, loc));

    LOCATIONS.forEach(loc => {
      this.add.text(loc.col * T + T / 2, loc.row * T - 6, loc.name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: colorHex(loc.color),
        stroke: '#000',
        strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(5);
    });

    // ── player ──
    this.playerGfx = this.add.graphics();
    this.drawPlayerGfx();
    this.physics.add.existing(this.playerGfx);
    this.playerGfx.body.setSize(T * 0.55, T * 0.55);
    this.playerGfx.body.setOffset(T * 0.22, T * 0.22);
    this.playerGfx.body.setCollideWorldBounds(true);
    this.playerGfx.x = 9 * T;
    this.playerGfx.y = 6 * T;
    this.playerGfx.setDepth(10);

    this.physics.add.collider(this.playerGfx, this.walls);
    this.physics.world.setBounds(0, 0, W, H);

    // ── camera — 整张地图刚好填满画面，不需要滚动 ──
    this.cameras.main.setBounds(0, 0, W, H);

    // ── input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
    });
    this.eKey = this.input.keyboard.addKey('E');
    this.spaceKey = this.input.keyboard.addKey('SPACE');

    // ── interaction prompt ──
    this.promptText = this.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: '12px',
      color: '#00f0ff', stroke: '#000', strokeThickness: 4,
      backgroundColor: '#00000099', padding: { x: 8, y: 4 },
    }).setDepth(20).setScrollFactor(0).setVisible(false);

    // ── HUD ──
    this.hudText = this.add.text(10, 10, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#2a2a4a',
    }).setScrollFactor(0).setDepth(20);
    this.updateHUD();
    this.time.addEvent({ delay: 10000, loop: true, callback: this.updateHUD, callbackScope: this });

    // ── dialog state ──
    this.dialog = {
      active: false,
      lines: [],
      idx: 0,
      loc: null,
      typing: false,
      timer: null,
      bg: null, nameTag: null, bodyText: null, hint: null,
    };

    this.activeZone = null;
  }

  drawMap(g) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const px = c * T, py = r * T;
        if (MAP[r][c] === 0) {
          g.fillStyle(C.building); g.fillRect(px, py, T, T);
          g.lineStyle(1, C.buildEdge); g.strokeRect(px, py, T, T);
        } else {
          g.fillStyle(C.road); g.fillRect(px, py, T, T);
          g.lineStyle(1, C.roadLine); g.strokeRect(px, py, T, T);
        }
      }
    }
  }

  drawLocationGlow(g, loc) {
    const px = loc.col * T, py = loc.row * T;
    g.fillStyle(loc.color, 0.12);
    g.fillRect(px - T, py - T, T * 3, T * 3);
    g.lineStyle(2, loc.color, 0.7);
    g.strokeRect(px - T + 1, py - T + 1, T * 3 - 2, T * 3 - 2);
    // center dot
    g.fillStyle(loc.color, 0.9);
    g.fillRect(px + T * 0.35, py + T * 0.35, T * 0.3, T * 0.3);
  }

  drawPlayerGfx() {
    const g = this.playerGfx;
    g.clear();
    g.fillStyle(C.pink, 0.25); g.fillRect(2, 2, T - 4, T - 4);
    g.fillStyle(C.pink, 0.95); g.fillRect(10, 10, T - 20, T - 20);
    g.fillStyle(0xffffff, 0.6); g.fillRect(12, 12, 5, 5);
  }

  updateHUD() {
    const now = new Date();
    const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const hh = String(jst.getHours()).padStart(2, '0');
    const mm = String(jst.getMinutes()).padStart(2, '0');
    this.hudText.setText(`🗼 ${hh}:${mm} JST   WASD/↑↓←→ 移动   E 互动`);
  }

  update() {
    if (this.dialog.active) {
      const justE     = Phaser.Input.Keyboard.JustDown(this.eKey);
      const justSpace = Phaser.Input.Keyboard.JustDown(this.spaceKey);
      if (justE || justSpace) this.advanceDialog();
      this.playerGfx.body.setVelocity(0, 0);
      return;
    }

    // ── movement ──
    const speed = 160;
    let vx = 0, vy = 0;
    const c = this.cursors, w = this.wasd;
    if (c.left.isDown  || w.left.isDown)  vx -= speed;
    if (c.right.isDown || w.right.isDown) vx += speed;
    if (c.up.isDown    || w.up.isDown)    vy -= speed;
    if (c.down.isDown  || w.down.isDown)  vy += speed;
    if (vx && vy) { vx *= 0.707; vy *= 0.707; }
    this.playerGfx.body.setVelocity(vx, vy);

    // ── zone detection ──
    const px = this.playerGfx.x + T / 2;
    const py = this.playerGfx.y + T / 2;

    this.activeZone = null;
    for (const loc of LOCATIONS) {
      const zx = loc.col * T + T / 2;
      const zy = loc.row * T + T / 2;
      const dist = Math.hypot(px - zx, py - zy);
      if (dist < T * 1.8) { this.activeZone = loc; break; }
    }

    if (this.activeZone) {
      this.promptText.setVisible(true);
      this.promptText.setText(`[ E ]  ${this.activeZone.name}`);
      const camW = this.cameras.main.width;
      const camH = this.cameras.main.height;
      this.promptText.setPosition(camW / 2 - this.promptText.width / 2, camH - 60);

      if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
        this.startDialog(this.activeZone);
      }
    } else {
      this.promptText.setVisible(false);
    }
  }

  startDialog(loc) {
    const id = loc.id;
    visited[id] = (visited[id] || 0);
    const lines = loc.stories[visited[id] % loc.stories.length];
    visited[id]++;

    const d = this.dialog;
    d.active  = true;
    d.lines   = lines;
    d.idx     = 0;
    d.loc     = loc;
    d.typing  = false;

    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    const boxH = 170;
    const pad  = 18;

    d.bg = this.add.graphics().setScrollFactor(0).setDepth(50);
    d.bg.fillStyle(0x000000, 0.9);
    d.bg.fillRect(0, camH - boxH, camW, boxH);
    d.bg.lineStyle(2, loc.color, 0.85);
    d.bg.strokeRect(1, camH - boxH + 1, camW - 2, boxH - 2);

    d.nameTag = this.add.text(pad, camH - boxH + pad, loc.name, {
      fontFamily: 'monospace', fontSize: '12px',
      color: colorHex(loc.color),
    }).setScrollFactor(0).setDepth(51);

    d.bodyText = this.add.text(pad, camH - boxH + pad + 24, '', {
      fontFamily: 'monospace', fontSize: '13px',
      color: '#c8c8e8', lineSpacing: 6,
      wordWrap: { width: camW - pad * 2 },
    }).setScrollFactor(0).setDepth(51);

    d.hint = this.add.text(camW - pad, camH - pad, '[ E / SPACE ] 继续', {
      fontFamily: 'monospace', fontSize: '11px', color: '#2a2a4a',
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(51).setVisible(false);

    this.showLine();
  }

  showLine() {
    const d = this.dialog;
    const line = d.lines[d.idx];
    d.typing = true;
    d.bodyText.setText('');
    d.hint.setVisible(false);

    let i = 0;
    if (d.timer) d.timer.remove();
    d.timer = this.time.addEvent({
      delay: 22,
      repeat: line.length,
      callback: () => {
        i++;
        d.bodyText.setText(line.slice(0, i));
        if (i > line.length) {
          d.typing = false;
          d.hint.setVisible(true);
        }
      }
    });
  }

  advanceDialog() {
    const d = this.dialog;
    if (d.typing) {
      if (d.timer) d.timer.remove();
      d.bodyText.setText(d.lines[d.idx]);
      d.typing = false;
      d.hint.setVisible(true);
      return;
    }
    d.idx++;
    if (d.idx < d.lines.length) {
      this.showLine();
    } else {
      this.closeDialog();
    }
  }

  closeDialog() {
    const d = this.dialog;
    d.active = false;
    d.typing = false;
    if (d.timer) d.timer.remove();
    [d.bg, d.nameTag, d.bodyText, d.hint].forEach(o => o?.destroy());
  }
}

// ── helpers ───────────────────────────────────────────────────
function colorHex(n) {
  return '#' + n.toString(16).padStart(6, '0');
}

// ── boot ─────────────────────────────────────────────────────
new Phaser.Game({
  type: Phaser.AUTO,
  width:  COLS * T,
  height: ROWS * T,
  backgroundColor: C.bg,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [TokyoScene],
  scale: {
    mode: Phaser.Scale.NONE,
    width:  gameW,
    height: gameH,
  },
});
