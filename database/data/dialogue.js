// OwO text transformation, cute emojis, faces and action assets

const OWO_FACES = [
  '(・`ω´・)', ';;w;;', 'owo', 'OwO', 'UwU', '>w<', '^w^', '(˘ω˘)',
  '(´・ω・`)', 'σωσ', 'x3', ' rawr x3', '(◕‿◕✿)', '(✿◠‿◠)', '(ﾉ´ヮ`)ﾉ*: ･ﾟ'
];

function getRandomFace() {
  return OWO_FACES[Math.floor(Math.random() * OWO_FACES.length)];
}

function owoify(text) {
  if (!text) return 'OwO? What\'s this?';

  let result = text
    .replace(/[lr]/g, 'w')
    .replace(/[LR]/g, 'W')
    .replace(/ove/g, 'uv')
    .replace(/OVE/g, 'UV')
    .replace(/n([aeiou])/gi, 'ny$1')
    .replace(/N([aeiou])/gi, 'Ny$1')
    .replace(/!+/g, `! ${getRandomFace()} `)
    .replace(/\?+/g, `? owo? `);

  // Add random cute suffix occasionally
  const suffix = ` ~ ${getRandomFace()}`;
  return result + suffix;
}

// All GIFs use Giphy CDN which reliably serves worldwide
const ACTION_GIFS = {
  hug: [
    'https://media.giphy.com/media/u9BxQbM5bxvwA/giphy.gif',
    'https://media.giphy.com/media/l2QDM9Jnim1YVsfXa/giphy.gif',
    'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
    'https://media.giphy.com/media/3bqtLMeiO2jRm/giphy.gif'
  ],
  kiss: [
    'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
    'https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif',
    'https://media.giphy.com/media/jR22gdcZT28Tu/giphy.gif'
  ],
  pat: [
    'https://media.giphy.com/media/ye7OTDaJ5UMddUj5yz/giphy.gif',
    'https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif',
    'https://media.giphy.com/media/109ltuoSQW21OW/giphy.gif',
    'https://media.giphy.com/media/4HP0ddZnNVvKU/giphy.gif'
  ],
  pats: [
    'https://media.giphy.com/media/ye7OTDaJ5UMddUj5yz/giphy.gif',
    'https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif'
  ],
  slap: [
    'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
    'https://media.giphy.com/media/jLeyZWgtwWP2U/giphy.gif',
    'https://media.giphy.com/media/Zau0yrl15jddK/giphy.gif'
  ],
  bite: [
    'https://media.giphy.com/media/pM2tk9zH5e0x2/giphy.gif',
    'https://media.giphy.com/media/129NVCr1UfsGTS/giphy.gif'
  ],
  cuddle: [
    'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    'https://media.giphy.com/media/xT39CXg70nNS0MFNLy/giphy.gif',
    'https://media.giphy.com/media/3bqtLMeiO2jRm/giphy.gif'
  ],
  poke: [
    'https://media.giphy.com/media/Lq0h93752f6J9tijrh/giphy.gif',
    'https://media.giphy.com/media/i8tV2kJB8Gig8/giphy.gif'
  ],
  punch: [
    'https://media.giphy.com/media/arbHBDAUw95yU/giphy.gif',
    'https://media.giphy.com/media/10Am8idu3qBYRy/giphy.gif',
    'https://media.giphy.com/media/xT0BKiwgIPGShJNi0g/giphy.gif',
    'https://media.giphy.com/media/AlsIdbROVJ2Lu/giphy.gif'
  ],
  dambi: [
    'https://media.giphy.com/media/arbHBDAUw95yU/giphy.gif',
    'https://media.giphy.com/media/AlsIdbROVJ2Lu/giphy.gif'
  ],
  sex: [
    'https://media.giphy.com/media/OpfkuToK5NLig/giphy.gif',
    'https://media.giphy.com/media/13eeJ2vmb29psI/giphy.gif',
    'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif'
  ],
  dogstyle: [
    'https://media.giphy.com/media/OpfkuToK5NLig/giphy.gif',
    'https://media.giphy.com/media/13eeJ2vmb29psI/giphy.gif',
    'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif'
  ],
  doggystyle: [
    'https://media.giphy.com/media/OpfkuToK5NLig/giphy.gif',
    'https://media.giphy.com/media/13eeJ2vmb29psI/giphy.gif',
    'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif'
  ],
  lewd: [
    'https://media.giphy.com/media/OpfkuToK5NLig/giphy.gif',
    'https://media.giphy.com/media/13eeJ2vmb29psI/giphy.gif'
  ],
  blush: [
    'https://media.giphy.com/media/kaq6GnxDlJaBq/giphy.gif',
    'https://media.giphy.com/media/bQC7ZMBl0oI36/giphy.gif'
  ],
  cry: [
    'https://media.giphy.com/media/XpgOZHuDfI09O/giphy.gif',
    'https://media.giphy.com/media/ROF8OQvDmxytW/giphy.gif',
    'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif'
  ],
  dance: [
    'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif',
    'https://media.giphy.com/media/j3iGKfXRKlBBe/giphy.gif'
  ],
  smile: [
    'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif',
    'https://media.giphy.com/media/xUPGcMzfkOPQB3IQbK/giphy.gif'
  ],
  lick: [
    'https://media.giphy.com/media/129NVCr1UfsGTS/giphy.gif',
    'https://media.giphy.com/media/jR22gdcZT28Tu/giphy.gif'
  ],
  nom: [
    'https://media.giphy.com/media/pM2tk9zH5e0x2/giphy.gif',
    'https://media.giphy.com/media/129NVCr1UfsGTS/giphy.gif'
  ],
  stare: [
    'https://media.giphy.com/media/3o7aCSX4nN1W2Nss80/giphy.gif',
    'https://media.giphy.com/media/Lq0h93752f6J9tijrh/giphy.gif'
  ],
  highfive: [
    'https://media.giphy.com/media/109ltuoSQW21OW/giphy.gif',
    'https://media.giphy.com/media/u9BxQbM5bxvwA/giphy.gif',
    'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif'
  ],
  wave: [
    'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif',
    'https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif'
  ],
  greet: [
    'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif',
    'https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif'
  ],
  handholding: [
    'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif'
  ],
  hold: [
    'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif'
  ],
  tickle: [
    'https://media.giphy.com/media/i8tV2kJB8Gig8/giphy.gif',
    'https://media.giphy.com/media/Lq0h93752f6J9tijrh/giphy.gif'
  ],
  kill: [
    'https://media.giphy.com/media/arbHBDAUw95yU/giphy.gif',
    'https://media.giphy.com/media/Zau0yrl15jddK/giphy.gif'
  ],
  boop: [
    'https://media.giphy.com/media/Lq0h93752f6J9tijrh/giphy.gif',
    'https://media.giphy.com/media/i8tV2kJB8Gig8/giphy.gif'
  ],
  snuggle: [
    'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    'https://media.giphy.com/media/xT39CXg70nNS0MFNLy/giphy.gif'
  ],
  bully: [
    'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
    'https://media.giphy.com/media/jLeyZWgtwWP2U/giphy.gif'
  ],
  pout: [
    'https://media.giphy.com/media/XpgOZHuDfI09O/giphy.gif',
    'https://media.giphy.com/media/bQC7ZMBl0oI36/giphy.gif'
  ],
  shrug: [
    'https://media.giphy.com/media/3o7aCSX4nN1W2Nss80/giphy.gif'
  ],
  sleepy: [
    'https://media.giphy.com/media/XpgOZHuDfI09O/giphy.gif'
  ],
  smug: [
    'https://media.giphy.com/media/xUPGcMzfkOPQB3IQbK/giphy.gif'
  ],
  thumbsup: [
    'https://media.giphy.com/media/109ltuoSQW21OW/giphy.gif'
  ],
  thumbs: [
    'https://media.giphy.com/media/109ltuoSQW21OW/giphy.gif'
  ],
  wag: [
    'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif'
  ],
  thinking: [
    'https://media.giphy.com/media/3o7aCSX4nN1W2Nss80/giphy.gif'
  ],
  thonking: [
    'https://media.giphy.com/media/3o7aCSX4nN1W2Nss80/giphy.gif'
  ],
  triggered: [
    'https://media.giphy.com/media/Zau0yrl15jddK/giphy.gif',
    'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif'
  ],
  teehee: [
    'https://media.giphy.com/media/13eeJ2vmb29psI/giphy.gif'
  ],
  deredere: [
    'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif'
  ],
  scoff: [
    'https://media.giphy.com/media/3o7aCSX4nN1W2Nss80/giphy.gif'
  ],
  happy: [
    'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif'
  ],
  grin: [
    'https://media.giphy.com/media/xUPGcMzfkOPQB3IQbK/giphy.gif'
  ],
  headpat: [
    'https://media.giphy.com/media/ye7OTDaJ5UMddUj5yz/giphy.gif',
    'https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif',
    'https://media.giphy.com/media/4HP0ddZnNVvKU/giphy.gif',
    'https://media.giphy.com/media/109ltuoSQW21OW/giphy.gif'
  ],
  spongebobchicken: [
    'https://media.giphy.com/media/l0HlvB2GAAMgqfNkY/giphy.gif',
    'https://media.giphy.com/media/QUXYcgCwvCm4cKcrI3/giphy.gif'
  ],
  zombie: [
    'https://media.giphy.com/media/RKMm7X3HGKZMuoZlMF/giphy.gif',
    'https://media.giphy.com/media/l41lPPSE5x9nqnQLC/giphy.gif'
  ],
  bonk: [
    'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
    'https://media.giphy.com/media/jLeyZWgtwWP2U/giphy.gif'
  ],
  yeet: [
    'https://media.giphy.com/media/Zau0yrl15jddK/giphy.gif',
    'https://media.giphy.com/media/arbHBDAUw95yU/giphy.gif'
  ],
  facepalm: [
    'https://media.giphy.com/media/3o7aCSX4nN1W2Nss80/giphy.gif',
    'https://media.giphy.com/media/XpgOZHuDfI09O/giphy.gif'
  ],
  dab: [
    'https://media.giphy.com/media/j3iGKfXRKlBBe/giphy.gif',
    'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif'
  ],
  nuzzle: [
    'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    'https://media.giphy.com/media/xT39CXg70nNS0MFNLy/giphy.gif'
  ],
  glomp: [
    'https://media.giphy.com/media/u9BxQbM5bxvwA/giphy.gif',
    'https://media.giphy.com/media/3bqtLMeiO2jRm/giphy.gif'
  ],
  tackle: [
    'https://media.giphy.com/media/arbHBDAUw95yU/giphy.gif',
    'https://media.giphy.com/media/10Am8idu3qBYRy/giphy.gif'
  ],
  chase: [
    'https://media.giphy.com/media/j3iGKfXRKlBBe/giphy.gif',
    'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif'
  ],
  pounce: [
    'https://media.giphy.com/media/Lq0h93752f6J9tijrh/giphy.gif',
    'https://media.giphy.com/media/i8tV2kJB8Gig8/giphy.gif'
  ],
  beg: [
    'https://media.giphy.com/media/XpgOZHuDfI09O/giphy.gif',
    'https://media.giphy.com/media/bQC7ZMBl0oI36/giphy.gif'
  ],
  whine: [
    'https://media.giphy.com/media/ROF8OQvDmxytW/giphy.gif',
    'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif'
  ],
  growl: [
    'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
    'https://media.giphy.com/media/Zau0yrl15jddK/giphy.gif'
  ]
};

function getActionGif(action) {
  const list = ACTION_GIFS[action];
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

module.exports = {
  OWO_FACES,
  getRandomFace,
  owoify,
  ACTION_GIFS,
  getActionGif
};
