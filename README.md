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

The `build` convenience script also runs checking and bundling. On newer Node versions, use the explicit commands above if npm-run-all does not print its child task results. The inherited Vite 5 toolchain reports deprecation and outdated Browserslist warnings; upgrading it is separate work. Node 20 LTS or newer is suitable; tests include a jsdom Storage setup for Node 26 compatibility.

## Demo behavior

- Fictional examples initialize once under localStorage key `jalurix.fr01.v1`. A valid empty dataset stays empty.
- Customers support individual/business profiles, contacts, and an optional saved address.
- Requests support several cargo items, quantity and optional measurements per item, offline intake channels, preferred WIB schedules, handling instructions, and independent pickup/delivery locations.
- `Use saved address` explicitly copies only that location's address. Later customer edits do not change request addresses.
- New requests remain Draft and use the visibly labelled Demo staff identity. Dates persist in UTC and display as Asia/Jakarta (WIB).
- Adding a customer from a new request temporarily saves the unfinished request in sessionStorage key `jalurix.request-editor.v1`. Creation or cancellation returns to that draft; successful request creation clears it.
- Navigation warns before discarding unsaved changes. Save failures keep the form open. Unreadable stored data is preserved and shows an error with retry; the app never silently resets it.

Data is local to this browser and origin, without encryption, accounts, shared storage, or server backups. Use fictional data only. Multiple tabs editing concurrently are unsupported. Clearing site data removes local records; export/backup UI is not included.

## Frontend boundaries

`src/features/customers` and `src/features/requests` contain types, validation, repository contracts, Pinia stores, and views. Views call stores; stores use asynchronous repositories. `src/data` implements these contracts with a versioned browser storage envelope. Future HTTP adapters can replace the browser implementation without changing the forms; no Go API contract is assumed.

Authentication, API authorization, audit guarantees, quotations, shipment operations, payment records, and backend architecture are deferred. Browser validation is usability support, not a replacement for future server validation.

Design and implementation plan: `docs/superpowers/specs/2026-10-22-fr01-frontend-design.md` and `docs/superpowers/plans/2026-10-22-fr01-frontend.md`.
