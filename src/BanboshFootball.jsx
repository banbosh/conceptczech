import { useState, useEffect, useRef, useCallback } from "react";
/* ═══════ CONSTANTS ═══════ */
const W=380,H=660,PR=20,BR=14,GW=130,GL=(W-GW)/2,GR=(W+GW)/2,FRC=0.981,KICK=14,PLR=0.13,PSC=1.12;

/* ═══════ POWER-UP TYPES ═══════ */
const PU_TYPES=[
  {id:"speed",emoji:"⚡",color:"#ffe066",dur:5000,desc:{en:"Speed!",cs:"Rychlost!",de:"Tempo!",fr:"Vitesse!",es:"¡Rápido!",zh:"加速!",hi:"गति!"}},
  {id:"giant",emoji:"🛡️",color:"#8eff8e",dur:5000,desc:{en:"Giant!",cs:"Obr!",de:"Riese!",fr:"Géant!",es:"¡Gigante!",zh:"巨人!",hi:"विशाल!"}},
  {id:"freeze",emoji:"❄️",color:"#8ef",dur:4000,desc:{en:"Freeze!",cs:"Zmrazení!",de:"Einfrieren!",fr:"Gel!",es:"¡Hielo!",zh:"冰冻!",hi:"जमाव!"}},
  {id:"fire",emoji:"🔥",color:"#ff6b35",dur:1,desc:{en:"Fire Shot!",cs:"Ohnivý výstřel!",de:"Feuerschuss!",fr:"Tir de feu!",es:"¡Disparo de fuego!",zh:"火焰射门!",hi:"आग शॉट!"}},
  {id:"magnet",emoji:"🧲",color:"#c4b5fd",dur:5000,desc:{en:"Magnet!",cs:"Magnet!",de:"Magnet!",fr:"Aimant!",es:"¡Imán!",zh:"磁铁!",hi:"चुंबक!"}},
];

/* ═══════ THEME ═══════ */
const TH={
  dark:{bg:"#0a0e17",card:"rgba(12,18,30,0.88)",
    accent:"linear-gradient(135deg,#6366f1,#22d3ee 40%,#34d399 70%,#4ade80)",
    accentSolid:"#22d3ee",border:"rgba(100,200,220,0.25)",txt:"#f0f4f8",sub:"#8899aa",
    btn:"rgba(255,255,255,0.95)",btnTxt:"#0a0e17",cardBorder:"rgba(100,200,220,0.18)",
    inputBg:"rgba(255,255,255,0.06)",inputBorder:"rgba(100,200,220,0.15)"},
  light:{bg:"#FDF6F0",card:"rgba(255,253,250,0.96)",
    accent:"linear-gradient(135deg,#D4A574,#C4956A 40%,#B8886E)",
    accentSolid:"#C4956A",border:"#d1c1a1",txt:"#3D2E22",sub:"#8B7265",
    btn:"#fff",btnTxt:"#3D2E22",cardBorder:"#d1c1a1",
    inputBg:"rgba(120,80,50,0.04)",inputBorder:"#d1c1a1"}
};

/* ═══════ JERSEYS ═══════ */
const JERSEYS=[
  {id:"red",primary:"#DC2626",secondary:"#fff",shorts:"#fff",dark:"#991B1B",hair:"#1a1a1a"},
  {id:"blue",primary:"#2563EB",secondary:"#fff",shorts:"#fff",dark:"#1E40AF",hair:"#3b2507"},
  {id:"green",primary:"#16A34A",secondary:"#fff",shorts:"#fff",dark:"#15803D",hair:"#5c3a1e"},
  {id:"yellow",primary:"#EAB308",secondary:"#222",shorts:"#222",dark:"#CA8A04",hair:"#1a1a1a"},
  {id:"white",primary:"#E2E8F0",secondary:"#222",shorts:"#334155",dark:"#94A3B8",hair:"#3b2507"},
  {id:"purple",primary:"#7C3AED",secondary:"#fff",shorts:"#fff",dark:"#5B21B6",hair:"#2a1a0a"},
  {id:"orange",primary:"#EA580C",secondary:"#fff",shorts:"#1a1a1a",dark:"#C2410C",hair:"#1a1a1a"},
  {id:"pink",primary:"#EC4899",secondary:"#fff",shorts:"#831843",dark:"#BE185D",hair:"#3b2507"},
  {id:"cyan",primary:"#06B6D4",secondary:"#fff",shorts:"#164E63",dark:"#0891B2",hair:"#1a1a1a"},
  {id:"black",primary:"#1F2937",secondary:"#FFD700",shorts:"#FFD700",dark:"#111827",hair:"#5c3a1e"},
];
const JN={red:{en:"Red",cs:"Červená"},blue:{en:"Blue",cs:"Modrá"},green:{en:"Green",cs:"Zelená"},yellow:{en:"Yellow",cs:"Žlutá"},white:{en:"White",cs:"Bílá"},purple:{en:"Purple",cs:"Fialová"},orange:{en:"Orange",cs:"Oranžová"},pink:{en:"Pink",cs:"Růžová"},cyan:{en:"Cyan",cs:"Tyrkysová"},black:{en:"Black",cs:"Černá"}};

/* ═══════ LEAGUE TEAMS ═══════ */
const LEAGUE_AI_NAMES=[
  "FC Dynamo","United SC","City FC","Athletic Club","Sporting FC",
  "Real Stars","Inter Milan","Bayern FC","Chelsea FC","Arsenal FC",
  "Liverpool FC","Juventus FC","PSG United","Ajax FC","Porto FC"
];

/* ═══════ FIELDS (hřiště) ═══════ */
const FIELDS=[
  {id:"grass",name:{en:"Classic Grass",cs:"Klasická tráva"},color1:"#2eaf44",color2:"#26953c",friction:0.985,locked:false},
  {id:"turf",name:{en:"Artificial Turf",cs:"Umělka"},color1:"#1e6b3e",color2:"#1a5c36",friction:0.99,locked:false},
  {id:"beach",name:{en:"Beach",cs:"Pláž"},color1:"#D4A574",color2:"#C4956A",friction:0.97,locked:true,unlockWins:8},
  {id:"ice",name:{en:"Ice Rink",cs:"Led"},color1:"#B0E0E6",color2:"#87CEEB",friction:0.998,locked:true,unlockWins:15},
  {id:"night",name:{en:"Night Stadium",cs:"Noční stadion"},color1:"#1a3d1a",color2:"#0f2d0f",friction:0.985,locked:true,unlockWins:25},
];

/* ═══════ WEATHER ═══════ */
const WEATHER=[
  {id:"clear",name:{en:"Clear",cs:"Jasno"},effect:1,particles:null},
  {id:"rain",name:{en:"Rain",cs:"Déšť"},effect:0.95,particles:"rain"},
  {id:"snow",name:{en:"Snow",cs:"Sníh"},effect:0.9,particles:"snow"},
];

/* ═══════ LEAGUE DATA ═══════ */
const LEAGUE_TEAMS=[
  {name:"FC Dynamo",jersey:JERSEYS[0],skill:0.7},
  {name:"United SC",jersey:JERSEYS[1],skill:0.8},
  {name:"City FC",jersey:JERSEYS[2],skill:0.85},
  {name:"Athletic Club",jersey:JERSEYS[3],skill:0.9},
  {name:"Sporting FC",jersey:JERSEYS[4],skill:0.75},
];

/* ═══════ AI ═══════ */
const DIFF={easy:{lerp:.035,pred:2,aggr:20,ret:80},medium:{lerp:.07,pred:6,aggr:40,ret:100},hard:{lerp:.13,pred:12,aggr:70,ret:140}};
const DIFF_ORDER=["easy","medium","hard"];

/* ═══════ LANGUAGES ═══════ */
const LANGS=["en","cs","de","fr","es","zh","hi"];
const LL={en:"English",cs:"Čeština",de:"Deutsch",fr:"Français",es:"Español",zh:"中文",hi:"हिन्दी"};
const LC={en:"GB",cs:"CZ",de:"DE",fr:"FR",es:"ES",zh:"CN",hi:"IN"};
const TX={
  en:{title:"BANBOSH <b>FOOTBALL</b>",sub:"Minimalist football duel — play AI, tournament or online.",
    ai:"Play vs AI",tourney:"Tournament",online:"Online Multiplayer",
    easy:"Easy",medium:"Medium",hard:"Hard",easyD:"For beginners",mediumD:"Balanced",hardD:"For pros",
    pickDiff:"Difficulty",pickJersey:"Choose Jersey",goals:"Goals to Win",
    start:"Start Game",back:"Menu",goal:"GOAL",wins:"wins!",again:"Play Again",
    beatAI:"You beat AI!",aiWin:"AI wins",great:"Great match!",vs:"vs",
    ctrl:"Drag bottom half = your player. Kick the ball into the top goal!",
    soon:"Coming Soon",onlineNote:"Online multiplayer requires a game server. We're working on it!",
    createRoom:"Create Room",joinRoom:"Join",roomCode:"Room Code",waiting:"Waiting for player...",
    enterCode:"Enter code",or:"or",restart:"Restart",
    tourneyTitle:"AI Tournament",tourneyDesc:"Beat 3 AI opponents with rising difficulty to become champion!",
    round:"Round",of:"of",champion:"Champion!",tourneyWin:"You won the tournament!",tourneyLose:"Tournament over",
    nextRound:"Next Round →",tourneyStart:"Start Tournament",
    onlineTourney:"Online Tournament",onlineTourneyDesc:"Create a tournament for 2-4 friends with bracket matches!",
    createTourney:"Create Tournament",joinTourney:"Join Tournament",bracket:"Bracket",
    semifinal:"Semi-final",final:"Final",players:"Players",player:"Player",
    tSlots:"Tournament size",waiting2:"Waiting for players...",joined:"joined",
    matchup:"Match",tOnlineDesc:"Invite friends with the code. Semi-finals → Final!",
    combo:"Combo",streak:"streak",fire:"🔥",next:"Next",
    league:"League",leagueTitle:"League Mode",leagueDesc:"Start in 3rd league, work your way up to 1st league!",
    league3:"3rd League",league2:"2nd League",league1:"1st League",
    leagueStart:"Start League",matchday:"Matchday",table:"Table",pos:"#",pts:"Pts",
    yourTeam:"Your Team",promoted:"Promoted!",relegated:"Relegated",leagueChamp:"Champion!",
    seasonEnd:"Season Over",nextSeason:"Next Season",stayLeague:"Stay in League",
    enterName:"Enter your name",playerName:"Player Name",confirm:"Confirm",
    tutorial:"How to Play",tutStep1:"Drag your finger on the bottom half of the screen to move your player",tutStep2:"Push the ball into the opponent's goal at the top",tutStep3:"Collect power-ups for special abilities!",tutStep4:"First to reach the target score wins!",skip:"Skip",gotIt:"Got it!",
    privacy:"Privacy Policy",terms:"Terms of Service",legal:"Legal",
    privacyText:"Banbosh Football does not collect any personal data. The game runs entirely on your device. No accounts, no tracking, no ads.",
    termsText:"By using Banbosh Football, you agree to use the game for entertainment purposes only. The game is provided as-is without warranties.",created:"Created by"},
  cs:{title:"BANBOSH <b>FOTBAL</b>",sub:"Minimalistický fotbalový souboj — hraj proti AI, turnaj nebo online.",
    ai:"Hrát proti AI",tourney:"Turnaj",online:"Online Multiplayer",
    easy:"Lehká",medium:"Střední",hard:"Těžká",easyD:"Pro začátečníky",mediumD:"Vyrovnaný",hardD:"Pro borce",
    pickDiff:"Obtížnost",pickJersey:"Vyber dres",goals:"Gólů k výhře",
    start:"Spustit hru",back:"Menu",goal:"GÓL",wins:"vyhrává!",again:"Hrát znovu",
    beatAI:"Porazil jsi AI!",aiWin:"AI vyhrává",great:"Skvělý zápas!",vs:"vs",
    ctrl:"Táhni po spodní půlce = tvůj hráč. Kopni míč do horní branky!",
    soon:"Již brzy",onlineNote:"Online vyžaduje herní server. Pracujeme na tom!",
    createRoom:"Vytvořit místnost",joinRoom:"Připojit",roomCode:"Kód místnosti",waiting:"Čekání na hráče...",
    enterCode:"Zadej kód",or:"nebo",restart:"Restart",
    tourneyTitle:"AI Turnaj",tourneyDesc:"Poraz 3 AI soupeře se stoupající obtížností a staň se šampionem!",
    round:"Kolo",of:"ze",champion:"Šampion!",tourneyWin:"Vyhrál jsi turnaj!",tourneyLose:"Turnaj skončil",
    nextRound:"Další kolo →",tourneyStart:"Spustit turnaj",
    onlineTourney:"Online turnaj",onlineTourneyDesc:"Vytvoř turnaj pro 2–4 hráče a hrajte pavouk!",
    createTourney:"Vytvořit turnaj",joinTourney:"Připojit se",bracket:"Pavouk",
    semifinal:"Semifinále",final:"Finále",players:"Hráči",player:"Hráč",
    tSlots:"Velikost turnaje",waiting2:"Čekání na hráče...",joined:"připojeno",
    matchup:"Zápas",tOnlineDesc:"Pošli kód kamarádům. Semifinále → Finále!",
    combo:"Kombo",streak:"v řadě",fire:"🔥",next:"Další",
    league:"Liga",leagueTitle:"Ligový mód",leagueDesc:"Začni ve 3. lize a proboj se až do 1. ligy!",
    league3:"3. liga",league2:"2. liga",league1:"1. liga",
    leagueStart:"Začít ligu",matchday:"Hrací den",table:"Tabulka",pos:"#",pts:"Body",
    yourTeam:"Tvůj tým",promoted:"Postup!",relegated:"Sestup",leagueChamp:"Šampion!",
    seasonEnd:"Konec sezóny",nextSeason:"Další sezóna",stayLeague:"Zůstáváš v lize",
    enterName:"Zadej své jméno",playerName:"Jméno hráče",confirm:"Potvrdit",
    tutorial:"Jak hrát",tutStep1:"Táhni prstem po spodní polovině obrazovky pro pohyb hráče",tutStep2:"Zatlač míč do soupeřovy branky nahoře",tutStep3:"Sbírej power-upy pro speciální schopnosti!",tutStep4:"Kdo první dosáhne cílového skóre, vyhrává!",skip:"Přeskočit",gotIt:"Rozumím!",
    privacy:"Ochrana soukromí",terms:"Podmínky užívání",legal:"Právní informace",
    privacyText:"Banbosh Football neshromažďuje žádné osobní údaje. Hra běží výhradně na vašem zařízení. Žádné účty, žádné sledování, žádné reklamy.",
    termsText:"Používáním hry Banbosh Football souhlasíte s tím, že hru budete používat pouze pro zábavu. Hra je poskytována tak, jak je, bez záruk.",created:"Vytvořilo"},
  de:{title:"BANBOSH <b>FUSSBALL</b>",sub:"Minimalistisches Fußballduell.",ai:"Gegen KI",tourney:"Turnier",online:"Online Multiplayer",easy:"Leicht",medium:"Mittel",hard:"Schwer",easyD:"Anfänger",mediumD:"Ausgeglichen",hardD:"Profis",pickDiff:"Schwierigkeit",pickJersey:"Trikot wählen",goals:"Tore zum Sieg",start:"Spiel starten",back:"Menü",goal:"TOR",wins:"gewinnt!",again:"Nochmal",beatAI:"KI besiegt!",aiWin:"KI gewinnt",great:"Tolles Spiel!",vs:"vs",ctrl:"Untere Hälfte ziehen = dein Spieler.",soon:"Demnächst",onlineNote:"Online erfordert Server.",createRoom:"Raum erstellen",joinRoom:"Beitreten",roomCode:"Raumcode",waiting:"Warte...",enterCode:"Code",or:"oder",restart:"Neustart",tourneyTitle:"KI Turnier",tourneyDesc:"Besiege 3 KI-Gegner!",round:"Runde",of:"von",champion:"Champion!",tourneyWin:"Turnier gewonnen!",tourneyLose:"Turnier vorbei",nextRound:"Nächste Runde →",tourneyStart:"Turnier starten",onlineTourney:"Online-Turnier",onlineTourneyDesc:"2–4 Spieler Turnier!",createTourney:"Turnier erstellen",joinTourney:"Beitreten",bracket:"Turnierbaum",semifinal:"Halbfinale",final:"Finale",players:"Spieler",player:"Spieler",tSlots:"Turniergröße",waiting2:"Warte...",joined:"beigetreten",matchup:"Spiel",tOnlineDesc:"Teile den Code!",combo:"Kombo",streak:"Serie",fire:"🔥",next:"Weiter",tutorial:"Spielanleitung",tutStep1:"Ziehe deinen Finger über die untere Hälfte des Bildschirms",tutStep2:"Schiebe den Ball ins gegnerische Tor oben",tutStep3:"Sammle Power-ups für Spezialfähigkeiten!",tutStep4:"Wer zuerst die Zielpunktzahl erreicht, gewinnt!",skip:"Überspringen",gotIt:"Verstanden!",privacy:"Datenschutz",terms:"Nutzungsbedingungen",legal:"Rechtliches",privacyText:"Banbosh Football sammelt keine persönlichen Daten. Das Spiel läuft vollständig auf deinem Gerät.",termsText:"Mit der Nutzung von Banbosh Football stimmst du zu, das Spiel nur zur Unterhaltung zu nutzen."},
  fr:{title:"BANBOSH <b>FOOTBALL</b>",sub:"Duel de football minimaliste.",ai:"Contre IA",tourney:"Tournoi",online:"En ligne",easy:"Facile",medium:"Moyen",hard:"Difficile",easyD:"Débutants",mediumD:"Équilibré",hardD:"Pros",pickDiff:"Difficulté",pickJersey:"Maillot",goals:"Buts pour gagner",start:"Commencer",back:"Menu",goal:"BUT",wins:"gagne!",again:"Rejouer",beatAI:"IA battue!",aiWin:"L'IA gagne",great:"Super!",vs:"vs",ctrl:"Glissez en bas = votre joueur.",soon:"Bientôt",onlineNote:"Serveur nécessaire.",createRoom:"Créer salle",joinRoom:"Rejoindre",roomCode:"Code",waiting:"En attente...",enterCode:"Code",or:"ou",restart:"Redémarrer",tourneyTitle:"Tournoi IA",tourneyDesc:"Battez 3 IAs!",round:"Tour",of:"sur",champion:"Champion!",tourneyWin:"Tournoi gagné!",tourneyLose:"Terminé",nextRound:"Tour suivant →",tourneyStart:"Lancer",onlineTourney:"Tournoi en ligne",onlineTourneyDesc:"2–4 joueurs!",createTourney:"Créer tournoi",joinTourney:"Rejoindre",bracket:"Tableau",semifinal:"Demi-finale",final:"Finale",players:"Joueurs",player:"Joueur",tSlots:"Taille",waiting2:"En attente...",joined:"connecté",matchup:"Match",tOnlineDesc:"Partagez le code!",combo:"Combo",streak:"série",fire:"🔥",next:"Suivant",tutorial:"Comment jouer",tutStep1:"Faites glisser votre doigt sur la moitié inférieure de l'écran",tutStep2:"Poussez le ballon dans le but adverse en haut",tutStep3:"Collectez des power-ups pour des capacités spéciales!",tutStep4:"Le premier à atteindre le score cible gagne!",skip:"Passer",gotIt:"Compris!",privacy:"Politique de confidentialité",terms:"Conditions d'utilisation",legal:"Mentions légales",privacyText:"Banbosh Football ne collecte aucune donnée personnelle. Le jeu fonctionne entièrement sur votre appareil.",termsText:"En utilisant Banbosh Football, vous acceptez d'utiliser le jeu uniquement à des fins de divertissement."},
  es:{title:"BANBOSH <b>FÚTBOL</b>",sub:"Duelo minimalista.",ai:"Vs IA",tourney:"Torneo",online:"Online Multiplayer",easy:"Fácil",medium:"Medio",hard:"Difícil",easyD:"Principiantes",mediumD:"Equilibrado",hardD:"Cracks",pickDiff:"Dificultad",pickJersey:"Camiseta",goals:"Goles para ganar",start:"Empezar",back:"Menú",goal:"GOL",wins:"gana!",again:"De nuevo",beatAI:"¡IA derrotada!",aiWin:"IA gana",great:"¡Gran partido!",vs:"vs",ctrl:"Arrastra abajo = tu jugador.",soon:"Próximamente",onlineNote:"Requiere servidor.",createRoom:"Crear sala",joinRoom:"Unirse",roomCode:"Código",waiting:"Esperando...",enterCode:"Código",or:"o",restart:"Reiniciar",tourneyTitle:"Torneo IA",tourneyDesc:"¡Vence a 3 IAs!",round:"Ronda",of:"de",champion:"¡Campeón!",tourneyWin:"¡Torneo ganado!",tourneyLose:"Terminado",nextRound:"Siguiente →",tourneyStart:"Iniciar",onlineTourney:"Torneo en línea",onlineTourneyDesc:"2–4 jugadores!",createTourney:"Crear torneo",joinTourney:"Unirse",bracket:"Cuadro",semifinal:"Semifinal",final:"Final",players:"Jugadores",player:"Jugador",tSlots:"Tamaño",waiting2:"Esperando...",joined:"conectados",matchup:"Partido",tOnlineDesc:"¡Comparte el código!",combo:"Combo",streak:"racha",fire:"🔥",next:"Siguiente",tutorial:"Cómo jugar",tutStep1:"Arrastra el dedo por la mitad inferior de la pantalla",tutStep2:"Empuja el balón a la portería rival arriba",tutStep3:"¡Recoge power-ups para habilidades especiales!",tutStep4:"¡El primero en alcanzar la puntuación objetivo gana!",skip:"Saltar",gotIt:"¡Entendido!",privacy:"Política de privacidad",terms:"Términos de servicio",legal:"Legal",privacyText:"Banbosh Football no recopila datos personales. El juego funciona completamente en tu dispositivo.",termsText:"Al usar Banbosh Football, aceptas usar el juego solo con fines de entretenimiento."},
  zh:{title:"BANBOSH <b>足球</b>",sub:"极简足球对决。",ai:"对战AI",tourney:"锦标赛",online:"在线PvP",easy:"简单",medium:"中等",hard:"困难",easyD:"新手",mediumD:"平衡",hardD:"高手",pickDiff:"难度",pickJersey:"球衣",goals:"进球获胜",start:"开始",back:"菜单",goal:"进球",wins:"获胜!",again:"再来",beatAI:"击败AI!",aiWin:"AI获胜",great:"精彩!",vs:"vs",ctrl:"拖动下半部分 = 你的球员。",soon:"即将推出",onlineNote:"需要服务器。",createRoom:"创建房间",joinRoom:"加入",roomCode:"代码",waiting:"等待...",enterCode:"代码",or:"或",restart:"重新开始",tourneyTitle:"AI锦标赛",tourneyDesc:"击败3个AI！",round:"轮",of:"/",champion:"冠军!",tourneyWin:"胜利!",tourneyLose:"结束",nextRound:"下一轮 →",tourneyStart:"开始",onlineTourney:"在线锦标赛",onlineTourneyDesc:"2-4人锦标赛！",createTourney:"创建",joinTourney:"加入",bracket:"赛程",semifinal:"半决赛",final:"决赛",players:"玩家",player:"玩家",tSlots:"规模",waiting2:"等待...",joined:"已加入",matchup:"比赛",tOnlineDesc:"分享代码！",combo:"连击",streak:"连续",fire:"🔥",next:"下一步",tutorial:"游戏说明",tutStep1:"在屏幕下半部分滑动手指来移动球员",tutStep2:"将球推入顶部的对方球门",tutStep3:"收集能量道具获得特殊能力！",tutStep4:"先达到目标分数者获胜！",skip:"跳过",gotIt:"明白了！",privacy:"隐私政策",terms:"服务条款",legal:"法律信息",privacyText:"Banbosh Football不收集任何个人数据。游戏完全在您的设备上运行。",termsText:"使用Banbosh Football即表示您同意仅将游戏用于娱乐目的。"},
  hi:{title:"BANBOSH <b>फ़ुटबॉल</b>",sub:"मिनिमलिस्ट मुकाबला।",ai:"AI",tourney:"टूर्नामेंट",online:"ऑनलाइन",easy:"आसान",medium:"मध्यम",hard:"कठिन",easyD:"शुरुआती",mediumD:"संतुलित",hardD:"विशेषज्ञ",pickDiff:"कठिनाई",pickJersey:"जर्सी",goals:"गोल",start:"शुरू",back:"मेनू",goal:"गोल",wins:"जीता!",again:"फिर से",beatAI:"AI हारा!",aiWin:"AI जीता",great:"शानदार!",vs:"vs",ctrl:"नीचे खींचें = खिलाड़ी।",soon:"जल्द",onlineNote:"सर्वर चाहिए।",createRoom:"बनाएं",joinRoom:"शामिल",roomCode:"कोड",waiting:"प्रतीक्षा...",enterCode:"कोड",or:"या",restart:"रीस्टार्ट",tourneyTitle:"AI टूर्नामेंट",tourneyDesc:"3 AI को हराएं!",round:"राउंड",of:"/",champion:"चैंपियन!",tourneyWin:"जीता!",tourneyLose:"खत्म",nextRound:"अगला →",tourneyStart:"शुरू",onlineTourney:"ऑनलाइन टूर्नामेंट",onlineTourneyDesc:"2-4 खिलाड़ी!",createTourney:"बनाएं",joinTourney:"शामिल",bracket:"ब्रैकेट",semifinal:"सेमीफाइनल",final:"फाइनल",players:"खिलाड़ी",player:"खिलाड़ी",tSlots:"आकार",waiting2:"प्रतीक्षा...",joined:"जुड़े",matchup:"मैच",tOnlineDesc:"कोड साझा करें!",combo:"कॉम्बो",streak:"लगातार",fire:"🔥",next:"अगला",tutorial:"कैसे खेलें",tutStep1:"खिलाड़ी को हिलाने के लिए स्क्रीन के निचले हिस्से पर उंगली खींचें",tutStep2:"गेंद को ऊपर प्रतिद्वंद्वी के गोल में धकेलें",tutStep3:"विशेष क्षमताओं के लिए पावर-अप इकट्ठा करें!",tutStep4:"जो पहले लक्ष्य स्कोर तक पहुंचे वह जीतता है!",skip:"छोड़ें",gotIt:"समझ गया!",privacy:"गोपनीयता नीति",terms:"सेवा की शर्तें",legal:"कानूनी",privacyText:"Banbosh Football कोई व्यक्तिगत डेटा एकत्र नहीं करता।",termsText:"Banbosh Football का उपयोग करके आप सहमत हैं कि गेम का उपयोग केवल मनोरंजन के लिए करेंगे।"},
};

/* ═══════ SOUND ENGINE ═══════ */
class SFX{
  constructor(){this.c=null;this.on=false;this.menuGain=null;this.menuMusic=null}
  init(){if(this.on)return;try{this.c=new(window.AudioContext||window.webkitAudioContext)();this.on=true}catch(e){}}
  resume(){if(this.c?.state==="suspended")this.c.resume()}
  _p(fn){if(!this.c)return;this.resume();try{fn(this.c)}catch(e){}}
  
  // Menu music - pleasant melody with chords
  startMenuMusic(){this._p(c=>{
    if(this.menuMusic)return;
    this.menuGain=c.createGain();this.menuGain.gain.value=.35;this.menuGain.connect(c.destination);
    
    // Chord progression (C-G-Am-F)
    const chords=[[262,330,392],[196,247,392],[220,262,330],[175,262,349]];
    // Melody notes that play over chords
    const melody=[523,494,523,587,523,494,440,392,440,494,523,494,440,392,349,392];
    const bpm=90,beatLen=60/bpm;
    let chordIdx=0,melodyIdx=0;
    
    const playBeat=()=>{
      if(!this.menuGain)return;
      const t=c.currentTime;
      
      // Play chord every 4 beats
      if(melodyIdx%4===0){
        const chord=chords[chordIdx%4];
        chord.forEach(f=>{
          const o=c.createOscillator(),g=c.createGain();
          o.type="sine";o.frequency.value=f;
          g.gain.setValueAtTime(.03,t);g.gain.exponentialRampToValueAtTime(.001,t+beatLen*3.5);
          o.connect(g).connect(this.menuGain);o.start(t);o.stop(t+beatLen*4)});
        // Bass
        const bass=c.createOscillator(),bg=c.createGain();
        bass.type="sine";bass.frequency.value=chords[chordIdx%4][0]/2;
        bg.gain.setValueAtTime(.04,t);bg.gain.exponentialRampToValueAtTime(.001,t+beatLen*3);
        bass.connect(bg).connect(this.menuGain);bass.start(t);bass.stop(t+beatLen*3.5);
        chordIdx++;
      }
      
      // Play melody note
      const note=melody[melodyIdx%melody.length];
      const mo=c.createOscillator(),mg=c.createGain();
      mo.type="sine";mo.frequency.value=note;
      mg.gain.setValueAtTime(.06,t);mg.gain.exponentialRampToValueAtTime(.001,t+beatLen*.9);
      mo.connect(mg).connect(this.menuGain);mo.start(t);mo.stop(t+beatLen);
      
      melodyIdx++;
      this._menuTimer=setTimeout(playBeat,beatLen*1000)};
    playBeat();this.menuMusic=true})}
  stopMenuMusic(){
    if(this._menuTimer){clearTimeout(this._menuTimer);this._menuTimer=null}
    if(this.menuGain){try{this.menuGain.disconnect()}catch(e){}}
    this.menuGain=null;this.menuMusic=null}
  
  // Kick ball - KEEP (good)
  kick(){this._p(c=>{const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type="triangle";o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(80,t+.08);g.gain.setValueAtTime(.35,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.12)})}
  
  // Wall - soft thump
  wall(){this._p(c=>{const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(100,t);o.frequency.exponentialRampToValueAtTime(50,t+.04);g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.06)})}
  
  // Goal - happy C-E-G
  goal(){this._p(c=>{const t=c.currentTime;
    [523,659,784].forEach((f,i)=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.value=f;
      g.gain.setValueAtTime(0,t+i*.1);g.gain.linearRampToValueAtTime(.12,t+i*.1+.02);
      g.gain.exponentialRampToValueAtTime(.001,t+i*.1+.35);
      o.connect(g).connect(c.destination);o.start(t+i*.1);o.stop(t+i*.1+.4)})})}
  
  // Win - ascending melody
  win(){this._p(c=>{const t=c.currentTime;
    [523,587,659,784,880,1047].forEach((f,i)=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.value=f;
      g.gain.setValueAtTime(0,t+i*.12);g.gain.linearRampToValueAtTime(.1,t+i*.12+.02);
      g.gain.exponentialRampToValueAtTime(.001,t+i*.12+.25);
      o.connect(g).connect(c.destination);o.start(t+i*.12);o.stop(t+i*.12+.3)})})}
  
  click(){this._p(c=>{const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=600;g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.03);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.04)})}
  
  powerup(){this._p(c=>{const t=c.currentTime;
    [440,550,660].forEach((f,i)=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.value=f;
      g.gain.setValueAtTime(.08,t+i*.04);g.gain.exponentialRampToValueAtTime(.001,t+i*.04+.08);
      o.connect(g).connect(c.destination);o.start(t+i*.04);o.stop(t+i*.04+.1)})})}
  
  // Simple warm chord for goal celebration
  crowdRoar(){this._p(c=>{const t=c.currentTime;
    [131,165,196].forEach(f=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type="sine";o.frequency.value=f;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.2);
      g.gain.exponentialRampToValueAtTime(.001,t+1);
      o.connect(g).connect(c.destination);o.start(t);o.stop(t+1.1)})})}
  
  // Simple descending "ooh"
  crowdOoh(){this._p(c=>{const t=c.currentTime;
    const o=c.createOscillator(),g=c.createGain();
    o.type="sine";o.frequency.setValueAtTime(350,t);o.frequency.exponentialRampToValueAtTime(200,t+.3);
    g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);
    o.connect(g).connect(c.destination);o.start(t);o.stop(t+.4)})}
}
const sfx=new SFX();const vib=ms=>{try{navigator.vibrate?.(ms)}catch(e){}};

/* ═══════ PLAYER PREVIEW ═══════ */
function PlayerPreview({jersey,size=80}){const ref=useRef(null);useEffect(()=>{const cv=ref.current;if(!cv)return;cv.width=size*2;cv.height=size*2;const x=cv.getContext("2d"),s=size/52;x.clearRect(0,0,size*2,size*2);x.save();x.scale(s,s);const p=52,q=52;x.fillStyle="rgba(0,0,0,0.12)";x.beginPath();x.ellipse(p+1,q+28,14,4,0,0,Math.PI*2);x.fill();x.fillStyle="#1a1a1a";[-7,7].forEach(d=>{x.beginPath();x.arc(p+d,q+24,4,0,Math.PI*2);x.fill()});x.strokeStyle="#f0c8a0";x.lineWidth=5;x.lineCap="round";[-7,7].forEach(d=>{x.beginPath();x.moveTo(p+d*.7,q+14);x.lineTo(p+d,q+21);x.stroke()});x.fillStyle=jersey.primary;x.beginPath();x.ellipse(p,q+4,16,14,0,0,Math.PI*2);x.fill();x.strokeStyle=jersey.dark;x.lineWidth=1.2;x.stroke();x.fillStyle=jersey.shorts;x.beginPath();x.ellipse(p,q+14,12,5,0,0,Math.PI);x.fill();x.strokeStyle="#f0c8a0";x.lineWidth=4.5;x.lineCap="round";[[-15,2,-22,10],[15,2,22,10]].forEach(([a,b,cc,d])=>{x.beginPath();x.moveTo(p+a,q+b);x.lineTo(p+cc,q+d);x.stroke()});x.fillStyle=jersey.secondary;x.font="bold 11px 'Inter',sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText("10",p,q+3);x.fillStyle="#f5d0a9";x.beginPath();x.arc(p,q-14,10,0,Math.PI*2);x.fill();x.fillStyle=jersey.hair;x.beginPath();x.arc(p,q-17,10,Math.PI+.4,-.4);x.fill();x.fillStyle="#222";[-3.5,3.5].forEach(d=>{x.beginPath();x.arc(p+d,q-14,1.6,0,Math.PI*2);x.fill()});x.strokeStyle="#c47a5a";x.lineWidth=1.2;x.beginPath();x.arc(p,q-10,3.5,.15*Math.PI,.85*Math.PI);x.stroke();x.restore()},[jersey,size]);return <canvas ref={ref} style={{width:size,height:size}}/>}

/* ═══════ DRAW HELPERS ═══════ */
function drawField(x){for(let i=0;i<H;i+=40){x.fillStyle=i%80===0?"#2eaf44":"#26953c";x.fillRect(0,i,W,40)}x.strokeStyle="rgba(255,255,255,0.55)";x.lineWidth=2;x.strokeRect(12,12,W-24,H-24);x.beginPath();x.moveTo(12,H/2);x.lineTo(W-12,H/2);x.stroke();x.beginPath();x.arc(W/2,H/2,52,0,Math.PI*2);x.stroke();x.fillStyle="rgba(255,255,255,0.55)";x.beginPath();x.arc(W/2,H/2,4,0,Math.PI*2);x.fill();const pw=GW+60,ph=70,pl=(W-pw)/2;x.strokeRect(pl,12,pw,ph);x.strokeRect(pl,H-12-ph,pw,ph);const gw2=GW+20,gh=30,gl=(W-gw2)/2;x.strokeRect(gl,12,gw2,gh);x.strokeRect(gl,H-12-gh,gw2,gh);x.fillStyle="rgba(255,255,255,0.2)";x.fillRect(GL,0,GW,12);x.fillRect(GL,H-12,GW,12);x.fillStyle="#fff";x.fillRect(GL-3,0,5,14);x.fillRect(GR-2,0,5,14);x.fillRect(GL-3,H-14,5,14);x.fillRect(GR-2,H-14,5,14);x.strokeStyle="rgba(255,255,255,0.12)";x.lineWidth=1;for(let i=GL+10;i<GR;i+=12){x.beginPath();x.moveTo(i,0);x.lineTo(i,12);x.stroke();x.beginPath();x.moveTo(i,H-12);x.lineTo(i,H);x.stroke()}}
function drawP(x,px,py,j,n,sc,anim){
  const s=sc||1;
  const vx=anim?.vx||0,ph=anim?.phase||0;
  const speed=Math.sqrt(vx*vx+(anim?.vy||0)*(anim?.vy||0));
  const moving=speed>.5;
  const now=anim?.now||0;
  // Run bob + lean
  const bob=moving?Math.sin(ph*Math.PI*2)*1.3:0;
  const lean=moving?Math.max(-.1,Math.min(.1,vx*.04)):0;
  // Kick lunge: brief forward push toward ball
  let kox=0,koy=0,kSc=1;
  if(anim?.kickT){
    const e=now-anim.kickT;
    if(e<180&&e>=0){const tt=e/180,ez=Math.sin(tt*Math.PI);
      kox=(anim.kickDx||0)*7*ez;koy=(anim.kickDy||0)*7*ez;kSc=1+ez*.06;}
  }
  // Goal jump: two pulses (big then small)
  let jY=0,jSc=1,celeb=false;
  if(anim?.celebT){
    const e=now-anim.celebT;
    if(e<950&&e>=0){celeb=true;
      const tt=e/950;
      if(tt<.45){const u=tt/.45;jY=-Math.sin(u*Math.PI)*8;}
      else if(tt>.55){const u=(tt-.55)/.45;jY=-Math.sin(u*Math.PI)*4.5;}
      jSc=1+Math.abs(jY)/55;}
  }
  // Ground shadow shrinks when player is in the air (jump altitude)
  const shScale=Math.max(.5,1-Math.abs(jY)/22);
  x.fillStyle="rgba(0,0,0,0.14)";
  x.beginPath();x.ellipse(px+1,py+28,14*shScale*s,4*shScale*s,0,0,Math.PI*2);x.fill();
  // Body transform (bob + jump + kick offset, scale, lean)
  x.save();
  x.translate(px+kox,py+bob+jY+koy);
  x.rotate(lean);
  x.scale(s*kSc*jSc,s*kSc*jSc);
  x.translate(-px,-py);
  // Shoes
  x.fillStyle="#1a1a1a";[-7,7].forEach(d=>{x.beginPath();x.arc(px+d,py+24,4,0,Math.PI*2);x.fill()});
  // Legs
  x.strokeStyle="#f0c8a0";x.lineWidth=5;x.lineCap="round";
  [-7,7].forEach(d=>{x.beginPath();x.moveTo(px+d*.7,py+14);x.lineTo(px+d,py+21);x.stroke()});
  // Body
  x.fillStyle=j.primary;x.beginPath();x.ellipse(px,py+4,16,14,0,0,Math.PI*2);x.fill();
  x.strokeStyle=j.dark;x.lineWidth=1.2;x.stroke();
  // Shorts
  x.fillStyle=j.shorts;x.beginPath();x.ellipse(px,py+14,12,5,0,0,Math.PI);x.fill();
  // Arms — raised for celebration, default otherwise
  x.strokeStyle="#f0c8a0";x.lineWidth=4.5;x.lineCap="round";
  if(celeb){
    [[-15,2,-13,-14],[15,2,13,-14]].forEach(([a,b,cc,d])=>{x.beginPath();x.moveTo(px+a,py+b);x.lineTo(px+cc,py+d);x.stroke()});
  }else{
    [[-15,2,-22,10],[15,2,22,10]].forEach(([a,b,cc,d])=>{x.beginPath();x.moveTo(px+a,py+b);x.lineTo(px+cc,py+d);x.stroke()});
  }
  // Number
  x.fillStyle=j.secondary;x.font="bold 11px 'Inter',sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(n,px,py+3);
  // Head
  x.fillStyle="#f5d0a9";x.beginPath();x.arc(px,py-14,10,0,Math.PI*2);x.fill();
  // Hair
  x.fillStyle=j.hair;x.beginPath();x.arc(px,py-17,10,Math.PI+.4,-.4);x.fill();
  // Eyes — tracking the ball
  const eDx=anim?.eyeDx||0,eDy=anim?.eyeDy||0;
  x.fillStyle="#222";
  [-3.5,3.5].forEach(d=>{x.beginPath();x.arc(px+d+eDx,py-14+eDy,1.6,0,Math.PI*2);x.fill()});
  // Mouth — bigger smile when celebrating
  x.strokeStyle="#c47a5a";x.lineWidth=1.2;x.beginPath();
  if(celeb)x.arc(px,py-11,4,0,Math.PI);
  else x.arc(px,py-10,3.5,.15*Math.PI,.85*Math.PI);
  x.stroke();
  x.restore();
}
function drawB(x,bx,by,fire){
  const grad=x.createRadialGradient(bx-BR*.35,by-BR*.35,BR*.1,bx,by,BR);
  if(fire){
    grad.addColorStop(0,"#ffe680");
    grad.addColorStop(.5,"#ff7a1f");
    grad.addColorStop(1,"#a8200a");
  }else{
    grad.addColorStop(0,"#ffc879");
    grad.addColorStop(.5,"#ee6a17");
    grad.addColorStop(1,"#a83b06");
  }
  x.fillStyle=grad;
  x.beginPath();x.arc(bx,by,BR,0,Math.PI*2);x.fill();
  x.strokeStyle=fire?"#5a1500":"#5a1d04";
  x.lineWidth=1;
  x.beginPath();x.arc(bx,by,BR,0,Math.PI*2);x.stroke();
  if(fire){
    x.save();x.globalCompositeOperation="screen";
    const fg=x.createRadialGradient(bx,by,BR*.3,bx,by,BR*1.6);
    fg.addColorStop(0,"rgba(255,180,60,0.5)");
    fg.addColorStop(1,"rgba(255,80,0,0)");
    x.fillStyle=fg;
    x.beginPath();x.arc(bx,by,BR*1.6,0,Math.PI*2);x.fill();
    x.restore();
  }
}
function rr(x,a,b,cc,d,r){x.beginPath();x.moveTo(a+r,b);x.lineTo(a+cc-r,b);x.quadraticCurveTo(a+cc,b,a+cc,b+r);x.lineTo(a+cc,b+d-r);x.quadraticCurveTo(a+cc,b+d,a+cc-r,b+d);x.lineTo(a+r,b+d);x.quadraticCurveTo(a,b+d,a,b+d-r);x.lineTo(a,b+r);x.quadraticCurveTo(a,b,a+r,b);x.closePath()}
function drawPowerup(x,pu,now){const pulse=1+Math.sin(now*.004)*.15;const r=16*pulse;x.save();x.shadowColor=pu.type.color;x.shadowBlur=12;x.fillStyle=pu.type.color+"40";x.beginPath();x.arc(pu.x,pu.y,r,0,Math.PI*2);x.fill();x.shadowBlur=0;x.font=`${18*pulse}px sans-serif`;x.textAlign="center";x.textBaseline="middle";x.fillText(pu.type.emoji,pu.x,pu.y);x.restore()}

/* ═══════ MAIN ═══════ */
export default function FootballGame(){
  const cvRef=useRef(null),rafRef=useRef(null),tMap=useRef(new Map());
  const[scr,setScr]=useState("menu");
  const[showIntro,setShowIntro]=useState(true);
  const[lang,setLang]=useState("en");
  const[theme,setTheme]=useState("dark");
  const[mode,setMode]=useState(null);
  const[diff,setDiff]=useState("medium");
  const[maxGoals,setMaxGoals]=useState(5);
  const[j1,setJ1]=useState(null);const[j2,setJ2]=useState(null);
  const[sel,setSel]=useState(null);
  const[sc,setSc]=useState([0,0]);
  const[winner,setWinner]=useState(null);
  const[gm,setGm]=useState(null);
  const[sndOn,setSndOn]=useState(true);
  const[roomCode,setRoomCode]=useState("");const[roomIn,setRoomIn]=useState("");
  const[tRound,setTRound]=useState(0);const[tResult,setTResult]=useState(null);
  const[otPlayers,setOtPlayers]=useState(4);const[otScreen,setOtScreen]=useState(null);
  const[showPause,setShowPause]=useState(false);
  const[combo,setCombo]=useState({p1:0,p2:0});
  const[shake,setShake]=useState(0);
  const[puMsg,setPuMsg]=useState(null);
  const[tutStep,setTutStep]=useState(0);
  const[showTutorial,setShowTutorial]=useState(false);
  
  // Player name
  const[playerName,setPlayerName]=useState(()=>{try{return localStorage.getItem("bf_playerName")||""}catch(e){return ""}});
  useEffect(()=>{try{if(playerName)localStorage.setItem("bf_playerName",playerName)}catch(e){}},[playerName]);

  // Helpers for persisting tournament/league progress
  const saveProgress=(key,data)=>{try{localStorage.setItem(key,JSON.stringify(data))}catch(e){}};
  const readProgress=(key)=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v):null}catch(e){return null}};
  const clearProgress=(key)=>{try{localStorage.removeItem(key)}catch(e){}};

  // League state
  const[leagueDiv,setLeagueDiv]=useState(3); // 3=3rd league, 2=2nd, 1=1st
  const[leagueTable,setLeagueTable]=useState([]);
  const[leagueMatchday,setLeagueMatchday]=useState(0);
  const[leagueOpponent,setLeagueOpponent]=useState(null);
  const[leagueResult,setLeagueResult]=useState(null); // "promoted","relegated","stay","champion"

  // Persist tournament progress between sessions
  useEffect(()=>{
    if(mode==="tourney"&&tRound>0&&tRound<3&&j1)saveProgress("bf_tourney",{tRound,j1Id:j1.id});
  },[mode,tRound,j1]);
  // Persist league progress between sessions
  useEffect(()=>{
    if(mode==="league"&&leagueMatchday>0&&leagueMatchday<9&&j1&&leagueTable.length)
      saveProgress("bf_league",{leagueDiv,leagueTable,leagueMatchday,j1Id:j1.id});
  },[mode,leagueDiv,leagueTable,leagueMatchday,j1]);
  // Clear saved progress when tournament/league ends
  useEffect(()=>{if(scr==="tourneyResult")clearProgress("bf_tourney")},[scr]);
  useEffect(()=>{if(scr==="leagueResult")clearProgress("bf_league")},[scr]);

  const cc=TH[theme];
  const t=useCallback(k=>TX[lang]?.[k]||TX.en[k]||k,[lang]);
  const jn=useCallback(j=>JN[j.id]?.[lang]||JN[j.id]?.en,[lang]);
  
  // Initialize league table
  const initLeague=useCallback((div)=>{
    const diffForDiv=div===3?"easy":div===2?"medium":"hard";
    setDiff(diffForDiv);
    const teams=[];
    // Add player team
    teams.push({name:playerName||"Player",jersey:j1,isPlayer:true,pts:0,gf:0,ga:0,played:0});
    // Add 9 AI teams
    const usedNames=new Set();
    const usedJerseys=new Set([j1?.id]);
    for(let i=0;i<9;i++){
      let name;
      do{name=LEAGUE_AI_NAMES[Math.floor(Math.random()*LEAGUE_AI_NAMES.length)]}while(usedNames.has(name));
      usedNames.add(name);
      let jersey;
      do{jersey=JERSEYS[Math.floor(Math.random()*JERSEYS.length)]}while(usedJerseys.has(jersey.id));
      usedJerseys.add(jersey.id);
      teams.push({name,jersey,isPlayer:false,pts:Math.floor(Math.random()*3),gf:0,ga:0,played:0});
    }
    setLeagueTable(teams);
    setLeagueMatchday(0);
    setLeagueResult(null);
  },[playerName,j1]);
  
  // Get current league difficulty
  const curDiff=mode==="league"?(leagueDiv===3?"easy":leagueDiv===2?"medium":"hard"):mode==="tourney"?DIFF_ORDER[tRound]:diff;

  const gRef=useRef({ball:{x:W/2,y:H/2,vx:0,vy:0},p1:{x:W/2,y:H-100,lx:W/2,ly:H-100,phase:0,kickT:0,kickDx:0,kickDy:0,celebT:0},p2:{x:W/2,y:100,lx:W/2,ly:100,phase:0,kickT:0,kickDx:0,kickDy:0,celebT:0},
    p1T:null,p2T:null,sc:[0,0],paused:false,parts:[],ti:{p1:null,p2:null},
    trail:[],powerups:[],effects:{p1:{},p2:{}},lastPuSpawn:0,combo:{p1:0,p2:0},fireShot:false});

  const reset=useCallback(()=>{const g=gRef.current;g.ball={x:W/2,y:H/2,vx:(Math.random()-.5)*3,vy:(Math.random()>.5?1:-1)*4};g.p1={x:W/2,y:H-100,lx:W/2,ly:H-100,phase:0,kickT:0,kickDx:0,kickDy:0,celebT:0};g.p2={x:W/2,y:100,lx:W/2,ly:100,phase:0,kickT:0,kickDx:0,kickDy:0,celebT:0};g.p1T=null;g.p2T=null;g.paused=false;g.parts=[];g.ti={p1:null,p2:null};g.trail=[];g.powerups=[];g.effects={p1:{},p2:{}};g.fireShot=false},[]);
  const fullReset=useCallback(()=>{reset();gRef.current.sc=[0,0];gRef.current.combo={p1:0,p2:0};gRef.current.lastPuSpawn=0;setSc([0,0]);setCombo({p1:0,p2:0})},[reset]);
  const startG=useCallback(()=>{sfx.stopMenuMusic();if(sndOn){sfx.init();sfx.resume()}setWinner(null);setGm(null);setPuMsg(null);fullReset();setScr("play")},[fullReset,sndOn]);
  const stopAudio=useCallback(()=>{},[]);
  const s2g=useCallback((cx,cy)=>{const cv=cvRef.current;if(!cv)return{x:0,y:0};const r=cv.getBoundingClientRect();return{x:(cx-r.left)*(W/r.width),y:(cy-r.top)*(H/r.height)}},[]);
  const spawnP=useCallback((x,y,co,n)=>{const g=gRef.current;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*4;g.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:.02+Math.random()*.03,size:2+Math.random()*3,color:co})}},[]);

  // League match end handler
  const handleLeagueMatchEnd=useCallback((playerWon,playerGoals,opponentGoals)=>{
    setLeagueTable(prev=>{
      const newTable=[...prev];
      const playerTeam=newTable.find(t=>t.isPlayer);
      const oppTeam=newTable.find(t=>t.name===leagueOpponent?.name);
      if(playerTeam){
        playerTeam.played++;
        playerTeam.gf+=playerGoals;
        playerTeam.ga+=opponentGoals;
        if(playerWon)playerTeam.pts+=3;
        else if(playerGoals===opponentGoals)playerTeam.pts+=1;
      }
      if(oppTeam){
        oppTeam.played++;
        oppTeam.gf+=opponentGoals;
        oppTeam.ga+=playerGoals;
        if(!playerWon&&playerGoals!==opponentGoals)oppTeam.pts+=3;
        else if(playerGoals===opponentGoals)oppTeam.pts+=1;
      }
      // Simulate other matches
      newTable.forEach(team=>{
        if(!team.isPlayer&&team.name!==leagueOpponent?.name&&team.played<leagueMatchday+1){
          team.played++;
          const result=Math.random();
          if(result<0.4)team.pts+=3;
          else if(result<0.7)team.pts+=1;
          team.gf+=Math.floor(Math.random()*4);
          team.ga+=Math.floor(Math.random()*4);
        }
      });
      return newTable.sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    });
    setLeagueMatchday(prev=>prev+1);
  },[leagueOpponent,leagueMatchday]);

  const doGoal=useCallback(scorer=>{const g=gRef.current;g.paused=true;g.sc[scorer]++;const ns=[...g.sc];setSc(ns);
    // Combo
    const key=scorer===0?"p1":"p2",okey=scorer===0?"p2":"p1";g.combo[key]++;g.combo[okey]=0;setCombo({...g.combo});
    const j=scorer===0?j1:j2;setGm(g.combo[key]>=2?`⚽ ${t("goal")}! ${t("combo")} x${g.combo[key]} ${t("fire")}`:`⚽ ${t("goal")}!`);
    // Goal celebration jump on scorer
    (scorer===0?g.p1:g.p2).celebT=Date.now();
    if(sndOn){sfx.goal();sfx.crowdRoar();vib([50,30,80])}
    setShake(1);setTimeout(()=>setShake(0),500);
    spawnP(g.ball.x,g.ball.y,j?.primary||"#fff",35);
    if(ns[scorer]>=maxGoals){setTimeout(()=>{if(sndOn){sfx.win();vib([80,40,80,40,120])}stopAudio();setWinner(scorer);
      if(mode==="tourney"){if(scorer===0){if(tRound>=2){setTResult("win");setScr("tourneyResult")}else{setTResult(null);setScr("tourneyNext")}}else{setTResult("lose");setScr("tourneyResult")}}
      else if(mode==="league"){
        handleLeagueMatchEnd(scorer===0,ns[0],ns[1]);
        setScr("leagueTable");
      }
      else{setScr("over")}setGm(null)},1300)}
    else{setTimeout(()=>{setGm(null);reset()},1300)}
  },[reset,spawnP,j1,j2,t,sndOn,maxGoals,mode,tRound,stopAudio,handleLeagueMatchEnd]);

  // Track AI state for smooth movement
  const aiStateRef=useRef({velX:0,velY:0,stuckCounter:0,lastX:0,lastY:0,smoothTargetX:W/2,smoothTargetY:H/4});
  
  const aiUp=useCallback(()=>{const g=gRef.current,d=DIFF[curDiff]||DIFF.medium,{ball,p2}=g;
    const eff=g.effects.p2,frozen=eff.freeze&&Date.now()<eff.freeze;
    const spd=frozen?0.3:((eff.speed&&Date.now()<eff.speed)?1.5:1);
    const ai=aiStateRef.current;
    
    // Stuck detection - check if AI hasn't moved much
    const movedX=Math.abs(p2.x-ai.lastX);
    const movedY=Math.abs(p2.y-ai.lastY);
    if(movedX<0.5&&movedY<0.5){
      ai.stuckCounter++;
    }else{
      ai.stuckCounter=0;
    }
    ai.lastX=p2.x;
    ai.lastY=p2.y;
    
    // Corner detection
    const inLeftCorner=p2.x<PR+40&&p2.y<PR+40;
    const inRightCorner=p2.x>W-PR-40&&p2.y<PR+40;
    const isStuck=ai.stuckCounter>10;
    
    // Calculate ball distance
    const dxBall=ball.x-p2.x, dyBall=ball.y-p2.y;
    const distToBall=Math.sqrt(dxBall*dxBall+dyBall*dyBall);
    
    let targetX,targetY;
    let isDefending=false; // Track if AI is in calm defensive mode
    
    // ESCAPE MODE - stuck in corner
    if(inLeftCorner||inRightCorner||isStuck){
      targetX=W/2;
      targetY=H/4;
      ai.stuckCounter=0;
      const escDx=targetX-p2.x;
      const escDy=targetY-p2.y;
      const escDist=Math.sqrt(escDx*escDx+escDy*escDy);
      if(escDist>1){
        p2.x+=escDx/escDist*4*spd;
        p2.y+=escDy/escDist*4*spd;
      }
      ai.velX=0;ai.velY=0;
      ai.smoothTargetX=targetX;
      ai.smoothTargetY=targetY;
    }
    // Ball in AI zone - CHASE IT actively
    else if(ball.y<H/2+d.aggr){
      const predX=ball.x+ball.vx*d.pred;
      const predY=ball.y+ball.vy*d.pred*0.3;
      
      if(distToBall<PR+BR+80){
        targetX=ball.x;
        targetY=ball.y-PR-5;
      }else{
        targetX=predX;
        targetY=Math.max(PR+20,Math.min(predY,H/2-30));
      }
      
      targetX=Math.max(PR+5,Math.min(W-PR-5,targetX));
      targetY=Math.max(PR+5,Math.min(H/2-5,targetY));
      
      // Smooth the target to reduce jitter
      ai.smoothTargetX+=(targetX-ai.smoothTargetX)*0.3;
      ai.smoothTargetY+=(targetY-ai.smoothTargetY)*0.3;
      
      const dx=ai.smoothTargetX-p2.x;
      const dy=ai.smoothTargetY-p2.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      
      if(dist>5){
        const nx=dx/dist;
        const ny=dy/dist;
        const baseSpeed=2+d.lerp*30;
        const moveSpeed=Math.min(baseSpeed*spd,dist*0.12);
        ai.velX=ai.velX*0.8+nx*moveSpeed*0.2;
        ai.velY=ai.velY*0.8+ny*moveSpeed*0.2;
      }else{
        ai.velX*=0.6;
        ai.velY*=0.6;
      }
      
      p2.x+=ai.velX;
      p2.y+=ai.velY;
    }
    // Ball in player zone - CALM defensive position
    else{
      isDefending=true;
      // Fixed defensive position - only slowly track ball X
      targetX=W/2+(ball.x-W/2)*0.3; // Very gentle tracking
      targetY=H/2-80;
      
      targetX=Math.max(PR+30,Math.min(W-PR-30,targetX));
      targetY=Math.max(PR+30,Math.min(H/2-30,targetY));
      
      // Very smooth target following - almost no jitter
      ai.smoothTargetX+=(targetX-ai.smoothTargetX)*0.05;
      ai.smoothTargetY+=(targetY-ai.smoothTargetY)*0.05;
      
      const dx=ai.smoothTargetX-p2.x;
      const dy=ai.smoothTargetY-p2.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      
      // Large dead zone when defending - don't move for small differences
      if(dist>15){
        const nx=dx/dist;
        const ny=dy/dist;
        const moveSpeed=Math.min(1.5*spd,dist*0.05);
        ai.velX=ai.velX*0.9+nx*moveSpeed*0.1;
        ai.velY=ai.velY*0.9+ny*moveSpeed*0.1;
        p2.x+=ai.velX;
        p2.y+=ai.velY;
      }else{
        // In dead zone - just slow down, don't jitter
        ai.velX*=0.85;
        ai.velY*=0.85;
        // Only apply tiny remaining velocity if significant
        if(Math.abs(ai.velX)>0.1)p2.x+=ai.velX;
        if(Math.abs(ai.velY)>0.1)p2.y+=ai.velY;
      }
    }
    
    // Hard clamp to play area
    p2.x=Math.max(PR+2,Math.min(W-PR-2,p2.x));
    p2.y=Math.max(PR+2,Math.min(H/2-2,p2.y));
    
    // AI picks up powerups if nearby
    g.powerups.forEach(pu=>{
      if(pu.taken)return;
      const pdx=p2.x-pu.x,pdy=p2.y-pu.y;
      if(Math.sqrt(pdx*pdx+pdy*pdy)<35){
        pu.taken=true;
        g.effects.p2[pu.type.id]=Date.now()+pu.type.dur;
      }
    });
  },[curDiff]);

  /* Touch/Mouse */
  const onTS=useCallback(e=>{e.preventDefault();if(sndOn){sfx.init();sfx.resume()}for(const tc of e.changedTouches){const p=s2g(tc.clientX,tc.clientY);const z=p.y>H/2?"p1":"p2";tMap.current.set(tc.identifier,{...p,zone:z});if(z==="p1"){gRef.current.p1T=p;gRef.current.ti.p1=p}}},[s2g,sndOn]);
  const onTM=useCallback(e=>{e.preventDefault();for(const tc of e.changedTouches){const p=s2g(tc.clientX,tc.clientY);const o=tMap.current.get(tc.identifier);if(!o)continue;tMap.current.set(tc.identifier,{...p,zone:o.zone});if(o.zone==="p1"){gRef.current.p1T=p;gRef.current.ti.p1=p}}},[s2g]);
  const onTE=useCallback(e=>{e.preventDefault();for(const tc of e.changedTouches){const o=tMap.current.get(tc.identifier);tMap.current.delete(tc.identifier);if(!o)continue;if(o.zone==="p1"){gRef.current.p1T=null;gRef.current.ti.p1=null}}},[]);
  const onMD=useCallback(e=>{if(sndOn){sfx.init();sfx.resume()}const p=s2g(e.clientX,e.clientY);tMap.current.set("m",{...p,zone:"p1"});gRef.current.p1T=p;gRef.current.ti.p1=p},[s2g,sndOn]);
  const onMM=useCallback(e=>{const en=tMap.current.get("m");if(!en)return;const p=s2g(e.clientX,e.clientY);tMap.current.set("m",{...p,zone:"p1"});gRef.current.p1T=p;gRef.current.ti.p1=p},[s2g]);
  const onMU=useCallback(()=>{tMap.current.delete("m");gRef.current.p1T=null;gRef.current.ti.p1=null},[]);

  /* MENU MUSIC */
  useEffect(()=>{
    if(scr==="menu"||scr==="jersey1"||scr==="tourneyIntro"||scr==="online"){
      if(sndOn){sfx.init();sfx.resume();sfx.startMenuMusic()}
    }else{sfx.stopMenuMusic()}
  },[scr,sndOn]);

  // Auto-dismiss intro screen after 2.5 s
  useEffect(()=>{
    if(!showIntro)return;
    const t=setTimeout(()=>setShowIntro(false),2500);
    return()=>clearTimeout(t);
  },[showIntro]);
  // (Auto-route to playerName screen removed — name is now inline in menu)

  /* GAME LOOP */
  useEffect(()=>{if(scr!=="play"){if(rafRef.current)cancelAnimationFrame(rafRef.current);return}
    const cv=cvRef.current;if(!cv)return;cv.width=W;cv.height=H;const ctx=cv.getContext("2d");
    let lk=0;const jj1=j1||JERSEYS[1],jj2=j2||JERSEYS[0];
    function tick(now){const g=gRef.current;
      if(!g.paused){const{ball,p1,p2}=g;const now2=Date.now();
        const eff1=g.effects.p1,frozen1=eff1.freeze&&now2<eff1.freeze,spd1=frozen1?.3:((eff1.speed&&now2<eff1.speed)?1.6:1);
        const giant1=eff1.giant&&now2<eff1.giant,mag1=eff1.magnet&&now2<eff1.magnet;
        const giant2=g.effects.p2.giant&&now2<g.effects.p2.giant;
        const pr1=(giant1?PR*1.5:PR),pr2=(giant2?PR*1.5:PR);
        if(g.p1T){const lrp=PLR*spd1;p1.x+=(Math.max(pr1+5,Math.min(W-pr1-5,g.p1T.x))-p1.x)*lrp;p1.y+=(Math.max(H/2+pr1+5,Math.min(H-pr1-15,g.p1T.y))-p1.y)*lrp}
        aiUp();
        // Magnet
        if(mag1){const dx=p1.x-ball.x,dy=p1.y-ball.y,dist=Math.sqrt(dx*dx+dy*dy);if(dist>0&&dist<120){ball.vx+=dx/dist*.3;ball.vy+=dy/dist*.3}}
        ball.x+=ball.vx;ball.y+=ball.vy;ball.vx*=FRC;ball.vy*=FRC;
        // Trail
        const sp=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);if(sp>3)g.trail.push({x:ball.x,y:ball.y,life:1,color:g.fireShot?"#ff6600":"#fff"});
        g.trail=g.trail.filter(t=>{t.life-=.06;return t.life>0});
        // Walls
        if(ball.x-BR<0){ball.x=BR;ball.vx=Math.abs(ball.vx)*.8;if(sndOn)sfx.wall()}if(ball.x+BR>W){ball.x=W-BR;ball.vx=-Math.abs(ball.vx)*.8;if(sndOn)sfx.wall()}
        if(ball.y-BR<0){if(ball.x>GL+5&&ball.x<GR-5)doGoal(0);else{ball.y=BR;ball.vy=Math.abs(ball.vy)*.8;if(sndOn){sfx.wall();if(ball.x>GL-30&&ball.x<GR+30)sfx.crowdOoh()}}}
        if(ball.y+BR>H){if(ball.x>GL+5&&ball.x<GR-5)doGoal(1);else{ball.y=H-BR;ball.vy=-Math.abs(ball.vy)*.8;if(sndOn){sfx.wall();if(ball.x>GL-30&&ball.x<GR+30)sfx.crowdOoh()}}}
        // Player-ball collision
        [[p1,pr1,0,jj1],[p2,pr2,1,jj2]].forEach(([pl,pr,idx,jj])=>{const dx=ball.x-pl.x,dy=ball.y-pl.y,dist=Math.sqrt(dx*dx+dy*dy),md=pr+BR+4;if(dist<md&&dist>0){const nx=dx/dist,ny=dy/dist;ball.x=pl.x+nx*(md+1);ball.y=pl.y+ny*(md+1);
          // Clamp ball inside field after push
          if(ball.x<BR+2){ball.x=BR+2;ball.vx=Math.abs(ball.vx)}if(ball.x>W-BR-2){ball.x=W-BR-2;ball.vx=-Math.abs(ball.vx)}
          if(ball.y<BR+2){ball.y=BR+2;ball.vy=Math.abs(ball.vy)}if(ball.y>H-BR-2){ball.y=H-BR-2;ball.vy=-Math.abs(ball.vy)}
          let k=KICK;if(idx===0&&g.fireShot){k=KICK*1.8;g.fireShot=false}const sp2=Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy);ball.vx=nx*Math.max(k,sp2*1.1);ball.vy=ny*Math.max(k,sp2*1.1);pl.kickT=Date.now();pl.kickDx=nx;pl.kickDy=ny;if(now-lk>80&&sndOn){sfx.kick();vib(15);lk=now}spawnP(ball.x,ball.y,jj.primary,6)}});
        if(sp>18){ball.vx=(ball.vx/sp)*18;ball.vy=(ball.vy/sp)*18}
        // Power-up spawning
        if(now-g.lastPuSpawn>8000+Math.random()*4000&&g.powerups.filter(p=>!p.taken).length<2){
          const type=PU_TYPES[Math.floor(Math.random()*PU_TYPES.length)];
          g.powerups.push({x:40+Math.random()*(W-80),y:H*.25+Math.random()*(H*.5),type,taken:false,spawn:now});
          g.lastPuSpawn=now}
        g.powerups=g.powerups.filter(pu=>{if(pu.taken)return false;if(now-pu.spawn>12000)return false;
          // Player pickup
          const dx1=p1.x-pu.x,dy1=p1.y-pu.y;
          if(Math.sqrt(dx1*dx1+dy1*dy1)<30){pu.taken=true;
            if(pu.type.id==="fire"){g.fireShot=true}else{g.effects.p1[pu.type.id]=now2+pu.type.dur}
            if(sndOn)sfx.powerup();spawnP(pu.x,pu.y,pu.type.color,10);
            setPuMsg(pu.type.desc[lang]||pu.type.desc.en);setTimeout(()=>setPuMsg(null),1200);return false}
          return true});
      }
      // Particles
      g.parts=g.parts.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vx*=.95;p.vy*=.95;p.life-=p.decay;return p.life>0});
      // DRAW
      ctx.clearRect(0,0,W,H);drawField(ctx);
      // Ball trail
      g.trail.forEach(tr=>{ctx.globalAlpha=tr.life*.35;ctx.fillStyle=tr.color;ctx.beginPath();ctx.arc(tr.x,tr.y,BR*tr.life*.7,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
      // Power-ups
      g.powerups.filter(p=>!p.taken).forEach(pu=>drawPowerup(ctx,pu,now));
      
      // Control circle - draw BEFORE player so it's underneath
      const ti=g.ti;
      if(ti.p1){
        // Large semi-transparent control circle
        ctx.fillStyle=jj1.primary+"30";
        ctx.beginPath();ctx.arc(ti.p1.x,ti.p1.y,45,0,Math.PI*2);ctx.fill();
        // Inner ring
        ctx.strokeStyle=jj1.primary+"60";ctx.lineWidth=3;
        ctx.beginPath();ctx.arc(ti.p1.x,ti.p1.y,45,0,Math.PI*2);ctx.stroke();
        // Center dot
        ctx.fillStyle=jj1.primary+"80";
        ctx.beginPath();ctx.arc(ti.p1.x,ti.p1.y,8,0,Math.PI*2);ctx.fill();
      }
      
      // Depth sort
      const eff1=g.effects.p1,eff2=g.effects.p2,now2=Date.now();
      const sc1=PSC*(eff1.giant&&now2<eff1.giant?1.4:1),sc2=PSC*(eff2.giant&&now2<eff2.giant?1.4:1);
      // Compute per-player animation: bob, lean, eye tracking, kick lunge, goal jump
      const tNow=Date.now();
      function pAnim(pl){
        const dx=pl.x-(pl.lx??pl.x),dy=pl.y-(pl.ly??pl.y);
        pl.lx=pl.x;pl.ly=pl.y;
        const sp=Math.sqrt(dx*dx+dy*dy);
        if(sp>.5)pl.phase=(pl.phase+sp*.05)%1;
        // Eye offset toward ball (clamped)
        const edx=g.ball.x-pl.x,edy=g.ball.y-pl.y;
        const edist=Math.sqrt(edx*edx+edy*edy)||1;
        const eyeDx=Math.max(-1.6,Math.min(1.6,edx/edist*1.6));
        const eyeDy=Math.max(-1.2,Math.min(1.2,edy/edist*1.2));
        return{vx:dx,vy:dy,phase:pl.phase||0,kickT:pl.kickT||0,kickDx:pl.kickDx||0,kickDy:pl.kickDy||0,celebT:pl.celebT||0,eyeDx,eyeDy,now:tNow};
      }
      const a1=pAnim(g.p1),a2=pAnim(g.p2);
      [{type:"p2",y:g.p2.y},{type:"ball",y:g.ball.y},{type:"p1",y:g.p1.y}].sort((a,b)=>a.y-b.y).forEach(e=>{
        if(e.type==="p1"){
          if(eff1.freeze&&now2<eff1.freeze){ctx.globalAlpha=.5;ctx.fillStyle="#8ef33";ctx.beginPath();ctx.arc(g.p1.x,g.p1.y,PR*sc1+8,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
          drawP(ctx,g.p1.x,g.p1.y,jj1,"10",sc1,a1)}
        if(e.type==="p2"){
          if(eff2.freeze&&now2<eff2.freeze){ctx.globalAlpha=.5;ctx.fillStyle="#8ef33";ctx.beginPath();ctx.arc(g.p2.x,g.p2.y,PR*sc2+8,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
          drawP(ctx,g.p2.x,g.p2.y,jj2,"7",sc2,a2)}
        if(e.type==="ball")drawB(ctx,g.ball.x,g.ball.y,g.fireShot)});
      // Particles
      g.parts.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
      // HUD
      ctx.fillStyle="rgba(0,0,0,0.5)";rr(ctx,W/2-55,14,110,38,12);ctx.fill();ctx.font="bold 22px 'Inter',sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=jj1.primary;ctx.fillText(g.sc[0].toString(),W/2-22,34);ctx.fillStyle="#fff";ctx.fillText("–",W/2,33);ctx.fillStyle=jj2.primary;ctx.fillText(g.sc[1].toString(),W/2+22,34);
      // Combo badge
      const cb=g.combo;if(cb.p1>=2){ctx.fillStyle="#ffe06690";rr(ctx,W/2-36,56,72,20,10);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 11px 'Inter'";ctx.fillText(`🔥 x${cb.p1}`,W/2,66)}
      if(cb.p2>=2){ctx.fillStyle="#ff8e8e90";rr(ctx,W/2-36,56,72,20,10);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 11px 'Inter'";ctx.fillText(`🔥 x${cb.p2}`,W/2,66)}
      // Active effects icons
      const icons=[];if(eff1.speed&&now2<eff1.speed)icons.push("⚡");if(eff1.giant&&now2<eff1.giant)icons.push("🛡️");if(eff1.magnet&&now2<eff1.magnet)icons.push("🧲");if(g.fireShot)icons.push("🔥");
      if(icons.length){ctx.font="16px sans-serif";ctx.textAlign="left";icons.forEach((ic,i)=>{ctx.fillText(ic,10+i*22,H-20)})}
      rafRef.current=requestAnimationFrame(tick)}
    rafRef.current=requestAnimationFrame(tick);
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current)}
  },[scr,doGoal,aiUp,spawnP,j1,j2,sndOn,lang]);

  /* ═══════ STYLES ═══════ */
  const css=`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    @keyframes fadeInUp{from{opacity:0;transform:translateY(38px)}to{opacity:1;transform:none}}
    @keyframes fadeScale{0%{opacity:0;transform:scale(.7)}100%{opacity:1;transform:scale(1)}}
    @keyframes goalPop{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
    @keyframes bounce{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
    @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
    @keyframes pulse2{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes puPop{0%{transform:translate(-50%,-60%) scale(0);opacity:0}30%{transform:translate(-50%,-60%) scale(1.3);opacity:1}100%{transform:translate(-50%,-60%) scale(1);opacity:0}}
    .mItem{transition:transform .15s ease,box-shadow .2s ease,filter .2s ease}
    .mItem:active{transform:scale(.97)}
    .mItem:hover{filter:brightness(1.05)}
    .mGhost{transition:transform .15s ease,background .2s ease,border-color .2s ease}
    .mGhost:active{transform:scale(.95)}
    @keyframes primaryPulse{0%,100%{box-shadow:0 4px 20px rgba(34,211,238,.28)}50%{box-shadow:0 6px 32px rgba(34,211,238,.55)}}
    @keyframes orbA{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-32px) scale(1.12)}}
    @keyframes orbB{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-34px,28px) scale(.92)}}
    @keyframes orbC{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,28px) scale(1.05)}}
    @keyframes meshHue{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(40deg)}}
    @keyframes glowLine{0%,100%{opacity:.4;transform:scaleX(1)}50%{opacity:.85;transform:scaleX(1.04)}}
    .mItemPrimary{animation:primaryPulse 2.6s ease-in-out infinite}`;
  const ctn={width:"100vw",height:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:cc.bg,fontFamily:"'Inter',Arial,sans-serif",overflow:"auto",touchAction:"none",userSelect:"none",WebkitUserSelect:"none",WebkitTouchCallout:"none",position:"relative",color:cc.txt,transition:"background 0.33s,color 0.33s"};
  const panel={background:cc.card,borderRadius:"29px",boxShadow:theme==="dark"?"0 8px 40px rgba(0,0,0,0.5)":"0 8px 30px rgba(60,40,20,0.06)",width:"90%",maxWidth:"420px",padding:"25px 20px",display:"flex",flexDirection:"column",alignItems:"center",border:`1.8px solid ${cc.cardBorder}`,transition:"background 0.33s",backdropFilter:"blur(16px)"};
  const ubtn=(ex={})=>({fontFamily:"inherit",borderRadius:"100px",outline:"none",border:theme==="light"?`1.6px solid ${cc.cardBorder}`:"1.6px solid transparent",background:cc.btn,color:cc.btnTxt,padding:"9px 18px",cursor:"pointer",fontWeight:600,transition:"all 0.2s",WebkitTapHighlightColor:"transparent",boxShadow:theme==="light"?"0 1px 4px rgba(0,0,0,0.06)":"none",...ex});
  const gbtn=(ex={})=>({...ubtn(),background:cc.accent,color:theme==="dark"?"#0a0e17":"#3D2E22",border:"none",fontWeight:700,boxShadow:theme==="dark"?"0 2px 20px rgba(34,211,238,0.15)":"0 2px 12px rgba(180,140,100,0.15)",fontSize:"1.05em",letterSpacing:"1.3px",width:"94%",maxWidth:"320px",padding:"13px 0",marginTop:"14px",...ex});
  const optBtn=(active,ex={})=>({...ubtn({border:`1.6px solid ${cc.cardBorder}`,...ex}),...(active?{background:cc.accent,color:theme==="dark"?"#0a0e17":"#3D2E22",borderColor:theme==="dark"?"rgba(34,211,238,0.4)":cc.border}:{})});
  const titS={fontSize:"clamp(1.8em,7vw,2.2em)",fontWeight:700,background:cc.accent,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",letterSpacing:"2px",marginBottom:"7px",marginTop:"16px",textAlign:"center"};
  const titSm={...titS,fontSize:"clamp(1.2em,5vw,1.6em)",marginTop:"0"};
  const desc={textAlign:"center",color:cc.sub,fontSize:"clamp(0.85em,3vw,0.95em)",marginBottom:"18px",maxWidth:"90%",lineHeight:1.5};
  const cvs={maxWidth:"100vw",maxHeight:"100dvh",width:"auto",height:"100dvh",aspectRatio:`${W}/${H}`,display:scr==="play"?"block":"none",animation:shake?"shake .5s ease":undefined};

  /* ═══════ SHARED UI ═══════ */
  const ThemeBtn=()=>(<button onClick={()=>{sfx.click();setTheme(p=>p==="dark"?"light":"dark")}} style={{background:"none",border:"none",color:cc.txt,opacity:.88,cursor:"pointer",width:28,height:28,padding:0,display:"inline-flex",alignItems:"center",justifyContent:"center"}}><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 4a8 8 0 0 1 0 16V4z"/></svg></button>);
  const SndBtn=()=>(<button onClick={()=>{sfx.init();sfx.click();setSndOn(p=>!p)}} style={{background:"none",border:"none",color:cc.txt,opacity:.88,cursor:"pointer",width:28,height:28,padding:0,display:"inline-flex",alignItems:"center",justifyContent:"center"}}><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M8 10h2l3-2v8l-3-2H8z"/>{sndOn?<path d="M14.5 9.5a4 4 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>:<path d="M15 15L18 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}</svg></button>);
  const LangSel=()=>(<select value={lang} onChange={e=>{sfx.click();setLang(e.target.value)}} style={{...ubtn(),background:cc.accent,color:theme==="dark"?"#222":"#504030",fontWeight:700,fontSize:"0.9em",padding:"8px 14px",WebkitAppearance:"none",appearance:"none"}}>{LANGS.map(l=><option key={l} value={l}>{LC[l]} {LL[l]}</option>)}</select>);
  const TopBar=()=>(<div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"10px"}}><ThemeBtn/><LangSel/><SndBtn/></div>);
  const BackBtn=({to,fn})=>(<button onClick={()=>{sfx.click();if(fn)fn();setScr(to);setSel(null)}} style={ubtn({fontSize:"0.9em",marginBottom:"10px"})}>{t("back")}</button>);
  const Footer=()=>(<div style={{marginTop:"18px",fontSize:"0.85em",color:cc.sub,textAlign:"center"}}>{t("created")||"Created by"} <a href="https://www.banbosh.cz" target="_blank" rel="noopener noreferrer" style={{color:cc.acc,textDecoration:"none"}}>Banbosh Studio</a></div>);
  const Fade=({children})=>(<div style={{animation:"fadeInUp 1s cubic-bezier(.45,.77,.32,1.01) both",display:"flex",flexDirection:"column",alignItems:"center",width:"100%",padding:"20px"}}>{children}</div>);
  const Slot=({n})=>(<div style={{background:cc.inputBg,border:`1.5px solid ${cc.border}50`,borderRadius:10,padding:"6px 12px",textAlign:"center",minWidth:50}}><div style={{fontSize:16}}>👤</div><div style={{fontSize:"0.7em",color:cc.sub,fontWeight:700}}>{t("player")} {n}</div></div>);

  /* ═══════ SCREENS ═══════ */
  // Intro screen — full-screen branding image, auto-dismisses after 2.5 s or on tap
  if(showIntro){
    return(<div onClick={()=>setShowIntro(false)} style={{position:"fixed",inset:0,background:"#0a0e17",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:1000,animation:"introIn .35s ease",overflow:"hidden"}}>
      <style>{`@keyframes introIn{from{opacity:0}to{opacity:1}}`}</style>
      <img src="/intro.png" alt="Banbosh Football" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",userSelect:"none",pointerEvents:"none"}}/>
    </div>);
  }
  if(scr==="menu"){
    // Big colored emoji icons (works in both themes)
    const ICO={ai:"🤖",tourney:"🏆",league:"🏟️",online:"🌐",tut:"📖",legal:"📄"};
    // Per-button color palettes — gradient + glow for each main action
    const PAL={
      ai:{grad:"linear-gradient(135deg,#1d4ed8 0%,#3b82f6 50%,#60a5fa 100%)",glow:"rgba(59,130,246,.55)",border:"rgba(96,165,250,.6)"},
      tourney:{grad:"linear-gradient(135deg,#c2410c 0%,#f59e0b 50%,#fbbf24 100%)",glow:"rgba(245,158,11,.55)",border:"rgba(251,191,36,.6)"},
      league:{grad:"linear-gradient(135deg,#15803d 0%,#22c55e 50%,#4ade80 100%)",glow:"rgba(34,197,94,.55)",border:"rgba(74,222,128,.6)"},
      online:{grad:"linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#c084fc 100%)",glow:"rgba(168,85,247,.55)",border:"rgba(192,132,252,.6)"},
    };
    const bigBtn=(pal)=>({
      width:"100%",maxWidth:320,marginBottom:12,
      fontFamily:"inherit",
      border:`1.5px solid ${pal.border}`,
      background:pal.grad,
      color:"#fff",
      borderRadius:"100px",
      padding:"14px 22px",
      display:"flex",alignItems:"center",gap:14,
      fontSize:"1.05em",fontWeight:800,letterSpacing:".5px",
      cursor:"pointer",WebkitTapHighlightColor:"transparent",
      boxShadow:`0 6px 24px ${pal.glow},inset 0 1px 0 rgba(255,255,255,.35),inset 0 -2px 4px rgba(0,0,0,.18)`,
      textShadow:"0 1px 2px rgba(0,0,0,.35)",
    });
    const btnIcon={fontSize:"1.5em",lineHeight:1,filter:"drop-shadow(0 2px 4px rgba(0,0,0,.4))",flexShrink:0,width:32,textAlign:"center"};
    const btnLabel={flex:1,textAlign:"center"};
    const mGhost={
      fontFamily:"inherit",
      background:"transparent",
      border:`1.4px solid ${cc.cardBorder}`,
      color:cc.txt,opacity:.85,
      borderRadius:"100px",padding:"8px 16px",
      display:"inline-flex",alignItems:"center",gap:8,
      fontSize:"0.85em",fontWeight:600,
      cursor:"pointer",WebkitTapHighlightColor:"transparent",
    };
    const isDark=theme==="dark";
    return(<div style={{...ctn,position:"relative",overflow:"hidden"}}>
      <style>{css}</style>
      {/* INTRO image as the dominant background — full opacity, fills screen */}
      <div aria-hidden="true" style={{position:"absolute",inset:0,backgroundImage:"url(/intro.png)",backgroundSize:"cover",backgroundPosition:"center top",zIndex:0,pointerEvents:"none"}}/>
      {/* Bottom gradient overlay — keeps top of intro fully visible (title, characters, ball) and dims the bottom so menu reads cleanly */}
      <div aria-hidden="true" style={{position:"absolute",inset:0,background:isDark?"linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 38%,rgba(0,0,0,.55) 60%,rgba(0,0,0,.85) 100%)":"linear-gradient(180deg,rgba(253,246,240,0) 0%,rgba(253,246,240,0) 38%,rgba(253,246,240,.7) 60%,rgba(253,246,240,.92) 100%)",zIndex:0,pointerEvents:"none"}}/>
      {/* Menu content — TopBar at top, name+buttons in the bottom half */}
      <div style={{position:"relative",zIndex:1,width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",overflow:"auto",padding:"8px 0 12px"}}>
      <Fade><TopBar/></Fade>
      <div style={{flex:1}}/>
      <Fade>
      {(() => {
        const tourneyResume=readProgress("bf_tourney");
        const leagueResume=readProgress("bf_league");
        const Badge=({children,color})=>(<span style={{background:color||"rgba(255,255,255,.95)",color:"#000",fontSize:"0.65em",padding:"2px 8px",borderRadius:"10px",fontWeight:800,marginLeft:6,letterSpacing:".5px",textShadow:"none"}}>{children}</span>);
        return(<>
          {/* Big colored buttons — name screen ALWAYS shown when starting a fresh game */}
          <button className="mItem" onClick={()=>{sfx.click();setMode("ai");setSel(null);setScr("playerName")}} style={bigBtn(PAL.ai)}>
            <span style={btnIcon}>{ICO.ai}</span><span style={btnLabel}>{t("ai")}</span>
          </button>
          <button className="mItem" onClick={()=>{
            sfx.click();setMode("tourney");setSel(null);
            const sv=readProgress("bf_tourney");
            const j=sv?JERSEYS.find(x=>x.id===sv.j1Id):null;
            if(sv&&j&&playerName.trim()){setJ1(j);setTRound(sv.tRound);setTResult(null);setScr("tourneyNext")}
            else setScr("playerName");
          }} style={bigBtn(PAL.tourney)}>
            <span style={btnIcon}>{ICO.tourney}</span><span style={btnLabel}>{t("tourney")}{tourneyResume&&<Badge color="#fff">{(tourneyResume.tRound||0)+1}/3</Badge>}</span>
          </button>
          <button className="mItem" onClick={()=>{
            sfx.click();setMode("league");setSel(null);
            const sv=readProgress("bf_league");
            const j=sv?JERSEYS.find(x=>x.id===sv.j1Id):null;
            if(sv&&j&&playerName.trim()){setJ1(j);setLeagueDiv(sv.leagueDiv);setLeagueTable(sv.leagueTable);setLeagueMatchday(sv.leagueMatchday);setScr("leagueTable")}
            else{setLeagueDiv(3);setScr("playerName")}
          }} style={bigBtn(PAL.league)}>
            <span style={btnIcon}>{ICO.league}</span><span style={btnLabel}>{t("league")}{leagueResume&&<Badge color="#fff">{t(`league${leagueResume.leagueDiv}`).split(" ")[0]}</Badge>}</span>
          </button>
          <button className="mItem" onClick={()=>{sfx.click();setRoomCode("");setRoomIn("");setScr("online")}} style={bigBtn(PAL.online)}>
            <span style={btnIcon}>{ICO.online}</span><span style={btnLabel}>{t("online")}</span>
          </button>
          {/* Tutorial hint */}
          <div style={{maxWidth:320,width:"90%",marginTop:14,padding:"10px 14px",background:isDark?"rgba(255,255,255,.04)":"rgba(0,0,0,.03)",border:`1px solid ${cc.cardBorder}`,borderRadius:14,fontSize:"0.78em",lineHeight:1.45,color:cc.sub,textAlign:"center"}}>
            <span style={{display:"block"}}>{t("ctrl")}</span>
          </div>
          {/* Tutorial / Legal small ghost buttons */}
          <div style={{marginTop:12,display:"flex",gap:10,justifyContent:"center"}}>
            <button className="mGhost" onClick={()=>{sfx.click();setTutStep(0);setScr("tutorial")}} style={mGhost}><span>{ICO.tut}</span><span>{t("tutorial")}</span></button>
            <button className="mGhost" onClick={()=>{sfx.click();setScr("legal")}} style={mGhost}><span>{ICO.legal}</span><span>{t("legal")}</span></button>
          </div>
        </>);
      })()}
      <Footer/>
    </Fade>
    </div>
    </div>);
  }

  // Tutorial screen
  if(scr==="tutorial"){
    const steps=[
      {icon:"👆",text:t("tutStep1")},
      {icon:"⚽",text:t("tutStep2")},
      {icon:"✨",text:t("tutStep3")},
      {icon:"🏆",text:t("tutStep4")}
    ];
    return(<div style={ctn}><style>{css}</style><Fade><TopBar/><BackBtn to="menu"/>
      <div style={{fontSize:64,marginBottom:8}}>{steps[tutStep].icon}</div>
      <h2 style={titSm}>{t("tutorial")}</h2>
      <div style={{...panel,gap:16,minHeight:120}}>
        <p style={{fontSize:"1.1em",textAlign:"center",lineHeight:1.6,margin:0}}>{steps[tutStep].text}</p>
        <div style={{display:"flex",gap:6,justifyContent:"center"}}>
          {steps.map((_,i)=>(<div key={i} style={{width:10,height:10,borderRadius:"50%",background:i===tutStep?cc.acc:cc.border}}/>))}
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginTop:16}}>
        {tutStep<steps.length-1?<>
          <button onClick={()=>{sfx.click();setScr("menu")}} style={ubtn({fontSize:"0.9em"})}>{t("skip")}</button>
          <button onClick={()=>{sfx.click();setTutStep(s=>s+1)}} style={gbtn()}>{t("next")} →</button>
        </>:
          <button onClick={()=>{sfx.click();setScr("menu")}} style={gbtn()}>{t("gotIt")} ✓</button>
        }
      </div>
    </Fade></div>);
  }

  // Legal screen (Privacy Policy & Terms)
  if(scr==="legal"){
    return(<div style={ctn}><style>{css}</style><Fade><TopBar/><BackBtn to="menu"/>
      <div style={{fontSize:48,marginBottom:8}}>📜</div>
      <h2 style={titSm}>{t("legal")}</h2>
      <div style={{...panel,gap:20,textAlign:"left",maxWidth:400}}>
        <div>
          <h3 style={{margin:"0 0 8px",fontSize:"1em",color:cc.acc}}>🔒 {t("privacy")}</h3>
          <p style={{margin:0,fontSize:"0.85em",lineHeight:1.6,color:cc.sub}}>{t("privacyText")}</p>
        </div>
        <div>
          <h3 style={{margin:"0 0 8px",fontSize:"1em",color:cc.acc}}>📄 {t("terms")}</h3>
          <p style={{margin:0,fontSize:"0.85em",lineHeight:1.6,color:cc.sub}}>{t("termsText")}</p>
        </div>
      </div>
      <button onClick={()=>{sfx.click();setScr("menu")}} style={{...gbtn(),marginTop:16}}>{t("back")}</button>
    </Fade></div>);
  }

  // Player name screen - special container without touch blocking
  if(scr==="playerName"){
    return(<div style={{width:"100vw",height:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:cc.bg,fontFamily:"'Inter',Arial,sans-serif",overflow:"auto",position:"relative",color:cc.txt,transition:"background 0.33s,color 0.33s"}}><style>{css}</style><Fade><TopBar/><BackBtn to="menu"/>
    <div style={{fontSize:48,marginBottom:4}}>👤</div>
    <h2 style={titSm}>{t("enterName")}</h2>
    <div style={{...panel,gap:14}}>
      <input
        type="text"
        inputMode="text"
        value={playerName}
        onChange={e=>setPlayerName(e.target.value)}
        onFocus={e=>{try{setTimeout(()=>e.target.select(),0)}catch(err){}}}
        onKeyDown={e=>{if(e.key==="Enter"&&playerName.trim()){sfx.click();setSel(null);setScr(mode?"jersey1":"menu")}}}
        placeholder={t("playerName")}
        maxLength={15}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{width:"100%",background:cc.inputBg,border:`2px solid ${cc.accentSolid}`,borderRadius:100,padding:"16px 22px",color:cc.txt,fontSize:"1.2em",outline:"none",textAlign:"center",WebkitUserSelect:"text",userSelect:"text",fontFamily:"inherit",fontWeight:600}}/>
      {playerName.trim()&&<button onClick={()=>{setPlayerName("");try{localStorage.removeItem("bf_playerName")}catch(e){}}} style={{background:"transparent",border:"none",color:cc.sub,fontSize:"0.8em",cursor:"pointer",textDecoration:"underline",padding:4}}>clear</button>}
      <button onClick={()=>{
        if(playerName.trim()){sfx.click();setSel(null);setScr(mode?"jersey1":"menu")}
      }} disabled={!playerName.trim()} style={{...gbtn(),opacity:playerName.trim()?1:.5,cursor:playerName.trim()?"pointer":"not-allowed"}}>{t("confirm")} →</button>
    </div>
  </Fade></div>);
  }

  if(scr==="jersey1"){const ds=[{key:"easy",em:"⭐"},{key:"medium",em:"⭐⭐"},{key:"hard",em:"⭐⭐⭐"}];
    return(<div style={ctn}><style>{css}</style><Fade><TopBar/><BackBtn to="playerName"/>
    <h2 style={titSm}>{t("pickJersey")}</h2>
    <div style={{height:90,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
      {sel?<div style={{animation:"fadeScale .25s ease"}}><PlayerPreview jersey={sel} size={80}/></div>
        :<div style={{width:80,height:80,borderRadius:"50%",border:`2px dashed ${cc.border}40`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:cc.sub,fontSize:28}}>👤</span></div>}
    </div>
    <div style={{...panel,padding:"18px 16px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,width:"100%"}}>
        {JERSEYS.map(j=>(<button key={j.id} onClick={()=>{sfx.click();setSel(j)}}
          style={{background:sel?.id===j.id?`${j.primary}20`:"transparent",border:sel?.id===j.id?`2px solid ${j.primary}`:`2px solid ${cc.border}30`,
            borderRadius:16,padding:"8px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all 0.15s"}}>
          <PlayerPreview jersey={j} size={50}/><span style={{color:sel?.id===j.id?cc.txt:cc.sub,fontSize:10,fontWeight:600}}>{jn(j)}</span>
        </button>))}
      </div>
      {sel&&mode==="ai"&&<>
        <div style={{fontWeight:700,fontSize:"0.95em",marginTop:14,marginBottom:4}}>{t("pickDiff")}</div>
        <div style={{display:"flex",gap:8}}>{ds.map(d=>(<button key={d.key} onClick={()=>{sfx.click();setDiff(d.key)}} style={optBtn(diff===d.key)}>{d.em} {t(d.key)}</button>))}</div>
        <div style={{fontWeight:700,fontSize:"0.95em",marginTop:10,marginBottom:4}}>{t("goals")}</div>
        <div style={{display:"flex",gap:8}}>{[3,5,7].map(n=>(<button key={n} onClick={()=>{sfx.click();setMaxGoals(n)}} style={optBtn(maxGoals===n,{minWidth:52})}>{n}</button>))}</div>
      </>}
    </div>
    {sel&&<button onClick={()=>{sfx.click();setJ1(sel);const o=JERSEYS.filter(x=>x.id!==sel.id);setJ2(o[Math.floor(Math.random()*o.length)]);
      if(mode==="tourney"){setTRound(0);setTResult(null);setScr("tourneyIntro")}
      else if(mode==="league"){setScr("leagueIntro")}
      else{startG()}
    }} style={{...gbtn(),animation:"fadeInUp .25s ease"}}>{mode==="tourney"||mode==="league"?t("next"):t("start")} →</button>}
  </Fade></div>)}

  // League intro screen
  if(scr==="leagueIntro")return(<div style={ctn}><style>{css}</style><Fade><TopBar/><BackBtn to="jersey1" fn={()=>setSel(j1)}/>
    <div style={{fontSize:48,marginBottom:4}}>🏟️</div>
    <h2 style={titSm}>{t("leagueTitle")}</h2><p style={desc}>{t("leagueDesc")}</p>
    <div style={{...panel,gap:10}}>
      <div style={{fontWeight:700,fontSize:"0.95em",marginBottom:4}}>{t("goals")}</div>
      <div style={{display:"flex",gap:8}}>{[3,5,7].map(n=>(<button key={n} onClick={()=>{sfx.click();setMaxGoals(n)}} style={optBtn(maxGoals===n,{minWidth:52})}>{n}</button>))}</div>
      <div style={{display:"flex",gap:8,alignItems:"center",margin:"14px 0 4px",flexWrap:"wrap",justifyContent:"center"}}>
        {[3,2,1].map((d,i)=>(<div key={d} style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{background:d===3?"#8eff8e22":d===2?"#ffe06622":"#ff8e8e22",border:`1.5px solid ${d===3?"#8eff8e":d===2?"#ffe066":"#ff8e8e"}`,borderRadius:12,padding:"8px 14px",textAlign:"center",fontSize:"0.85em"}}>
            <div style={{fontWeight:700}}>{t(`league${d}`)}</div><div style={{fontSize:"0.8em",color:cc.sub}}>{"⭐".repeat(4-d)} {d===3?t("easy"):d===2?t("medium"):t("hard")}</div>
          </div>{i<2&&<span style={{color:cc.sub,fontSize:18}}>→</span>}
        </div>))}
      </div>
      <p style={{color:cc.sub,fontSize:"0.8em",textAlign:"center",margin:"8px 0"}}>Top 2 {t("promoted").toLowerCase()}, Bottom 2 {t("relegated").toLowerCase()}</p>
      <button onClick={()=>{setLeagueDiv(3);initLeague(3);setScr("leagueTable")}} style={gbtn()}>{t("leagueStart")}</button>
    </div>
  </Fade></div>);

  // League table screen
  if(scr==="leagueTable"){
    const sortedTable=[...leagueTable].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));
    const playerPos=sortedTable.findIndex(t=>t.isPlayer)+1;
    const seasonOver=leagueMatchday>=9;
    
    // Check for promotion/relegation
    const checkSeasonEnd=()=>{
      if(playerPos<=2&&leagueDiv>1){
        setLeagueResult("promoted");
        setScr("leagueResult");
      }else if(playerPos<=2&&leagueDiv===1){
        setLeagueResult("champion");
        setScr("leagueResult");
      }else if(playerPos>=9&&leagueDiv<3){
        setLeagueResult("relegated");
        setScr("leagueResult");
      }else{
        setLeagueResult("stay");
        setScr("leagueResult");
      }
    };
    
    // Get next opponent
    const getNextOpponent=()=>{
      const nonPlayerTeams=leagueTable.filter(t=>!t.isPlayer);
      return nonPlayerTeams[leagueMatchday%nonPlayerTeams.length];
    };
    
    return(<div style={ctn}><style>{css}</style><Fade><TopBar/>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{fontSize:24}}>🏟️</span>
        <h2 style={{...titSm,margin:0}}>{t(`league${leagueDiv}`)} - {t("matchday")} {leagueMatchday+1}/9</h2>
      </div>
      <div style={{...panel,padding:"12px 10px",maxHeight:"50vh",overflowY:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.85em"}}>
          <thead><tr style={{borderBottom:`1px solid ${cc.border}40`}}>
            <th style={{padding:"6px 4px",textAlign:"left"}}>{t("pos")}</th>
            <th style={{padding:"6px 4px",textAlign:"left"}}></th>
            <th style={{padding:"6px 4px",textAlign:"left",flex:1}}></th>
            <th style={{padding:"6px 4px",textAlign:"center"}}>P</th>
            <th style={{padding:"6px 4px",textAlign:"center"}}>GD</th>
            <th style={{padding:"6px 4px",textAlign:"center",fontWeight:700}}>{t("pts")}</th>
          </tr></thead>
          <tbody>{sortedTable.map((team,i)=>(
            <tr key={team.name} style={{background:team.isPlayer?`${cc.accent}20`:i<2?"#8eff8e15":i>=8?"#ff8e8e15":"transparent",borderBottom:`1px solid ${cc.border}20`}}>
              <td style={{padding:"8px 4px",fontWeight:700,color:i<2?"#8eff8e":i>=8?"#ff8e8e":cc.txt}}>{i+1}</td>
              <td style={{padding:"4px"}}><div style={{width:24,height:24,borderRadius:"50%",background:team.jersey.primary}}/></td>
              <td style={{padding:"8px 4px",fontWeight:team.isPlayer?700:400}}>{team.isPlayer?`⭐ ${team.name}`:team.name}</td>
              <td style={{padding:"8px 4px",textAlign:"center",color:cc.sub}}>{team.played}</td>
              <td style={{padding:"8px 4px",textAlign:"center",color:cc.sub}}>{team.gf-team.ga>0?"+":""}{team.gf-team.ga}</td>
              <td style={{padding:"8px 4px",textAlign:"center",fontWeight:700}}>{team.pts}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{display:"flex",gap:6,marginTop:8,fontSize:"0.75em"}}>
        <span style={{color:"#8eff8e"}}>● {t("promoted")}</span>
        <span style={{color:"#ff8e8e"}}>● {t("relegated")}</span>
      </div>
      {!seasonOver?<button onClick={()=>{
        const opp=getNextOpponent();
        setLeagueOpponent(opp);
        setJ2(opp.jersey);
        startG();
      }} style={gbtn()}>{t("matchday")} {leagueMatchday+1}: vs {getNextOpponent()?.name} →</button>
      :<button onClick={checkSeasonEnd} style={gbtn()}>{t("seasonEnd")} →</button>}
      <button onClick={()=>{sfx.click();setScr("menu")}} style={ubtn({marginTop:8})}>{t("back")}</button>
    </Fade></div>);
  }

  // League result screen
  if(scr==="leagueResult"){
    const isPromo=leagueResult==="promoted";
    const isChamp=leagueResult==="champion";
    const isReleg=leagueResult==="relegated";
    return(<div style={ctn}><style>{css}</style><Fade>
      <div style={{fontSize:56,marginBottom:6,animation:"bounce .6s ease"}}>{isChamp?"🏆":isPromo?"🎉":isReleg?"😢":"➡️"}</div>
      <h1 style={{...titS,fontSize:"clamp(1.3em,6vw,1.8em)",marginTop:8}}>
        {isChamp?t("leagueChamp"):isPromo?t("promoted"):isReleg?t("relegated"):t("stayLeague")}
      </h1>
      <p style={desc}>{t(`league${leagueDiv}`)} → {isPromo||isChamp?t(`league${Math.max(1,leagueDiv-1)}`):isReleg?t(`league${Math.min(3,leagueDiv+1)}`):t(`league${leagueDiv}`)}</p>
      {isChamp&&<PlayerPreview jersey={j1} size={80}/>}
      {!isChamp&&<button onClick={()=>{
        const newDiv=isPromo?leagueDiv-1:isReleg?leagueDiv+1:leagueDiv;
        setLeagueDiv(newDiv);
        initLeague(newDiv);
        setScr("leagueTable");
      }} style={gbtn()}>{t("nextSeason")} →</button>}
      <button onClick={()=>{sfx.click();setScr("menu")}} style={ubtn({marginTop:12})}>{t("back")}</button>
    </Fade></div>);
  }

  if(scr==="tourneyIntro")return(<div style={ctn}><style>{css}</style><Fade><TopBar/><BackBtn to="jersey1" fn={()=>setSel(j1)}/>
    <div style={{fontSize:48,marginBottom:4}}>🏆</div>
    <h2 style={titSm}>{t("tourneyTitle")}</h2><p style={desc}>{t("tourneyDesc")}</p>
    <div style={{...panel,gap:10}}>
      <div style={{fontWeight:700,fontSize:"0.95em",marginBottom:4}}>{t("goals")}</div>
      <div style={{display:"flex",gap:8}}>{[3,5,7].map(n=>(<button key={n} onClick={()=>{sfx.click();setMaxGoals(n)}} style={optBtn(maxGoals===n,{minWidth:52})}>{n}</button>))}</div>
      <div style={{display:"flex",gap:8,alignItems:"center",margin:"14px 0 4px",flexWrap:"wrap",justifyContent:"center"}}>
        {DIFF_ORDER.map((d,i)=>(<div key={d} style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{background:i===0?"#8eff8e22":i===1?"#ffe06622":"#ff8e8e22",border:`1.5px solid ${i===0?"#8eff8e":i===1?"#ffe066":"#ff8e8e"}`,borderRadius:12,padding:"8px 14px",textAlign:"center",fontSize:"0.85em"}}>
            <div style={{fontWeight:700}}>{t("round")} {i+1}</div><div style={{fontSize:"0.8em",color:cc.sub}}>{"⭐".repeat(i+1)} {t(d)}</div>
          </div>{i<2&&<span style={{color:cc.sub,fontSize:18}}>→</span>}
        </div>))}
      </div>
      <button onClick={()=>{setTRound(0);setTResult(null);startG()}} style={gbtn()}>{t("tourneyStart")}</button>
    </div>
  </Fade></div>);

  if(scr==="tourneyNext")return(<div style={ctn}><style>{css}</style><Fade><TopBar/>
    <div style={{fontSize:48,marginBottom:4}}>✅</div>
    <h2 style={titSm}>{t("round")} {tRound+1} {t("of")} 3 — {t(DIFF_ORDER[tRound])} ✓</h2>
    <p style={desc}>{t("round")} {tRound+2}: {"⭐".repeat(tRound+2)} {t(DIFF_ORDER[tRound+1])}</p>
    <div style={{display:"flex",alignItems:"center",gap:16,margin:"8px 0 16px"}}><PlayerPreview jersey={j1} size={50}/><span style={{color:cc.sub,fontWeight:700}}>{t("vs")}</span><PlayerPreview jersey={j2} size={50}/></div>
    <button onClick={()=>{setTRound(r=>r+1);const o=JERSEYS.filter(x=>x.id!==j1.id);setJ2(o[Math.floor(Math.random()*o.length)]);startG()}} style={gbtn()}>{t("nextRound")}</button>
  </Fade></div>);

  if(scr==="tourneyResult"){const won=tResult==="win";return(<div style={ctn}><style>{css}</style><Fade>
    <div style={{fontSize:56,marginBottom:6,animation:"bounce .6s ease"}}>{won?"🏆":"😢"}</div>
    <h1 style={{...titS,fontSize:"clamp(1.3em,6vw,1.8em)",marginTop:8}}>{won?t("champion"):t("tourneyLose")}</h1>
    <p style={desc}>{won?t("tourneyWin"):`${t("round")} ${tRound+1} ${t("of")} 3`}</p>
    {won&&<PlayerPreview jersey={j1} size={80}/>}
    <button onClick={()=>{sfx.click();setScr("menu")}} style={gbtn()}>{t("back")}</button>
  </Fade></div>)}

  if(scr==="online"){const genC=()=>{const ch="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let code="";for(let i=0;i<6;i++)code+=ch[Math.floor(Math.random()*ch.length)];setRoomCode(code)};
    if(otScreen==="lobby")return(<div style={ctn}><style>{css}</style><Fade><TopBar/><BackBtn to="online" fn={()=>setOtScreen(null)}/>
      <div style={{fontSize:42,marginBottom:4}}>🏆</div><h2 style={titSm}>{t("onlineTourney")}</h2>
      <div style={{...panel,gap:12}}>
        <div style={{background:cc.inputBg,borderRadius:16,padding:16,border:`1px dashed ${cc.border}40`,width:"100%",textAlign:"center"}}>
          <p style={{color:cc.sub,fontSize:"0.75em",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1}}>{t("roomCode")}</p>
          <p style={{color:cc.txt,fontSize:"1.8em",fontWeight:900,margin:"0 0 6px",letterSpacing:4,fontFamily:"monospace"}}>{roomCode||"------"}</p>
        </div>
        <div style={{fontWeight:700,fontSize:"0.95em",marginTop:4}}>{t("tSlots")}</div>
        <div style={{display:"flex",gap:8}}>{[2,3,4].map(n=>(<button key={n} onClick={()=>{sfx.click();setOtPlayers(n)}} style={optBtn(otPlayers===n,{minWidth:52})}>{n} {t("players")}</button>))}</div>
        <div style={{width:"100%",marginTop:10}}>
          {otPlayers===2&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}><Slot n="1"/><span style={{color:cc.sub,fontWeight:800}}>{t("vs")}</span><Slot n="2"/><span style={{color:cc.accentSolid,marginLeft:8}}>→ 🏆</span></div>}
          {otPlayers>=3&&<div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"center"}}>
            <div style={{fontSize:"0.8em",color:cc.sub,fontWeight:700}}>{t("semifinal")}</div>
            <div style={{display:"flex",alignItems:"center",gap:otPlayers===4?20:8,flexWrap:"wrap",justifyContent:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><Slot n="1"/><span style={{color:cc.sub,fontWeight:800}}>{t("vs")}</span><Slot n="2"/></div>
              {otPlayers===4&&<div style={{display:"flex",alignItems:"center",gap:6}}><Slot n="3"/><span style={{color:cc.sub,fontWeight:800}}>{t("vs")}</span><Slot n="4"/></div>}
            </div>
            <span style={{color:cc.sub}}>↓</span>
            <div style={{fontSize:"0.8em",color:cc.sub,fontWeight:700}}>{t("final")}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Slot n="?"/><span style={{color:cc.sub,fontWeight:800}}>{t("vs")}</span><Slot n={otPlayers===3?"3":"?"}/><span style={{color:cc.accentSolid,marginLeft:8}}>→ 🏆</span></div>
          </div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}><div style={{width:10,height:10,borderRadius:"50%",background:"#8eff8e",animation:"pulse2 1.5s infinite"}}/><span style={{color:cc.sub,fontSize:"0.85em"}}>1 {t("of")} {otPlayers} {t("joined")}</span></div>
        <div style={{background:`${cc.accentSolid}15`,border:`1px solid ${cc.accentSolid}30`,borderRadius:12,padding:"10px 16px",width:"100%",textAlign:"center",marginTop:4}}><span style={{fontWeight:700,fontSize:"0.85em",color:cc.accentSolid}}>🚧 {t("soon")}</span></div>
      </div>
    </Fade></div>);
    return(<div style={ctn}><style>{css}</style><Fade><TopBar/><BackBtn to="menu"/>
      <div style={{fontSize:42,marginBottom:4}}>🌐</div><h2 style={titSm}>{t("online")}</h2>
      <div style={{...panel,gap:12}}>
        <div style={{background:`${cc.accentSolid}15`,border:`1px solid ${cc.accentSolid}30`,borderRadius:12,padding:"10px 16px",width:"100%",textAlign:"center"}}><span style={{fontWeight:700,fontSize:"0.9em",color:cc.accentSolid}}>🚧 {t("soon")}</span></div>
        <button onClick={()=>{sfx.click();genC()}} style={gbtn({marginTop:4})}>{t("createRoom")}</button>
        {roomCode&&<div style={{background:cc.inputBg,borderRadius:16,padding:16,border:`1px dashed ${cc.border}40`,width:"100%",textAlign:"center"}}>
          <p style={{color:cc.sub,fontSize:"0.75em",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:1}}>{t("roomCode")}</p>
          <p style={{color:cc.txt,fontSize:"1.8em",fontWeight:900,margin:"0 0 6px",letterSpacing:4,fontFamily:"monospace"}}>{roomCode}</p>
          <p style={{color:cc.accentSolid,fontSize:"0.8em",margin:0}}>{t("waiting")}</p>
        </div>}
        <p style={{color:cc.sub,fontSize:"0.85em",margin:"2px 0"}}>{t("or")}</p>
        <div style={{display:"flex",gap:8,width:"100%"}}>
          <input value={roomIn} onChange={e=>setRoomIn(e.target.value.toUpperCase())} placeholder={t("enterCode")} maxLength={6}
            style={{flex:1,background:cc.inputBg,border:`1px solid ${cc.inputBorder}`,borderRadius:100,padding:"10px 14px",color:cc.txt,fontSize:"1em",fontFamily:"monospace",letterSpacing:2,outline:"none",textAlign:"center"}}/>
          <button onClick={()=>sfx.click()} style={ubtn({fontSize:"0.9em"})}>{t("joinRoom")}</button>
        </div>
        <div style={{width:"100%",borderTop:`1px solid ${cc.border}30`,paddingTop:14,marginTop:6}}>
          <div style={{fontWeight:700,fontSize:"0.95em",marginBottom:6,textAlign:"center"}}>{t("onlineTourney")}</div>
          <p style={{color:cc.sub,fontSize:"0.78em",textAlign:"center",margin:"0 0 10px",lineHeight:1.5}}>{t("onlineTourneyDesc")}</p>
          <div style={{display:"flex",gap:8,justifyContent:"center"}}>
            <button onClick={()=>{sfx.click();genC();setOtScreen("lobby")}} style={ubtn({fontSize:"0.85em"})}>{t("createTourney")}</button>
            <button onClick={()=>{sfx.click();setOtScreen("lobby")}} style={ubtn({fontSize:"0.85em"})}>{t("joinTourney")}</button>
          </div>
        </div>
        <p style={{color:cc.sub,fontSize:"0.72em",lineHeight:1.5,margin:"8px 0 0",textAlign:"center"}}>{t("onlineNote")}</p>
      </div>
    </Fade></div>)}

  if(scr==="over"){const isP1=winner===0;const wj=isP1?j1:j2;
    return(<div style={ctn}><style>{css}</style><Fade>
      <div style={{fontSize:56,marginBottom:6,animation:"bounce .6s ease"}}>🏆</div>
      <PlayerPreview jersey={wj} size={80}/>
      <h1 style={{...titS,fontSize:"clamp(1.3em,6vw,1.8em)",marginTop:8}}>{jn(wj)} {t("wins")}</h1>
      <div style={{display:"flex",alignItems:"center",gap:20,margin:"12px 0"}}>
        <div style={{textAlign:"center"}}><PlayerPreview jersey={j1} size={40}/><div style={{color:j1?.primary,fontSize:"1.6em",fontWeight:900}}>{sc[0]}</div></div>
        <span style={{color:cc.sub,fontSize:"1.1em",fontWeight:700}}>–</span>
        <div style={{textAlign:"center"}}><PlayerPreview jersey={j2} size={40}/><div style={{color:j2?.primary,fontSize:"1.6em",fontWeight:900}}>{sc[1]}</div></div>
      </div>
      <p style={{color:cc.sub,fontSize:"0.95em",margin:"0 0 20px"}}>{isP1?t("beatAI"):t("aiWin")}</p>
      <button onClick={()=>{sfx.click();startG()}} style={gbtn()}>{t("again")}</button>
      <button onClick={()=>{sfx.click();setScr("menu")}} style={ubtn({marginTop:12,fontSize:"0.95em"})}>{t("back")}</button><Footer/>
    </Fade></div>)}

  // PLAYING
  return(<div style={ctn}><style>{css}</style>
    <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>
      <canvas ref={cvRef} style={cvs} onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} onTouchCancel={onTE} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}/>
      <button onClick={()=>{sfx.click();gRef.current.paused=true;setShowPause(true)}}
        style={{position:"absolute",bottom:16,right:16,width:44,height:44,borderRadius:"50%",background:cc.card,border:`1.5px solid ${cc.cardBorder}`,
          color:cc.txt,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
          backdropFilter:"blur(8px)",boxShadow:"0 4px 16px #0005",zIndex:10}}>⏸</button>
    </div>
    {showPause&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,backdropFilter:"blur(4px)"}}>
      <div style={{...panel,maxWidth:320,animation:"fadeScale .2s ease",gap:10}}>
        <div style={{fontSize:36,marginBottom:4}}>⏸</div>
        <button onClick={()=>{sfx.click();gRef.current.paused=false;setShowPause(false)}} style={gbtn()}>▶ {t("start")}</button>
        <button onClick={()=>{sfx.click();setShowPause(false);fullReset();setGm(null)}} style={ubtn({width:"100%",marginTop:4})}>{t("restart")}</button>
        <button onClick={()=>{sfx.click();setShowPause(false);stopAudio();setScr("menu")}} style={ubtn({width:"100%",marginTop:4})}>{t("back")}</button>
      </div>
    </div>}
    {puMsg&&<div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-60%)",color:"#fff",fontSize:"1.4em",fontWeight:800,textShadow:"0 2px 8px #000",animation:"puPop .8s ease forwards",pointerEvents:"none",zIndex:15}}>{puMsg}</div>}
    {gm&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:cc.card,color:cc.txt,padding:"20px 36px",borderRadius:20,fontSize:"1.3em",fontWeight:800,textAlign:"center",pointerEvents:"none",animation:"goalPop .4s cubic-bezier(0.34,1.56,0.64,1)",backdropFilter:"blur(10px)",boxShadow:"0 8px 36px #0007",border:`1.8px solid ${cc.cardBorder}`,zIndex:15}}>{gm}</div>}
  </div>);
}
