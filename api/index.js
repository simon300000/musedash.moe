const parser = require('./albumParser')

;
(async () => {
  let albums = await parser()
  console.log(albums)
})()
