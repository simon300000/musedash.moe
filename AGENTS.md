# Repository Guidelines

## Project Structure & Module Organization
The Vue 2 client sits in `src/`, with page layouts under `views/`, reusable widgets in `components/`, and shared wiring (`router.js`, `store.js`, `registerServiceWorker.js`) at the root. API and scraping logic lives in TypeScript under `api/`; the sibling `.js` files are compiled output—edit only the `.ts` sources. Custom webpack and SSR setup resides in `build/` and `index.js`. Static assets land in `public/`, while `covers/` and `covers-raw/` supply processed artwork. `db/` ships LevelDB snapshots copied from production; treat them as read-only.

## Build, Test, and Development Commands
- `npm install`: install dependencies; rerun after lockfile changes.
- `npm run serve`: launch the Vue dev server with hot reload and API proxying.
- `npm run build:dev`: compile the client in development mode, then start the bundled Koa server.
- `npm run build`: run `build:api` and `build:vue` for production bundles (mirrors the CI workflow).
- `npm run dev`: watch and rebuild the TypeScript API during local work.
- `npm run api`: run the compiled API server directly for manual endpoint testing.
- `npm run lint` (optionally `-- --fix`): apply the shared ESLint/Standard ruleset.

## Coding Style & Naming Conventions
All JavaScript, TypeScript, and Vue SFCs use two-space indentation per `.editorconfig`. ESLint extends `plugin:vue/essential`, `@vue/standard`, and StandardJS; prefer `camelCase` for functions and data, and `PascalCase` for Vue components. Type aliases in `api/*.ts` follow the existing `NamePayload` patterns—keep new definitions consistent. Generated `.js` artifacts in `api/` should not be touched; rely on the TypeScript sources and `npm run build:api`.

## Testing Guidelines
No automated suite exists yet, so every change must at least pass `npm run build`. When editing API modules, run `npm run dev` to check type output and exercise endpoints with `npm run api`. For UI changes, smoke-test affected routes via `npm run serve` and include before/after screenshots when visuals shift. If you add automated coverage, colocate tests (e.g., `api/foo.spec.ts`) and document the new command so the workflow can call it.

## Commit & Pull Request Guidelines
Commits follow short, imperative summaries (`Game update`, `Ignore map5 from MDMC API`); keep them under ~72 characters and avoid trailing punctuation. Pull requests should link relevant issues, outline behavioural or data changes, list the commands you ran, and attach screenshots for UI work. Verify `npm run build` and `npm run lint` locally before opening the PR—GitHub Actions enforces the same build step.
