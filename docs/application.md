# EcoCycle application handoff

The existing MERN project now includes persistent pickup CRUD, real account authentication and separate General User and Recycling Collector workspaces. No administrator role exists. Collectors register directly; the application does not claim to independently verify them.

## Design and existing assets

The provided Figma file opens to a sign-in gate in the available browser. The Figma plugin was suggested but its connection was not confirmed. No exported screens were attached. Exact Figma fidelity is therefore **not verified**. The implementation extends the existing forest-green/cream design and follows the written brief; it does not claim to reproduce unseen designs.

The homepage is shortened to hero, three process steps, six compact categories, final CTA and footer. All original photographs and responsive variants remain in `client/public/images`; the original logo asset is retained. The sorting image appears on account pages, collection truck on collector/public pages, electronics imagery on user/public pages and facility image on About.

The pasted brief ends at “Prefill” in the UPDATE section. Pending-request edits are prefilled, and deletion is implemented with an explicit confirmation dialog as required by the preceding CRUD/user-role requirements.

## Authentication

- Passwords use bcryptjs with work factor 12. Inputs reject more than 72 UTF-8 bytes to prevent bcrypt truncation.
- Sessions use cryptographically random 256-bit opaque tokens. Only their SHA-256 digest is stored in MongoDB; a seven-day TTL and expiry query invalidate old sessions.
- Session cookies are HTTP-only, SameSite=Lax and use Secure plus the `__Host-` prefix in production. Credentials are never kept in localStorage.
- Authenticated writes require an unpredictable session CSRF token in a header. JSON-only writes, a strict Origin allowlist and rejection of cross-site fetches protect login and registration too.
- Login and account creation are rate-limited. Logout removes the session from MongoDB and clears the cookie.
- The server enforces exactly `user` and `collector`. Registration chooses the role; profile updates cannot change it or change login credentials.
- Helmet supplies API security headers. Errors avoid logging request bodies, cookies or database connection details.

## Request lifecycle and privacy

`pending → accepted → scheduled → collected → recycled`

Users can change or delete their own requests only while pending. A version check prevents stale edits from overwriting newer changes. Acceptance checks status and assignment in a single atomic MongoDB operation, so competing collectors cannot both claim a request. Scheduling, collection and recycling require the assigned collector and a valid prior status.

Available-request lists and details hide the exact street address and owner identifier/contact details. Those details are shared with the assigned collector after acceptance. Users see their assigned collector’s contact details. No member can browse another user’s private requests.

Optional JPEG, PNG and WebP photos up to 2 MB are validated by MIME type and file signature, stored with the MongoDB request, excluded from list responses, and displayed only in authorized details. There is no public upload directory. A description field reminds users to place addresses and contact details in dedicated fields.

The dashboard uses database aggregates; lists use database filtering and pagination. Empty states are real empty states. There are no seeded accounts, fabricated statistics or fake successful API responses.

Dates are shown in Sri Lanka time. Preferred dates must be today or later; collector schedules must be in the future. Scheduling records include a timestamp and activity timeline. Collection/recycling are collector-reported statuses, not independently certified outcomes.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Database-aware health status |
| POST | `/api/auth/register` | Register one of the two roles |
| POST | `/api/auth/login` | Start a new session |
| GET | `/api/auth/me` | Current profile and CSRF token |
| POST | `/api/auth/logout` | Revoke current session |
| PATCH | `/api/auth/profile` | Update name, phone and district |
| GET | `/api/pickups/options` | Valid categories, conditions, districts and statuses |
| GET | `/api/pickups/stats` | Real current-user statistics |
| GET | `/api/pickups` | Paginated own requests; collector `scope=available` or `scope=history` |
| POST | `/api/pickups` | Create a pickup as a General User |
| GET | `/api/pickups/:id` | Authorized request details and timeline |
| PATCH | `/api/pickups/:id` | Update own pending request using its `version` |
| DELETE | `/api/pickups/:id` | Delete own pending request |
| POST | `/api/pickups/:id/accept` | Atomically accept as a collector |
| POST | `/api/pickups/:id/schedule` | Schedule/reschedule own accepted collection |
| POST | `/api/pickups/:id/status` | Mark own collection collected, then recycled |

List parameters: `q`, `status`, `district`, `page`, `limit` (maximum 50). Mutation requests use `Content-Type: application/json`; session mutations also use `X-CSRF-Token`. Errors return a `message` and optional `fields` map. The frontend API client handles expired sessions and displays failed requests with retry actions.

## Database connectivity

`npm run db:check` loads the existing `.env` privately, tests system DNS and the existing public DNS configuration, and performs a read-only MongoDB ping. It prints only sanitized categories and never the connection string. Current Atlas connectivity failed with both configurations even outside the sandbox: system DNS failed during lookup; public DNS reached a connection timeout/access-list/network failure. This does not establish which Atlas/network setting is responsible.

The `.env` is unchanged and ignored. The normal `npm run dev` / `npm start` path continues to use that Atlas configuration and fails clearly when it cannot connect. Check cluster availability, outbound network access and the Atlas access list in your own account; add only the required client IP, and do not broadly expose the cluster.

`npm run dev:local` is an explicit alternative using the installed MongoDB Community executable. It starts a separate database on `127.0.0.1:27018`, stores data persistently under ignored `server/.local-data/mongodb`, and starts the same API on `127.0.0.1:5000`. It does not read or alter `.env` and does not replace Atlas automatically. Set `MONGOD_BINARY` if the executable is installed elsewhere; `LOCAL_MONGO_PORT` can override the database port. Stop with Ctrl+C. This local database is for development and must not be exposed to a public network.

## Verification

The frontend has a production build and ESLint checks. Backend tests use a real, isolated MongoDB instance and synthetic disposable data, with no Atlas reads or writes. Tests cover hashing, session revocation/expiry, CSRF, Origin rejection, input validation, ownership, role boundaries, persistent CRUD across a reconnect, stale updates, competing acceptances, address privacy, schedule transitions and history/statistics. Run `npm test` in `server` for the latest result.

## Deployment and limits

Deploy the frontend and `/api` behind the same HTTPS origin. Forward `/api` to Express, set `NODE_ENV=production`, configure `CLIENT_ORIGIN` to the exact public URL, and serve React routes with an `index.html` fallback. The Vite development proxy currently forwards to local API port 5000; update the proxy if changing that port. Use `TRUST_PROXY=1` only when there is exactly one trusted reverse proxy.

The rate-limit store is process-local; a multi-instance deployment should use a shared store. Optional images are bounded MongoDB document fields, suitable for this mini-project; larger-scale image storage is outside this implementation. No email password reset, external notifications, fee collection, live GPS, independent collector verification or support-message delivery is claimed. The contact page continues to provide guidance because no real support destination was supplied.

No commit, push or deployment is performed by this task. The earlier `phase-a.md` is a historical record; this handoff and the current README supersede its planned authentication/administrator scope.
