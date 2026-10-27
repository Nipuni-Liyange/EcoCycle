# EcoCycle

E-waste collection and recycling coordination, built in the existing React/Vite + Express/Mongoose project.

## Run the full app locally

MongoDB Community 8.0 is already installed on this computer. For a working local database, open two PowerShell terminals:

```powershell
cd E:\ecocycle\EcoCycle\server
npm run dev:local
```

```powershell
cd E:\ecocycle\EcoCycle\client
npm run dev
```

Open [EcoCycle](http://localhost:5173). Register a General User to create pickups, or a Recycling Collector to accept and schedule them. There are no seeded accounts.

The explicit local option starts a separate MongoDB on loopback port 27018 and stores records under ignored `server/.local-data/mongodb`. Data survives API/database restarts. It does not read or modify the private Atlas `.env`. Stop the backend with Ctrl+C. A fresh checkout needs `npm ci` in both folders; Node 20.19+ and MongoDB Community are required for this local mode.

## Use the existing Atlas configuration

```powershell
cd E:\ecocycle\EcoCycle\server
npm run db:check
npm run dev
```

The original `MONGODB_URI` and `PORT` settings remain supported. The earlier password-template issue was corrected and a connection was verified at that time. A later failure was traced to a TLS handshake rejection before authentication; it does not establish that the password is incorrect. `npm run db:check` inspects nested driver errors and reports a diagnosis without printing credentials or changing records. System DNS also failed on this computer; the project resolvers resolved the cluster but encountered the TLS rejection.

For `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`, first check the correct Atlas project's **Security → Network Access → IP Access List**. If your current public IP is missing, select **Add IP Address → Add Current IP Address**, confirm the entry and wait until it is **Active**. An internet reconnect, VPN change or expired temporary entry can change access. If the current IP is already allowed, check cluster availability and VPN/firewall/TLS-inspection settings. The TLS error alone does not identify which of these caused the rejection. See [MongoDB's connection troubleshooting](https://www.mongodb.com/docs/atlas/troubleshoot-connection/).

Run `npm run db:check` again after the setting is corrected. If nodemon is waiting after a correction, type `rs` and press Enter, or stop it with Ctrl+C and run `npm run dev` again. For development without Atlas, `npm run dev:local` remains a separate persistent local database option; existing Atlas records are not copied into it.

## Features

- Short responsive landing page retaining the original hero photograph, image library and branding.
- Real registration/login/logout, bcrypt passwords, revocable MongoDB sessions, HTTP-only cookies and CSRF protection.
- Exactly two roles: General User and Recycling Collector, with direct collector registration.
- Persistent pickup CRUD with up to three private JPG/PNG/WebP photos (2 MB each), previews, removal/replacement on pending requests, validation, search, filters and pagination.
- General User dashboard, requests, editing, tracking and profile.
- Collector dashboard, available pickups, atomic acceptance, scheduling, status updates, history and profile.
- Real database statistics, empty/loading/error states, route protection and ownership enforcement.
- Reduced-motion support, keyboard-accessible forms/dialogs and responsive layouts.

## Checks

```powershell
cd E:\ecocycle\EcoCycle\server
npm test
cd E:\ecocycle\EcoCycle\client
npm run lint
npm run build
```

Backend tests start an isolated real MongoDB instance, use disposable synthetic data and never connect to Atlas. Tests prefer the installed MongoDB binary; if absent, mongodb-memory-server downloads a test binary. Set `MONGOD_BINARY` for a custom installed executable.

See [photo upload implementation](docs/photo-uploads.md) for storage, access rules, API examples, verification results and the exact changed-file list. Sharp safely decodes and re-encodes uploads; Multer is unnecessary because the existing JSON request flow is retained.

## Design reference and documentation

The supplied Figma URL requires sign-in in the available browser, and no exported screens were attached. Exact visual matching remains unverified. The implementation follows the written brief and extends the existing visual identity. All original photos and logo assets are preserved.

See [application handoff](docs/application.md) for API routes, security behavior, database troubleshooting and deployment settings. [Phase A](docs/phase-a.md) is historical and superseded by the current implementation; no administrator role is included. Existing public About, Services and Contact guidance pages remain available. Collection steps are summarized on the homepage.
