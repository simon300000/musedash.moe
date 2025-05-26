# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

musedash.moe is an unofficial rank tracking website for the rhythm game "Muse Dash" by PeroPeroGames. It tracks player rankings and statistics across multiple platforms (Steam, Google Play, Nintendo Switch, Apple App Store, TapTap).

## Development Setup

**Required first step - Initialize git submodules:**
```bash
git submodule init && git submodule update
```

**Install dependencies:**
```bash
npm install
```

## Development Commands

**Frontend development with hot reload:**
```bash
npm run serve
```

**Backend development with TypeScript watch:**
```bash
npm run dev
```

**API server only:**
```bash
npm run api
```

**Linting:**
```bash
npm run lint
```

## Production Commands

**Full build (frontend + backend):**
```bash
npm run build
```

**Frontend build only:**
```bash
npm run build:vue
```

**Backend TypeScript compilation:**
```bash
npm run build:api
```

**Production deployment with PM2:**
```bash
pm2 start ecosystem.config.cjs
```

## Architecture Overview

### Frontend (Vue.js 2.6)
- **SSR-enabled** Vue.js application with vue-server-renderer
- **State management** via Vuex with router sync
- **Styling** with Bulma CSS framework and custom SCSS themes
- **PWA** capabilities with service worker
- **Multi-language support** across 5 languages

### Backend (Node.js + Koa + TypeScript)
- **Dual server architecture**: separate API server (port 8301) and SSR server
- **Database**: LevelDB via rave-level
- **Caching**: LRU cache for performance
- **Multi-threading**: Worker threads for data processing
- **Proxy setup**: vue.config.cjs proxies `/api/*` to local API server during development

### Key Directories
- `/api/` - TypeScript backend with database layer and API endpoints
- `/src/` - Vue.js frontend application
- `/src/components/` - Reusable Vue components
- `/covers/` - WebP optimized music cover artwork
- `/build/` - Custom build configuration scripts

## API Architecture

**Main endpoints:**
- `/albums` - Music album metadata
- `/rank/:uid/:difficulty/:platform` - Player ranking data
- `/player/:id` - Player profiles
- `/search/:string` - Player search
- `/diffdiff` - Difficulty ratings
- `/mdmc/*` - MDMC (Muse Dash Modding Community) endpoints

**Data sources:**
- Official Muse Dash game data
- MDMC API (https://api.mdmc.moe/v2/)
- User-contributed ranking data via spider system

## Special Considerations

### Multi-language Support
- Separate JSON files for each language in `/api/albums/` and `/api/extra/`
- Supported languages: Chinese Simplified/Traditional, English, Japanese, Korean
- Dynamic language switching in frontend

### Asset Management
- Cover images stored as WebP format for optimization
- Raw PNG covers in `/covers-raw/` converted to WebP in `/covers/`
- Custom font loading (Impact.ttf)

### Development Proxy
- Frontend dev server proxies API calls to either local (port 8301) or production API
- Toggle in `vue.config.cjs` between local and production API endpoints

### Performance Optimizations
- Server-side rendering for SEO and initial load performance
- LRU caching on API layer
- Service worker for offline functionality
- Workbox for asset caching strategies

### Deployment
- PM2 process management with separate processes for API and SSR servers
- Custom build process handles both frontend and backend compilation
- NODE_OPTIONS=--openssl-legacy-provider required for Vue CLI compatibility