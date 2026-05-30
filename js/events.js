'use strict';

const POPUP_EVENTS = [
  {
    text: '上司把一份文件扔在你桌上。\n截止：明天早上九点。全是日语。',
    tone: 'bad',
    choices: [
      { label: '🌙 熬夜做完', reply: '凌晨两点交上去。上司说了句"お疲れ様"。你后来查了这是什么意思。', changes: { energy: -20, money: 8000 }, tone: 'neutral' },
      { label: '🤝 找同事帮忙', reply: '他帮你理清了三个误解。你欠他一顿饭。', changes: { energy: -8, money: 5000, happiness: 5 }, tone: 'good' },
    ]
  },
  {
    text: '开会。所有人在说日语。\n你点头，因为点头是你唯一能做的事。',
    tone: 'bad',
    choices: [
      { label: '😶 努力跟上', reply: '会后同事发给你英文总结。你回复了"ありがとう"，这是你会的少数日语之一。', changes: { energy: -10 }, tone: 'neutral' },
      { label: '📱 悄悄用翻译软件', reply: '你翻译出来发现主要在讨论午饭选哪家。', changes: { energy: -5, happiness: 8 }, tone: 'neutral' },
    ]
  },
  {
    text: '项目顺利交付。\n上司发来邮件，里面有一行英语：\n"Good work."',
    tone: 'good',
    choices: [
      { label: '📸 截图发给F国朋友', reply: '他回复了一个大拇指。你看着这个大拇指笑了一会儿。', changes: { happiness: 20, money: 5000 }, tone: 'good' },
      { label: '💰 谈加薪', reply: '上司说下季度再说。这在日本意思是不。', changes: { happiness: -5, money: 2000 }, tone: 'bad' },
    ]
  },
  {
    text: '午休。同事们去了一家定食屋。\n没有人邀请你。\n不一定是恶意——语言不通让邀请变得麻烦。',
    tone: 'bad',
    choices: [
      { label: '🏪 自己去便利店', reply: '你坐在工位吃饭，看着空荡荡的办公室。这是东京一种特别的孤独。', changes: { energy: 8, happiness: -10 }, tone: 'bad' },
      { label: '🚶 鼓起勇气跟上去', reply: '你用手机翻译菜单点了一份看起来安全的东西。没人跟你说话，但你坐在人群里。这已经好一点了。', changes: { energy: 12, happiness: 10 }, tone: 'neutral' },
    ]
  },
  {
    isStory: true,
    storyTitle: '打给家里',
    storyEmoji: '📞',
    text: '久违地和家人通了个电话。\n妈妈问你有没有好好吃饭。\n你说都好，都好。\n挂掉电话，房间很安静。',
    tone: 'neutral',
    choices: [
      { label: '"都好，别担心。"', reply: '你挂掉电话，坐在黑暗里了一会儿。窗外是东京，窗内是你。', changes: { happiness: -8 }, tone: 'bad' },
      { label: '说了一些真实的事', reply: '"最近有点累，但还好。"\n妈妈说那就回来吧。\n你笑了，说不用。挂掉以后哭了一会儿，然后去睡觉了。', changes: { happiness: 18, health: 5 }, tone: 'good' },
    ]
  },
  {
    isStory: true,
    storyTitle: '电梯里的她',
    storyEmoji: '🏩',
    text: '电梯门打开的时候，你们同时愣了一下。\n她比照片里更普通，穿着便服，抱着一个包。\n你知道她是谁。她不知道你是谁。\n楼层数字往上走，你们保持着陌生人的距离。',
    tone: 'neutral',
    choices: [
      { label: '什么都没说', reply: '她先出了电梯，你跟在后面，走进了同一扇门。\n她转过身看见你，愣了大概两秒钟，然后职业性地笑了。\n"啊，是您。"\n你不知道该说什么，也笑了。', changes: { happiness: 15 }, tone: 'neutral' },
    ]
  },
  {
    isStory: true,
    storyTitle: '三十天找房子',
    storyEmoji: '🏠',
    text: 'HR发来邮件——\n「入住期限为30天，之后请自行安排住所。」\n\n你打开了Suumo。\n页面全是日语。\n你不会日语。',
    tone: 'bad',
    choices: [
      { label: '开始一行一行翻译', reply: '你用翻译软件，一个词一个词地读。\n"礼金"和"敷金"——后来才知道都是要付的。\n倒计时：30天。', changes: { energy: -15, happiness: -10 }, tone: 'bad' },
      { label: '找HR求助', reply: 'HR介绍了一个中介。\n中介问："外国人？日語大丈夫？"\n你说了个"No"。电话那头沉默了两秒。\n你听懂了那个沉默的意思。', changes: { energy: -8, happiness: -12 }, tone: 'bad' },
    ]
  },
  {
    text: '满员电车。\n有人踩了你的脚，没有道歉。\n你也没说什么，因为你不知道日语该怎么说。',
    tone: 'bad',
    choices: [
      { label: '算了', reply: '你盯着电车门，数着还有几站。\n这座城市慢慢在把你变成它的一部分。', changes: { energy: -8, happiness: -5 }, tone: 'bad' },
      { label: '找了个角落站着', reply: '你靠着车门，闭上眼睛，假装这是F国的地铁。没什么用，但好一点点。', changes: { energy: -5, happiness: 3 }, tone: 'neutral' },
    ]
  },
  {
    text: '今天电车罕见地不那么挤。\n你甚至找到了靠窗的位置。\n远处能看到富士山的轮廓。',
    tone: 'good',
    choices: [
      { label: '📷 拍了张照片', reply: '你发给F国的朋友，他说"wow"。\n有时候一张照片能解释你来这里的理由。', changes: { happiness: 20 }, tone: 'good' },
      { label: '就这样看着', reply: '你没有拍照。有些东西留在眼睛里就够了。', changes: { happiness: 15, energy: 8 }, tone: 'good' },
    ]
  },
  {
    text: '超市半额便当区。晚上八点，黄色标签。\n你在F国从没想过有一天会为半价便当感到高兴。',
    tone: 'neutral',
    choices: [
      { label: '拿了两个', reply: '省了钱，有一种奇怪的满足感。\n你把这个心情发给F国朋友，他说"你变了"。\n也许是。', changes: { energy: 18, happiness: 10, money: 500 }, tone: 'good' },
    ]
  },
];

function getRandomEvent() {
  return POPUP_EVENTS[Math.floor(Math.random() * POPUP_EVENTS.length)];
}
