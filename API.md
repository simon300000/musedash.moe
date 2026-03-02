# Muse Dash Rank API Documentation

Base URL: `https://api.musedash.moe`

## Endpoints

### GET /albums

Returns music album metadata with multi-language support.

```bash
curl https://api.musedash.moe/albums
```

**Response:**
```json
{
  "ALBUM1": {
    "title": "Default Music",
    "json": "ALBUM1",
    "ChineseS": {"title": "基础包"},
    "ChineseT": {"title": "基礎包"},
    "English": {"title": "Default Music"},
    "Japanese": {"title": "デフォルト曲"},
    "Korean": {"title": "기본 패키지"},
    "tag": "Default",
    "music": {
      "0-48": {
        "uid": "0-48",
        "name": "Magical Wonderland (More colorful mix)",
        "author": "3R2",
        "cover": "magical_wonderland_cover",
        "bpm": "160",
        "levelDesigner": ["Howard_Y"],
        "difficulty": ["1","3","0","0","0"],
        "ChineseS": {"name": "Magical Wonderland (More colorful mix)", "author": "3R2"},
        "ChineseT": {"name": "Magical Wonderland (More colorful mix)", "author": "3R2"},
        "English": {"name": "Magical Wonderland (More colorful mix)", "author": "3R2"},
        "Japanese": {"name": "Magical Wonderland (More colorful mix)", "author": "3R2"},
        "Korean": {"name": "Magical Wonderland (More colorful mix)", "author": "3R2"}
      }
      ...
    }
  }
  ...
}
```

---

### GET /tag

Returns music tags/categories with localized display names.

```bash
curl https://api.musedash.moe/tag
```

**Response:**
```json
[
  {
    "name": "New",
    "displayName": {
      "ChineseS": "New",
      "ChineseT": "New",
      "English": "New",
      "Japanese": "New",
      "Korean": "New"
    },
    "musicList": [
      {"json": "ALBUM1", "musics": ["0-60","0-59"]},
      ...
    ]
  },
  {
    "name": "Default",
    "displayName": {
      "ChineseS": "基础包",
      "ChineseT": "基礎包",
      "English": "Default Music",
      "Japanese": "デフォルト曲",
      "Korean": "기본 패키지"
    },
    "musicList": [
      {"json": "ALBUM1"},
      {"json": "ALBUM22"},
      {"json": "ALBUM7"}
    ]
  }
  ...
]
```

---

### GET /rank/:uid/:difficulty/:platform

Returns player rankings for a specific song and difficulty.

**Parameters:**
- `uid` - Music UID (e.g., `1-1`)
- `difficulty` - Difficulty index: `0`, `1`, `2`, `3`, `4`
- `platform` - Platform: `mobile`, `pc`, or `all`

```bash
curl https://api.musedash.moe/rank/1-1/1/all
```

**Response:**
```json
[
  [100,163648,0,"BUCKY！","2dc6abd2c4d411e892380242ac11002b","mobile","7","6"],
  [100,163648,1,"夜行芽依。","00a8d336d41111e896ba0242ac11003f","mobile","7","6"],
  [100,163648,2,"白黒砂糖","c9800b181bdc11e9a8ee0242ac11000b","mobile","7","6"],
  ...
]
```

**Array format (for all platforms):** `[acc, score, lastRank, nickname, user_id, platform, character_uid, elfin_uid]`

**Array format (for specific platform):** `[acc, score, lastRank, nickname, user_id, undefined, character_uid, elfin_uid]`

---

### GET /rank/:uid/:difficulty/:platform/:id

Returns raw ranking data for a specific player on a song.

**Parameters:**
- `uid` - Music UID
- `difficulty` - Difficulty level: `0`, `1`, `2`, `3`, `4`
- `platform` - Platform: `mobile` or `pc`
- `id` - Player ID

```bash
curl https://api.musedash.moe/rank/13-5/2/mobile/6ea4f986ffd211e8aa980242ac110011
```

**Response:**
```json
{
  "play": {
    "object_id": "5d05b96f42cda6442b248774",
    "created_at": "2019-06-16T03:37:19.616Z",
    "updated_at": "2019-09-06T10:50:11.023Z",
    "user_id": "6ea4f986ffd211e8aa980242ac110011",
    "bms_id": 853251,
    "character_uid": "3",
    "elfin_uid": "6",
    "hp": 200,
    "music_uid": "",
    "music_difficulty": 0,
    "acc": 95.47999572753906,
    "miss": 0,
    "judge": "ss",
    "combo": 471,
    "score": 290510,
    "visible": true,
    "bms_version": "",
    "music_map_start_delay": 0,
    "is_check": false,
    "lb_version": "",
    "game_version": ""
  },
  "user": {
    "object_id": "5c13fda544d904005f7c64d4",
    "created_at": "2018-12-14T18:59:49.941Z",
    "updated_at": "2021-10-02T06:22:18.013Z",
    "nickname": "SiMOOOOOON",
    "user_id": "6ea4f986ffd211e8aa980242ac110011"
  },
  "now": 1772425619043
}
```

---

### GET /rankUpdateTime/:uid/:difficulty/:platform

Returns the last update timestamp for a song's rankings.

```bash
curl https://api.musedash.moe/rankUpdateTime/1-1/1/all
```

**Response:**
```
1772397939717
```

---

### GET /diffDiffMusic/:uid/:difficulty

Returns difficulty ratings for a specific song and difficulty.

```bash
curl https://api.musedash.moe/diffDiffMusic/1-1/1
```

**Response:**
```json
{
  "relative": 6.958533117029823,
  "absolute": -43.62812794476883
}
```

---

### GET /player/:id

Returns player profile with play data.

```bash
curl https://api.musedash.moe/player/6ea4f986ffd211e8aa980242ac110011
```

**Response:**
```json
{
  "lastUpdate": 1772408586649,
  "rl": 4.168161927471734,
  "diffHistoryNumber": 621,
  "plays": [
    {"score":261705,"acc":93.94999694824219,"i":1946,"platform":"mobile","history":{"lastRank":1946},"difficulty":2,"uid":"48-13","sum":3946,"character_uid":"11","elfin_uid":"7"},
    {"score":302027,"acc":94.16999816894531,"i":1921,"platform":"mobile","history":{"lastRank":1921},"difficulty":2,"uid":"14-4","sum":3921,"character_uid":"11","elfin_uid":"7"},
    {"score":194166,"acc":97.30999755859375,"i":661,"platform":"mobile","history":{"lastRank":661},"difficulty":1,"uid":"13-5","sum":1846,"character_uid":"7","elfin_uid":"6"},
    {"score":290510,"acc":95.47999572753906,"i":1824,"platform":"mobile","history":{"lastRank":1824},"difficulty":2,"uid":"13-5","sum":3824,"character_uid":"3","elfin_uid":"6"}
  ],
  "user": {
    "object_id": "5c13fda544d904005f7c64d4",
    "created_at": "2018-12-14T18:59:49.941Z",
    "updated_at": "2021-10-02T06:22:18.013Z",
    "user_id": "6ea4f986ffd211e8aa980242ac110011",
    "nickname": "SiMOOOOOON"
  },
  "key": "0.15487145307655448"
}
```

---

### GET /player/diffHistory/:id

Returns player difficulty history with pagination.

**Query Parameters:**
- `start` - Starting index (required, integer)
- `length` - Number of records to return (required, integer)

```bash
curl 'https://api.musedash.moe/player/diffHistory/2dc6abd2c4d411e892380242ac11002b?start=0&length=5'
```

**Response:**
```json
[
  {"time":1677565027985,"diff":9.330743317244497,"rank":15033},
  {"time":1677707611720,"diff":9.340689742674476,"rank":14934},
  {"time":1677960031596,"diff":9.333170148969721,"rank":15156},
  {"time":1678479866391,"diff":9.327889228901496,"rank":15280},
  {"time":1678996853393,"diff":9.333288962685632,"rank":15305}
]
```

---

### GET /search/:string

Searches for players by nickname.

```bash
curl https://api.musedash.moe/search/simooo
```

**Response:**
```json
[["SiMOOOOOON","6ea4f986ffd211e8aa980242ac110011"]]
```

---

### GET /log

Returns recent backend logs as plain text.

```bash
curl https://api.musedash.moe/log
```

**Response:**
```text
mdmc: Icedust - 2 / 509
mdmc: Icedust - 1 / 510
mdmc: Icedust - 0 / 511
mdmc: Constant Moderato - 1 / 512
mdmc: Fantasia Sonata Mirror - 1 / 513
mdmc: Pure Ruby - 2 / 514
mdmc: Pure Ruby - 1 / 515
mdmc: Pure Ruby - 0 / 516
mdmc: 少女綺想曲 - 2 / 517
mdmc: 少女綺想曲 - 1 / 518
mdmc: 少女綺想曲 - 0 / 519
mdmc: BULK UP - 1 / 520
mdmc: ΩΩPARTS - 1 / 521
mdmc: Bookmaker - 1 / 522
mdmc: DIE IN - 3 / 523
mdmc: DIE IN - 1 / 524
mdmc: Kalis Mind - 1 / 525
mdmc: Breakin' Asia - 2 / 526
mdmc: Breakin' Asia - 1 / 527
mdmc: Breakin' Asia - 0 / 528
mdmc: ULTiMATE INFLATiON - 3 / 529
mdmc: ULTiMATE INFLATiON - 2 / 530
mdmc: ULTiMATE INFLATiON - 1 / 531
mdmc: ULTiMATE INFLATiON - 0 / 532
mdmc: Rrhar'il - 1 / 533
mdmc: オニユリ - 2 / 534
mdmc: オニユリ - 1 / 535
mdmc: オニユリ - 0 / 536
mdmc: folern - 2 / 537
mdmc: folern - 1 / 538
```

---

### GET /ce

Returns character and elfin (helper) names in all languages.

```bash
curl https://api.musedash.moe/ce
```

**Response:**
```json
{
  "c": {
    "ChineseS": [
      "凛·贝斯手",
      "凛·问题少女",
      ...
    ],
    "ChineseT": [
      "凜·貝斯手",
      "凜·問題少女",
      ...
    ],
    "English": [
      "Rin·Bassist",
      "Rin·Bad Girl",
      ...
    ],
    "Japanese": [
      "リン·ベーシスト",
      "リン·不良少女",
      ...
    ],
    "Korean": [
      "린·베이시스트",
      "린·불량소녀",
      ...
    ]
  },
  "e": {
    "ChineseS": ["喵斯", "安吉拉", "塔纳托斯", "Rabot-233", ...],
    "ChineseT": ["喵斯", "安吉拉", "塔納托斯", "Rabot-233", ...],
    "English": ["Mio Sir", "Angela", "Thanatos", "Rabot-233", ...],
    "Japanese": ["ミャース", "アンジェラ", "タナトス", "Rabot-233", ...],
    "Korean": ["린·베이시스트", "앤젤라", "타나토스", "Rabot-233", ...]
  }
}
```

---

### GET /diffdiff

Returns all song difficulty ratings.

```bash
curl https://api.musedash.moe/diffdiff
```

**Response:**
```json
[
  ["92-0",3,"12",739.7729872739195,12.5],
  ["83-2",3,"12",728.0785703552648,12.459252866379174],
  ["74-5",3,"12",713.6942455993467,12.418505732758348],
  ...
]
```

**Array format:** `[uid, difficulty, level, absolute, relative]`

---

### GET /diffdiff.xml

Returns all song difficulty ratings in XML format.

```bash
curl https://api.musedash.moe/diffdiff.xml
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<diffdiff>
  <song uid="92-0" difficulty="3">
    <level>12</level>
    <absolute>739.7729872739195</absolute>
    <relative>12.5</relative>
  </song>
  <song uid="83-2" difficulty="3">
    <level>12</level>
    <absolute>728.0785703552648</absolute>
    <relative>12.459252866379174</relative>
  </song>
  ...
</diffdiff>
```

---

### GET /uptime

Returns server uptime in seconds.

```bash
curl https://api.musedash.moe/uptime
```

**Response:**
```
6120.840400969
```

---

### GET /playerNumber

Returns total number of players in the database.

```bash
curl https://api.musedash.moe/playerNumber
```

**Response:**
```
679064
```

---

### GET /playerDiffRank

Returns player difficulty ranking.

```bash
curl https://api.musedash.moe/playerDiffRank
```

**Response:**
```json
[
  {"id":"e678f6fd53634cacb45b0ccf88815bbd","rl":12.345342074112676},
  {"id":"406ceb0c33e6402f88997056215a523c","rl":12.344712480285448},
  {"id":"b25a8a65d1fb45aab2ba484533ec7eb3","rl":12.344028175563405},
  {"id":"6fffa392fc7d11e898ae0242ac110013","rl":12.341560907281593},
  {"id":"86e9ca68df704901bd0a8e3a02ec6f4b","rl":12.340791953242052}
  ...
]
```

---

### GET /mdmc/musics

Returns MDMC (Muse Dash Modding Community) music list.

```bash
curl https://api.musedash.moe/mdmc/musics
```

**Response:**
```json
[
  {
    "id": "670b5e11984eb9b7a347a899",
    "name": "少女A",
    "author": "椎名もた",
    "levelDesigner": "Young Boy [C]",
    "bpm": "130",
    "difficulty1": "5",
    "difficulty2": "8",
    "difficulty3": "11",
    "difficulty4": "0"
  }
  ...
]
```

---

### GET /mdmc/player/:id

Returns MDMC player profile.

```bash
curl https://api.musedash.moe/mdmc/player/1
```

**Response:**
```json
{
  "user": {
    "user_id": 1,
    "nickname": "AshtonMemer",
    "discord_id": "373657230530052099"
  },
  "plays": [
    {"id":"670b5e11984eb9b7a347a899","history":{"lastRank":4},"score":333525,"acc":100,"difficulty":1,"i":4,"character_uid":11,"elfin_uid":7},
    {"id":"670b5e0a984eb9b7a347a584","history":{"lastRank":50},"score":364391,"acc":99.03,"difficulty":1,"i":50,"character_uid":11,"elfin_uid":7},
    {"id":"670b5e0a984eb9b7a347a584","history":{"lastRank":29},"score":452650,"acc":100,"difficulty":2,"i":29,"character_uid":3,"elfin_uid":6}
    ...
  ]
}
```

---

### GET /mdmc/rank/:id/:difficulty

Returns MDMC ranking data for a song.

```bash
curl https://api.musedash.moe/mdmc/rank/670b5e11984eb9b7a347a899/0
```

**Response:**
```json
[[100,158101,0,"free0ne",21338,7,6],[100,158101,1,"Kuma熊",22038,7,6],[100,158101,2,"sintown",2224,7,6],[100,158101,3,"solar90",9698,7,6],[100,158101,4,"gugulop",22663,7,6],[100,158101,5,"Dream_Mercy",12864,7,6],[100,158101,6,"hqtf",25134,7,6],[100,158101,7,"Papa_Sora",20124,7,6],[100,158101,8,"Domster",7624,7,6],[100,158101,9,"VeeFy",27747,7,6],[100,158101,10,"Pockxto",23145,7,6],[100,158101,11,"reztracc",34948,7,6],[99.85,157981,12,"BenzylAlcohol",29061,7,6],[100,157861,13,"MissFrancesca",33907,7,6],[100,157861,14,"mieko",28211,7,6],[99.7,157686,15,"L_u_c_i_p_h_e_r",6439,7,6],[99.7,157676,16,"nywfan",19408,7,6],[99.7,157591,17,"seblade4231",25517,7,6],[99.7,157581,18,"ladno",24928,7,6],[100,157581,19,"12GAUGEGRL",29855,7,6],[99.7,157531,20,"OwlNest",23319,7,6] ...]
```

**Array format:** `[acc, score, lastRank, nickname, user_id, character_uid, elfin_uid]`

---

### GET /mdmc/search/:string

Searches for MDMC players by nickname.

```bash
curl https://api.musedash.moe/mdmc/search/meme
```

**Response:**
```json
[["AshtonMemer","1"],["MyDadsMemes","1493"],["ketxmeme","19643"],["DioKellofMemes","25595"],["memememeol","31765"],["dogmemeavi","5652"],["deadmemejj","7225"]]
```

---
