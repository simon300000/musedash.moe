import { RaveLevel } from 'rave-level'

const db = new RaveLevel('./db')


const playerDiffHistory = db.sublevel('playerDiffHistory', { valueEncoding: 'json' })
const playerDiffHistoryNumber = playerDiffHistory.sublevel('number', { valueEncoding: 'json' })

for await (const [key, value] of playerDiffHistoryNumber.iterator()) {
  await playerDiffHistoryNumber.put(key, value - 1)
}
