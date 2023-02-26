import { RaveLevel } from 'rave-level'

const db = new RaveLevel('./db')


const playerDiffHistory = db.sublevel('playerDiffHistory', { valueEncoding: 'json' })
const playerDiffHistoryNumber = playerDiffHistory.sublevel('number', { valueEncoding: 'json' })

const state = db.sublevel('state', { valueEncoding: 'json' })


let count = 0

let waits = Array(100).fill(Promise.resolve())

for await (const [key, value] of playerDiffHistoryNumber.iterator()) {
  if (value > 0) {
    await waits.shift()
    waits.push(playerDiffHistoryNumber.put(key, value - 1))
  }
  count++
  if (count % 1000 === 0) {
    console.log(count)
  }
}

await Promise.all(waits)

await state.put('playerLastUpdate', 0)

