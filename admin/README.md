# NEET PG Admin Panel

The admin console for the NEET PG platform. It is a separate Next.js app (port **3001**) next to the student site (`../frontend`, port 3000) and the API (`../backend`, port 5000).

**It uses dummy data only.** There is no backend or database connected yet. Add, edit and delete work on the screen and are shared between pages, but everything resets when the browser page is refreshed.

## Run it

```bash
cd admin
npm install        # first time only (use "npm ci" to install exactly what package-lock.json says)
npm run dev        # http://localhost:3001
```

Other commands: `npm run lint`, `npm run typecheck`, `npm run build`, `npm start`.

Any email and a password of 6 or more characters works on the sign-in page (it is a demo).

## Folder structure

```
src/
  app/
    (auth)/login/            Sign-in page (has its own layout, no sidebar)
    (admin)/                 Every page that needs the sidebar and header
      layout.tsx             Adds the sidebar, header and the shared data store
      dashboard/ students/ subjects/ topics/ questions/ tests/
      results/ analytics/ subscriptions/ payments/ notifications/ settings/
  components/
    layout/                  Sidebar, header, global search, the AdminShell frame
    ui/                      Basic parts: button, card, table, modal, form fields, tabs ...
    common/                  Parts shared by pages: page header, stat card, status badges
    charts/                  Charts drawn with SVG/CSS (no chart library)
    dashboard/ students/ subjects/ topics/ questions/ tests/ results/
    analytics/ plans/ payments/ notifications/ settings/ auth/   One folder per module
    providers/               Toast messages and the shared data store
  data/                      The dummy data (one file per kind of data)
  hooks/                     Small reusable hooks (pagination, dialog, collection ...)
  lib/                       Helpers: formatting, ids, selectors, the sidebar menu (nav.ts)
  types/                     TypeScript types for all the data
```

The folders `(auth)` and `(admin)` are Next.js *route groups*: they organise files and share layouts, but they do **not** appear in the URL (`(admin)/students` is `/students`).

## Add a new admin page

1. Create `src/app/(admin)/my-page/page.tsx`. It automatically gets the sidebar and header.
2. Put the page's interactive parts in `src/components/my-page/` (a client component that starts with `"use client"`).
3. Add one line to `src/lib/nav.ts` so it appears in the sidebar.

## Connecting the backend later

All data comes from one place: `src/components/providers/admin-store-provider.tsx`. It starts from `src/data` and keeps the lists in React state. To use the real API, change that file so it loads and saves through `../backend` instead; the pages do not need to change. The types in `src/types/index.ts` describe the shapes the API should return.
