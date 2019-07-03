const got = require('got')

const INTERVAL = 1000 * 60 * 60 * 24

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const platforms = {
  mobile: 'leaderboard',
  pc: 'pcleaderboard'
}

const download = async ({ api, uid, difficulty }) => (await got(`https://prpr-muse-dash.leanapp.cn/musedash/v1/${api}/top?music_uid=${uid}&music_difficulty=${difficulty + 1}&limit=1999`, { json: true })).body.result

const prepare = music => music
  .flatMap(({ uid, difficulty, name }) => difficulty
    .map((difficultyNum, difficulty) => ({ uid, level: difficultyNum, difficulty, name })))
  .flatMap(({ uid, difficulty, name, level }) => Object.entries(platforms)
    .map(([platform, api]) => ({ uid, difficulty, name, level, platform, api })))
  .filter(({ level }) => level)

const round = async ({ musicList, rank }) => {
  let pending = [...musicList]
  for (; pending.length;) {
    const { uid, difficulty, name, platform, api } = pending.shift()
    let result = await download({ uid, difficulty, api }).catch(() => undefined)
    if (!result) {
      pending.push({ uid, difficulty, name, platform, api })
      console.log(`RETRY: ${uid}: ${name} - ${difficulty} - ${platform}`)
      continue
    }

    await rank.put({ uid, difficulty, platform, value: result })

    console.log(`${uid}: ${name} - ${difficulty} - ${platform}`)
  }
}

module.exports = async ({ music, rank }) => {
  for (;;) {
    let startTime = Date.now()
    let musicList = prepare(music)
    await round({ musicList, rank })
    let endTime = Date.now()
    console.log(`Wait ${INTERVAL - (endTime - startTime)}`)
    await wait(INTERVAL - (endTime - startTime))
  }
}
