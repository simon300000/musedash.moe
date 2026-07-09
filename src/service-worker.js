import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute, setDefaultHandler } from 'workbox-routing'
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies'

clientsClaim()

setDefaultHandler(new StaleWhileRevalidate())

precacheAndRoute(self.__WB_MANIFEST)

registerRoute(/https:\/\/api\.musedash\.moe/, new NetworkFirst())
