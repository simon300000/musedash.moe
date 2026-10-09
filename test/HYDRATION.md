# SSR hydration regression tests

Run from the repository root on the Node version used by CI (Node 20.19+). The test starts its own development SSR server and requires port 8300 to be free.

```sh
npm ci
npx playwright-core install --with-deps chromium
npm run test:hydration
npm test
npm run build
```

The new suite uses the built-in `node:test` runner and `playwright-core` with Chromium. Set `HYDRATION_BROWSER_EXECUTABLE` if a preinstalled Chromium binary should be used. GitHub Actions installs Chromium before running `npm test`.

The tests use the real Vite development server, `src/entry-server.ts`, `src/entry-client.ts`, shared app factory, Vue, Pinia, Vue Router and `App.vue`. They defer loading JavaScript, capture references to server-rendered DOM nodes, then release scripts and assert hydration reuses the nodes without child-list or text changes. Tests cover SSR Pinia language restoration, themes and URL/Cookie precedence, menu/theme/language/navigation/search events, and an intentional SSR tag mismatch that must be diagnosed and repaired.

The browser disables the background crawler and Service Worker and mocks external API/analytics requests only. It does not mock the Vue components. No production data or API/database process is required.

## Confirm regression behavior

To see the expected failure on the original app factory in a clean checkout, first apply the test-related changes **without** the `src/app.ts` hunk. Run `npm run test:hydration`: the original `createApp` should replace the SSR nodes instead of hydrating. Then apply the factory fix and rerun the suite.

This documents the intended checks; tests and production build must still run in a full checkout. A successful unit test is not a claim that all pages and browsers have been exhaustively tested.
