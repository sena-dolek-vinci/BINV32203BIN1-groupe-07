# Gesta project guidelines

## Build, test, and lint

Use Node.js 22.14 or newer (Node 24 LTS is recommended) and run commands from the
repository root. The repository uses npm workspaces for `backend` and `frontend`.

```bash
npm ci                 # install the locked dependencies
npm run setup          # create backend/.env and initialize the demo database
npm run dev            # API on :3000 and Vite app on :5173
npm run check          # lint, typecheck, tests, then build
```

Individual checks are also available:

```bash
npm run lint
npm run typecheck
npm run build
npm test
npm run test -w backend -- tests/companies.test.ts
npm run test -w frontend -- tests/CompaniesPage.test.tsx
npm run test -w backend -- tests/companies.test.ts -t "test name"
```

Backend tests use Vitest and Supertest with an in-memory SQLite database. Frontend tests
use Vitest, jsdom, and Testing Library with mocked fetch responses. Do not use the
development database for tests. Run `npm run db:reset` only after stopping the dev server.

## Architecture

This is a two-workspace TypeScript application:

- `backend/` is an Express API backed by SQLite and `better-sqlite3`.
- `frontend/` is a React/Vite single-page application using React Router.
- During development, the frontend calls `/api/...`; Vite proxies that path to the API
  (default `http://localhost:3000`) and removes the `/api` prefix.

Backend requests flow through `main.ts` and `app.ts`, then controllers, services,
repositories, and SQLite. Mappers convert database rows (DBOs) to domain objects and API
DTOs. Controllers validate HTTP input and shape responses; services contain business rules
and must not depend on Express `Request` or `Response`; repositories contain SQL.
Authentication and authorization are middleware concerns, with named permission rules in
`services/permissions.ts`. Unexpected and expected application errors are represented by
`HttpError` and normalized by `errorHandler` as
`{ "error": { "code": "...", "message": "..." } }`.

Frontend code follows the course's MVVM structure: pages compose hooks and components;
hooks expose display-ready state; services perform HTTP calls and validate JSON with type
guards; models define API data; utilities handle parsing, labels, tokens, and display
rules. `App.tsx` is the single owner of `useAuth`; it passes the session and logout
callback to pages. A 401 should trigger the existing unauthorized callback so the user
returns to login.

Use the existing companies and offers flows as cross-layer examples. See
[`docs/architecture.md`](../docs/architecture.md) for the layer map and
[`backend/API.md`](../backend/API.md) for the API contract.

## Repository-specific conventions

- Keep backend relative imports ending in `.ts`; the TypeScript build rewrites them to
  `.js`.
- Send the session token directly in `Authorization`; this project does not use the
  `Bearer` prefix.
- Use `API_PORT` for the backend port. `PORT` is not the project setting.
- Keep authorization enforcement in the backend. Frontend visibility is not a security
  boundary.
- Add database schema changes as a new ordered migration under
  `backend/src/db/migrations/` (for example `002_*.sql`); never edit an applied migration.
- SQLite enforces structural constraints, while services enforce business rules such as
  permissions and status transitions.
- Persist status codes in English (for example `PUBLISHED`) and use the frontend's
  existing French-label utilities for display.
- Backend composition uses factory functions such as
  `createCompaniesRepository(db)` and `createCompaniesService(repository)` so complete
  in-memory application instances can be constructed in tests.
- Preserve the API's error status/code contract (`400` invalid input, `401`
  unauthenticated, `403` forbidden, `404` not found, `500` unexpected error) when adding
  routes.
- The demo authentication mode is development-only: `DEMO_AUTH_ENABLED=true` is rejected
  with `NODE_ENV=production`. The token contains only identity; roles and company
  memberships are reloaded from the database on every request.
- Keep `backend/API.md` and matching `backend/http/*.http` examples current when changing
  the API. For schema or feature work, update the relevant tests and follow the pull
  request checklist in [`.github/pull_request_template.md`](./pull_request_template.md).

