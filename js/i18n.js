'use strict';

const I18N = {
  zh: {
    // title screen
    'title.desc':        '在这座永不停歇的城市里，你只是一颗螺丝钉。',
    'title.new':         '[ 新游戏 ]',
    'title.continue':    '[ 继续 ]',
    'title.export':      '[ 导出存档 ]',
    'title.import':      '[ 导入存档 ]',
    'title.time':        '🗼 东京时间',

    // create screen
    'create.title':      '── 新的社畜诞生 ──',
    'create.p1':         '入职第一天。',
    'create.p2':         '你跟着公司从F国搬来了这座城市。<br/>你不会日语，但合同已经签了。',
    'create.p3':         '先从敲代码开始吧。',
    'create.p4':         '（我只是个会点鼠标的猴子）',
    'create.placeholder':'你的名字',
    'create.start':      '入 职 →',

    // game header
    'lang.toggle':       'EN',
    'lang.change':       '🌐 语言',

    // stat panel
    'panel.status':      '── 状 态 ──',
    'stat.energy':       '体力',
    'stat.health':       '健康',
    'stat.happiness':    '快乐',
    'panel.finance':     '── 财 务 ──',
    'finance.click':     '点击: ',
    'finance.sec':       ' &nbsp;自动: ',
    'finance.kohai':     '後輩压榨累计: ',
    'panel.config':      '── 当前配置 ──',
    'panel.portfolio':   '── 投资组合 ──',
    'panel.market':      '── 市场行情 ──',
    'btn.stories':       '📖 物語',
    'btn.save':          '[ 存档 ]',
    'btn.title':         '[ 主页 ]',
    'music.on':          '🎵 音乐 开',
    'music.off':         '🎵 音乐 关',
    'music.disliked':    '👎 已拉黑这个电台，切走',

    // center panel
    'team.title':        '团队（被压榨成员）',
    'team.empty':        '目前只有你一个人……',
    'team.more':         '+{n}人',
    'log.title':         '── 今日记录 ──',
    'hint.click':        '👆 点击下面的屏幕，敲代码赚钱',
    'log.welcome':       '👆 点击上方屏幕，敲代码赚钱',
    'popup.tag':         '── 突发事件 ──',
    'choice.continue':   '── 继续 ──',

    // shop panels
    'panel.auto':        '── 自 动 化 ──',
    'panel.upgrade':     '── 设 备 升 级 ──',
    'panel.invest':      '── 投 资 ──',
    'panel.life':        '── 生 活 消 费 ──',

    // portfolio
    'portfolio.value':   '市值',
    'portfolio.cost':    '成本',
    'portfolio.gain':    '浮盈',
    'portfolio.ps':      '/s',
    'portfolio.unrealized': '未实现',
    'portfolio.realized':   '已实现',
    'portfolio.empty':   '尚无投资',
    'sell.btn':          '卖出',
    'portfolio.market':  '行情',
    'portfolio.sellprice':'卖出价',
    'portfolio.crash_warn':'⚠️ 比特币几乎归零。现在卖还能回点血。',
    'inv.fixed':         '固定',
    'inv.risk':          '高风险・可卖出',

    // config
    'config.empty':      '未配置',
    'config.ai.empty':   'AI未启动',
    'config.keyboard.empty':'公司发的键盘',
    'config.monitor.empty': '公司发的显示器',
    'config.chair.empty':   '公司发的椅子',

    // upgrade shop
    'upgrade.keyboard':  '键盘',
    'upgrade.monitor':   '显示器',
    'upgrade.chair':     '椅子',
    'upgrade.ai':        'AI助手',
    'upgrade.maxed':     '已满级 ✓',
    'upgrade.owned':     '已解锁 ✓',
    'upgrade.ai.run':    '▶ 启动运行',

    // auto shop
    'auto.ai.off':   '购买 AI 助手后自动永久运行',
    'auto.total':    '合计自动化：',
    'kohai.recruit.first': '招募第一个後輩。作为小组长，压榨他们是你的权利。',
    'kohai.recruit.more':  '当前团队 {n} 人。再申请一个？',
    'kohai.locked':        '🔒 需要晋升为【主任】后才能向 HR 申请後輩',
    'kohai.locked.cur':    '当前：{title}（Day {day}/90）',
    'kohai.hr.pending':    '📋 HR 审核中…',
    'kohai.hr.eta':        '申请书已提交，等待 HR 回复',
    'kohai.hr.remaining':  '预计剩余：{n} 秒',
    'kohai.hr.btn':        '向HR申請 ¥50k',
    'kohai.hr.cooldown':   'HR 冷却中 ({n}s)',
    'kohai.hr.nofund':     '余额不足 ¥50,000',
    'ai.running':          '🤖 AI Lv{n} 永久运行中',

    // life shop
    'shop.cooldown':     ' (冷却中)',
    'shop.free':         '免费',

    // story modal
    'story.title':       '── 物 語 ──',
    'story.empty':       '还没有记录任何故事。<br/>去游戏里触发它们吧。',
    'story.expand':      '展开',
    'story.collapse':    '收起',
    'story.close':       '[ 关闭 ]',

    // toasts / logs
    'toast.no_save':        '没有存档',
    'toast.copied':         '存档码已复制 ✓',
    'toast.copy_manual':    '复制存档码：',
    'toast.paste_save':     '粘贴存档码：',
    'toast.import_ok':      '导入成功 ✓',
    'toast.import_fail':    '存档码无效',
    'toast.need_name':      '请输入名字',
    'toast.overwrite':      '已有存档，确定覆盖？',
    'toast.auto_save':      '自动存档 ✓',
    'toast.save_ok':        '存档完成 ✓',
    'toast.energy_low':     '体力耗尽，先去休息吧',
    'toast.sick':           '🤒 你病倒了，被迫休息',
    'toast.sick_resting':   '病倒休息中，动不了',
    'log.sick':             '🤒 健康透支，你病倒了，被迫停工',
    'crisis.text':          `你盯着屏幕，突然不想再点任何东西。\n\n「我到底在这里干什么？」\n这个念头第一次这么清晰。\n\n要辞职吗？还是再撑一下？`,
    'crisis.tough':         '再撑一下',
    'crisis.tough.reply':   '你深吸一口气，把简历又关掉了。心情勉强回稳，但身体更累了。',
    'crisis.leave':         '请几天假',
    'crisis.leave.reply':   '你交了请假申请。这几天什么都不做，只是发呆。回来时，好像又能继续了。',
    'boss.catch.text':      `你正趴在键盘上补觉——\n肩膀被人拍了一下。\n\n上司站在身后，面无表情地看着你。\n「○○さん…上班时间睡得挺香啊。」`,
    'boss.catch.c1':        '立刻清醒，连声道歉',
    'boss.catch.c1r':       '你点头哈腰道歉。上司扣了你这个月一点绩效（{fine}），转身走了。',
    'boss.catch.c2':        '嘴硬：我在闭眼调试',
    'boss.catch.c2r':       '上司冷笑一声，在本子上记了一笔。你得到一次正式警告。',
    'boss.catch.log':       '🫣 趴桌补觉被上司逮到了',
    'toast.buy_sell':       '{name} 已卖出 {gain}',
    'toast.buy_ok':         '购入 {name} ✓',
    'toast.no_fund':        '余额不足',
    'toast.maxed':          '已满级',
    'toast.cooldown':       '冷却中，稍后再来',
    'toast.kohai_need_rank':'需要晋升为主任后才能申请',
    'toast.kohai_pending':  '申请还在审核中…',
    'toast.kohai_cooldown': 'HR 冷却中，稍后再试',
    'toast.kohai_nofund':   '余额不足 ¥50,000',
    'toast.hr_submit':      '申请书已提交，等待 HR 回复',
    'toast.hr_approve':     'HR 批准了！後輩入职 ✓',
    'toast.hr_reject':      'HR：今期は予算がありません（已退款）',
    'toast.ai_need_buy':    '请先购买 AI 助手升级',
    'toast.ai_no_fund':     '余额不足',
    'toast.ai_start':       'AI 运行中 ✓',
    'toast.ai_cancel':      '[ 取消 ]',

    'log.sell':      '卖出 {emoji} {name}，实现收益 {gain}',
    'log.buy':       '买入 {emoji} {name}',
    'log.upgrade':   '{emoji} 升级为【{name}】',
    'log.hr_submit': '📋 已向 HR 提交後輩申请书，等待审核…',
    'log.hr_approve':'✅ HR 批准！第 {n} 位後輩即将入职',
    'log.hr_reject': '❌ HR 拒绝：今期は予算がありません',
    'log.ai_start':  '🤖 AI 开始运行，时长 {n} 小时',
    'log.ai_end':    '🤖 AI 运行结束',
    'log.btc_crash': '₿ 比特币崩盘！你的持仓几乎归零。',

    // AI config popup
    'ai.cost_per_sec': 'Token 消耗：',
    'ai.earn_per_sec': '代码产出：',
    'ai.net_per_sec':  '净收益：',
    'ai.choose_dur':   '选择运行时长：',
    'ai.dur.1h':  '1 小时',
    'ai.dur.4h':  '4 小时',
    'ai.dur.8h':  '8 小时',
    'ai.dur.24h': '24 小时',
    'ai.dur.cost':   '消耗 {n}',
    'ai.dur.profit': '+{n}',

    // HR event popup texts
    'hr.approve.text': `HR 发来邮件：\n\n「您的人员申请已获批准。\n新员工将于本周一报到。」\n\n你看着坐到对面工位的新人，\n想起自己当年入职第一天的样子。\n\n然后你把最难的需求分配给了他。`,
    'hr.approve.choice': '这就是社会',
    'hr.approve.reply':  '後輩用迷茫的眼神看着你。你露出了意味深长的微笑。',
    'hr.reject.text': `HR 发来邮件：\n\n「感谢您的申请。\n经研究，今期人力预算已冻结，\n暂无法批准新增人员需求。\n\n如有需要请在下期重新提交。」\n\n你盯着这封邮件看了很久。\n¥50,000 已原路退回。`,
    'hr.reject.choice': '好的（不好的）',
    'hr.reject.reply':  '你把申请书模板存好，下次还要用。',
  },

  en: {
    // title screen
    'title.desc':        'In this city that never stops, you are just a cog in the machine.',
    'title.new':         '[ New Game ]',
    'title.continue':    '[ Continue ]',
    'title.export':      '[ Export Save ]',
    'title.import':      '[ Import Save ]',
    'title.time':        '🗼 Tokyo Time',

    // create screen
    'create.title':      '── A New Wage Slave is Born ──',
    'create.p1':         'First day on the job.',
    'create.p2':         'Your company relocated you here from home.<br/>You don\'t speak Japanese, but the contract is signed.',
    'create.p3':         'Better start writing some code.',
    'create.p4':         '(Just a monkey who knows how to click)',
    'create.placeholder':'Your name',
    'create.start':      'Clock In →',

    // game header
    'lang.toggle':       '中',
    'lang.change':       '🌐 Language',

    // stat panel
    'panel.status':      '── STATUS ──',
    'stat.energy':       'Energy',
    'stat.health':       'Health',
    'stat.happiness':    'Mood',
    'panel.finance':     '── FINANCE ──',
    'finance.click':     'Click: ',
    'finance.sec':       ' &nbsp;Auto: ',
    'finance.kohai':     'Kohai earnings: ',
    'panel.config':      '── EQUIPMENT ──',
    'panel.portfolio':   '── PORTFOLIO ──',
    'panel.market':      '── MARKET ──',
    'btn.stories':       '📖 Stories',
    'btn.save':          '[ Save ]',
    'btn.title':         '[ Menu ]',
    'music.on':          '🎵 Music On',
    'music.off':         '🎵 Music Off',
    'music.disliked':    '👎 Station blocked — switching',

    // center panel
    'team.title':        'Team (The Exploited)',
    'team.empty':        'Just you for now…',
    'team.more':         '+{n}',
    'log.title':         '── Today\'s Log ──',
    'hint.click':        '👆 Click the screen below to write code & earn',
    'log.welcome':       '👆 Click the screen above to write code & earn',
    'popup.tag':         '── EVENT ──',
    'choice.continue':   '── Continue ──',

    // shop panels
    'panel.auto':        '── AUTOMATION ──',
    'panel.upgrade':     '── UPGRADES ──',
    'panel.invest':      '── INVEST ──',
    'panel.life':        '── LIFESTYLE ──',

    // portfolio
    'portfolio.value':   'Value',
    'portfolio.cost':    'Cost',
    'portfolio.gain':    'P&L',
    'portfolio.ps':      '/s',
    'portfolio.unrealized': 'Unrealized',
    'portfolio.realized':   'Realized',
    'portfolio.empty':   'No investments yet',
    'sell.btn':          'Sell',
    'portfolio.market':  'Market',
    'portfolio.sellprice':'Sell px',
    'portfolio.crash_warn':'⚠️ Bitcoin near zero. Sell now to salvage something.',
    'inv.fixed':         'fixed',
    'inv.risk':          'High risk · sellable',

    // config
    'config.empty':      'Not configured',
    'config.ai.empty':   'AI inactive',
    'config.keyboard.empty':'Company keyboard',
    'config.monitor.empty': 'Company monitor',
    'config.chair.empty':   'Company chair',

    // upgrade shop
    'upgrade.keyboard':  'Keyboard',
    'upgrade.monitor':   'Monitor',
    'upgrade.chair':     'Chair',
    'upgrade.ai':        'AI Assist',
    'upgrade.maxed':     'Maxed ✓',
    'upgrade.owned':     'Unlocked ✓',
    'upgrade.ai.run':    '▶ Start Run',

    // auto shop
    'auto.ai.off':   'Buy an AI upgrade to enable auto-run',
    'auto.total':    'Total automation: ',
    'kohai.recruit.first': 'Hire your first kohai. As team lead, exploiting them is your right.',
    'kohai.recruit.more':  'Team of {n}. Hire another?',
    'kohai.locked':        '🔒 Reach 【Section Chief】 rank to apply for kohai',
    'kohai.locked.cur':    'Current: {title} (Day {day}/90)',
    'kohai.hr.pending':    '📋 HR Review in Progress…',
    'kohai.hr.eta':        'Application submitted, awaiting HR reply',
    'kohai.hr.remaining':  'Est. remaining: {n}s',
    'kohai.hr.btn':        'Apply to HR ¥50k',
    'kohai.hr.cooldown':   'HR cooldown ({n}s)',
    'kohai.hr.nofund':     'Insufficient funds ¥50,000',
    'ai.running':          '🤖 AI Lv{n} running permanently',

    // life shop
    'shop.cooldown':     ' (cooldown)',
    'shop.free':         'Free',

    // story modal
    'story.title':       '── STORIES ──',
    'story.empty':       'No stories recorded yet.<br/>Trigger events in-game to find them.',
    'story.expand':      'Expand',
    'story.collapse':    'Collapse',
    'story.close':       '[ Close ]',

    // toasts / logs
    'toast.no_save':        'No save data',
    'toast.copied':         'Save code copied ✓',
    'toast.copy_manual':    'Copy save code:',
    'toast.paste_save':     'Paste save code:',
    'toast.import_ok':      'Import successful ✓',
    'toast.import_fail':    'Invalid save code',
    'toast.need_name':      'Please enter a name',
    'toast.overwrite':      'Save data exists. Overwrite?',
    'toast.auto_save':      'Auto-saved ✓',
    'toast.save_ok':        'Saved ✓',
    'toast.energy_low':     'No energy left — take a rest',
    'toast.sick':           '🤒 You collapsed. Forced rest.',
    'toast.sick_resting':   'Sick — too weak to work',
    'log.sick':             '🤒 Health ran out — you collapsed and had to stop working',
    'crisis.text':          `You stare at the screen and suddenly don't want to click anything.\n\n"What am I even doing here?"\nThe thought has never been this clear.\n\nQuit? Or push on a little longer?`,
    'crisis.tough':         'Push on',
    'crisis.tough.reply':   'You take a deep breath and close the resume tab again. Your mood steadies, but your body is more tired.',
    'crisis.leave':         'Take a few days off',
    'crisis.leave.reply':   'You file for leave. A few days of doing nothing, staring into space. By the time you return, you can keep going again.',
    'boss.catch.text':      `Face-down on your keyboard, mid-nap—\na tap on your shoulder.\n\nYour boss looms over you, expressionless.\n"Sleeping well on the clock, are we?"`,
    'boss.catch.c1':        'Snap awake and apologize',
    'boss.catch.c1r':       'You bow and apologize. The boss docks a bit of your performance pay ({fine}) and walks off.',
    'boss.catch.c2':        'Bluff: "I was debugging with my eyes closed"',
    'boss.catch.c2r':       'The boss smirks and writes something down. You get an official warning.',
    'boss.catch.log':       '🫣 Caught napping at your desk by the boss',
    'toast.buy_sell':       '{name} sold {gain}',
    'toast.buy_ok':         'Bought {name} ✓',
    'toast.no_fund':        'Insufficient funds',
    'toast.maxed':          'Already maxed',
    'toast.cooldown':       'On cooldown, try again later',
    'toast.kohai_need_rank':'Reach Section Chief rank to apply',
    'toast.kohai_pending':  'Application still under review…',
    'toast.kohai_cooldown': 'HR on cooldown, try again later',
    'toast.kohai_nofund':   'Insufficient funds ¥50,000',
    'toast.hr_submit':      'Application submitted, awaiting HR reply',
    'toast.hr_approve':     'HR approved! Kohai joining ✓',
    'toast.hr_reject':      'HR: No budget this quarter (refunded)',
    'toast.ai_need_buy':    'Purchase an AI upgrade first',
    'toast.ai_no_fund':     'Insufficient funds',
    'toast.ai_start':       'AI running ✓',
    'toast.ai_cancel':      '[ Cancel ]',

    'log.sell':      'Sold {emoji} {name}, realized gain {gain}',
    'log.buy':       'Bought {emoji} {name}',
    'log.upgrade':   '{emoji} Upgraded to 【{name}】',
    'log.hr_submit': '📋 Submitted kohai application to HR…',
    'log.hr_approve':'✅ HR approved! Kohai #{n} joining',
    'log.hr_reject': '❌ HR: No budget this quarter',
    'log.ai_start':  '🤖 AI started, running for {n} hours',
    'log.ai_end':    '🤖 AI run complete',
    'log.btc_crash': '₿ Bitcoin crashed! Your holdings are nearly worthless.',

    // AI config popup
    'ai.cost_per_sec': 'Token cost: ',
    'ai.earn_per_sec': 'Code output: ',
    'ai.net_per_sec':  'Net gain: ',
    'ai.choose_dur':   'Choose run duration:',
    'ai.dur.1h':  '1 Hour',
    'ai.dur.4h':  '4 Hours',
    'ai.dur.8h':  '8 Hours',
    'ai.dur.24h': '24 Hours',
    'ai.dur.cost':   'Cost {n}',
    'ai.dur.profit': '+{n}',

    // HR event popup texts
    'hr.approve.text': `Email from HR:\n\n"Your staffing request has been approved.\nThe new employee will report on Monday."\n\nYou watch them settle into the desk across from yours,\nremembering your own first day.\n\nThen you assign them the hardest ticket in the backlog.`,
    'hr.approve.choice': 'This is the system',
    'hr.approve.reply':  'Your kohai stares at the task with lost eyes. You smile knowingly.',
    'hr.reject.text': `Email from HR:\n\n"Thank you for your request.\nUnfortunately, the headcount budget\nfor this quarter has been frozen.\n\nPlease resubmit next quarter."\n\nYou stare at the email for a long time.\n¥50,000 has been refunded.`,
    'hr.reject.choice': 'Understood. (It\'s not fine.)',
    'hr.reject.reply':  'You save the application template. You\'ll need it again.',
  },

  ja: {
    // title screen
    'title.desc':        'この眠らない街で、あなたはただのネジだ。',
    'title.new':         '[ 新規ゲーム ]',
    'title.continue':    '[ つづきから ]',
    'title.export':      '[ セーブ出力 ]',
    'title.import':      '[ セーブ入力 ]',
    'title.time':        '🗼 東京時間',

    // create screen
    'create.title':      '── 新しい社畜、誕生 ──',
    'create.p1':         '入社初日。',
    'create.p2':         '会社の都合で、この街に移ってきた。<br/>日本語はできないけど、もう契約にサインした。',
    'create.p3':         'まずはコードを書くことから始めよう。',
    'create.p4':         '（ただマウスを動かすだけの猿です）',
    'create.placeholder':'あなたの名前',
    'create.start':      '入 社 →',

    // game header
    'lang.toggle':       '中',
    'lang.change':       '🌐 言語',

    // stat panel
    'panel.status':      '── ス テ ー タ ス ──',
    'stat.energy':       '体力',
    'stat.health':       '健康',
    'stat.happiness':    '幸福度',
    'panel.finance':     '── 財 務 ──',
    'finance.click':     'クリック: ',
    'finance.sec':       ' &nbsp;自動: ',
    'finance.kohai':     '後輩搾取合計: ',
    'panel.config':      '── 現在の装備 ──',
    'panel.portfolio':   '── ポートフォリオ ──',
    'panel.market':      '── 市場動向 ──',
    'btn.stories':       '📖 物語',
    'btn.save':          '[ セーブ ]',
    'btn.title':         '[ タイトル ]',
    'music.on':          '🎵 BGM オン',
    'music.off':         '🎵 BGM オフ',
    'music.disliked':    '👎 この局をブロック、切替',

    // center panel
    'team.title':        'チーム（搾取される側）',
    'team.empty':        '今はあなただけ……',
    'team.more':         '+{n}人',
    'log.title':         '── 本日の記録 ──',
    'hint.click':        '👆 下の画面をクリックしてコードを書こう',
    'log.welcome':       '👆 上の画面をクリックしてコードを書いて稼ごう',
    'popup.tag':         '── イベント発生 ──',
    'choice.continue':   '── 続ける ──',

    // shop panels
    'panel.auto':        '── 自 動 化 ──',
    'panel.upgrade':     '── 設 備 強 化 ──',
    'panel.invest':      '── 投 資 ──',
    'panel.life':        '── 生 活 費 ──',

    // portfolio
    'portfolio.value':   '時価',
    'portfolio.cost':    '原価',
    'portfolio.gain':    '含み損益',
    'portfolio.ps':      '/秒',
    'portfolio.unrealized': '含み損益',
    'portfolio.realized':   '確定損益',
    'portfolio.empty':   '投資なし',
    'sell.btn':          '売却',
    'portfolio.market':  '相場',
    'portfolio.sellprice':'売値',
    'portfolio.crash_warn':'⚠️ ビットコインがほぼゼロ。今売れば少しは戻る。',
    'inv.fixed':         '固定',
    'inv.risk':          'ハイリスク・売却可',

    // config
    'config.empty':      '未設定',
    'config.ai.empty':   'AI停止中',
    'config.keyboard.empty':'会社のキーボード',
    'config.monitor.empty': '会社のモニター',
    'config.chair.empty':   '会社の椅子',

    // upgrade shop
    'upgrade.keyboard':  'キーボード',
    'upgrade.monitor':   'モニター',
    'upgrade.chair':     'チェア',
    'upgrade.ai':        'AIアシスト',
    'upgrade.maxed':     '最大強化済 ✓',
    'upgrade.owned':     '解除済 ✓',
    'upgrade.ai.run':    '▶ 起動',

    // auto shop
    'auto.ai.off':   'AIを購入すると自動で永続稼働',
    'auto.total':    '自動化合計: ',
    'kohai.recruit.first': '最初の後輩を募集。チームリーダーとして、こき使う権利がある。',
    'kohai.recruit.more':  '現在{n}人チーム。もう一人申請する？',
    'kohai.locked':        '🔒 【主任】に昇進後、HR申請が可能',
    'kohai.locked.cur':    '現在: {title}（Day {day}/90）',
    'kohai.hr.pending':    '📋 HR審査中…',
    'kohai.hr.eta':        '申請書を提出済み、HR返答待ち',
    'kohai.hr.remaining':  '残り予定時間: {n}秒',
    'kohai.hr.btn':        'HRへ申請 ¥50k',
    'kohai.hr.cooldown':   'HRクールダウン中 ({n}s)',
    'kohai.hr.nofund':     '残高不足 ¥50,000',
    'ai.running':          '🤖 AI Lv{n} 永続稼働中',

    // life shop
    'shop.cooldown':     ' (クールダウン)',
    'shop.free':         '無料',

    // story modal
    'story.title':       '── 物 語 ──',
    'story.empty':       'まだ記録された物語はない。<br/>ゲーム内でイベントを引き起こそう。',
    'story.expand':      '展開',
    'story.collapse':    '折り畳む',
    'story.close':       '[ 閉じる ]',

    // toasts / logs
    'toast.no_save':        'セーブデータなし',
    'toast.copied':         'セーブコードをコピーしました ✓',
    'toast.copy_manual':    'セーブコードをコピー:',
    'toast.paste_save':     'セーブコードを貼り付け:',
    'toast.import_ok':      'インポート成功 ✓',
    'toast.import_fail':    '無効なセーブコード',
    'toast.need_name':      '名前を入力してください',
    'toast.overwrite':      'セーブデータが存在します。上書きしますか？',
    'toast.auto_save':      'オートセーブ ✓',
    'toast.save_ok':        'セーブ完了 ✓',
    'toast.energy_low':     '体力切れ。休んでください',
    'toast.sick':           '🤒 倒れた。強制休養',
    'toast.sick_resting':   '療養中、動けない',
    'log.sick':             '🤒 健康を使い果たし、倒れて強制休業',
    'crisis.text':          `画面を見つめて、急に何もクリックしたくなくなった。\n\n「自分は一体ここで何をしているんだ？」\nその思いが初めてこんなに鮮明になった。\n\n辞める？それとももう少し耐える？`,
    'crisis.tough':         'もう少し耐える',
    'crisis.tough.reply':   '深呼吸して、履歴書をそっと閉じた。気持ちは持ち直したが、体はもっと疲れた。',
    'crisis.leave':         '数日休む',
    'crisis.leave.reply':   '休暇届を出した。数日間、ただぼんやり過ごす。戻る頃には、また続けられる気がした。',
    'boss.catch.text':      `キーボードに突っ伏して仮眠中——\n肩を叩かれた。\n\n上司が無表情で見下ろしている。\n「○○さん…勤務中にずいぶん気持ちよさそうだね。」`,
    'boss.catch.c1':        'すぐ起きて平謝り',
    'boss.catch.c1r':       'ペコペコ謝った。上司は今月の評価を少し削り（{fine}）、去っていった。',
    'boss.catch.c2':        '強がる：目を閉じてデバッグ中です',
    'boss.catch.c2r':       '上司は鼻で笑い、手帳に何か書き込んだ。正式な警告を1つ受けた。',
    'boss.catch.log':       '🫣 デスクで仮眠中に上司に見つかった',
    'toast.buy_sell':       '{name} 売却 {gain}',
    'toast.buy_ok':         '{name} 購入 ✓',
    'toast.no_fund':        '残高不足',
    'toast.maxed':          '最大強化済み',
    'toast.cooldown':       'クールダウン中、後でまた',
    'toast.kohai_need_rank':'主任以上に昇進後に申請可能',
    'toast.kohai_pending':  'まだ審査中…',
    'toast.kohai_cooldown': 'HRクールダウン中、後でまた',
    'toast.kohai_nofund':   '残高不足 ¥50,000',
    'toast.hr_submit':      '申請書を提出しました、HR返答待ち',
    'toast.hr_approve':     'HR承認！後輩入社 ✓',
    'toast.hr_reject':      'HR: 今期は予算がありません（返金済）',
    'toast.ai_need_buy':    '先にAIアップグレードを購入してください',
    'toast.ai_no_fund':     '残高不足',
    'toast.ai_start':       'AI稼働中 ✓',
    'toast.ai_cancel':      '[ キャンセル ]',

    'log.sell':      '{emoji} {name} 売却、確定損益 {gain}',
    'log.buy':       '{emoji} {name} 購入',
    'log.upgrade':   '{emoji} 【{name}】にアップグレード',
    'log.hr_submit': '📋 後輩申請書をHRに提出しました…',
    'log.hr_approve':'✅ HR承認！{n}人目の後輩が入社',
    'log.hr_reject': '❌ HR: 今期は予算がありません',
    'log.ai_start':  '🤖 AI稼働開始、{n}時間実行',
    'log.ai_end':    '🤖 AI稼働終了',
    'log.btc_crash': '₿ ビットコイン大暴落！保有分がほぼ無価値に。',

    // AI config popup
    'ai.cost_per_sec': 'トークン消費: ',
    'ai.earn_per_sec': 'コード産出: ',
    'ai.net_per_sec':  '純利益: ',
    'ai.choose_dur':   '稼働時間を選択:',
    'ai.dur.1h':  '1時間',
    'ai.dur.4h':  '4時間',
    'ai.dur.8h':  '8時間',
    'ai.dur.24h': '24時間',
    'ai.dur.cost':   '消費 {n}',
    'ai.dur.profit': '+{n}',

    // HR event popup texts
    'hr.approve.text': `HRからメール:\n\n「人員申請を承認しました。\n新入社員は月曜に出社します。」\n\n向かいの席に座る新人を見て、\n自分の入社初日を思い出す。\n\nそして一番難しいタスクを割り振った。`,
    'hr.approve.choice': 'それが社会',
    'hr.approve.reply':  '後輩は迷子のような目でタスクを見つめる。あなたは意味深な笑みを浮かべた。',
    'hr.reject.text': `HRからメール:\n\n「この度はご申請いただき、\nありがとうございます。\n今期の人件費予算は凍結のため、\n申請を承認できません。\n\n来期に再提出をお願いします。」\n\nそのメールをしばらく見つめた。\n¥50,000は返金されました。`,
    'hr.reject.choice': 'わかりました。（よくない）',
    'hr.reject.reply':  '申請書テンプレートを保存した。また使うことになる。',
  },
};

let _lang = localStorage.getItem('tokyo_lang') || 'zh';

// 是否已经选过语言（决定首次加载是否弹出语言选择界面）
function langChosen() { return localStorage.getItem('tokyo_lang') != null; }

function t(key, vars) {
  const str = I18N[_lang]?.[key] ?? I18N.zh[key] ?? key;
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// 数据对象字段本地化：返回 obj.<base>_<lang> ?? obj.<base>
// 例：tf(item, 'label') → item.label_ja / item.label_en / item.label
function tf(obj, base) {
  if (!obj) return '';
  return obj[base + '_' + _lang] ?? obj[base] ?? '';
}

// ── 按职级/随机的本地化数组（每种语言下全用该语言）──────────────
const CAREER_TITLES = {
  zh: ['新人',         '正式员工',  '主任',         '系长',          '课长'],
  ja: ['新卒社員',     '平社員',    '主任',         '係長',          '課長'],
  en: ['New Hire',     'Staff',     'Section Chief','Section Mgr',   'Dept Head'],
};
function careerTitle(level) {
  const a = CAREER_TITLES[_lang] || CAREER_TITLES.zh;
  return a[level] ?? a[0];
}

const KOHAI_STATUSES_I18N = {
  zh: ['修Bug中…',     '代码审查',        '写文档中',       '开会中',        '加班中…',     '端茶倒水'],
  ja: ['バグ修正中…',  'コードレビュー',  '資料作成中',     'ミーティング',  '残業中…',     'お茶汲み'],
  en: ['Fixing bugs…', 'Code review',     'Writing docs',   'In a meeting',  'Overtime…',   'Making tea'],
};
function kohaiStatuses() { return KOHAI_STATUSES_I18N[_lang] || KOHAI_STATUSES_I18N.zh; }

const MEMBER_NAMES_I18N = {
  zh: ['田中','铃木','佐藤','高桥','渡边','中村','小林','加藤','吉田','山田'],
  ja: ['田中','鈴木','佐藤','高橋','渡辺','中村','小林','加藤','吉田','山田'],
  en: ['Tanaka','Suzuki','Sato','Takahashi','Watanabe','Nakamura','Kobayashi','Kato','Yoshida','Yamada'],
};
function memberNames() { return MEMBER_NAMES_I18N[_lang] || MEMBER_NAMES_I18N.zh; }

function getLang() { return _lang; }

function setLang(lang) {
  _lang = lang;
  localStorage.setItem('tokyo_lang', lang);
  applyI18n();
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.innerHTML = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    el.value = t(el.dataset.i18nValue);
  });
  // 高亮语言选择界面里当前选中的语言
  document.querySelectorAll('.lang-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.lang === _lang);
  });
  document.documentElement.lang = _lang === 'zh' ? 'zh-CN' : _lang === 'ja' ? 'ja' : 'en';
}
