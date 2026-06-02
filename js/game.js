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
      text: '洗完澡，她没有说话，\n只是侧躺过来，把头靠在你旁边。\n\n像一只猫。\n\n你低下头，吻了她。\n她没有躲。',
      text_en: 'After the bath she didn\'t say anything.\nShe just rolled over and rested her head next to yours.\n\nLike a cat.\n\nYou leaned down and kissed her.\nA real kiss. Not that kind.\nShe didn\'t pull away.',
      text_ja: 'お風呂の後、彼女は何も言わなかった。\nただ横になって、あなたの隣に頭をもたせかけた。\n\n猫みたいに。\n\nあなたは顔を近づけてキスした。\n本物のキス。そういう意味じゃない方の。\n彼女は避けなかった。',
      choices: [{ label: '什么都没说', label_en: 'You say nothing', label_ja: '何も言わなかった', reply: '不管三七二十一。\n今晚就这样，明天再说。', reply_en: 'Whatever. Figure it out tomorrow.\nTonight\'s tonight.', reply_ja: 'まあいいか。\n明日のことは明日考える。', changes: { happiness: 15 }, tone: 'good' }],
    },
    {
      isStory: true, storyTitle: '银座，下午三点', storyTitle_en: 'Ginza, 3pm', storyTitle_ja: '銀座、午後三時', storyEmoji: '🛍️',
      text: '完事后，你躺在床上抽烟。\n她问你明天周日休息要做什么。\n你说想去逛逛街，买点衣服，问她要不要一起。\n\n她愣了一下。\n"那你会给我买吗？"\n\n你想也没想。\n"当然。"\n\n沉默了两秒。\n"那明天下午三点，银座见。"',
      text_en: 'Afterwards, you lay in bed, smoking.\nShe asked what you were doing tomorrow — Sunday.\nYou said you were going to walk around, buy some clothes. Asked if she wanted to come.\n\nShe paused.\n"Would you buy something for me?"\n\nYou didn\'t even think.\n"Of course."\n\nTwo seconds of silence.\n"Tomorrow. 3pm. Ginza."',
      text_ja: '終わった後、ベッドに寝転んでタバコを吸っていた。\n彼女が聞いた。明日日曜、何するの？\n買い物でもしようかと思ってると言ったら、一緒に行く？と聞いた。\n\n彼女がちょっと固まった。\n「じゃあ、買ってくれる？」\n\n考える間もなかった。\n「もちろん。」\n\n二秒の沈黙。\n「じゃあ明日の午後三時、銀座で。」',
      choices: [
        { label: '准时出现在银座', label_en: 'You show up at Ginza', label_ja: '時間通りに銀座に現れた', reply: '银座的阳光很好。\n她穿着普通衣服站在约定地点，看见你时有点不自然地笑了。\n你们走进了第一家店。\n她没有再提昨晚的事，你也没有。', reply_en: 'The light in Ginza was nice.\nShe was already there in plain clothes, smiled a little awkwardly when she saw you.\nYou walked into the first store together.\nNeither of you mentioned last night.', reply_ja: '銀座の日差しは良かった。\n彼女は私服で待っていて、あなたを見てちょっとぎこちなく笑った。\n二人で最初の店に入った。\n昨晩のことは、どちらも触れなかった。', changes: { money: -20000, happiness: 25 }, tone: 'good' },
        { label: '想了一夜，没去', label_en: 'You thought all night. Didn\'t go.', label_ja: '一晩考えて、行かなかった', reply: '下午三点，她发来一个问号。\n你盯着那个问号很久。\n最后你出门，一个人去买了衣服。\n你没有回她的消息。', reply_en: 'At 3pm she sent a question mark.\nYou stared at it for a long time.\nYou went out alone and bought the clothes.\nYou never replied.', reply_ja: '午後三時、「？」とメッセージが届いた。\nしばらくそれを見つめていた。\n一人で出かけて、服を買った。\n返信はしなかった。', changes: { happiness: -15 }, tone: 'bad' },
      ],
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
    UI.appendLog(t('log.welcome'), 'neutral');  // 开局引导：写进今日记录(DOM)
  }

  function loadGame(data) {
    player = Player.fromJSON(data);
    fujokuVisits = data.fujokuVisits || 0;
    enterGame();
  }

  // ── enter game ────────────────────────────────────────────
  function enterGame() {
    UI.show('game');
    UI.updateStats(player);
    UI.startMoneyAnim(() => player);  // rAF 金钱动画计数器
    renderShops();
    UI.renderAchievements(player);
    startLoop();
    bindGameButtons();
    bindCollapsible();

    // pixel office click area
    document.getElementById('btn-click').addEventListener('click', handleClick);
  }

  function bindCollapsible() {
    document.querySelectorAll('.right-panel .panel-title').forEach(title => {
      if (title._collapsibleBound) return;
      title._collapsibleBound = true;
      title.classList.add('panel-title--collapsible');
      title.addEventListener('click', () => title.closest('.panel-section').classList.toggle('collapsed'));
    });
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
    document.getElementById('btn-bribe')?.addEventListener('click', bribe);
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
  let _wasCollapsed = false;
  let _lastEnergyZone = 3;
  function energyZone(e) { return e > 60 ? 3 : e > 40 ? 2 : e > 20 ? 1 : 0; }
  function startLoop() {
    // tick every second
    setInterval(() => {
      const { autoClicks, sickStarted, reviewDue, collapseStarted } = player.tick() || {};
      if (autoClicks > 0) UI.spawnAutoFloat(player.clickValue, autoClicks);
      if (sickStarted)     { UI.appendLog(t('log.sick'),      'bad'); UI.toast(t('toast.sick'),     2600); }
      if (collapseStarted) { UI.appendLog(t('log.collapse'),  'bad'); UI.toast(t('toast.collapse'), 2600); }
      if (_wasCollapsed && !player.isCollapsed) {
        UI.toast(t('toast.collapse_wake'), 2200);
      }
      _wasCollapsed = player.isCollapsed;
      if (reviewDue != null) triggerReview(reviewDue);
      checkAchievements();
      // 能量警告最后发 toast，不会被成就等覆盖
      const curZone = energyZone(player.energy);
      if (curZone < _lastEnergyZone) {
        if (curZone === 2) UI.toast(t('toast.energy_warn_2'), 2200);
        if (curZone === 1) UI.toast(t('toast.energy_warn_1'), 2200);
        if (curZone === 0) { UI.toast(t('toast.energy_warn_0'), 3000); UI.appendLog(t('log.energy_warn_0'), 'bad'); }
      }
      _lastEnergyZone = curZone;
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
  let _comboHideTimer = null;

  function handleClick() {
    if (player.isSick)       { UI.toast(t('toast.sick_resting'));     return; }
    if (player.isCollapsed)  { UI.toast(t('toast.collapse_resting')); return; }
    if (player.energy < 1)   { UI.toast(t('toast.energy_low'));       return; }
    const { value, combo, mult } = player.click();
    UI.spawnFloat(value, mult > 1.0);

    // 连击显示
    const comboEl = document.getElementById('combo-display');
    if (comboEl) {
      comboEl.style.display = combo >= 5 ? '' : 'none';
      if (combo >= 5) {
        const lv = mult >= 2 ? 'lv3' : mult >= 1.5 ? 'lv2' : 'lv1';
        comboEl.className = 'combo-display ' + lv;
        comboEl.textContent = `×${mult.toFixed(1)} ${combo}連`;
      }
      // 阈值首次触达时飘特效文字
      if (combo === 5)  UI.spawnFloat('集中力 ×1.2', true);
      if (combo === 15) UI.spawnFloat('入状態！×1.5', true);
      if (combo === 30) UI.spawnFloat('🔥 燃焼 ×2.0', true);
      // 3秒无点击后隐藏
      clearTimeout(_comboHideTimer);
      _comboHideTimer = setTimeout(() => {
        if (comboEl) comboEl.style.display = 'none';
        if (player) player.comboCount = 0;
      }, 3000);
    }

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
      if (type.startsWith('staff:')) {
        const sid = type.slice(6);
        const def = AUTO_STAFF.find(s => s.id === sid);
        if (def && player.buyAutoStaff(sid)) {
          UI.appendLog(t('log.buy', { emoji: def.emoji, name: tf(def, 'label') }), 'good');
          UI.toast(t('toast.buy_ok', { name: tf(def, 'label') }));
          UI.updateStats(player); renderShops(); save();
        } else {
          UI.toast(t('toast.no_fund'));
        }
        return;
      }
      const result = player.buyTierUpgrade(type);
      if (result) {
        const effK = { keyboard: 'effect.keyboard', monitor: 'effect.monitor', chair: 'effect.chair' }[type];
        UI.appendLog(t('log.upgrade', { emoji: result.emoji, name: tf(result, 'label') }) + (effK ? `（${t(effK)}）` : ''), 'good');
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
      // 工位趴一会有风险被上司逮到
      if (id === 'rest' && Math.random() < 0.50) bossCatch();
    });
  }

  // ── 工位睡觉被上司逮到 ────────────────────────────────────
  function bossCatch() {
    if (eventActive) return;
    eventActive = true;
    const fine = 1500 + Math.floor(Math.random() * 2500); // 罚款 ¥1.5k–4k
    UI.showEventPopup({
      text: t('boss.catch.text'),
      choices: [
        { label: t('boss.catch.c1'), reply: t('boss.catch.c1r', { fine: fmtMoney(fine) }), tone: 'bad', _fine: fine },
        { label: t('boss.catch.c2'), reply: t('boss.catch.c2r'), tone: 'bad', _warn: true },
      ],
    }, choice => {
      if (choice._fine) {
        player.money = Math.max(0, player.money - choice._fine);
        player.happiness = clamp(player.happiness - 8, 0, 100);
        UI.toast(t('boss.catch.fine_penalty', { fine: fmtMoney(choice._fine) }), 2200);
      } else {
        player.warnCount = (player.warnCount || 0) + 1;
        const wc = player.warnCount;
        const hpLoss  = wc >= 2 ? 20 : 15;
        const hltLoss = wc >= 2 ? 10 : 5;
        player.happiness = clamp(player.happiness - hpLoss,  0, 100);
        player.health    = clamp(player.health    - hltLoss, 0, 100);
        UI.toast(t('boss.catch.c2_penalty', { n: wc, hp: hpLoss, hlt: hltLoss }), 2500);
        if (wc >= 3) {
          // 第三次：HR 约谈
          setTimeout(() => triggerHRWarning(), 800);
        }
      }
      UI.appendLog(t('boss.catch.log'), 'bad');
      UI.updateStats(player);
      renderShops();
      save();
      eventActive = false;
    });
  }

  // ── HR 约谈（嘴硬警告累计 3 次触发）────────────────────────
  function triggerHRWarning() {
    if (eventActive) return;
    eventActive = true;
    UI.showEventPopup({
      text: t('hr.warn.text'),
      choices: [
        { label: t('hr.warn.c1'), reply: t('hr.warn.c1r'), tone: 'bad', _hrwarn: true },
      ],
    }, choice => {
      player.happiness = clamp(player.happiness - 30, 0, 100);
      player.health    = clamp(player.health    - 20, 0, 100);
      player.warnCount = 0;
      UI.appendLog(t('hr.warn.log'), 'bad');
      UI.toast(t('hr.warn.penalty'), 2500);
      UI.updateStats(player);
      renderShops();
      save();
      eventActive = false;
    });
  }

  // ── 风俗店购买 → 触发故事事件 ────────────────────────────
  function buyFujoku() {
    const item = SHOP_ITEMS.find(s => s.id === 'fujoku');
    if (!player.canAfford(item.cost)) { UI.toast(t('toast.no_fund')); return; }
    if (player.energy < 20) { UI.toast(t('toast.energy_low')); return; }
    player.money    -= item.cost;
    player.happiness = clamp(player.happiness + 15, 0, 100);
    player.health    = clamp(player.health    - 12, 0, 100);
    player.energy    = clamp(player.energy    - 60, 0, 100);

    const storyIndex = fujokuVisits;
    fujokuVisits++;
    player.fujokuVisits = fujokuVisits;

    // 物語已讲完，后续只显示普通短事件
    const lang = getLang();
    const pick = (zh, en, ja) => lang === 'en' ? en : lang === 'ja' ? ja : zh;
    const story = storyIndex < FUJOKU_STORIES.length
      ? localizeEvent(FUJOKU_STORIES[storyIndex])
      : {
          isStory: false,
          text: pick('花了¥35,000。\n你告诉自己这是最后一次。\n你上次也是这么说的。',
                     'Spent ¥35,000.\nYou told yourself this was the last time.\nYou said that last time too.',
                     '¥35,000使った。\nもう最後にしようと自分に言い聞かせた。\n前回もそう言っていた。'),
          choices: [{ label: pick('又来了', 'Again', 'また来た'),
                      reply: pick('又是普通的一夜。', 'Just another night.', 'また普通の夜が過ぎた。'),
                      changes: {}, tone: 'neutral' }],
        };

    eventActive = true;
    UI.showEventPopup(story, choice => {
      player.modify(choice.changes || {});
      if (story.isStory && storyIndex < FUJOKU_STORIES.length) {
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

  // ── 成就检测 ─────────────────────────────────────────────
  const ACHIEVEMENT_CONDITIONS = {
    earn_10k:     p => p.totalEarned >= 10_000,
    earn_100k:    p => p.totalEarned >= 100_000,
    earn_1m:      p => p.totalEarned >= 1_000_000,
    earn_10m:     p => p.totalEarned >= 10_000_000,
    earn_100m:    p => p.totalEarned >= 100_000_000,
    got_keyboard: p => (p.tierLevels?.keyboard || 0) >= 1,
    got_monitor:  p => (p.tierLevels?.monitor  || 0) >= 1,
    got_chair:    p => (p.tierLevels?.chair    || 0) >= 1,
    got_ai:       p => (p.tierLevels?.ai       || 0) >= 1,
    promoted_1:   p => p.careerLevel >= 1,
    promoted_2:   p => p.careerLevel >= 2,
    got_kohai:    p => (p.autoStaff?.kohai  || 0) >= 1,
    got_script:   p => (p.autoStaff?.script || 0) >= 1,
    invested:     p => (p.portfolio?.bonds?.qty || 0) >= 1,
    btc_holder:   p => (p.portfolio?.btc?.qty   || 0) >= 1,
    collapsed:    p => p.everCollapsed === true,
    got_sick:     p => p.everSick      === true,
    first_fujoku: p => (p.fujokuVisits || 0) >= 1,
  };

  function checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
      const cond = ACHIEVEMENT_CONDITIONS[ach.id];
      if (!cond) continue;
      if (!cond(player)) continue;
      if (!player.unlockAchievement(ach.id)) continue;
      // 新解锁
      const name = tf(ach, 'label');
      UI.toast(`🏆 ${name}`, 2600);
      UI.appendLog(`🏆 ${name} — ${tf(ach, 'desc')}`, 'good');
      UI.renderAchievements(player);
    }
  }

  // ── 随机事件 ─────────────────────────────────────────────
  function checkEvent() {
    if (eventActive) return;
    if (Date.now() < player.nextEventAt) return;
    eventActive = true;
    const seenStoryKeys = new Set((player.storyLog || []).map(s => s.key).filter(Boolean));
    const seenEventKeys = new Set(player.seenEvents || []);
    const event = getRandomEvent(seenStoryKeys, seenEventKeys, player.day);
    UI.showEventPopup(event, choice => {
      player.modify(choice.changes || {});
      if (event.isStory) {
        player.addStory({ title: event.storyTitle, emoji: event.storyEmoji, text: event.text, reply: choice.reply || '', tone: choice.tone, key: event._storyKey });
        UI.showStoryBadge(player.storyLog.length);
      } else if (event._eventKey) {
        player.seenEvents = player.seenEvents || [];
        if (!player.seenEvents.includes(event._eventKey)) {
          player.seenEvents.push(event._eventKey);
          // 全部普通事件都见过则重洗
          const nonStoryTotal = POPUP_EVENTS.filter(e => !e.isStory).length;
          if (player.seenEvents.length >= nonStoryTotal) player.seenEvents = [];
        }
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
    const delay = 90000 + Math.random() * 150000; // 1.5–4 分钟
    marketTimer = setTimeout(() => { triggerMarketEvent(); scheduleMarket(); }, delay);
  }

  function checkMarketEvent() {} // handled by scheduleMarket

  function triggerMarketEvent() {
    const ev = pickMarketEvent(player.btcMarket);
    const prev = player.btcMarket;
    player.btcMarket = clamp2(prev * ev.mult, 0.02, 10.0);

    // 只在投资面板已解锁（设备齐全）时才显示行情新闻
    if (!player.gearComplete) return;

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

  // ── 人事考课（年功序列晋升）──────────────────────────────
  let reviewShowing = false;
  function triggerReview(level) {
    if (eventActive || reviewShowing) return;  // 忙/已在显示则跳过，下个 tick 再来
    reviewShowing = true;
    eventActive   = true;
    UI.showEventPopup({
      text: t('review.text'),
      choices: [
        { label: t('review.c1'), reply: t('review.c1r'), tone: 'good',    changes: { happiness: 5 } },
        { label: t('review.c2'), reply: t('review.c2r'), tone: 'neutral', changes: { happiness: -3 } },
      ],
    }, choice => {
      player.careerLevel = level;          // 确认晋升
      player.modify(choice.changes || {});
      UI.appendLog(t('log.promoted', { title: player.title }), 'good');
      if (level === 2) UI.appendLog(t('log.kohai_unlocked'), 'good');
      UI.updateStats(player);
      renderShops();
      save();
      eventActive   = false;
      reviewShowing = false;
    });
  }

  // ── 贿赂上司（买官捷径·玩梗）──────────────────────────────
  function bribe() {
    if (eventActive || player.careerLevel >= 4) return;
    const cost = player.bribeCost;
    if (player.money < cost)                    { UI.toast(t('toast.no_fund')); return; }
    if (Date.now() < (player.bribeCooldown || 0)) { UI.toast(t('toast.bribe_cd')); return; }
    player.money -= cost;
    player.bribeCooldown = Date.now() + 5 * 60000;  // 5 分钟冷却
    eventActive = true;
    const caught = Math.random() < 0.25;            // 25% 翻车
    UI.showEventPopup({
      text: t(caught ? 'bribe.fail.text' : 'bribe.ok.text'),
      choices: [{ label: t('choice.continue'), reply: t(caught ? 'bribe.fail.r' : 'bribe.ok.r'), changes: {}, tone: caught ? 'bad' : 'good' }],
    }, () => {
      if (caught) {
        player.money += cost;                        // 退款
        player.happiness = clamp(player.happiness - 10, 0, 100);
        UI.appendLog(t('bribe.fail.log'), 'bad');
      } else {
        player.careerLevel++;
        UI.appendLog(t('bribe.ok.log', { title: player.title }), 'good');
        if (player.careerLevel === 2) UI.appendLog(t('log.kohai_unlocked'), 'good');
      }
      UI.updateStats(player); renderShops(); save();
      eventActive = false;
    });
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
