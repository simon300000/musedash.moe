const INTERVAL = 1000 * 60 * 60 * 24

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const platforms = {
  mobile: 'leaderboard',
  pc: 'pcleaderboard'
}

const prepare = music => music
  .flatMap(({ uid, difficulty, name }) => difficulty
    .map((difficultyNum, difficulty) => ({ uid, level: difficultyNum, difficulty, name })))
  .flatMap(({ uid, difficulty, name, level }) => Object.entries(platforms)
    .map(([platform, api]) => ({ uid, difficulty, name, level, platform, api })))
  .filter(({ level }) => level)

module.exports = async ({ music, rank }) => {
  for (;;) {
    let startTime = Date.now()
    let pending = prepare(music)
    console.log(pending)
    let endTime = Date.now()
    console.log(`Wait ${INTERVAL - (endTime - startTime)}`)
    await wait(INTERVAL - (endTime - startTime))
  }
}
