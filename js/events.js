'use strict';

// ── Shop items (always available to buy) ─────────────────────
const SHOP = [
  {
    id: 'rest', label: '回家休息', cost: 0, emoji: '🛋',
    desc: '体力 +20，健康 +5',
    changes: { energy: 20, health: 5 },
    cooldown: 3_600_000, // 1hr
    reply: '你换上睡衣躺下来。这是一天里最好的几分钟。',
    tone: 'good',
  },
  {
    id: 'conbini', label: '便利店', cost: 350, emoji: '🏪',
    desc: '体力 +10，快乐 +5',
    changes: { energy: 10, happiness: 5, savings: -350 },
    cooldown: 1_800_000, // 30min
    reply: '饭团还是饭团。店员说了句"ありがとうございます"，这是今天听到最清晰的一句话。',
    tone: 'neutral',
  },
  {
    id: 'ramen', label: '拉面', cost: 950, emoji: '🍜',
    desc: '体力 +25，快乐 +18',
    changes: { energy: 25, happiness: 18, savings: -950 },
    cooldown: 7_200_000, // 2hr
    reply: '豚骨拉面。你坐在吧台，对着白烟发了很久的呆。没有人跟你说话。没关系。',
    tone: 'good',
  },
  {
    id: 'izakaya', label: '居酒屋', cost: 3000, emoji: '🍺',
    desc: '快乐 +28，体力 -8',
    changes: { happiness: 28, energy: -8, savings: -3000 },
    cooldown: 14_400_000, // 4hr
    reply: '生啤，枝豆。你听不懂旁边桌在说什么，但热闹的声音已经够了。',
    tone: 'good',
  },
  {
    id: 'gym', label: '健身房', cost: 1000, emoji: '💪',
    desc: '健康 +20，体力 -10',
    changes: { health: 20, energy: -10, savings: -1000 },
    cooldown: 86_400_000, // 24hr
    reply: '教练说了几句日语你没听懂，但哑铃的重量是世界语言。',
    tone: 'good',
  },
  {
    id: 'karaoke', label: '卡拉OK', cost: 2500, emoji: '🎤',
    desc: '快乐 +22，体力 -5',
    changes: { happiness: 22, energy: -5, savings: -2500 },
    cooldown: 14_400_000,
    reply: '你唱了三小时F国的歌，嗓子哑了，但眼眶有点红。没关系，灯光很暗。',
    tone: 'good',
  },
  {
    id: 'fujoku', label: '风俗店', cost: 12000, emoji: '🏩',
    desc: '快乐 +42，健康 -3',
    changes: { happiness: 42, health: -3, savings: -12000 },
    cooldown: 0,
    reply: null, // special — uses story events
    tone: 'neutral',
  },
];

// ── Random popup events ───────────────────────────────────────
const POPUP_EVENTS = [
  // --- work / career ---
  {
    text: '上司把一份文件扔在你桌上。\n截止：明天早上九点。\n全是日语。',
    tone: 'bad',
    choices: [
      { label: '熬夜翻译，做完', reply: '凌晨两点交上去。上司隔天说了一句"お疲れ様"。你后来查了这句话是什么意思。', changes: { energy: -20, work: 20, savings: 2000 }, tone: 'neutral' },
      { label: '找同事田中帮忙', reply: '他帮你理清了三个关键误解。你欠他一顿饭。', changes: { energy: -8, work: 15, savings: -3000 }, tone: 'good' },
    ]
  },
  {
    text: '开会。\n所有人在说日语。\n你点头，因为点头是你唯一能做的事。',
    tone: 'bad',
    choices: [
      { label: '努力跟上', reply: '会后同事发给你英文总结。你回复了"ありがとう"，这是你会的少数日语之一。', changes: { energy: -12, work: 8 }, tone: 'neutral' },
      { label: '悄悄用翻译软件', reply: '你翻译出来发现主要在讨论午饭。', changes: { energy: -5, happiness: 5 }, tone: 'neutral' },
    ]
  },
  {
    text: '上司用蹩脚的英语叫住你：\n"The project. You. Understand?"',
    tone: 'neutral',
    choices: [
      { label: '"Yes." （其实没懂）', reply: '你花了两小时翻译后才明白他的意思。绕了远路，但做完了。', changes: { energy: -10, work: 10 }, tone: 'neutral' },
      { label: '如实说没听懂', reply: '他叫来了一个会英语的同事。你学到了今天的第一件真实信息。', changes: { work: 12, happiness: 5 }, tone: 'good' },
    ]
  },
  {
    text: '项目顺利交付。\n上司发来邮件，里面有一行英语：\n"Good work."',
    tone: 'good',
    choices: [
      { label: '截图发给F国的朋友', reply: '他回复了一个大拇指。你看着这个大拇指笑了一会儿。', changes: { happiness: 22, work: 12 }, tone: 'good' },
      { label: '继续下一个', reply: '下一份文件已经在邮箱里等着了。东京不停下来等你高兴。', changes: { work: 18, savings: 5000 }, tone: 'neutral' },
    ]
  },
  // --- life / loneliness ---
  {
    text: '午休。\n同事们去了一家你不认识的定食屋。\n没有人邀请你。\n不一定是恶意，可能只是语言不通让邀请变得麻烦。',
    tone: 'bad',
    choices: [
      { label: '自己去便利店', reply: '你坐在工位吃饭，看着空荡荡的办公室。\n这是东京一种特别的孤独。', changes: { energy: 8, happiness: -12, savings: -350 }, tone: 'bad' },
      { label: '鼓起勇气跟上去', reply: '你用手机翻译菜单点了一份看起来安全的东西。\n没有人跟你说话，但你坐在人群里。这已经好一点了。', changes: { energy: 12, happiness: 8, savings: -850 }, tone: 'neutral' },
    ]
  },
  {
    text: '久违地和家人通了个电话。\n妈妈问你有没有好好吃饭，在那边还好吗。\n你说都好，都好。\n挂掉电话，房间很安静。',
    tone: 'neutral',
    choices: [
      { label: '"都好，别担心。"', reply: '你挂掉电话，坐在黑暗里了一会儿。窗外是东京，窗内是你。', changes: { happiness: -8 }, tone: 'bad' },
      { label: '说了一些真实的事', reply: '"最近有点累，但还好。"\n妈妈说那就回来吧。\n你笑了，说不用。挂掉以后哭了一会儿，然后去睡觉了。', changes: { happiness: 18, health: 5 }, tone: 'good' },
    ]
  },
  {
    text: 'HR发来一封邮件——\n\n「入住期限为30天，之后将转为房补形式，请自行安排住所。」\n\n你打开了Suumo。\n页面全是日语。\n你不会日语。',
    tone: 'bad',
    choices: [
      { label: '开始一行一行翻译', reply: '你用翻译软件，一个词一个词地读。\n倒计时：30天。\n你不知道"礼金"和"敷金"的区别。\n你后来知道了——都是要付的。', changes: { energy: -15, happiness: -10 }, tone: 'bad' },
      { label: '找公司HR求助', reply: 'HR介绍了一个中介。\n中介在电话里问："外国人？日语大丈夫？"\n你说了一个"No"。电话那头沉默了两秒。\n你听懂了那个沉默的意思。', changes: { energy: -8, happiness: -15 }, tone: 'bad' },
    ]
  },
  {
    text: '满员电车。\n有人踩了你的脚，没有道歉。\n你也没说什么，\n因为你不知道该用日语说什么。',
    tone: 'bad',
    choices: [
      { label: '算了', reply: '你盯着电车门，数着还有几站。\n这座城市慢慢在把你变成它的一部分。', changes: { energy: -10, happiness: -5 }, tone: 'bad' },
      { label: '找了个角落站着', reply: '你靠着车门，闭上眼睛，假装这是F国的地铁。\n没什么用，但好一点点。', changes: { energy: -5, happiness: 3 }, tone: 'neutral' },
    ]
  },
  // --- 风俗店 story (triggered from shop) ---
  {
    id: 'fujoku_1',
    text: '电梯门打开的时候，你们同时愣了一下。\n\n她比照片里更普通，\n穿着便服，抱着一个包，像是刚下班的OL。\n\n你知道她是谁。她不知道你是谁。',
    tone: 'neutral',
    choices: [
      { label: '什么都没说，盯着门', reply: '她先出了电梯，你跟在后面，走进了同一扇门。\n她转过身看见你，愣了大概两秒钟。\n然后职业性地笑了。"啊，是您。"\n你不知道该说什么，也笑了。', changes: { happiness: 10 }, tone: 'neutral' },
    ]
  },
  {
    id: 'fujoku_2',
    text: '洗完澡，她没有说话，\n只是侧躺过来，把头靠在你旁边。\n\n像一只猫。\n\n你低下头，吻了她。\n是真的吻，不是那种。\n\n她没有躲。',
    tone: 'neutral',
    choices: [
      { label: '什么都没说', reply: '这是你来东京以来第一次觉得不孤独。\n你知道这不是真的。\n但今晚不想在意这些。', changes: { happiness: 15 }, tone: 'good' },
    ]
  },
  {
    id: 'fujoku_3',
    text: '出门前你问她能不能加LINE。\n你以为她会拒绝。\n她把二维码给你扫了。\n\n此后偶尔会有消息。\n"下周四有出勤哦～"\n一个笑脸。\n\n她在演戏。你当真了。\n你知道你当真了。\n你没有办法。',
    tone: 'bad',
    choices: [
      { label: '回复了一个笑脸', reply: '她秒回了一个"✨"。\n你看着这个符号很久。', changes: { happiness: -5 }, tone: 'neutral' },
      { label: '没有回复，把手机放下', reply: '你知道有些事看清楚了就别再看了。\n你还是留着那条LINE。', changes: { happiness: -10 }, tone: 'bad' },
    ]
  },
  // --- small daily moments ---
  {
    text: '今天电车罕见地不那么挤。\n你甚至找到了一个靠窗的位置。\n远处能看到富士山的轮廓。',
    tone: 'good',
    choices: [
      { label: '拍了张照片', reply: '你发给F国的朋友，他说"wow"。\n有时候一张照片能解释你来这里的理由。', changes: { happiness: 18 }, tone: 'good' },
      { label: '就这样看着', reply: '你没有拍照。有些东西留在眼睛里就够了。', changes: { happiness: 12, energy: 8 }, tone: 'good' },
    ]
  },
  {
    text: '你路过一家书店，还没关门。\n橱窗里有一本关于东京的摄影集，\n封面是夜晚的新宿，霓虹灯，人群，雨。',
    tone: 'neutral',
    choices: [
      { label: '进去买下来（¥2,000）', reply: '你看不懂里面的日文，但照片你看懂了。', changes: { happiness: 15, savings: -2000 }, tone: 'good' },
      { label: '继续走', reply: '"下次吧。"这两个字在东京通常是永远。', changes: { happiness: -3 }, tone: 'neutral' },
    ]
  },
  {
    text: '超市的半额便当区。\n晚上八点，黄色标签。\n\n你在F国的时候从没想过\n有一天会为半价便当感到高兴。',
    tone: 'neutral',
    choices: [
      { label: '拿了两个', reply: '省了钱，有一种奇怪的满足感。\n你把这个心情发给F国朋友，他说"你变了"。\n也许是。', changes: { energy: 18, happiness: 8, savings: 600 }, tone: 'good' },
    ]
  },
];

// ── 风俗店 story queue (played in order after buying) ─────────
const FUJOKU_STORY = ['fujoku_1', 'fujoku_2', 'fujoku_3'];

function getRandomEvent() {
  const regular = POPUP_EVENTS.filter(e => !e.id || !FUJOKU_STORY.includes(e.id));
  return regular[Math.floor(Math.random() * regular.length)];
}

function getFujokuEvent(visitCount) {
  const id = FUJOKU_STORY[visitCount % FUJOKU_STORY.length];
  return POPUP_EVENTS.find(e => e.id === id);
}
