# Pickup photo uploads

Implemented in the existing EcoCycle MERN application without replacing the UI, authentication or request lifecycle. No commits, pushes or deployment were performed.

## Behavior

- General Users can select up to three JPG/JPEG, PNG or WebP images, at most 2 MiB (2,097,152 bytes) each. Photos remain optional.
- The existing form shows local previews, a count, removal controls and clear validation errors. Existing photos are prefilled when editing. A failed save retains the selection.
- My Requests and shared collector/dashboard tables show a thumbnail and count. Request Details shows all photos with links to larger views.
- Owners may retain, remove or replace photos only while their request is pending and unassigned. Existing version checks prevent stale edits or an acceptance during processing from overwriting data.
- Saved photos survive page reloads, API restarts and MongoDB reconnects. Unsaved file selections are intentionally not persisted across a reload.
- Existing single-image records remain readable through a protected legacy URL and migrate when their photos are edited. No bulk migration is required.

## Storage and validation

The existing JSON submission flow is retained. Sharp is the only new direct dependency; no Multer or multipart upload layer is needed. File input MIME, signatures, canonical base64, byte limits, actual image decoding, declared/decoded format agreement and pixel count are checked on the server. Corrupt files, unsupported formats, animated images and images exceeding 24 megapixels are rejected. Accepted images are rotated to their intended orientation, fit within 1600 × 1600 pixels without enlargement, and re-encoded as WebP with metadata removed. Originals and client filenames are not stored.

Each pickup has `photos` subdocuments containing a stable ObjectId, dimensions, content type, size and private MongoDB binary data. JSON responses contain only references: `{ id, url, width, height, size }`. Binary fields are excluded from normal queries and list projections. Keeping the bounded photos in the pickup document makes creation/replacement/deletion atomic; failed processing or stale writes leave no orphan upload files.

Image reads require the existing session cookie and the same access rules as request details. General Users can read only their own request photos. Collectors can view pending unassigned requests and their own assigned requests. After acceptance, other collectors lose access. Responses use `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff`. There is no public/static upload endpoint. Upload-directory patterns are ignored by Git as defense against future disk artifacts; actual photo bytes live only in MongoDB.

Create/update bodies allow 9 MiB to accommodate base64 encoding of three 2 MiB files plus text. Authentication, role, CSRF and database availability are checked before parsing that larger body; other routes retain their 3 MiB limit. The existing API rate limiter runs before parsing, and at most two image decodes run concurrently per process. Deploying behind a reverse proxy requires allowing this request-body size and a suitable request timeout. Busy/failed processing produces an error, never a successful database response.

## API

Send the existing pickup fields plus `photos` on `POST /api/pickups` or `PATCH /api/pickups/:id`. Updates also require the current `version`. Each entry has exactly one key:

```json
{
  "photos": [
    { "id": "an-existing-photo-id-from-this-pickup" },
    { "dataUrl": "data:image/jpeg;base64,..." }
  ]
}
```

New requests can include only new images. Retained IDs must belong to that exact request and cannot repeat. Omit `photos` to preserve the current set; send `photos: []` to remove all. An older client can still submit the single `image` field; sending both fields is rejected. The legacy retained ID `legacy` is supported only when that pickup contains an older image.

`GET /api/pickups/:id/photos/:photoId` returns processed WebP bytes to authorized viewers. All JSON endpoints omit raw images, including collector mutation responses.

## Verification on 2026-10-27

- The configured Atlas connection failed before authentication with a TLS handshake rejection; system DNS also failed. `.env` and the configured application database were not changed. Atlas CRUD is therefore not claimed as verified.
- Before implementation, all 14 existing tests passed against a real isolated MongoDB process, including persistent CRUD and collector lifecycle behavior. No file-storage fallback or mocked database success was used.
- All 25 tests passed in the final `npm test` run. The expanded suite covers three formats, maximum file/count/body limits, corrupt/mislabeled/animated images, metadata removal, pixel bounds, private bytes and URLs, owner/collector boundaries, atomic replacement/removal/deletion, legacy migration, stale edits, database outages, session persistence and fresh-app reads after reconnect.
- Frontend ESLint and the production build passed.
- Browser checks in a disposable real-MongoDB environment confirmed thumbnails, three-photo details, prefilled edit previews, file-picker replacement, saving and viewing the photos after refreshing. Desktop and mobile layouts were inspected. A later new-request browser upload was declined by the browser permission system and was not retried or bypassed; three-photo creation is covered by the automated integration tests.
- Disposable browser test services were stopped. Test accounts and requests were isolated from existing application databases.

## Exact project files changed

1. `.gitignore`
2. `README.md`
3. `client/src/application.css`
4. `client/src/components/app/PhotoGallery.jsx` (new)
5. `client/src/components/app/PhotoPicker.jsx` (new)
6. `client/src/components/app/RequestTable.jsx`
7. `client/src/lib/photos.js` (new)
8. `client/src/pages/dashboard/PickupForm.jsx`
9. `client/src/pages/dashboard/RequestDetails.jsx`
10. `docs/application.md`
11. `docs/photo-uploads.md` (this file)
12. `server/package.json`
13. `server/package-lock.json`
14. `server/src/app.js`
15. `server/src/models.js`
16. `server/src/photos.js` (new)
17. `server/src/routes/pickupRoutes.js`
18. `server/src/validation.js`
19. `server/test/integration.test.js`
20. `server/test/photos.test.js` (new)

An ignored, temporary `server/.local-data/photo-preview.mjs` was used only to launch disposable browser QA and removed afterward. No `.env`, image library, public pages or existing database records were edited.
