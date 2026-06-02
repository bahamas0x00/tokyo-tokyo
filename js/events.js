'use strict';

const POPUP_EVENTS = [

  // ── 早期（DAY 1–35）新来的 ──────────────────────────────────

  {
    maxDay: 20,
    isStory: true,
    storyTitle: '三十天找房子',
    storyTitle_en: 'Thirty Days to Find a Place',
    storyTitle_ja: '三十日で部屋を探す',
    storyEmoji: '🏠',
    text: 'HR发来邮件——\n「入住期限为30天，之后请自行安排住所。」\n\n你打开了Suumo。\n页面全是日语。\n你不会日语。',
    text_en: 'An email from HR:\n"Company housing ends in 30 days.\nPlease arrange your own accommodation after that."\n\nYou open Suumo.\nEvery page is in Japanese.\nYou don\'t speak Japanese.',
    text_ja: 'HRからメールが来た。\n「社宅の入居期限は30日後です。\nその後は自力で住居を確保してください。」\n\nSuumoを開いた。\n全部日本語だ。\n日本語はわからない。',
    tone: 'bad',
    choices: [
      { label: '开始一行一行翻译', label_en: 'Start translating line by line', label_ja: '一行ずつ翻訳し始める', reply: '你用翻译软件，一个词一个词地读。\n"礼金"和"敷金"——后来才知道都是要付的。\n倒计时：30天。', reply_en: 'You use a translation app, word by word.\n"Reikin" and "shikikin" — you learn later they both mean money you have to pay.\nCountdown: 30 days.', reply_ja: '翻訳アプリで一語一語読んでいく。\n「礼金」「敷金」——後で知ったが、どちらもお金を払うものだ。\nカウントダウン：30日。', changes: { energy: -15, happiness: -10 }, tone: 'bad' },
      { label: '找HR求助', label_en: 'Ask HR for help', label_ja: 'HRに助けを求める', reply: 'HR介绍了一个中介。\n中介问："外国人？日語大丈夫？"\n你说了个"No"。电话那头沉默了两秒。\n你听懂了那个沉默的意思。', reply_en: 'HR refers you to an agent.\nThe agent asks: "Foreigner? Japanese okay?"\nYou say "No." Two seconds of silence on the phone.\nYou understood what that silence meant.', reply_ja: 'HRが仲介業者を紹介してくれた。\n「外国人ですか？日本語大丈夫ですか？」\n「No」と言った。二秒間の沈黙。\nその沈黙の意味はわかった。', changes: { energy: -8, happiness: -12 }, tone: 'bad' },
    ]
  },

  {
    maxDay: 15,
    text: '在公司转了半圈，找不到厕所。\n不好意思开口问，已经憋了二十分钟。',
    text_en: 'You\'ve wandered half the office floor. Can\'t find the bathroom.\nToo embarrassed to ask. It\'s been twenty minutes.',
    text_ja: 'オフィスを半周した。トイレが見つからない。\n聞くのが恥ずかしくて、もう二十分経った。',
    tone: 'bad',
    choices: [
      { label: '继续憋着找', label_en: 'Keep searching silently', label_ja: 'このまま探し続ける', reply: '终于在四楼角落找到了。\n以后记住了：日本厕所永远在最不顺路的地方。', reply_en: 'Found it on the 4th floor, in a corner.\nLesson learned: Japanese restrooms are always in the most inconvenient spots.', reply_ja: '四階の隅でようやく見つけた。\n覚えた：日本のトイレは必ず一番遠い場所にある。', changes: { energy: -8, happiness: -5 }, tone: 'neutral' },
      { label: '硬着头皮问同事', label_en: 'Force yourself to ask a colleague', label_ja: '思い切って同僚に聞く', reply: '同事带你走了过去，顺便教了你"お手洗いはどこですか"。\n今后你的日语词汇库+1。', reply_en: 'They walked you there and taught you "お手洗いはどこですか."\nJapanese vocabulary +1.', reply_ja: '連れて行ってもらい、「お手洗いはどこですか」を教えてもらった。\n日本語の語彙が一つ増えた。', changes: { energy: -3, happiness: 8 }, tone: 'good' },
    ]
  },

  {
    maxDay: 25,
    text: '第一次交换名片。\n你用双手接过，然后随手塞进了裤兜。\n对方的表情凝固了零点五秒。',
    text_en: 'First business card exchange.\nYou received it with both hands, then casually stuffed it in your pocket.\nThe other person\'s expression froze for half a second.',
    text_ja: '初めての名刺交換。\n両手で受け取って、そのままズボンのポケットに突っ込んだ。\n相手の表情が0.5秒固まった。',
    tone: 'bad',
    choices: [
      { label: '假装什么都没发生', label_en: 'Pretend nothing happened', label_ja: '何もなかったふりをする', reply: '回去搜索了"日本名片礼仪"。\n你把那张皱巴巴的名片夹放进了钱包。', reply_en: 'You Googled "Japanese business card etiquette" afterwards.\nYou carefully smoothed out the crumpled card and put it in your wallet.', reply_ja: '後で「名刺マナー 日本」と検索した。\nくしゃくしゃの名刺を丁寧に伸ばして財布にしまった。', changes: { energy: -5, happiness: -5 }, tone: 'neutral' },
      { label: '立刻道歉纠正', label_en: 'Apologize and correct immediately', label_ja: 'すぐに謝って訂正する', reply: '你摸出名片，双手托着，深鞠一躬。\n对方也鞠了一躬。礼仪战争终于停火。', reply_en: 'You retrieved the card, held it with both hands, and bowed deeply.\nThey bowed back. Etiquette war: ceasefire achieved.', reply_ja: '名刺を取り出し、両手で持ち直して深くお辞儀をした。\n相手もお辞儀を返した。マナー戦争、停戦成立。', changes: { energy: -5, happiness: 5 }, tone: 'good' },
    ]
  },

  {
    maxDay: 35,
    text: '合同需要盖章。\n对方说："ハンコをお願いします。"\n你不知道ハンコ是什么，但点了头。',
    text_en: 'The contract needs a stamp.\nThey say: "ハンコをお願いします."\nYou don\'t know what ハンコ is, but you nodded anyway.',
    text_ja: '契約書に印鑑が必要らしい。\n「ハンコをお願いします」と言われた。\nハンコが何かわからないけど、うなずいた。',
    tone: 'bad',
    choices: [
      { label: '问上司什么是ハンコ', label_en: 'Ask your boss what ハンコ is', label_ja: '上司にハンコって何か聞く', reply: '上司拿出一个小圆柱给你看。你搜了一下：印章，中国也有的。\n"原来如此。" 文化差异-1。', reply_en: 'Your boss pulls out a small cylinder. You look it up: a personal seal stamp. China has those too.\n"Ah, I see." Cultural gap -1.', reply_ja: '上司が小さな円柱を取り出した。調べた：印鑑、中国にもある。\n「なるほど」。文化の壁-1。', changes: { energy: -5 }, tone: 'neutral' },
      { label: '用签名代替', label_en: 'Sign your name instead', label_ja: 'サインで代用する', reply: '对方看了三秒，去找了主管。\n你的签名被接受了，但你感觉到了某种无声的叹气。', reply_en: 'They stared for three seconds, then went to find their manager.\nYour signature was accepted, but you sensed an unspoken sigh.', reply_ja: '三秒見つめてから、上司を呼びに行った。\nサインは受け入れられたが、無言のため息を感じた。', changes: { energy: -5, happiness: -8 }, tone: 'bad' },
    ]
  },

  {
    maxDay: 30,
    text: '乘换ミス。坐过站了。\n下一班反向列车要等十二分钟。\n今天是你入职后第一次迟到。',
    text_en: 'Wrong transfer. You missed your stop.\nNext train in the opposite direction: 12 minutes.\nThis is your first time being late since joining.',
    text_ja: '乗り換えミス。乗り過ごした。\n逆方向の次の電車：12分後。\n入社後、初めての遅刻だ。',
    tone: 'bad',
    choices: [
      { label: '发邮件说电车延误', label_en: 'Email in saying train delay', label_ja: '電車遅延とメールする', reply: '日本的JR会给你出具延误证明。你第一次用到了这个功能。\n有些制度确实设计得很周到。', reply_en: 'JR issues official delay certificates. You used this feature for the first time.\nSome systems are actually well-designed.', reply_ja: 'JRが遅延証明書を発行してくれる。初めてこの制度を使った。\nよく考えられた仕組みだと思った。', changes: { energy: -10, happiness: -8 }, tone: 'neutral' },
      { label: '打车赶过去', label_en: 'Grab a taxi', label_ja: 'タクシーで急ぐ', reply: '打车软件全是日语。你最后截图给司机看目的地。\n到了，迟到八分钟，出租车花了¥3000。', reply_en: 'The taxi app is all in Japanese. You screenshot the destination map for the driver.\nArrived. 8 minutes late. ¥3,000 for the taxi.', reply_ja: 'タクシーアプリが全部日本語。目的地の地図をスクショして見せた。\n到着。8分遅刻。タクシー代¥3,000。', changes: { energy: -5, money: -3000, happiness: -5 }, tone: 'bad' },
    ]
  },

  {
    maxDay: 60,
    text: '上司把一份文件扔在你桌上。\n截止：明天早上九点。全是日语。',
    text_en: 'Your boss drops a document on your desk.\nDeadline: tomorrow 9am. All in Japanese.',
    text_ja: '上司が書類をデスクに投げつけた。\n締め切り：明日の朝九時。全部日本語。',
    tone: 'bad',
    choices: [
      { label: '🌙 熬夜做完', label_en: '🌙 Pull an all-nighter', label_ja: '🌙 徹夜で仕上げる', reply: '凌晨两点交上去。上司说了句"お疲れ様"。你后来查了这是什么意思。', reply_en: 'You submit at 2am. Your boss says "お疲れ様". You Google what it means later.', reply_ja: '深夜二時に提出。上司から「お疲れ様」のひとこと。後で意味を調べた。', changes: { energy: -20, money: 8000 }, tone: 'neutral' },
      { label: '🤝 找同事帮忙', label_en: '🤝 Ask a colleague', label_ja: '🤝 同僚に助けを求める', reply: '他帮你理清了三个误解。你欠他一顿饭。', reply_en: 'They clarify three misunderstandings. You owe them dinner.', reply_ja: '三つの誤解を解消してもらった。夕食をおごる約束をした。', changes: { energy: -8, money: 5000, happiness: 5 }, tone: 'good' },
    ]
  },

  {
    maxDay: 50,
    text: '开会。所有人在说日语。\n你点头，因为点头是你唯一能做的事。',
    text_en: 'Meeting. Everyone is speaking Japanese.\nYou nod, because nodding is the only thing you can do.',
    text_ja: '会議。全員日本語で話している。\nうなずくしかない。それだけができること。',
    tone: 'bad',
    choices: [
      { label: '😶 努力跟上', label_en: '😶 Try to follow along', label_ja: '😶 必死についていく', reply: '会后同事发给你英文总结。你回复了"ありがとう"，这是你会的少数日语之一。', reply_en: 'A colleague sends you an English summary after. You reply "ありがとう" — one of the few Japanese words you know.', reply_ja: '会議後、同僚が英語の要約を送ってくれた。「ありがとう」と返した。', changes: { energy: -10 }, tone: 'neutral' },
      { label: '📱 悄悄用翻译软件', label_en: '📱 Secretly use a translator', label_ja: '📱 こっそり翻訳アプリを使う', reply: '你翻译出来发现主要在讨论午饭选哪家。', reply_en: 'You translate it and discover they were mostly discussing where to eat lunch.', reply_ja: '翻訳してみたら、ほとんどランチの話だった。', changes: { energy: -5, happiness: 8 }, tone: 'neutral' },
    ]
  },

  {
    maxDay: 80,
    text: '午休。同事们去了一家定食屋。\n没有人邀请你。\n不一定是恶意——语言不通让邀请变得麻烦。',
    text_en: 'Lunch break. Colleagues head to a teishoku place.\nNobody invites you.\nNot necessarily malicious — the language gap makes it awkward.',
    text_ja: '昼休み。同僚たちが定食屋へ向かった。\n誰も誘ってくれなかった。\n悪意ではないかもしれない。言葉の壁が誘うことを億劫にさせる。',
    tone: 'bad',
    choices: [
      { label: '🏪 自己去便利店', label_en: '🏪 Grab something from the conbini', label_ja: '🏪 コンビニで一人ご飯', reply: '饭团+罐装咖啡，回工位吃。效率极高，省去了全程猜菜单的环节。\n独自午餐的最高境界。', reply_en: 'Onigiri + canned coffee, back to your desk. Zero social friction. Peak efficiency lunch.', reply_ja: 'おにぎりと缶コーヒー、デスクで食べる。効率最高。独り飯の極意。', changes: { energy: 8, happiness: -5 }, tone: 'neutral' },
      { label: '🚶 鼓起勇气跟上去', label_en: '🚶 Gather the courage to follow them', label_ja: '🚶 勇気を出してついていく', reply: '翻译菜单、指屏幕、微笑、点头。外国人定食操作流程走一遍。\n味道不错，顺便学会了"おすすめ"怎么发音。', reply_en: 'Translate menu, point at screen, smile, nod. Standard foreigner ordering protocol.\nFood was good. Learned "osusume" pronunciation as a bonus.', reply_ja: 'メニューを翻訳、画面を指差し、笑顔でうなずく。\n美味しかった。「おすすめ」の発音も覚えた。', changes: { energy: 12, happiness: 12 }, tone: 'good' },
    ]
  },

  // ── 中期（DAY 20–120）摸清门道 ─────────────────────────────

  {
    minDay: 20, maxDay: 120,
    text: '部门飲み会。\n上司说"強制参加ではない"。\n所有人都去了。',
    text_en: 'Department nomikai.\nYour boss says "attendance is not mandatory."\nEveryone goes.',
    text_ja: '部署の飲み会。\n上司が「強制参加ではない」と言った。\n全員参加した。',
    tone: 'neutral',
    choices: [
      { label: '参加', label_en: 'Go along', label_ja: '参加する', reply: '你喝了两杯，用翻译软件聊了半晚上。\n散场时上司拍了你肩膀："よく来た。"\n你觉得自己通过了某个测试。', reply_en: 'Two drinks in, you chat through a translation app all evening.\nBoss pats your shoulder at the end: "よく来た."\nYou feel like you passed some kind of test.', reply_ja: '二杯飲んで、翻訳アプリで半分の夜を過ごした。\n帰り際に上司が肩を叩いた。「よく来た」\n何かのテストに合格した気がした。', changes: { energy: -20, happiness: 20 }, tone: 'good' },
      { label: '托病逃跑', label_en: 'Fake being sick', label_ja: '仮病で逃げる', reply: '第二天同事问你身体好些了没有。\n你说好多了，谢谢关心。\n然后大家都知道你不是真的生病。', reply_en: 'Next day a colleague asks if you\'re feeling better.\nYou say much better, thanks.\nEveryone already knew you weren\'t sick.', reply_ja: '翌日、同僚が「体調はよくなりましたか？」と聞いた。\n「おかげさまで」と答えた。\n全員わかっていた。', changes: { energy: 5, happiness: -10 }, tone: 'bad' },
    ]
  },

  {
    minDay: 15, maxDay: 100,
    text: '晚上七点。你准备收拾东西了。\n上司还在位置上，看都没看你一眼。\n整层楼没有人起身。',
    text_en: 'It\'s 7pm. You start packing up.\nYour boss is still at their desk, didn\'t even glance at you.\nNobody else on the floor has moved.',
    text_ja: '夜七時。帰り支度を始めた。\n上司はまだ席にいて、こちらを見もしない。\nフロア全員、誰も立ち上がっていない。',
    tone: 'neutral',
    choices: [
      { label: '继续装忙等', label_en: 'Stay and pretend to be busy', label_ja: '忙しいふりをして残る', reply: '八点半，上司终于站起来说"お疲れ様でした"。\n大家如释重负地收拾东西。\n你学会了新的打工规则。', reply_en: 'At 8:30, your boss finally stands up: "お疲れ様でした."\nEveryone packs up with visible relief.\nYou\'ve learned a new rule of the game.', reply_ja: '八時半、上司がついに立ち上がって「お疲れ様でした」。\n全員が安堵して片付け始めた。\n新しいルールを覚えた。', changes: { energy: -15, happiness: -10 }, tone: 'bad' },
      { label: '率先起身走人', label_en: 'Be the first to leave', label_ja: '率先して帰る', reply: '你收拾包，站起来说了声"お先に失礼します"。\n有两个人抬头看了你一眼。\n你走出去，外面空气很好。', reply_en: 'You pack your bag, stand up, say "お先に失礼します."\nTwo people looked up at you.\nOutside, the air was fresh.', reply_ja: 'バッグをまとめ、立ち上がって「お先に失礼します」と言った。\n二人が顔を上げた。\n外の空気は清々しかった。', changes: { energy: 10, happiness: 5 }, tone: 'good' },
    ]
  },

  {
    minDay: 30,
    text: '周五下午五点，PM发来消息：\n"小改动，很简单，周一上线"\n附件：一份二十页的文档。',
    text_en: 'Friday 5pm. A message from the PM:\n"Small change, very simple, live Monday"\nAttachment: a 20-page document.',
    text_ja: '金曜の夕方五時。PMからメッセージ：\n「小さな変更、簡単です、月曜リリース」\n添付：二十ページのドキュメント。',
    tone: 'bad',
    choices: [
      { label: '加班干完', label_en: 'Work through the weekend', label_ja: '週末に仕上げる', reply: '你把周末搭进去了。周一准时上线。\nPM说："辛苦了，下次提前说啊。"\n你盯着屏幕沉默了三秒。', reply_en: 'You gave up your weekend. It went live on Monday.\nPM says: "Good work, let me know earlier next time."\nYou stared at the screen in silence for three seconds.', reply_ja: '週末を捧げた。月曜に無事リリース。\nPMが「お疲れ様、次回は早めに言ってね」と言った。\n三秒間、画面を無言で見つめた。', changes: { energy: -30, money: 5000 }, tone: 'bad' },
      { label: '回复"收到"然后摸鱼', label_en: '"Got it" then do nothing', label_ja: '「了解です」と返してから何もしない', reply: '周一上午告诉PM"评估了一下，需要两周"。\n对方说"好吧"。\n你学会了技术评估的艺术。', reply_en: 'Monday morning: "Assessed it — we need two weeks."\nPM says "okay."\nYou\'ve learned the art of technical estimation.', reply_ja: '月曜の朝、「見積もった結果、二週間必要です」と伝えた。\nPMが「わかった」と言った。\n技術的な見積もりの技を習得した。', changes: { energy: 5, happiness: 8 }, tone: 'good' },
    ]
  },

  {
    minDay: 40,
    text: 'PR挂着五天了。\n今天终于来了第一条Review：\n"LGTM 👍"\n下面还有198条comments。',
    text_en: 'Your PR has been up for five days.\nFirst review finally landed:\n"LGTM 👍"\nBelow that: 198 more comments.',
    text_ja: 'PRが五日間放置されていた。\n今日ようやく最初のレビューが来た：\n「LGTM 👍」\nその下に198件のコメントが続く。',
    tone: 'bad',
    choices: [
      { label: '逐条回复', label_en: 'Reply to every comment', label_ja: '全コメントに返信する', reply: '你花了三个小时回复了全部comments。\n最后merge了。前辈说："对新人来说还不错。"\n你不确定这是表扬。', reply_en: 'Three hours of replies. Finally merged.\nSenpai said: "Not bad for a newcomer."\nYou weren\'t sure if that was a compliment.', reply_ja: '三時間かけて全コメントに返信した。\n最終的にマージされた。先輩が「新人にしては悪くない」と言った。\n褒められたのかどうかわからなかった。', changes: { energy: -20, happiness: -5 }, tone: 'neutral' },
      { label: '找前辈聊聊', label_en: 'Talk it over with senpai', label_ja: '先輩に相談する', reply: '前辈说大部分是nitpick，重点看三条。\n你merge了，世界恢复平静。', reply_en: 'Senpai said most are nitpicks, focus on three key ones.\nYou merged. The world was at peace again.', reply_ja: '先輩が「ほとんどはnitpick、重要なのは三つだけ」と言った。\nマージした。世界は平和に戻った。', changes: { energy: -10, happiness: 5 }, tone: 'good' },
    ]
  },

  {
    minDay: 20,
    text: '刷手机刷到一半，\n感觉背后有道视线。\n上司站在你身后，不知道站了多久。',
    text_en: 'Scrolling your phone, you feel a gaze behind you.\nYour boss is standing there.\nYou have no idea how long they\'ve been there.',
    text_ja: 'スマホをスクロールしていると、背中に視線を感じた。\n上司が後ろに立っていた。\nいつからいたかわからない。',
    tone: 'bad',
    choices: [
      { label: '假装在查资料', label_en: 'Pretend you\'re checking docs', label_ja: '資料を確認しているふりをする', reply: '"哦，我在查这个API的文档……"\n上司点点头走了。\n你不确定他信没信。', reply_en: '"Oh, I was checking the API docs..."\nBoss nodded and walked away.\nYou\'re not sure they believed you.', reply_ja: '「ああ、このAPIのドキュメントを確認してました」\n上司はうなずいて去った。\n信じてもらえたかどうかわからない。', changes: { energy: -5, happiness: -10 }, tone: 'neutral' },
      { label: '坦然放下手机', label_en: 'Calmly put the phone down', label_ja: '落ち着いてスマホを置く', reply: '"午休时间还有三分钟。"\n上司愣了一下，说"そうだね"，走开了。\n有时候坦诚是最好的防御。', reply_en: '"Three minutes left of lunch break."\nBoss paused, said "そうだね", walked away.\nSometimes honesty is the best defense.', reply_ja: '「昼休みはあと三分あります」\n上司は一瞬止まり、「そうだね」と言って去った。\n時に正直が最良の防御になる。', changes: { energy: 5, happiness: 5 }, tone: 'good' },
    ]
  },

  // ── 全程 ──────────────────────────────────────────────────

  {
    isStory: true,
    storyTitle: '打给家里',
    storyTitle_en: 'Call Home',
    storyTitle_ja: '実家に電話する',
    storyEmoji: '📞',
    text: '久违地和家人通了个电话。\n妈妈问你有没有好好吃饭。\n你说都好，都好。\n挂掉电话，房间很安静。',
    text_en: 'A long-overdue call with family.\nYour mom asks if you\'ve been eating properly.\nYou say everything is fine, everything is fine.\nAfter you hang up, the room is very quiet.',
    text_ja: '久しぶりに家族に電話した。\nお母さんがちゃんとご飯食べてるかと聞いてきた。\n大丈夫、全部大丈夫って答えた。\n電話を切ると、部屋はとても静かだった。',
    tone: 'neutral',
    choices: [
      { label: '"都好，别担心。"', label_en: '"Everything\'s fine, don\'t worry."', label_ja: '「大丈夫、心配しないで」', reply: '挂掉，躺下，盯天花板。妈以为你过得不错，其实也确实还行。\n睡觉。', reply_en: 'Hang up, lie down, stare at the ceiling. Mom thinks you\'re doing fine. You kind of are.\nSleep.', reply_ja: '電話を切って、横になって天井を見る。お母さんはうまくやってると思ってる。まあそうかもしれない。\n眠る。', changes: { happiness: -5 }, tone: 'neutral' },
      { label: '说了一些真实的事', label_en: 'You told them something true', label_ja: '本当のことを少し話した', reply: '"最近有点累，但有意思。"\n妈妈说那就回来吧。你说不用，在这里挺好玩的。\n最后两边都笑着挂掉了。', reply_en: '"Tired lately, but it\'s interesting."\nMom says come home. You say nah, it\'s fun here actually.\nYou both end up laughing before hanging up.', reply_ja: '「最近疲れてるけど、面白い」\nお母さんが「じゃあ帰っておいで」と言った。「大丈夫、結構楽しいよ」と返した。\n最後は二人で笑いながら電話を切った。', changes: { happiness: 20, health: 5 }, tone: 'good' },
    ]
  },

  {
    text: '项目顺利交付。\n上司发来邮件，里面有一行英语：\n"Good work."',
    text_en: 'The project ships successfully.\nYour boss sends an email with one line of English:\n"Good work."',
    text_ja: 'プロジェクト無事リリース。\n上司からメールが届いた。英語で一行：\n"Good work."',
    tone: 'good',
    choices: [
      { label: '📸 截图发给F国朋友', label_en: '📸 Screenshot it for friends back home', label_ja: '📸 スクショを友達に送る', reply: '他回复了一个大拇指。你看着这个大拇指笑了一会儿。', reply_en: 'They reply with a thumbs up. You stare at it and smile for a moment.', reply_ja: '👍が返ってきた。しばらくその絵文字を見つめてしまった。', changes: { happiness: 20, money: 5000 }, tone: 'good' },
      { label: '💰 谈加薪', label_en: '💰 Ask for a raise', label_ja: '💰 昇給を交渉する', reply: '上司说下季度再说。这在日本意思是不。', reply_en: 'Your boss says "maybe next quarter." In Japan, that means no.', reply_ja: '「来期に検討します」と言われた。日本語で「ノー」という意味だ。', changes: { happiness: -5, money: 2000 }, tone: 'bad' },
    ]
  },

  {
    text: '满员电车。\n有人踩了你的脚，没有道歉。\n你也没说什么，因为你不知道日语该怎么说。',
    text_en: 'Packed train.\nSomebody steps on your foot. No apology.\nYou don\'t say anything either, because you don\'t know how to say it in Japanese.',
    text_ja: '満員電車。\n足を踏まれた。謝罪なし。\nこちらも何も言わなかった。言い方がわからないから。',
    tone: 'bad',
    choices: [
      { label: '算了', label_en: 'Let it go', label_ja: 'まあいいか', reply: '盯着电车门，默数剩余站数。3站。2站。1站。下车，继续上班。\n人均东京打工人。', reply_en: 'Stare at the door and count stops. 3. 2. 1. Get off. Go to work.\nJust another Tokyo salaryman.', reply_ja: 'ドアを見て駅数を数える。3、2、1。降りる、仕事へ。\n東京サラリーマンの日常。', changes: { energy: -8, happiness: -5 }, tone: 'neutral' },
      { label: '找了个角落站着', label_en: 'Find a corner to stand in', label_ja: '隅に移動した', reply: '找到角落，掏出手机刷刷。满员电车核心技能：物理隔绝，精神出走。', reply_en: 'Find a corner, take out phone. Key skill for packed trains: physical isolation, mental escape.', reply_ja: '隅を確保してスマホを取り出す。満員電車のコアスキル：物理的孤立、精神的脱出。', changes: { energy: -5, happiness: 5 }, tone: 'neutral' },
    ]
  },

  {
    text: '今天电车罕见地不那么挤。\n你甚至找到了靠窗的位置。\n远处能看到富士山的轮廓。',
    text_en: 'The train is unusually empty today.\nYou even find a window seat.\nIn the distance you can see the outline of Mt. Fuji.',
    text_ja: '今日は珍しく電車が空いていた。\n窓際の席まで確保できた。\n遠くに富士山のシルエットが見える。',
    tone: 'good',
    choices: [
      { label: '📷 拍了张照片', label_en: '📷 Take a photo', label_ja: '📷 写真を撮った', reply: '你发给F国的朋友，他说"wow"。\n有时候一张照片能解释你来这里的理由。', reply_en: 'You send it to a friend back home. They say "wow."\nSometimes a photo explains why you came here.', reply_ja: '故郷の友達に送ったら「すごい」と返ってきた。\n一枚の写真で、ここに来た理由が説明できることがある。', changes: { happiness: 20 }, tone: 'good' },
      { label: '就这样看着', label_en: 'Just watch', label_ja: 'ただ見ていた', reply: '你没有拍照。有些东西留在眼睛里就够了。', reply_en: 'You don\'t take a photo. Some things are enough just to keep in your eyes.', reply_ja: '写真は撮らなかった。目に留めておくだけで十分なものがある。', changes: { happiness: 15, energy: 8 }, tone: 'good' },
    ]
  },

  {
    maxDay: 80,
    text: '超市半额便当区。晚上八点，黄色标签。\n你在F国从没想过有一天会为半价便当感到高兴。',
    text_en: 'Half-price bento section at the supermarket. 8pm, yellow stickers.\nBack home you never imagined you\'d feel this happy about a discounted lunch box.',
    text_ja: 'スーパーの半額弁当コーナー。夜八時、黄色いシール。\n故郷では半額弁当でこんなに嬉しくなるとは思っていなかった。',
    tone: 'neutral',
    choices: [
      { label: '拿了两个', label_en: 'Grab two', label_ja: '二つ取った', reply: '省了钱，有一种奇怪的满足感。\n你把这个心情发给F国朋友，他说"你变了"。\n也许是。', reply_en: 'You save money. A strange satisfaction.\nYou describe the feeling to a friend back home. They say "you\'ve changed."\nMaybe.', reply_ja: '節約できた。不思議な満足感。\nその気持ちを故郷の友達に伝えたら「変わったな」と言われた。\nそうかもしれない。', changes: { energy: 18, happiness: 10, money: 500 }, tone: 'good' },
    ]
  },

  // ── 中后期（DAY 60+）老油条 ────────────────────────────────

  {
    minDay: 60,
    text: '你在本地分支上打了 git push --force。\n然后发现 branch 名字打错了。\n你推到了 main。',
    text_en: 'You typed git push --force on your local branch.\nThen noticed you mistyped the branch name.\nYou pushed to main.',
    text_ja: 'ローカルブランチで git push --force を実行した。\nブランチ名を打ち間違えていたことに気づいた。\nmainにプッシュしてしまった。',
    tone: 'bad',
    choices: [
      { label: '立刻 revert', label_en: 'Revert immediately', label_ja: '即座にrevertする', reply: '你用了四十分钟 revert 并修复了 pipeline。\n没有人注意到——或者说，没有人追究。\n你把这件事永远埋进了心里。', reply_en: 'Forty minutes to revert and fix the pipeline.\nNobody noticed — or nobody said anything.\nYou buried this moment forever.', reply_ja: '四十分かけてrevertしてpipelineを修正した。\n誰も気づかなかった——あるいは誰も言わなかった。\nこの出来事を永遠に心の奥に葬った。', changes: { energy: -20, happiness: -15, money: -5000 }, tone: 'neutral' },
      { label: '在群里坦白', label_en: 'Confess in the group chat', label_ja: 'グループチャットで告白する', reply: '团队用了两个小时修复。\n下午架构师发起了"分支保护规范"讨论。\n你是那份规范的直接推动者。这算功德一件。', reply_en: 'The team spent two hours fixing it.\nThat afternoon the architect started a "branch protection policy" discussion.\nYou are the direct reason that policy exists. That\'s a legacy.', reply_ja: 'チームが二時間かけて修正した。\n午後にアーキテクトが「ブランチ保護ポリシー」の議論を始めた。\nそのポリシーの生みの親はあなただ。それも一つのレガシー。', changes: { energy: -10, happiness: -20 }, tone: 'neutral' },
    ]
  },

  {
    minDay: 80,
    text: '你接手了一个"三年前的遗留系统"。\n注释全是日语，变量名是罗马字拼音。\n有个方法叫 doSomethingFinal_v3_真的最终版。',
    text_en: 'You\'ve inherited a "legacy system from three years ago."\nComments are all in Japanese. Variable names are romaji pinyin.\nThere\'s a method called doSomethingFinal_v3_reallyFinal.',
    text_ja: '「三年前のレガシーシステム」を引き継いだ。\nコメントは全部日本語、変数名はローマ字。\n「doSomethingFinal_v3_本当に最終版」というメソッドがある。',
    tone: 'bad',
    choices: [
      { label: '重构它', label_en: 'Refactor it', label_ja: 'リファクタリングする', reply: '你重构了两周，写了新文档。\n两周后来了个新需求，发现有个边界条件藏在你删掉的代码里。\n技术债是有生命的。', reply_en: 'Two weeks of refactoring. New docs written.\nA new requirement arrived two weeks later. Edge case was in the code you deleted.\nTechnical debt is alive.', reply_ja: '二週間リファクタリングして新しいドキュメントを書いた。\n二週間後に新しい要件が来た。削除したコードにエッジケースが隠れていた。\n技術的負債は生きている。', changes: { energy: -25, money: 8000 }, tone: 'bad' },
      { label: '先跑再说', label_en: 'Leave it and move on', label_ja: 'そのままにして先に進む', reply: '你给这个方法加了一行注释：\n// 请勿修改，原因不明，但改了就崩\n然后继续往上叠新功能。', reply_en: 'You added one line of comment:\n// DO NOT TOUCH. Unknown reason. But it breaks if you do.\nThen kept stacking new features on top.', reply_ja: '一行コメントを追加した：\n// 触るな。理由不明。でも触ると壊れる。\nその上に新機能を積み重ねていった。', changes: { energy: -5, happiness: -5 }, tone: 'neutral' },
    ]
  },

  {
    minDay: 100,
    text: '猎头发来LinkedIn消息：\n"您好，看了您的背景很契合，\n年薪区间120-180万日元……"',
    text_en: 'A headhunter messaged you on LinkedIn:\n"Hello, your background is a great fit,\nsalary range ¥1.2M–¥1.8M per year…"',
    text_ja: 'ヘッドハンターからLinkedInにメッセージが届いた：\n「はじめまして、ご経歴を拝見しました。\n年収120〜180万円のポジションがございます……」',
    tone: 'neutral',
    choices: [
      { label: '随便聊聊', label_en: 'Chat a bit', label_ja: 'とりあえず話してみる', reply: '"具体什么职位？""您有兴趣进一步了解吗？"\n最终没有下文。但你知道了自己的市场价。', reply_en: '"What\'s the role specifically?" "Are you open to learning more?"\nNothing came of it. But now you know your market value.', reply_ja: '「具体的にはどんなポジションですか？」「もう少し聞いてみますか？」\n結局何もなかった。でも自分の市場価値がわかった。', changes: { energy: -5, happiness: 15, money: 3000 }, tone: 'good' },
      { label: '礼貌拒绝', label_en: 'Politely decline', label_ja: '丁重に断る', reply: '"感谢关注，暂无跳槽计划。"\n对方说"好的，保持联系"。\n两周后又来了一条消息。', reply_en: '"Thanks for reaching out, no plans to move right now."\nThey say "Understood, let\'s stay in touch."\nTwo weeks later, another message.', reply_ja: '「ご連絡ありがとうございます。現在は転職の予定はございません。」\n「了解です、また機会があれば」と返ってきた。\n二週間後、また別のメッセージが届いた。', changes: { happiness: 5 }, tone: 'neutral' },
    ]
  },

  {
    minDay: 130,
    text: '猎头直接问：\n"坦白说，35岁以上我们这边比较难推进，\n您今年……？"',
    text_en: 'The headhunter cuts to the chase:\n"To be frank, it\'s harder to place candidates over 35 with our clients.\nMay I ask your age…?"',
    text_ja: 'ヘッドハンターがズバリ聞いてきた：\n「率直に言うと、35歳以上はご紹介が難しくて、\n今おいくつですか……？」',
    tone: 'bad',
    choices: [
      { label: '"还早，先聊聊"', label_en: '"I\'m fine, let\'s talk"', label_ja: '「まだ大丈夫です、話しましょう」', reply: '你告诉了他年龄。他说"嗯，那还好"。\n你不知道为什么"还好"让你更难受。', reply_en: 'You told him your age. He said "ah, that\'s fine then."\nYou don\'t know why "fine then" made you feel worse.', reply_ja: '年齢を伝えた。「ああ、それなら大丈夫です」と言われた。\n「大丈夫」という言葉がなぜかより辛かった。', changes: { energy: -5, happiness: -10 }, tone: 'bad' },
      { label: '删除联系人', label_en: 'Delete contact', label_ja: '連絡先を削除する', reply: '你删了他，关上手机，继续敲代码。\n你的代码不会问你几岁。', reply_en: 'You deleted them, put down your phone, kept coding.\nYour code doesn\'t ask how old you are.', reply_ja: '連絡先を削除して、スマホを置き、コードを書き続けた。\nコードは年齢を聞かない。', changes: { happiness: -5 }, tone: 'neutral' },
    ]
  },

];

function getEventText(ev) {
  return (typeof t !== 'undefined' && getLang() === 'en' && ev.text_en) ? ev.text_en : ev.text;
}

function getChoiceLabel(c) {
  return (typeof t !== 'undefined' && getLang() === 'en' && c.label_en) ? c.label_en : c.label;
}

function getChoiceReply(c) {
  return (typeof t !== 'undefined' && getLang() === 'en' && c.reply_en) ? c.reply_en : c.reply;
}

function getEventTitle(ev) {
  return (typeof t !== 'undefined' && getLang() === 'en' && ev.storyTitle_en) ? ev.storyTitle_en : ev.storyTitle;
}

function getRandomEvent(seenStoryKeys, seenEventKeys, playerDay) {
  const day = playerDay || 1;
  const inRange = e => day >= (e.minDay || 1) && day <= (e.maxDay || Infinity);

  const nonStoryAll = POPUP_EVENTS.filter(e => !e.isStory && inRange(e));
  const storyPool   = POPUP_EVENTS.filter(e => e.isStory && inRange(e) && (!seenStoryKeys || !seenStoryKeys.has(e.storyTitle)));

  // 非物語：过滤已见事件；全见完则重洗牌（但保持 DAY 范围限制）
  let nonStoryPool = seenEventKeys && seenEventKeys.size
    ? nonStoryAll.filter(e => !seenEventKeys.has(e.text.split('\n')[0]))
    : nonStoryAll;
  if (!nonStoryPool.length) nonStoryPool = nonStoryAll.length ? nonStoryAll : POPUP_EVENTS.filter(e => !e.isStory);

  const candidates = [...nonStoryPool, ...storyPool];
  const pool = candidates.length ? candidates : POPUP_EVENTS.filter(e => !e.isStory);
  const ev = pool[Math.floor(Math.random() * pool.length)];
  return localizeEvent(ev);
}

function localizeEvent(ev) {
  if (typeof getLang === 'undefined') return ev;
  const lang = getLang();
  const pick = (zh, ja, en) => lang === 'ja' ? (ja || zh) : lang === 'en' ? (en || zh) : zh;
  return {
    ...ev,
    text: pick(ev.text, ev.text_ja, ev.text_en),
    _storyKey:  ev.storyTitle,
    _eventKey:  ev.text.split('\n')[0],
    storyTitle: ev.storyTitle ? pick(ev.storyTitle, ev.storyTitle_ja, ev.storyTitle_en) : ev.storyTitle,
    choices: ev.choices ? ev.choices.map(c => ({
      ...c,
      label: pick(c.label, c.label_ja, c.label_en),
      reply: pick(c.reply, c.reply_ja, c.reply_en),
    })) : ev.choices,
  };
}
