import parser from './albumParser'

import { rank, player, nickname } from './database'
import spider from './spider'

(async () => {
  let albums = await parser()
  let music = [].concat(...albums
    .map(({ music }) => music))
  spider({ music, rank, player, nickname })
})()
