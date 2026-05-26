// ==================== КОНФІГ FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyD1-UDrqRzfUw_32nOzqT2mAozzab5DJZk",
  authDomain: "hamka-game.firebaseapp.com",
  databaseURL: "https://hamka-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hamka-game",
  storageBucket: "hamka-game.firebasestorage.app",
  messagingSenderId: "975050013138",
  appId: "1:975050013138:web:19f42c1c5f2b2d35d6300b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const tg = window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand()}

function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}

const GIFS=[{id:'🐹',e:'🐹',r:'common'},{id:'🐱',e:'🐱',r:'common'},{id:'🐶',e:'🐶',r:'common'},{id:'🦊',e:'🦊',r:'common'},{id:'🐻',e:'🐻',r:'common'},{id:'🐯',e:'🐯',r:'rare'},{id:'🦁',e:'🦁',r:'rare'},{id:'🐺',e:'🐺',r:'rare'},{id:'👑',e:'👑',r:'superrare'},{id:'💎',e:'💎',r:'superrare'},{id:'🌟',e:'🌟',r:'epic'},{id:'🔥',e:'🔥',r:'epic'},{id:'🚀',e:'🚀',r:'mythic'},{id:'🦄',e:'🦄',r:'legendary'},{id:'🐲',e:'🐲',r:'legendary'},{id:'⚔️',e:'⚔️',r:'exclusive',homa:1}];
GIFS.push({id:'☀️',e:'☀️',r:'rare'}, {id:'🏖️',e:'🏖️',r:'rare'}); // івентові гіфки
const R={common:{n:'Простий',p:1000},rare:{n:'Рідкісний',p:3000},superrare:{n:'Надрідкісний',p:8000},epic:{n:'Епічний',p:50000},mythic:{n:'Міфічний',p:150000},legendary:{n:'Легендарний',p:500000},exclusive:{n:'Ексклюзивний',p:0}};
const LEVELS=[{l:1,x:0,rw:0},{l:2,x:200,rw:20},{l:3,x:600,rw:40},{l:4,x:1500,rw:80},{l:5,x:4000,rw:160},{l:6,x:10000,rw:320},{l:7,x:25000,rw:640},{l:8,x:60000,rw:1280},{l:9,x:150000,rw:2500},{l:10,x:400000,rw:5000},{l:11,x:1000000,rw:10000},{l:12,x:2500000,rw:25000},{l:13,x:6000000,rw:50000},{l:14,x:15000000,rw:100000},{l:15,x:40000000,rw:250000},{l:16,x:100000000,rw:500000},{l:17,x:250000000,rw:1000000},{l:18,x:600000000,rw:2500000},{l:19,x:1500000000,rw:5000000},{l:20,x:4000000000,rw:10000000}];

let coins=50,inv=[],autoTap=0,tapLvl=1,totalTaps=0,totalWon=0,luck=1.0,lastSpin=0,isAdmin=0,coinBoost=1.0,autoXP=0,homa=0,saperHW=0,casinoW=0,maxEn=400,curEn=400,accXP=0,accLvl=1,userName='Гравець',myGifs=['🐹'],curGif='🐹',myTitles=['none'],curTitle='none',morseUsed=0,tapPow=1.0,crit=0;
let buyCount={maxEnergy:0,autoXP:0,autoTap:0,energyRegen:0,upgradeTap:0,coinBoostB:0,energyUp:0,tapPowerB:0,critChanceB:0,luckB:0};
let chests = {common:0, rare:0, epic:0, legendary:0, mythic:0, homa_chest:0, homa10_chest:0};
let morseLastLevel = 0;
const usedPromos=[],promos={lordeddw:500,robot:300,hamka2024:1000,gift:5000,h7f9h6l0:'admin'};
let lastSaveTime=Date.now();

// ---- ІВЕНТ ----
let eventHoma = 0;
let megaQuest = null;
let megaQuestProgress = 0;
let megaQuestLevel = 1;

const MEGA_QUEST_TYPES = [
    {type:'taps', desc:'Натисніть тап {0} разів', baseTarget:100},
    {type:'casinoPlays', desc:'Зіграйте в казино {0} разів', baseTarget:3},
    {type:'casinoWins', desc:'Виграйте в казино {0} разів', baseTarget:1},
    {type:'bossKill', desc:'Переможіть боса {0} разів', baseTarget:1},
    {type:'openChest', desc:'Відкрийте {0} ящиків', baseTarget:2},
    {type:'earnCoins', desc:'Заробіть {0} монет', baseTarget:5000},
    {type:'levelUp', desc:'Підвищіть рівень {0} разів', baseTarget:1},
    {type:'newGif', desc:'Отримайте {0} нових гіфок', baseTarget:1},
    {type:'buyItem', desc:'Купіть {0} покращень у магазині', baseTarget:1},
];

function generateMegaQuest(level) {
    const t = MEGA_QUEST_TYPES[Math.floor(Math.random() * MEGA_QUEST_TYPES.length)];
    const target = Math.floor(t.baseTarget * (1 + (level-1) * 0.5));
    return {
        type: t.type,
        desc: t.desc.replace('{0}', target),
        target: target,
        rewardEventHoma: 2 + level,
        rewardCoins: 500 * level,
        rewardHoma: 10 * level,
    };
}
function loadMegaQuest() { if (!megaQuest) megaQuest = generateMegaQuest(megaQuestLevel); }
function claimMegaQuest() {
    if (!megaQuest || megaQuestProgress < megaQuest.target) { toast('❌ Квест ще не виконано!'); return; }
    eventHoma += megaQuest.rewardEventHoma;
    coins += megaQuest.rewardCoins;
    homa += megaQuest.rewardHoma;
    toast(`✅ Мегаквест виконано! +${megaQuest.rewardEventHoma} івенхом, +${megaQuest.rewardCoins}💰, +${megaQuest.rewardHoma}🟣`);
    megaQuestLevel++;
    megaQuestProgress = 0;
    megaQuest = generateMegaQuest(megaQuestLevel);
    updAll(); saveG(); renderEvent();
}
function updateMegaQuestProgress() {
    if (!megaQuest) return;
    switch (megaQuest.type) {
        case 'taps': megaQuestProgress = tapsToday; break;
        case 'casinoPlays': megaQuestProgress = casinoPlaysToday; break;
        case 'casinoWins': megaQuestProgress = casinoWinsToday; break;
        case 'bossKill': megaQuestProgress = bossKillsToday; break;
        case 'openChest': megaQuestProgress = chestsOpenedToday; break;
        case 'earnCoins': megaQuestProgress = coinsEarnedToday; break;
        case 'levelUp': megaQuestProgress = levelUpsToday; break;
        case 'newGif': megaQuestProgress = newGifsToday; break;
        case 'buyItem': megaQuestProgress = (boughtAutoTapToday + boughtGifToday); break;
    }
    if (megaQuestProgress >= megaQuest.target) toast('🎯 Мегаквест виконано! Заберіть нагороду.');
}
function openEventChest() {
    if (eventHoma < 10) { toast('❌ Потрібно 10 івенхом'); return; }
    eventHoma -= 10;
    const r = Math.random() * 100;
    let reward = '';
    if (r < 34) { homa += 5; reward = '5 хом'; }
    else if (r < 60) { homa += 20; reward = '20 хом'; }
    else if (r < 75) {
        if (!myGifs.includes('☀️')) { myGifs.push('☀️'); newGifsToday++; reward = 'гіфка "сонце"'; }
        else { homa += 10; reward = '10 хом (гіфка вже є)'; }
    }
    else if (r < 85) {
        if (!myGifs.includes('🏖️')) { myGifs.push('🏖️'); newGifsToday++; reward = 'гіфка "пляж"'; }
        else { homa += 10; reward = '10 хом (гіфка вже є)'; }
    }
    else if (r < 95) {
        if (!myTitles.includes('летний')) { myTitles.push('летний'); newTitlesToday++; reward = 'титул "летний"'; }
        else { homa += 20; reward = '20 хом (титул вже є)'; }
    }
    else if (r < 99) { homa += 150; reward = '150 хом'; }
    else {
        if (!myTitles.includes('ĹÈŤOʻ')) { myTitles.push('ĹÈŤOʻ'); newTitlesToday++; reward = 'титул "ĹÈŤOʻ"'; }
        else { homa += 50; reward = '50 хом (титул вже є)'; }
    }
    toast('🎁 ' + reward);
    updAll(); saveG(); renderEvent();
}
function renderEvent() {
    const a = document.getElementById('game-area');
    let html = '<div class="center-game"><h3 style="color:#ec4899">🌸 Івент: Літній бум</h3>';
    html += `<div class="card"><b>🪙 Івенхоми:</b> ${eventHoma}</div>`;
    html += `<div class="card"><b>📦 Івенхоум</b> (10 івенхом)<br><button class="btn btn-o btn-sm" onclick="openEventChest()">Відкрити</button></div>`;
    if (megaQuest) {
        const prog = Math.min(megaQuestProgress, megaQuest.target);
        html += `<div class="card"><b>🏆 Мегаквест ${megaQuestLevel}</b><br>${megaQuest.desc}<br>
        <small>Прогрес: ${prog}/${megaQuest.target}</small>
        <div style="background:#333;height:5px;border-radius:3px;margin:4px 0"><div style="width:${(prog/megaQuest.target)*100}%;height:100%;background:#ec4899;border-radius:3px"></div></div>
        <small>Нагорода: ${megaQuest.rewardEventHoma} івенхом, ${megaQuest.rewardCoins}💰, ${megaQuest.rewardHoma}🟣</small><br>
        <button class="btn btn-sm btn-g" onclick="claimMegaQuest()" ${prog < megaQuest.target ? 'disabled' : ''}>Забрати</button></div>`;
    }
    html += '</div>';
    a.innerHTML = html;
}

// ---- КВЕСТИ (денні) ----
const QUEST_POOL = [ /* ... всі квести ... */ ];
let dailyQuests = [];
let lastQuestDate = '';
let tapsToday = 0, casinoPlaysToday = 0, casinoWinsToday = 0, chestsOpenedToday = 0, bossKillsToday = 0;
let morseUsesToday = 0, newGifsToday = 0, newTitlesToday = 0, coinsEarnedToday = 0, homaEarnedToday = 0;
let levelUpsToday = 0, boughtAutoTapToday = 0, boughtGifToday = 0, homaChestsOpenedToday = 0;

// ... (всі функції денних квестів, авторизація, гра, магазин, адмінка) ...
// Важливо: у всіх ігрових функціях (tapClick, spin, fightBoss, openChestFromInventory, submitMorse, addXP, buyItem, buyGif, buyTitle) додано виклик updateMegaQuestProgress() після updateQuestProgress().

// Приклад модифікації tapClick:
function tapClick(e){
    if(blocked)return; if(curEn<=0){toast('⚡ Немає енергії!');return} curEn--;
    const now=Date.now();clicks=clicks.filter(t=>now-t<1000);
    if(clicks.length>=12){blocked=1;setTimeout(()=>{blocked=0;clicks=[]},2000);return}
    clicks.push(now);
    let inc=Math.floor(Math.random()*3)+1+(tapLvl-1); inc=Math.floor(inc*coinBoost*tapPow);
    if(Math.random()*100<crit)inc=Math.floor(inc*2);
    coins+=inc;totalTaps++;addXP(1);updBal();updEnergy();
    tapsToday++; coinsEarnedToday += inc;
    updateQuestProgress();
    updateMegaQuestProgress(); // додано
}

// У spin():
// після updateQuestProgress(); додати updateMegaQuestProgress();
// У fightBoss():
// після updateQuestProgress(); додати updateMegaQuestProgress();
// У openChestFromInventory():
// після updateQuestProgress(); додати updateMegaQuestProgress();
// У submitMorse():
// після updateQuestProgress(); додати updateMegaQuestProgress();
// У addXP():
// після updateQuestProgress(); додати updateMegaQuestProgress();
// У buyItem (при t==='autoTap'):
// після updateQuestProgress(); додати updateMegaQuestProgress();
// У buyGif():
// після updateQuestProgress(); додати updateMegaQuestProgress();
// У buyTitle():
// після updateQuestProgress(); додати updateMegaQuestProgress();

// У loadD додати:
eventHoma = d.eventHoma || 0;
megaQuest = d.megaQuest || null;
megaQuestProgress = d.megaQuestProgress || 0;
megaQuestLevel = d.megaQuestLevel || 1;

// У saveG додати поля:
const d = { ..., eventHoma, megaQuest, megaQuestProgress, megaQuestLevel, ... };

// У startGame() додати:
loadMegaQuest();

// У buildPages() додати кнопку:
<button class="btn" style="background:#f472b6;color:#fff" onclick="openGame('event')">🌸 Івент</button>

// В openGame() додати:
if (g === 'event') renderEvent();
