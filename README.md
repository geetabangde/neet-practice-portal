# NEET PG Practice Portal

One repository with two separate applications:

```
neet-practice-portal/
├── frontend/   Student website (Next.js, React, TypeScript, Tailwind CSS)
├── backend/    API server (Node.js, Express, TypeScript)
├── .gitignore
└── README.md
```

Each folder has its own `package.json` and `package-lock.json`. They are installed, started and built independently.

## Requirements

Node.js 20.9 or newer (22 is recommended) and npm.

## Frontend (http://localhost:3000)

```bash
cd frontend
npm install        # first time only (use "npm ci" to install exactly what package-lock.json says)
npm run dev        # development server
```

Other commands: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm start`.

`frontend/AGENTS.md` is created and kept up to date by Next.js itself. Leave it where it is.

## Backend (http://localhost:5000)

```bash
cd backend
npm install        # first time only
cp .env.example .env   # then edit the values if you need to
npm run dev        # development server with auto-restart
```

Other commands: `npm run typecheck`, `npm run build`, `npm start` (runs the built code from `dist/`).

Check that it works: open http://localhost:5000/api/health. You should see:

```json
{ "success": true, "message": "NEET PG backend is running" }
```

The backend has only this health endpoint for now. There is no database, login or other API yet.

## Environment files

- Real `.env` files hold secrets. They are ignored by Git and must never be committed.
- `backend/.env.example` shows the names of the settings with placeholder values. It is safe to commit.

## How the two apps will talk to each other

The browser loads the website from the frontend (port 3000). When the website needs data, it sends a request to the backend (port 5000), for example `fetch("http://localhost:5000/api/health")`. The backend only accepts browser requests from the address in `FRONTEND_ORIGIN` (CORS). Each application can be started, tested and deployed on its own.

## Deploying the frontend

The frontend is a normal Next.js app, so `frontend/` is the folder to upload or connect to a host. When you make a zip for a host, zip the contents of `frontend/` and leave out `node_modules`, `.next` and `.git`.
