import { writeFile, readFile } from 'fs/promises'

const toXYCSV = data => `x,y\n${data.map(({ x, y }) => `${x},${y}`).join('\n')}`

const loadPlayer = async type => JSON.parse(await readFile(`tune-${type}-playerdiff.json`))

const basePlayer = await loadPlayer('base')
const newPlayer = await loadPlayer('36p')

const basePlayerRL = Object.fromEntries(basePlayer.map(({ id, rl }) => [id, rl]))
const newPlayerRL = Object.fromEntries(newPlayer.map(({ id, rl }) => [id, rl]))

const difference = basePlayer
  .filter(({ rl }) => rl > 8)
  .map(({ id, rl }) => ({ rl, diff: newPlayerRL[id] - rl })).map(({ rl, diff }) => ({ x: rl, y: diff }))

await writeFile('tune-36p-playerdiff.csv', toXYCSV(difference))

const averageDifference = difference.reduce((sum, { y }) => sum + y, 0) / difference.length

console.log(averageDifference)
