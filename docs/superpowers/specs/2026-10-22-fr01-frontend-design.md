# FR-01 frontend — Forest Chocolate

## Intent and scope

Build the first usable Jalurix staff interface for customers and transport requests, following FR-01 in the workspace requirements.md. The user approved frontend-first development and a Forest Chocolate visual direction. Go architecture, APIs, authentication, and production persistence are deferred.

Success means a staff member can create and edit a customer, create and edit a linked transport request, reload without losing demo records, and inspect each request's cargo, schedule, contacts, and independent pickup/delivery addresses.

## Visual design

Use deep forest green (#183D32) for navigation and primary actions, chocolate (#573D2E) for warm accents, cream (#F6F2E9) for the canvas, moss (#82956B) for highlights, and dark brown (#302B25) for text. White/cream surfaces, restrained shadows, fine borders, and generous spacing keep forms readable. Validate text and interactive contrast; moss is decorative unless its foreground pairing passes contrast.

Create a desktop sidebar with Jalurix identity and Customers / Transport Requests navigation. Use a compact responsive navigation on small screens. Page headers contain titles, concise descriptions, and the primary create action. Use accessible system fonts, clear focus rings, visible labels, and semantic controls. The forest feeling comes from color and subtle organic decoration, without image dependencies or backgrounds that compete with operational data.

## Routes and screens

- `/` redirects to `/requests`.
- `/customers`: searchable customer list, individual/business filters, contact summary, and create action.
- `/customers/new` and `/customers/:id/edit`: customer form.
- `/customers/:id`: customer details, edit action, and linked requests.
- `/requests`: searchable transport request list showing reference, customer, route, cargo summary, preferred schedule, and Draft status.
- `/requests/new` and `/requests/:id/edit`: transport request form.
- `/requests/:id`: request details, creator/timestamps, and edit action.

Preserve the existing storybook routes. Missing record IDs display a recoverable not-found state. Lists include empty and no-match states. Forms retain values after validation or storage errors and navigate only after successful saves. Cancel returns without saving; warn before leaving a dirty form.

## Customer data

Customer fields: generated ID, type (`individual` or `business`), name, phone, optional email, optional saved address, and creation/update timestamps. Require a trimmed name and phone. Validate email only when supplied. Keep phone validation permissive for Indonesian and international formatting. Do not introduce deletion, customer accounts, or tax/company policies.

## Request data and form

Each request has a generated internal ID, human-readable reference, customer ID, intake channel (`phone`, `whatsapp`, or `other`), optional intake notes, cargo items, preferred pickup/delivery schedule, special handling instructions, pickup location, delivery location, Draft status, creator, and timestamps.

Cargo supports multiple items. Each item records description, positive integer quantity, and optional positive dimensions in centimetres and weight in kilograms. Optional measurements describe one item; show units and this meaning next to the fields. Require at least one cargo item. Multiple items implement FR-01 intake only and do not settle quotation/shipment cardinality.

Each location independently records type (`residential`, `warehouse`, `dealership`, `business`, or `other`), required address text, site contact name/phone, optional latitude/longitude, and instructions. Require both coordinates together when used; validate latitude -90..90 and longitude -180..180. Contact names/phones are optional during draft intake.

Use clearly separated form sections: customer/intake, cargo, schedule/handling, pickup, and delivery. A customer saved address may be explicitly copied into either location; never update a request address automatically when the customer changes. Provide a create-customer link that preserves the request draft when returning.

Preferred schedule values are optional local date/times, explicitly labelled WIB (Asia/Jakarta), serialized as UTC instants. Reject delivery earlier than pickup when both exist. No ETA promises, route optimization, quotations, assignments, or shipment conversion.

All new requests remain Draft. Originating staff is a stable, explicitly labelled `Demo staff` identity. Editing preserves the creator and creation timestamp. Production identity and status transitions await authentication and FR-02.

## Frontend architecture and persistence

Retain Vue 3, TypeScript, Vue Router, Pinia, Tailwind, and Vitest. Organize customer and request types, validation, services, stores, and views by feature. Share the app shell and small accessible form/list primitives. Reuse existing components where suitable without unrelated refactoring.

Views call feature stores; stores call typed asynchronous repository interfaces. A localStorage adapter implements those interfaces for this phase. A later HTTP adapter can replace it without rewriting forms. This is a frontend seam, not a proposed Go API contract.

Persist customers and requests together in one versioned storage envelope to keep links consistent. Generate collision-resistant IDs with browser crypto. Derive human-readable request references from a stored sequence and reject duplicate references. Treat cross-tab concurrent editing as unsupported demo behavior; disclose that limitation in documentation.

Initialize example records once only for a new storage key. Clearly label the application `Local demo — data saved in this browser`. Do not seed again when a user has an empty dataset. Handle malformed data, unavailable storage, and quota failures with visible recovery/error messages; never silently overwrite unreadable records. Validate loaded record shapes before use. Do not put real customer data into bundled samples.

## Validation and verification

Test customer and request validation, multiple cargo items, coordinate boundaries, schedule ordering, independent copied addresses, creator preservation, and repository round trips/error handling. Add focused component tests for create/edit and failed-save behavior where useful. Run unit tests, TypeScript checking, and production build.

Verify the screens in a browser at desktop and mobile sizes: navigation, keyboard focus, form errors, customer-to-request flow, search/filter, edit, reload persistence, empty states, and invalid IDs. Local demo validation is usability support; future server-side authorization and validation remain necessary.

## Explicit limits

No backend scaffolding, login/RBAC enforcement, audit guarantees, shared storage, financial records, quotations, or production deployment in this phase. Customer deletion, request cancellation, and non-Draft transitions remain outside this design. The implementation must not imply those capabilities exist.
