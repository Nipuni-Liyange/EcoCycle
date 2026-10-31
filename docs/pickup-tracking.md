# Pickup tracking and collection management

## Why the pages looked alike

All four routes rendered `Requests` and its shared `RequestTable`. The tracking flag changed headings, not the query or presentation. Collector collections used the unrestricted assigned-pickup query, and history included both `collected` and `recycled`, so records overlapped.

## Page behavior

| Page | Records | Interface |
| --- | --- | --- |
| `/dashboard/requests` | All requests owned by the signed-in user | Management table, photos, categories, preferred/confirmed dates, search, all-status filter, details. Existing pending edit/delete actions remain in details. |
| `/dashboard/tracking` | Owner's pending, accepted, scheduled and collected requests | Progress cards with all five stages, current-stage highlight, real timeline, authorized collector contacts, location/date, photos, refresh and details. |
| `/collector/requests` | Assigned accepted, scheduled and collected requests | Active work list with search/status filters and access to the existing scheduling/status workflow. |
| `/collector/history` | Assigned recycled requests only | Read-only history, recorded collection/recycling dates, total completed count, search, completion-date sorting and details. |

Recycled records stay in the same MongoDB `pickups` collection. They remain in the owner's My Requests and appear in the assigned collector's history. Missing event dates display **Not recorded**. Undated historical records sort after dated records in both sort directions.

## API and privacy

The existing `GET /api/pickups` endpoint now accepts `scope=active`. For users this excludes recycled pickups; for collectors it permits only accepted, scheduled and collected pickups assigned to that collector. `scope=mine` retains all owned/assigned statuses. `scope=available` and acceptance behavior are preserved.

`scope=history` is collector-only and permits only recycled records. An incompatible `status` filter returns 422 rather than widening the scope. Both list modes preserve server-side search, district filtering, pagination and ownership filtering. `sort=newest` is the default; `sort=oldest` reverses date order.

History returns computed `collectedAt` and `recycledAt` from recorded timeline events, plus `completedTotal` (all completed records for that collector, independent of search and pagination). These are response fields, not schema fields or a migration. Active user tracking populates only the assigned collector's name, email and phone after ownership filtering. Photo bytes remain excluded from list responses and image endpoints retain their authorization checks. Existing write permissions and transitions are unchanged.

## Files changed for this feature

- `client/src/App.jsx`
- `client/src/application.css`
- `client/src/components/app/RequestTable.jsx`
- `client/src/components/app/PickupProgress.jsx` (new)
- `client/src/components/app/PickupTimeline.jsx` (new)
- `client/src/components/app/TrackingList.jsx` (new)
- `client/src/pages/dashboard/Requests.jsx`
- `client/src/pages/dashboard/RequestDetails.jsx`
- `server/src/routes/pickupRoutes.js`
- `server/test/integration.test.js`
- `docs/pickup-tracking.md` (this file)

Pre-existing README and Vite configuration edits were retained. No packages, environment values, credentials, schemas, indexes or database records were changed for this feature. The sidebar and hamburger implementation were retained.

## Verification — 28 October 2026

- Backend: **30 tests passed**, using an isolated real MongoDB instance, including authentication, roles, CSRF, private photo uploads, validation, CRUD, persistence, concurrent acceptance, ownership, active/history separation, query restrictions, recorded dates, sorting, pagination and recycled transitions.
- Frontend: ESLint and Vite production build passed. Initial sandbox test/build attempts could not spawn subprocesses (`EPERM`); approved runs outside the sandbox passed.
- Browser: separate disposable MongoDB/API/frontend, with synthetic accounts and pickups. All four pages checked at **375px, 768px and 1440px**, without document horizontal overflow. Mobile navigation remained accessible.
- Browser checks included all-status requests, four active tracking stages, private thumbnails, collector contacts, expandable real test timelines, refresh persistence, pending edit/delete controls, accepted-request locks, active assigned collections, recycled-only history, both history sort directions, search/no-match results, unrecorded dates, all four empty states, and the collected-to-recycled transition moving a record from active collections into read-only history.
- Real Atlas account and pickup records were not used for write tests. Existing API regression tests cover photo replacement, creation/deletion and invalid upload boundaries; the browser pass focused on the changed tracking/list workflows rather than repeating every upload interaction.

## Manual acceptance walkthrough

Use dedicated development accounts and test requests for changes to statuses or deletion. Leave existing user records intact.

1. Start the configured backend with `npm run dev` in `server` and the frontend with `npm run dev` in `client` if they are not already running. Use the site's current configured URL. Do not start duplicate servers on occupied ports.
2. Sign in as a General User. Create two disposable requests with quantity at least 1 and up to three JPG/PNG/WebP photos under 2 MB each. Confirm they appear in My Requests and Tracking. Edit one while pending; delete the other using the confirmation dialog.
3. Sign in as a collector. Accept the remaining request from Available requests. Check that it appears in My Collections but not Collection History. Schedule it through its details page.
4. As the owner, open Tracking. Confirm the current stage, collector details, confirmed date, photo and recorded timeline. Confirm accepted/scheduled requests cannot be edited or deleted. Refresh the browser and check persistence.
5. As the assigned collector, mark the request Collected. It should still be in My Collections and the owner's Tracking. Mark it Recycled. It should leave both active lists and appear in Collection History while remaining in the owner's My Requests.
6. Search and filter My Requests/My Collections/Tracking. Search History and switch newest/oldest completed sorting. Verify its total and recorded dates. Historical details must have no scheduling or status-update controls.
7. Use another user and collector to confirm that private details/photos and status changes for the assigned request are denied. Repeat the four pages at 375px; open/close the hamburger, search, follow details links and check that controls fit without horizontal scrolling.

No feature checks are failing. Status refresh is explicit through the Refresh controls or page reload; no background polling or invented events were added.

### Live startup limitation — 29 October 2026

The final production build and lint passed. Restarting the existing Atlas-backed API to load the changes failed with `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` before authentication. The current Atlas IP access-list entry needs checking again; this error alone does not establish its exact network cause. Ports 5000 and 4000 were not serving the live app at the final runtime check. The isolated browser test servers were stopped and their temporary scripts/logs removed. The Atlas URI, credentials and records were not changed, and no local-database fallback was enabled. Live verification can resume once Atlas connectivity is restored and the frontend/backend are running.
