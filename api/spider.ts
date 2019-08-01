import got = require('got')

const INTERVAL = 1000 * 60 * 60 * 24

const wait = (ms: number): Promise<undefined> => new Promise(resolve => setTimeout(resolve, ms))

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

const round = async ({ pending, rank }) => {
  for (; pending.length;) {
    const { uid, difficulty, name, platform, api } = pending.shift()
    let result = await download({ uid, difficulty, api }).catch(() => undefined)
    if (!result) {
      pending.push({ uid, difficulty, name, platform, api })
      console.log(`RETRY: ${uid}: ${name} - ${difficulty} - ${platform}`)
      continue
    }

    result = result.filter(({ play, user }) => play && user)

    const currentRank = await rank.get({ uid, difficulty, platform })
    if (currentRank) {
      const currentUidRank = currentRank.map(({ play }) => play.user_id)
      for (let i = 0; i < result.length; i++) {
        result[i].history = { lastRank: currentUidRank.indexOf(result[i].play.user_id) }
      }
    }

    await rank.put({ uid, difficulty, platform, value: result })

    console.log(`${uid}: ${name} - ${difficulty} - ${platform} / ${pending.length}`)
  }
}

const analyze = async ({ musicList, rank, player }) => {
  await player.clear()
  console.log('Analyze cleared')

  let pending = [...musicList]
  for (; pending.length;) {
    const { uid, difficulty, platform } = pending.shift()
    const currentRank = await rank.get({ uid, difficulty, platform })
    const sumRank = await rank.get({ uid, difficulty, platform: 'all' })
    await Promise.all(currentRank.map(async ({ user, play: { score, acc }, history }, i) => {
      let playerData = await player.get(user.user_id)
      if (!playerData) {
        playerData = { plays: [] }
      }
      playerData.user = user
      const sum = sumRank.findIndex(play => play.platform === platform && play.user.user_id === user.user_id)
      playerData.plays.push({ score, acc, i, platform, history, difficulty, uid, sum })
      await player.put(user.user_id, playerData)
    }))
  }
  console.log('Analyzed')
}

const sumRank = async ({ musicList, rank }) => {
  const pending = musicList.filter(({ platform }) => platform === 'mobile')

  for (let i = 0; i < pending.length; i++) {
    const { uid, difficulty } = pending[i]
    const result = []
      .concat(...await Promise.all(Object.keys(platforms).map(async platform => (await rank.get({ uid, difficulty, platform })).map(play => ({ ...play, platform })))))
      .sort((a, b) => b.play.score - a.play.score)
    const currentRank = await rank.get({ uid, difficulty, platform: 'all' })
    if (currentRank) {
      const currentUidRank = currentRank.map(({ play }) => play.user_id)
      for (let i = 0; i < result.length; i++) {
        result[i].history = { lastRank: currentUidRank.indexOf(result[i].play.user_id) }
      }
    }
    await rank.put({ uid, difficulty, platform: 'all', value: result })
  }
  console.log('Ranked')
}

export default async ({ music, rank, player, PARALLEL }) => {
  for (; ;) {
    const startTime = Date.now()
    const musicList = prepare(music)
    await Promise.all(Array(PARALLEL).fill([...musicList]).map(pending => round({ pending, rank })))
    await sumRank({ musicList, rank })
    await analyze({ musicList, rank, player })
    const endTime = Date.now()
    console.log(`Wait ${INTERVAL - (endTime - startTime)}`)
    await wait(INTERVAL - (endTime - startTime))
  }
}
