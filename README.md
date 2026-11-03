# NEET PG Practice Portal

One repository with three separate applications:

```
neet-practice-portal/
├── frontend/   Student website (Next.js, React, TypeScript, Tailwind CSS)
├── admin/      Admin panel (Next.js, TypeScript, Tailwind CSS, dummy data)
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

## Admin panel (http://localhost:3001)

```bash
cd admin
npm install        # first time only
npm run dev        # development server
```

Other commands: `npm run lint`, `npm run typecheck`, `npm run build`, `npm start`. It shows dummy data only and is not connected to the backend yet. See [admin/README.md](admin/README.md) for the folder structure and how to add a page.

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
- `backend/.env.example` and `admin/.env.example` show the names of the settings with placeholder values. They are safe to commit.

## How the two apps will talk to each other

The browser loads the student website from the frontend (port 3000) and the admin panel from the admin app (port 3001). When they need data, they send a request to the backend (port 5000), for example `fetch("http://localhost:5000/api/health")`. The backend only accepts browser requests from the address in `FRONTEND_ORIGIN` (CORS). When the admin panel starts calling the API, its address (`http://localhost:3001`) must be allowed there too. Each application can be started, tested and deployed on its own.

## Deploying the frontend

The frontend is a normal Next.js app, so `frontend/` is the folder to upload or connect to a host. When you make a zip for a host, zip the contents of `frontend/` and leave out `node_modules`, `.next` and `.git`.
