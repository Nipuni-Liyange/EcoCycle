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

The original `MONGODB_URI` and `PORT` settings remain supported. The current Atlas connection failed verification with system and project DNS outside the sandbox. Check cluster availability, DNS/network access and your exact client IP in the Atlas access list. The diagnostic command never prints credentials. See `server/.env.example` for optional settings; **do not overwrite the existing .env**.

## Features

- Short responsive landing page retaining the original hero photograph, image library and branding.
- Real registration/login/logout, bcrypt passwords, revocable MongoDB sessions, HTTP-only cookies and CSRF protection.
- Exactly two roles: General User and Recycling Collector, with direct collector registration.
- Persistent create/read/update/delete operations for pickups, optional image, validation, search, filters and pagination.
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

## Design reference and documentation

The supplied Figma URL requires sign-in in the available browser, and no exported screens were attached. Exact visual matching remains unverified. The implementation follows the written brief and extends the existing visual identity. All original photos and logo assets are preserved.

See [application handoff](docs/application.md) for API routes, security behavior, database troubleshooting and deployment settings. [Phase A](docs/phase-a.md) is historical and superseded by the current implementation; no administrator role is included. Existing public About, How It Works, Services and Contact guidance pages remain available.
