const parser = require('./albumParser')

const { rank } = require('./database')
;
(async () => {
  let albums = await parser()
  console.log(albums)
})()
