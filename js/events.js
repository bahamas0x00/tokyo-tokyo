'use strict';

const POPUP_EVENTS = [
  {
    text: '上司把一份文件扔在你桌上。\n截止：明天早上九点。全是日语。',
    text_en: 'Your boss drops a document on your desk.\nDeadline: tomorrow 9am. All in Japanese.',
    text_ja: '上司が書類をデスクに投げつけた。\n締め切り：明日の朝九時。全部日本語。',
    tone: 'bad',
    choices: [
      { label: '🌙 熬夜做完', label_en: '🌙 Pull an all-nighter', label_ja: '🌙 徹夜で仕上げる', reply: '凌晨两点交上去。上司说了句"お疲れ様"。你后来查了这是什么意思。', reply_en: 'You submit at 2am. Your boss says "お疲れ様". You Google what it means later.', reply_ja: '深夜二時に提出。上司から「お疲れ様」のひとこと。', changes: { energy: -20, money: 8000 }, tone: 'neutral' },
      { label: '🤝 找同事帮忙', label_en: '🤝 Ask a colleague', label_ja: '🤝 同僚に助けを求める', reply: '他帮你理清了三个误解。你欠他一顿饭。', reply_en: 'They clarify three misunderstandings. You owe them dinner.', reply_ja: '三つの誤解を解消してもらった。夕食をおごる約束をした。', changes: { energy: -8, money: 5000, happiness: 5 }, tone: 'good' },
    ]
  },
  {
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
    text: '午休。同事们去了一家定食屋。\n没有人邀请你。\n不一定是恶意——语言不通让邀请变得麻烦。',
    text_en: 'Lunch break. Colleagues head to a teishoku place.\nNobody invites you.\nNot necessarily malicious — the language gap makes it awkward.',
    text_ja: '昼休み。同僚たちが定食屋へ向かった。\n誰も誘ってくれなかった。\n悪意ではないかもしれない。言葉の壁が誘うことを億劫にさせる。',
    tone: 'bad',
    choices: [
      { label: '🏪 自己去便利店', label_en: '🏪 Grab something from the conbini', label_ja: '🏪 コンビニで一人ご飯', reply: '你坐在工位吃饭，看着空荡荡的办公室。这是东京一种特别的孤独。', reply_en: 'You eat at your desk, staring at the empty office. A particular kind of Tokyo loneliness.', reply_ja: 'デスクで一人ご飯。がらんとしたオフィスを眺めながら。東京特有の孤独。', changes: { energy: 8, happiness: -10 }, tone: 'bad' },
      { label: '🚶 鼓起勇气跟上去', label_en: '🚶 Gather the courage to follow them', label_ja: '🚶 勇気を出してついていく', reply: '你用手机翻译菜单点了一份看起来安全的东西。没人跟你说话，但你坐在人群里。这已经好一点了。', reply_en: 'You use your phone to translate the menu and order something that looks safe. Nobody talks to you, but you sit among people. That\'s something.', reply_ja: 'スマホでメニューを翻訳して無難なものを頼んだ。誰も話しかけてこない。でも人の中にいる。それだけでマシだ。', changes: { energy: 12, happiness: 10 }, tone: 'neutral' },
    ]
  },
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
      { label: '"都好，别担心。"', label_en: '"Everything\'s fine, don\'t worry."', label_ja: '「大丈夫、心配しないで」', reply: '你挂掉电话，坐在黑暗里了一会儿。窗外是东京，窗内是你。', reply_en: 'You hang up and sit in the dark for a while. Tokyo outside the window. Just you inside.', reply_ja: '電話を切って、しばらく暗がりに座っていた。窓の外は東京。部屋の中にはあなただけ。', changes: { happiness: -8 }, tone: 'bad' },
      { label: '说了一些真实的事', label_en: 'You told them something true', label_ja: '本当のことを少し話した', reply: '"最近有点累，但还好。"\n妈妈说那就回来吧。\n你笑了，说不用。挂掉以后哭了一会儿，然后去睡觉了。', reply_en: '"A little tired lately, but okay."\nMom says come home then.\nYou laugh and say no. After you hang up you cry a little, then go to sleep.', reply_ja: '「最近ちょっと疲れてるけど、大丈夫」\nお母さんが「じゃあ帰っておいで」と言った。\n笑って「大丈夫」と言った。電話を切った後、少し泣いて、眠った。', changes: { happiness: 18, health: 5 }, tone: 'good' },
    ]
  },
  {
    isStory: true,
    storyTitle: '电梯里的她',
    storyTitle_en: 'Her in the Elevator',
    storyTitle_ja: 'エレベーターの彼女',
    storyEmoji: '🏩',
    text: '电梯门打开的时候，你们同时愣了一下。\n她比照片里更普通，穿着便服，抱着一个包。\n你知道她是谁。她不知道你是谁。\n楼层数字往上走，你们保持着陌生人的距离。',
    text_en: 'The elevator doors open and you both freeze for a second.\nShe looks more ordinary than her photos — casual clothes, a bag in her arms.\nYou know who she is. She doesn\'t know who you are.\nThe floor numbers climb. You keep a stranger\'s distance.',
    text_ja: 'エレベーターのドアが開いた瞬間、二人同時に固まった。\n写真より地味な印象。私服に小さなバッグを抱えて、\nどこかの会社のOLみたいだった。\nあなたは彼女が誰か知っている。彼女はあなたのことを知らない。\n数字が上がっていく。見知らぬ他人の距離を保ったまま。',
    tone: 'neutral',
    choices: [
      { label: '什么都没说', label_en: 'You say nothing', label_ja: '何も言わなかった', reply: '她先出了电梯，你跟在后面，走进了同一扇门。\n她转过身看见你，愣了大概两秒钟，然后职业性地笑了。\n"啊，是您。"\n你不知道该说什么，也笑了。', reply_en: 'She steps out first, you follow her through the same door.\nShe turns around, pauses for two seconds, then smiles professionally.\n"Oh, it\'s you."\nYou didn\'t know what to say. You smiled too.', reply_ja: '彼女が先にエレベーターを降りた。あなたもついていき、同じドアをくぐった。\n振り返った彼女が二秒ほど固まって、それからプロの笑顔を浮かべた。\n「あ、お客様でしたか。」\n何も言えなかった。あなたも笑った。', changes: { happiness: 15 }, tone: 'neutral' },
    ]
  },
  {
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
    text: '满员电车。\n有人踩了你的脚，没有道歉。\n你也没说什么，因为你不知道日语该怎么说。',
    text_en: 'Packed train.\nSomebody steps on your foot. No apology.\nYou don\'t say anything either, because you don\'t know how to say it in Japanese.',
    text_ja: '満員電車。\n足を踏まれた。謝罪なし。\nこちらも何も言わなかった。言い方がわからないから。',
    tone: 'bad',
    choices: [
      { label: '算了', label_en: 'Let it go', label_ja: 'まあいいか', reply: '你盯着电车门，数着还有几站。\n这座城市慢慢在把你变成它的一部分。', reply_en: 'You stare at the train doors and count the remaining stops.\nThis city is slowly making you part of itself.', reply_ja: 'ドアを見つめながら、残りの駅数を数えた。\nこの街は少しずつ、あなたをその一部にしていく。', changes: { energy: -8, happiness: -5 }, tone: 'bad' },
      { label: '找了个角落站着', label_en: 'Find a corner to stand in', label_ja: '隅に移動した', reply: '你靠着车门，闭上眼睛，假装这是F国的地铁。没什么用，但好一点点。', reply_en: 'You lean against the door, close your eyes, pretend it\'s the metro back home. Doesn\'t really work, but slightly better.', reply_ja: 'ドアに背をもたせ、目を閉じて、故国の地下鉄のふりをした。あまり意味はない。でも少しだけマシ。', changes: { energy: -5, happiness: 3 }, tone: 'neutral' },
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
    text: '超市半额便当区。晚上八点，黄色标签。\n你在F国从没想过有一天会为半价便当感到高兴。',
    text_en: 'Half-price bento section at the supermarket. 8pm, yellow stickers.\nBack home you never imagined you\'d feel this happy about a discounted lunch box.',
    text_ja: 'スーパーの半額弁当コーナー。夜八時、黄色いシール。\n故郷では半額弁当でこんなに嬉しくなるとは思っていなかった。',
    tone: 'neutral',
    choices: [
      { label: '拿了两个', label_en: 'Grab two', label_ja: '二つ取った', reply: '省了钱，有一种奇怪的满足感。\n你把这个心情发给F国朋友，他说"你变了"。\n也许是。', reply_en: 'You save money. A strange satisfaction.\nYou describe the feeling to a friend back home. They say "you\'ve changed."\nMaybe.', reply_ja: '節約できた。不思議な満足感。\nその気持ちを故郷の友達に伝えたら「変わったな」と言われた。\nそうかもしれない。', changes: { energy: 18, happiness: 10, money: 500 }, tone: 'good' },
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

function getRandomEvent() {
  const ev = POPUP_EVENTS[Math.floor(Math.random() * POPUP_EVENTS.length)];
  return localizeEvent(ev);
}

function localizeEvent(ev) {
  if (typeof getLang === 'undefined') return ev;
  const lang = getLang();
  const pick = (zh, ja, en) => lang === 'ja' ? (ja || zh) : lang === 'en' ? (en || zh) : zh;
  return {
    ...ev,
    text: pick(ev.text, ev.text_ja, ev.text_en),
    storyTitle: ev.storyTitle ? pick(ev.storyTitle, ev.storyTitle_ja, ev.storyTitle_en) : ev.storyTitle,
    choices: ev.choices ? ev.choices.map(c => ({
      ...c,
      label: pick(c.label, c.label_ja, c.label_en),
      reply: pick(c.reply, c.reply_ja, c.reply_en),
    })) : ev.choices,
  };
}
