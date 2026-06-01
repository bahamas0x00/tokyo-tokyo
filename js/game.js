'use strict';

const Game = (() => {
  let player = null;
  let eventActive = false;
  let fujokuVisits = 0;

  // ── 风俗店故事序列 ────────────────────────────────────────
  const FUJOKU_STORIES = [
    {
      isStory: true, storyTitle: '电梯里的她（一）', storyTitle_en: 'Her in the Elevator (I)', storyTitle_ja: 'エレベーターの彼女（一）', storyEmoji: '🏩',
      text: '电梯门打开的时候，你们同时愣了一下。\n\n她比照片里更普通，穿着便服，抱着一个包，\n像是刚下班的OL。\n\n你知道她是谁。她不知道你是谁。\n楼层数字往上走，你们保持着陌生人的距离。',
      text_en: 'The elevator doors open and you both freeze.\n\nShe looks more ordinary than her photos — casual clothes, a bag in her arms,\nlike an OL just off work.\n\nYou know who she is. She doesn\'t know who you are.\nThe floor numbers climb. You keep a stranger\'s distance.',
      text_ja: 'エレベーターのドアが開いた瞬間、二人同時に固まった。\n\n写真より地味な印象。私服にバッグ、\nさっき退勤したOLみたいな雰囲気。\n\nあなたは彼女が誰か知っている。彼女はあなたのことを知らない。\n数字が上がっていく。見知らぬ他人の距離を保ったまま。',
      choices: [{ label: '什么都没说，盯着门', label_en: 'You say nothing, stare at the door', label_ja: '何も言わずドアを見つめた', reply: '她先出了电梯，你跟在后面，走进了同一扇门。\n她转过身，愣了两秒，然后职业性地笑了。\n"啊，是您。"\n你不知道该说什么，也笑了。', reply_en: 'She steps out first. You follow her through the same door.\nShe turns around, pauses two seconds, then smiles professionally.\n"Oh, it\'s you."\nYou didn\'t know what to say. You smiled too.', reply_ja: '彼女が先に降りた。あなたもついて同じドアをくぐった。\n振り返った彼女が二秒ほど固まって、プロの笑顔を浮かべた。\n「あ、お客様でしたか。」\n何も言えなかった。あなたも笑った。', changes: {}, tone: 'neutral' }],
    },
    {
      isStory: true, storyTitle: '电梯里的她（二）', storyTitle_en: 'Her in the Elevator (II)', storyTitle_ja: 'エレベーターの彼女（二）', storyEmoji: '🏩',
      text: '洗完澡，她没有说话，\n只是侧躺过来，把头靠在你旁边。\n\n像一只猫。\n\n你低下头，吻了她。\n是真的吻，不是那种。\n她没有躲。',
      text_en: 'After the bath she didn\'t say anything.\nShe just rolled over and rested her head next to yours.\n\nLike a cat.\n\nYou leaned down and kissed her.\nA real kiss. Not that kind.\nShe didn\'t pull away.',
      text_ja: 'お風呂の後、彼女は何も言わなかった。\nただ横になって、あなたの隣に頭をもたせかけた。\n\n猫みたいに。\n\nあなたは顔を近づけてキスした。\n本物のキス。そういう意味じゃない方の。\n彼女は避けなかった。',
      choices: [{ label: '什么都没说', label_en: 'You say nothing', label_ja: '何も言わなかった', reply: '这是你来东京以来第一次觉得不孤独。\n你知道这不是真的。\n但今晚不想在意这些。', reply_en: 'This is the first time since coming to Tokyo that you haven\'t felt alone.\nYou know it\'s not real.\nBut tonight you don\'t want to think about that.', reply_ja: '東京に来てから初めて、孤独じゃないと感じた。\n本物じゃないってわかってる。\nでも今夜はそんなこと考えたくない。', changes: { happiness: 15 }, tone: 'good' }],
    },
    {
      isStory: true, storyTitle: '她的LINE', storyTitle_en: 'Her LINE', storyTitle_ja: '彼女のLINE', storyEmoji: '💬',
      text: '出门前你问她能不能加LINE。\n她把二维码给你扫了。\n\n此后偶尔会有消息。\n"下周四有出勤哦～"  一个笑脸。\n\n她在演戏。你当真了。\n你知道你当真了。\n你没有办法。',
      text_en: 'Before you left you asked if you could add her on LINE.\nShe let you scan her QR code.\n\nOccasionally a message after that.\n"I\'m working Thursday~" A smiley face.\n\nShe\'s acting. You took it seriously.\nYou know you took it seriously.\nYou couldn\'t help it.',
      text_ja: '帰り際にLINEを交換してもいいか聞いた。\n彼女がQRコードを見せてくれた。\n\nその後、たまにメッセージが来る。\n「来週木曜、出勤してますよ〜」笑顔の絵文字。\n\n彼女は演じている。あなたは本気にした。\n本気にしてるってわかってる。\nどうしようもない。',
      choices: [
        { label: '回复了一个笑脸', label_en: 'You replied with a smile', label_ja: '笑顔で返信した', reply: '她秒回了一个"✨"。\n你看着这个符号很久。', reply_en: 'She instantly replied with "✨".\nYou stared at that symbol for a long time.', reply_ja: '即座に「✨」が返ってきた。\nその絵文字をしばらく見つめてしまった。', changes: { happiness: -5 }, tone: 'neutral' },
        { label: '没有回复，把手机放下', label_en: 'No reply. You put your phone down.', label_ja: '返信せず、スマホを置いた', reply: '你知道有些事看清楚了就别再看了。\n你还是留着那条LINE。', reply_en: 'You know that some things, once you\'ve seen them clearly, you should stop looking at.\nYou kept the LINE anyway.', reply_ja: '見えてしまったものは、もう見ない方がいいとわかってる。\nそれでもLINEは残しておいた。', changes: { happiness: -10 }, tone: 'bad' },
      ],
    },
  ];

  // ── init ─────────────────────────────────────────────────
  function init() {
    UI.updateClock();
    setInterval(UI.updateClock, 1000);
    if (Save.hasSave()) document.getElementById('btn-continue').disabled = false;

    // 语言选择弹窗：首次加载弹出；选完关闭；点背景仅在已选过时可关
    const langModal = document.getElementById('lang-modal');
    document.querySelectorAll('.lang-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        setLang(btn.dataset.lang);
        if (player) { renderShops(); UI.updateStats(player); }
        langModal.classList.add('hidden');
      });
    });
    langModal.addEventListener('click', e => {
      if (e.target === langModal && langChosen()) langModal.classList.add('hidden');
    });
    if (!langChosen()) langModal.classList.remove('hidden');

    document.getElementById('btn-new').addEventListener('click', () => UI.show('create'));
    document.getElementById('btn-continue').addEventListener('click', () => {
      const d = Save.read(); if (d) loadGame(d);
    });
    document.getElementById('btn-export').addEventListener('click', () => {
      const c = Save.exportCode();
      if (!c) return UI.toast(t('toast.no_save'));
      navigator.clipboard.writeText(c).then(
        () => UI.toast(t('toast.copied')),
        () => prompt(t('toast.copy_manual'), c)
      );
    });
    document.getElementById('btn-import').addEventListener('click', () => {
      const c = prompt(t('toast.paste_save'));
      if (c && Save.importCode(c)) { UI.toast(t('toast.import_ok')); loadGame(Save.read()); }
      else if (c) UI.toast(t('toast.import_fail'));
    });
    document.getElementById('btn-lang').addEventListener('click', () => {
      document.getElementById('lang-modal').classList.remove('hidden');
    });
    document.getElementById('btn-start-game').addEventListener('click', startNew);
    document.getElementById('player-name-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') startNew();
    });
  }

  // ── new / load ────────────────────────────────────────────
  function startNew() {
    const name = document.getElementById('player-name-input').value.trim();
    const err  = document.getElementById('create-error');
    if (!name) { err.textContent = t('toast.need_name'); err.classList.remove('hidden'); return; }
    if (Save.hasSave() && !confirm(t('toast.overwrite'))) return;
    err.classList.add('hidden');
    player = new Player(name);
    enterGame();
  }

  function loadGame(data) {
    player = Player.fromJSON(data);
    fujokuVisits = data.fujokuVisits || 0;
    enterGame();
  }

  // ── enter game ────────────────────────────────────────────
  function enterGame() {
    UI.show('game');
    renderShops();
    startLoop();
    bindGameButtons();

    // pixel office click area
    document.getElementById('btn-click').addEventListener('click', handleClick);
  }

  function bindGameButtons() {
    document.getElementById('btn-stories').addEventListener('click', () => {
      UI.showStories(player.storyLog || []);
    });
    document.getElementById('btn-save').addEventListener('click', () => {
      save(); UI.toast(t('toast.save_ok'));
    });
    document.getElementById('btn-to-title').addEventListener('click', () => {
      save(); UI.show('title');
    });
    // bindMusic();  // 音乐功能暂时搁置（要开回来取消本行注释 + index.html 去掉 .music-bar 的 display:none）
  }

  // ── lofi 背景音乐（多电台 · 切换 · 不喜欢拉黑）─────────────
  // 柔和优先；鼓点重的 Fluid 放最后。换源改这里即可。
  // 本地曲优先（放你自己的 lofi tokyo），找不到再回退在线流
  const BGM_STATIONS = [
    { id: 'local',        name: '本地 lofi（assets/bgm.mp3）', url: 'assets/bgm.mp3' },
    { id: 'groovesalad',  name: 'Groove Salad · chill' },
    { id: 'dronezone',    name: 'Drone Zone · ambient' },
    { id: 'gsclassic',    name: 'Groove Salad Classic' },
    { id: 'fluid',        name: 'Fluid · lofi beats' },
  ];
  const srcOf = s => s.url || `https://ice1.somafm.com/${s.id}-128-mp3`;

  function bindMusic() {
    const bgm = document.getElementById('bgm');
    const btn = document.getElementById('btn-music');
    if (!bgm || !btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    const btnNext = document.getElementById('btn-music-next');
    const btnDis  = document.getElementById('btn-music-dislike');
    const nameEl  = document.getElementById('music-name');
    bgm.volume = 0.3;

    let on = localStorage.getItem('tokyo_bgm') === 'on';
    const disliked = new Set((localStorage.getItem('tokyo_bgm_dislike') || '').split(',').filter(Boolean));
    let stationId = localStorage.getItem('tokyo_bgm_station') || BGM_STATIONS[0].id;

    const avail = () => BGM_STATIONS.filter(s => !disliked.has(s.id));
    const cur   = () => BGM_STATIONS.find(s => s.id === stationId) || BGM_STATIONS[0];
    const refresh = () => { btn.textContent = on ? '🎵' : '🔇'; if (nameEl) nameEl.textContent = cur().name; };

    function load(play) {
      bgm.src = srcOf(cur());
      localStorage.setItem('tokyo_bgm_station', stationId);
      if (on && play) bgm.play().catch(() => {});
      refresh();
    }
    function setOn(v) {
      on = v; localStorage.setItem('tokyo_bgm', on ? 'on' : 'off');
      if (on) { if (!bgm.src) bgm.src = srcOf(cur()); bgm.play().catch(() => {}); }
      else bgm.pause();
      refresh();
    }
    function next() {
      const list = avail(); if (!list.length) return;
      const i = list.findIndex(s => s.id === stationId);
      stationId = list[(i + 1 + list.length) % list.length].id;
      load(true);
    }
    function dislike() {
      disliked.add(stationId);
      if (disliked.size >= BGM_STATIONS.length) disliked.clear(); // 全黑名单则重置
      localStorage.setItem('tokyo_bgm_dislike', [...disliked].join(','));
      const list = avail();
      const i = list.findIndex(s => s.id === stationId);
      stationId = list[i >= 0 ? (i + 1) % list.length : 0].id;
      load(true);
      UI.toast(t('music.disliked'), 1500);
    }

    btn.addEventListener('click', () => setOn(!on));
    if (btnNext) btnNext.addEventListener('click', next);
    if (btnDis)  btnDis.addEventListener('click', dislike);
    // 本地曲不存在时自动回退到在线流
    bgm.addEventListener('error', () => {
      if (cur().id === 'local') {
        const list = avail().filter(s => s.id !== 'local');
        if (list.length) { stationId = list[0].id; load(on); }
      }
    });

    bgm.src = srcOf(cur());
    refresh();
    // 浏览器禁止无交互自动播放：若上次开着，首次任意点击后恢复
    if (on) {
      const resume = () => { bgm.play().catch(() => {}); document.removeEventListener('click', resume); };
      document.addEventListener('click', resume);
    }
  }

  // ── main loop ─────────────────────────────────────────────
  function startLoop() {
    // tick every second
    setInterval(() => {
      const { autoClicks, sickStarted } = player.tick() || {};
      if (autoClicks > 0) UI.spawnAutoFloat(player.clickValue, autoClicks);
      if (sickStarted) { UI.appendLog(t('log.sick'), 'bad'); UI.toast(t('toast.sick'), 2600); }
      UI.updateStats(player);
      renderShops();
      checkEvent();
      checkMarketEvent();
      checkCrisis();
    }, 1000);

    // auto-save every 60s
    setInterval(() => { save(); UI.toast(t('toast.auto_save'), 1200); }, 60000);

    // market fluctuation every 5-15 min
    scheduleMarket();
  }

  // ── click ─────────────────────────────────────────────────
  function handleClick() {
    if (player.isSick)      { UI.toast(t('toast.sick_resting')); return; }
    if (player.energy < 1)  { UI.toast(t('toast.energy_low')); return; }
    const earned = player.click();
    UI.spawnFloat(earned);
    // 打字动画
    const worker = document.getElementById('px-main-worker');
    if (worker) {
      worker.classList.add('typing');
      setTimeout(() => worker.classList.remove('typing'), 400);
    }
    UI.updateStats(player);
  }

  // ── shops ─────────────────────────────────────────────────
  function renderShops() {
    // BTC 卖出回调
    window._onSellCallback = () => {
      const result = player.sellBtc();
      if (!result) return;
      const gainStr = (result.gain >= 0 ? '+' : '') + fmtMoney(result.gain);
      UI.appendLog(t('log.sell', { emoji: '₿', name: 'BTC', gain: gainStr }), result.gain >= 0 ? 'good' : 'bad');
      UI.toast(t('toast.buy_sell', { name: 'BTC', gain: gainStr }));
      UI.updateStats(player);
      renderShops();
      save();
    };

    UI.renderInvestShop(player, key => {
      if (player.buyInvestment(key)) {
        const inv = INVESTMENTS[key];
        UI.appendLog(t('log.buy', { emoji: inv.emoji, name: tf(inv, 'label') }), 'good');
        UI.toast(t('toast.buy_ok', { name: tf(inv, 'label') }));
        UI.updateStats(player);
        renderShops();
        save();
      } else {
        UI.toast(t('toast.no_fund'));
      }
    });

    UI.renderUpgradeShop(player, type => {
      if (type === 'kohai-buy') {
        if (player.buyAutoStaff('kohai')) {
          UI.appendLog(t('log.buy', { emoji: AUTO_STAFF[0].emoji, name: tf(AUTO_STAFF[0], 'label') }), 'good');
          UI.toast(t('toast.buy_ok', { name: tf(AUTO_STAFF[0], 'label') }));
          UI.updateStats(player); renderShops(); save();
        } else {
          UI.toast(t('toast.no_fund'));
        }
        return;
      }
      const result = player.buyTierUpgrade(type);
      if (result) {
        UI.appendLog(t('log.upgrade', { emoji: result.emoji, name: tf(result, 'label') }), 'good');
        UI.toast(`${tf(result, 'label')} ✓`);
        UI.updateStats(player);
        renderShops();
        save();
      } else {
        const lv    = (player.tierLevels && player.tierLevels[type]) || 0;
        const tiers = { keyboard: KEYBOARD_TIERS, monitor: MONITOR_TIERS, chair: CHAIR_TIERS, ai: AI_TIERS }[type];
        const maxed = tiers && lv >= tiers.length;
        UI.toast(maxed ? t('toast.maxed') : t('toast.no_fund'));
      }
    });

    UI.renderLifeShop(player, id => {
      if (id === 'fujoku') { buyFujoku(); return; }
      const item = SHOP_ITEMS.find(s => s.id === id);
      if (!item) return;
      if (!player.canAfford(item.cost)) { UI.toast(t('toast.no_fund')); return; }
      if (!player.canUseShop(id, item.cooldown)) { UI.toast(t('toast.cooldown')); return; }
      player.buyShopItem(id);
      UI.appendLog(`${item.emoji} ${tf(item, 'reply') || tf(item, 'label')}`, item.tone);
      UI.toast(`${item.emoji} ${tf(item, 'label')}`);
      UI.updateStats(player);
      renderShops();
      save();
    });
  }

  // ── 风俗店购买 → 触发故事事件 ────────────────────────────
  function buyFujoku() {
    const item = SHOP_ITEMS.find(s => s.id === 'fujoku');
    if (!player.canAfford(item.cost)) { UI.toast(t('toast.no_fund')); return; }
    player.money    -= item.cost;
    player.happiness = clamp(player.happiness + 40, 0, 100);
    player.health    = clamp(player.health    - 3,  0, 100);

    const story = localizeEvent(FUJOKU_STORIES[fujokuVisits % FUJOKU_STORIES.length]);
    fujokuVisits++;
    player.fujokuVisits = fujokuVisits;

    eventActive = true;
    UI.showEventPopup(story, choice => {
      player.modify(choice.changes || {});
      if (story.isStory) {
        player.addStory({ title: story.storyTitle, emoji: story.storyEmoji, text: story.text, reply: choice.reply || '', tone: choice.tone });
        UI.showStoryBadge(player.storyLog.length);
      }
      UI.appendLog('🏩 ' + (choice.reply || '').split('\n')[0], choice.tone);
      UI.updateStats(player);
      renderShops();
      save();
      eventActive = false;
      player.scheduleNextEvent();
    });
  }

  // ── 随机事件 ─────────────────────────────────────────────
  function checkEvent() {
    if (eventActive) return;
    if (Date.now() < player.nextEventAt) return;
    eventActive = true;
    const event = getRandomEvent();
    UI.showEventPopup(event, choice => {
      player.modify(choice.changes || {});
      if (event.isStory) {
        player.addStory({ title: event.storyTitle, emoji: event.storyEmoji, text: event.text, reply: choice.reply || '', tone: choice.tone });
        UI.showStoryBadge(player.storyLog.length);
      }
      UI.appendLog((choice.reply || event.text).split('\n')[0], choice.tone);
      UI.updateStats(player);
      renderShops();
      save();
      eventActive = false;
      player.scheduleNextEvent();
    });
  }

  // ── 市场波动 ─────────────────────────────────────────────
  let marketTimer = null;
  function scheduleMarket() {
    clearTimeout(marketTimer);
    const delay = 5 * 60000 + Math.random() * 10 * 60000; // 5-15分钟
    marketTimer = setTimeout(() => { triggerMarketEvent(); scheduleMarket(); }, delay);
  }

  function checkMarketEvent() {} // handled by scheduleMarket

  function triggerMarketEvent() {
    const ev = pickMarketEvent();
    const prev = player.btcMarket;
    player.btcMarket = clamp2(prev * ev.mult, 0.02, 6.0);

    const lang = getLang();
    const newsText = lang === 'en' && ev.text_en ? ev.text_en
                   : lang === 'ja' && ev.text_ja ? ev.text_ja
                   : ev.text;
    UI.showMarketNews(newsText, ev.tone);

    if (ev.isCrash && (player.portfolio.btc?.qty || 0) > 0) {
      UI.appendLog(t('log.btc_crash'), 'bad');
    }
    UI.updateStats(player);
    renderShops();
    save();
  }

  // ── HR 申请流程 ───────────────────────────────────────────
  const HR_COST     = 50000;
  const HR_WAIT_MS  = 45000;  // 45秒审核
  const HR_COOLDOWN = 5 * 60000; // 5分钟冷却
  const HR_APPROVE_RATE = 0.7;  // 70%批准率

  function submitHRApplication() {
    if (!player.canApplyForKohai) { UI.toast(t('toast.kohai_need_rank')); return; }
    if (player.hrPending)          { UI.toast(t('toast.kohai_pending')); return; }
    if (Date.now() < (player.hrCooldown || 0)) { UI.toast(t('toast.kohai_cooldown')); return; }
    if (!player.canAfford(HR_COST)) { UI.toast(t('toast.kohai_nofund')); return; }

    player.money      -= HR_COST;
    player.hrPending   = true;
    player.hrPendingEnd = Date.now() + HR_WAIT_MS;

    UI.appendLog(t('log.hr_submit'), 'neutral');
    UI.toast(t('toast.hr_submit'));
    save();

    setTimeout(() => {
      player.hrPending = false;
      player.hrCooldown = Date.now() + HR_COOLDOWN;

      if (Math.random() < HR_APPROVE_RATE) {
        // 批准
        player.autoStaff.kohai = (player.autoStaff.kohai || 0) + 1;
        const count = player.autoStaff.kohai;
        UI.appendLog(t('log.hr_approve', { n: count }), 'good');
        UI.toast(t('toast.hr_approve'));
        UI.showEventPopup({
          text: t('hr.approve.text'),
          choices: [{ label: t('hr.approve.choice'), reply: t('hr.approve.reply'), changes: { happiness: 15 }, tone: 'good' }]
        }, choice => {
          player.modify(choice.changes || {});
          save();
        });
      } else {
        // 拒绝
        player.money += HR_COST; // refund
        UI.appendLog(t('log.hr_reject'), 'bad');
        UI.toast(t('toast.hr_reject'));
        UI.showEventPopup({
          text: t('hr.reject.text'),
          choices: [{ label: t('hr.reject.choice'), reply: t('hr.reject.reply'), changes: { happiness: -8 }, tone: 'bad' }]
        }, choice => {
          player.modify(choice.changes || {});
          save();
        });
      }

      UI.updateStats(player);
      renderShops();
      save();
    }, HR_WAIT_MS);
  }

  // ── 离职危机（快乐 ≤5 触发，回升 >20 后可再次触发）──────────
  function checkCrisis() {
    if (eventActive) return;
    if (player.happiness > 20) { player.crisisShown = false; return; }
    if (player.happiness <= 5 && !player.crisisShown) {
      player.crisisShown = true;
      eventActive = true;
      UI.showEventPopup({
        text: t('crisis.text'),
        choices: [
          { label: t('crisis.tough'), reply: t('crisis.tough.reply'), tone: 'bad',     _crisis: 'tough' },
          { label: t('crisis.leave'), reply: t('crisis.leave.reply'), tone: 'neutral', _crisis: 'leave' },
        ],
      }, choice => {
        if (choice._crisis === 'tough') {
          player.happiness = Math.max(player.happiness, 20);
          player.health    = clamp(player.health - 15, 0, 100);
        } else {
          player.happiness = clamp(player.happiness + 30, 0, 100);
          player.sickUntil = Date.now() + 3 * 60000; // 请假 3 分钟停工
        }
        UI.updateStats(player);
        renderShops();
        save();
        eventActive = false;
      });
    }
  }

  // ── save ─────────────────────────────────────────────────
  function save() {
    if (player) Save.write({ ...player.toJSON(), fujokuVisits });
  }

  return { init };
})();

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function clamp2(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

document.addEventListener('DOMContentLoaded', () => {
  applyI18n();
  Game.init();
});
