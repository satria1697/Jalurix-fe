# Jalurix frontend

FR-01 customer and transport request intake, built with Vue 3, TypeScript, Pinia, and Tailwind. The Forest Chocolate theme uses forest green, chocolate, cream, and moss.

## Run

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The root opens Transport requests; Customers is in the sidebar. Existing component examples remain under `/story-book/button`.

## Verify

```sh
npm run test:unit -- --run
npm run type-check
npm run build-only
```

The `build` convenience script also runs checking and bundling. The build script runs these tasks sequentially so a failed check stops bundling. The inherited Vite 5 toolchain reports deprecation and outdated Browserslist warnings; upgrading it is separate work. Verified with Node 26; tests include a jsdom Storage setup for compatibility.

## Demo behavior

- Fictional examples initialize once under localStorage key `jalurix.fr01.v1`. A valid empty dataset stays empty.
- Customers support individual/business profiles, contacts, and an optional saved address.
- Requests support several cargo items, quantity and optional measurements per item, offline intake channels, preferred WIB schedules, handling instructions, and independent pickup/delivery locations.
- `Use saved address` explicitly copies only that location's address. Later customer edits do not change request addresses.
- New requests remain Draft and use the visibly labelled Demo staff identity. Dates persist in UTC and display as Asia/Jakarta (WIB).
- Adding a customer from a new request temporarily saves the unfinished request in sessionStorage key `jalurix.request-editor.v1`. Creation, cancellation, or browser Back returns to that draft; successful request creation or confirmed discard clears it.
- Navigation warns before discarding unsaved changes. Save failures keep the form open. Unreadable stored data is preserved and shows an error with retry; the app never silently resets it.

Data is local to this browser and origin, without encryption, accounts, shared storage, or server backups. Use fictional data only. Multiple tabs editing concurrently are unsupported. Clearing site data removes local records; export/backup UI is not included.

## Frontend boundaries

`src/features/customers` and `src/features/requests` contain types, validation, repository contracts, Pinia stores, and views. Views call stores; stores use asynchronous repositories. `src/data` implements these contracts with a versioned browser storage envelope. Future HTTP adapters can replace the browser implementation without changing the forms; no Go API contract is assumed.

Authentication, API authorization, audit guarantees, quotations, shipment operations, payment records, and backend architecture are deferred. Browser validation is usability support, not a replacement for future server validation.

Design and implementation plan: `docs/superpowers/specs/2026-10-22-fr01-frontend-design.md` and `docs/superpowers/plans/2026-10-22-fr01-frontend.md`.

## PostgreSQL-backed development mode

The backend now implements FR-01. In `../jalurix-api`, configure DATABASE_URL, run `make migrate`, and start with `FR01_DEV_MODE=true GIN_MODE=debug make run`. This is explicitly local development only; production authentication/RBAC is not implemented. The API binds to 127.0.0.1 in this mode and cannot be enabled with release mode.

Start this frontend with:

```sh
VITE_DATA_SOURCE=api VITE_API_PROXY_TARGET=http://127.0.0.1:8080 npm run dev
```

The same-origin Vite `/api` proxy connects the UI to PostgreSQL through the API. `.env.example` documents both options. `VITE_DATA_SOURCE` defaults to `local`, preserving the original standalone demo. API mode changes the footer to “Local development API — records saved in PostgreSQL”. It never seeds, imports, or silently falls back to localStorage. API validation errors appear in the forms and failed saves retain entered values.

Unfinished API drafts use `jalurix.request-editor.api.v1` in sessionStorage, independently of local-demo drafts. Existing browser demo records remain untouched when switching modes. Detail/edit routes fetch records directly by ID. For this small-team phase, list adapters traverse server pagination and load the full collection for lists/dropdowns; page-aware UI is deferred. A load has an overall 10-second timeout, and any failed or inconsistent page fails the load instead of showing incomplete results.

Do not point API mode at a public unauthenticated service. Built assets require a same-origin `/api` proxy supplied by their hosting environment; Vite's development proxy is not a production server. Backend API/migration/test instructions are in `../jalurix-api/README.md`; the OpenAPI contract is `../jalurix-api/docs/openapi.yaml`.
