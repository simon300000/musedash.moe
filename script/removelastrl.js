import { RaveLevel } from 'rave-level'

const db = new RaveLevel('./db')


const playerDiffHistory = db.sublevel('playerDiffHistory', { valueEncoding: 'json' })
const playerDiffHistoryNumber = playerDiffHistory.sublevel('number', { valueEncoding: 'json' })

let count = 0

for await (const [key, value] of playerDiffHistoryNumber.iterator()) {
  await playerDiffHistoryNumber.put(key, value - 1)
  count++
  if (count % 1000 === 0) {
    console.log(count)
  }
}
