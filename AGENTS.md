# AGENTS.md

Shared rules:
- Follow `/Users/refresh/code/AGENTS.md` first.

Repo-specific rules for `refresh-frontend`:

## Workflow Preferences

- Follow the repo-local `CLAUDE.md` guidance in this repository.
- Use `src/components/AppV2.tsx` as the source of truth for which pages are active.
- If a page or component is not clearly active from `AppV2`, ask before assuming it matters.
- Do not treat old `Community.tsx` as active just because the route path is `/community`; use the component actually mounted in `AppV2`.
- Prefer colocated tests next to the files they cover.
- For work in the Refreshments or community area, use the real Ionic test setup pattern from `src/components/TextModal.test.tsx` rather than generic DOM or Ionic stubs.
- If a page is truly unused or deprecated, mark it with a valid comment form for TS or TSX. Do not leave a raw `#` marker in code.

## Commands

```bash
npm run dev           # Dev build targeting localhost:8001 backend
npm run serve         # Dev server on port 8100 with hot reload
npm run staging       # Build targeting Railway staging environment
npm run build         # Production build targeting Railway production
```

Tests must be run inside the Docker container defined in the backend repo at `/Users/refresh/code/refreshconnections/docker-compose.yml`. The container sets the correct env vars such as `BASE_URL`, so local test runs are not authoritative.

```bash
# From /Users/refresh/code/refreshconnections
docker-compose exec frontend npm run test
docker-compose exec frontend npm run test -- src/hooks/utilities.test.ts
docker-compose exec frontend npm run test -- src/path/to/file.test.tsx
```

The `frontend` container must already be running via `docker-compose up frontend`.

## Architecture Overview

This is a React 18 + Ionic + Capacitor cross-platform app written in TypeScript and bundled with Webpack 5.

### Key Tech

- Ionic React 8 for mobile UI components and tab navigation
- Capacitor 7 for native iOS and Android integration
- TanStack React Query v5 for server state
- React Router v5 for routing inside Ionic's router
- Axios in `src/hooks/api/api-client.tsx` for authenticated HTTP requests

### Source Layout

- `src/index.tsx` is the entry point and sets up app providers
- `src/components/App.tsx` and `src/components/AppV2.tsx` are the main app shells
- `src/pages/` contains route-level page components
- `src/components/` contains reusable components, modals, and providers
- `src/hooks/utilities.ts` contains shared utilities
- `src/hooks/useWebSocket.tsx` manages WebSocket lifecycle
- `src/hooks/api/` contains domain-organized React Query hooks

### State Management Pattern

- Server state uses TanStack React Query
- Global app state uses React Context
- Persistence uses Capacitor Preferences via `src/hooks/capacitorPreferences/`

### API / Auth Pattern

- `src/hooks/api/api-client.tsx` points at `process.env.REACT_APP_API_BASE_URL`
- Auth token is stored in Capacitor Preferences and injected by an Axios interceptor
- CSRF token is read from cookies with `js-cookie`
- `401` responses trigger global logout
- `503` responses redirect to maintenance mode

### Environment Targets

- `npm run dev` targets `localhost:8001`
- `npm run staging` targets Railway staging
- `npm run build` targets Railway production

### Mobile / Capacitor Notes

- App ID: `com.refresh-connections.app`
- Web output directory: `static/frontend`
- `frontend_capacitor_sync.py` syncs the web build to Capacitor
- Native plugins include Camera, Geolocation, Filesystem, Browser, Voice Recorder, OneSignal, RevenueCat, and Yoti

### Testing

Tests live in `src/pages/__tests__/` and alongside source files. Vitest runs in a jsdom environment with React Testing Library.
