import { createApp } from './app'

export default context => {
  return new Promise((resolve, reject) => {
    let titles = []
    const changeTitle = (depth, part) => {
      titles[depth] = part
    }

    const { app, router, store } = createApp({ lang: context.lang, changeTitle })

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
