import { createApp } from './app'

import { injectFetch } from './api'

export default context => {
  injectFetch(context.fetch)

  return new Promise((resolve, reject) => {
    let titles = []
    const changeTitle = (depth, part) => {
      titles[depth] = part
    }

    const { app, router, store } = createApp({ lang: context.lang, changeTitle, theme: context.theme })

    router.push(context.url)

    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents()
      if (!matchedComponents.length) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return reject({ code: 404 })
      }
      context.rendered = () => {
        context.state = store.state
        context.title = titles.filter(Boolean).reverse().join(' - ')
      }

      resolve(app)
    }, reject)
  })
}
