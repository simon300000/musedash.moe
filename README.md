# musedash.moe

Repository of <https://musedash.moe>

Track player ranks of game "Muse Dash" by "PeroPeroGames".



This project/website is **unofficial**! I have no copyright with the music/picture/cover displayed in the website, they belong to the original owner. This website has no relation with MuseDash or PeroPeroGames.

Please download the game under :D



### Download the game

**Steam:(PC/macOS)** <https://store.steampowered.com/app/774171/Muse_Dash/>

**Google Play:** <https://play.google.com/store/apps/details?id=com.prpr.musedash>

**Nintendo Switch:** <https://www.nintendo.com/games/detail/muse-dash-switch/>

**Apple App Store:** <https://apps.apple.com/us/app/muse-dash/id1361473095>

**TapTap:** <https://www.taptap.com/app/60809>



#### Twitter:

[Muse Dash](https://twitter.com/musedashthegame)

[PeroPeroGames](https://twitter.com/peroperoguys)

#### Website:

[PeroPeroGames](http://www.peroperogames.com)



### Todo

* Rank for Nintendo Switch

## Project setup

#### First, init the git submodule

```sh
git submodule init
git submodule update
```

#### Then install npm dependencies

```sh
npm install
git submodule init
git submodule update
```


### Development

#### Compiles frontend and hot-reloads for development

```sh
npm run serve
```

#### Compiles backend with watch for development

```sh
npm run dev
```

### Production

#### Compiles frontend and minifies for production
```sh
npm run build
```

#### Compiles backend for production

```sh
npm run build:api
```

#### Run for production with `pm2`

```sh
pm2 start ecosystem.config.js 
```

