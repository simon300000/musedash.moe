import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute, setDefaultHandler } from 'workbox-routing'
import { NetworkOnly, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

clientsClaim()

console.log('yay')

setDefaultHandler(new NetworkOnly())

precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  /\/covers\/.*\.png$/,
  new CacheFirst({
    cacheName: 'covers',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 2333,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      })
    ]
  })
)
