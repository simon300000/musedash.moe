import { renderToString } from '@vue/server-renderer'
import { createApp } from './app'
import type { SSRContext } from './types'

export interface EntryServerResult {
  html: string
  state: unknown
  title: string
}

export default async (context: SSRContext): Promise<EntryServerResult> => {
  const titles: string[] = []
  const changeTitle = (depth: number, part: string) => {
    titles[depth] = part
  }

  const { app, router, store } = createApp({ lang: context.lang, changeTitle, theme: context.theme })

  await router.push(context.url)
  await router.isReady()

  const matched = router.currentRoute.value.matched
  if (!matched.length) {
    const err = new Error('Not Found')
    ;(err as any).code = 404
    throw err
  }

  const html = await renderToString(app, context)

  const title = titles.filter(Boolean).reverse().join(' - ') || 'MuseDash.moe'

  return { html, state: store.$state, title }
}
