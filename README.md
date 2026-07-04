# Football Training App

A web application for American football players to access position-specific workout and diet plans.

## Features

- **Position Selection**: Choose from QB, WR, RB, LB, DB, OL, DL.
- **Workout Plans**: Detailed gym (strength) and field (agility/technique) exercises.
- **Diet Plans**: Daily meal breakdowns and protein targets.
- **Dark Mode Design**: Modern, sporty interface with neon blue accents.

## Getting Started on Replit

1.  **Run the Application**:
    - Click the **Run** button at the top of the Replit editor.
    - This executes `npm run dev`, starting both the backend (port 5000) and frontend (Vite).

2.  **Access the App**:
    - A webview window should open automatically.
    - If not, click the "Webview" tab or "Open in New Tab" to view the app.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express
- **Data**: PostgreSQL (Drizzle ORM)
- **Routing**: wouter
- **Auth**: Email + password (`passport-local`, session-based, no external OAuth provider needed)

## Deploy to Vercel + Supabase (magyar útmutató)

Ez a projekt platformfüggetlen: ugyanaz a kód fut Replit-en és Vercel-en is.
A `server/app.ts` építi fel az Express appot, `server/index.ts` futtatja hosszan élő
szerverként (Replit/bármilyen Node host), `api/index.ts` pedig ugyanezt Vercel
serverless function-ként csomagolja be. Az adatbázis-kapcsolat a `DATABASE_URL`
környezeti változóból jön, natív `pg` driverrel — ez már most is Supabase Postgres.

### a) A repó GitHub-ra és Vercel-hez kötése

1. Pushold a projektet egy GitHub repóba (Replit-ből: Git panel → "Push to GitHub",
   vagy `git remote add origin ...` majd `git push`).
2. A [vercel.com](https://vercel.com) dashboardon: **Add New → Project**, válaszd ki a
   GitHub repót.
3. Vercel automatikusan felismeri a `vercel.json`-t:
   - Build parancs: `npm run build`
   - Frontend statikus fájlok: `dist/public`
   - API: `api/index.ts` → egyetlen serverless function, minden `/api/*` kérést ide irányít

### b) Környezeti változók beállítása a Vercel dashboardon

A projekt **Settings → Environment Variables** menüjében add hozzá (lásd `.env.example`):

| Változó | Érték |
|---|---|
| `DATABASE_URL` | Supabase connection string, **pooler (6543) port**-tal, produkciós forgalomhoz |
| `SESSION_SECRET` | Egy hosszú, véletlen string (session cookie aláírásához) |
| `NODE_ENV` | `production` |

A bejelentkezés e-mail + jelszó alapú (nincs szükség külső OAuth-providerre vagy
Authorized redirect URI beállításra), így ez a két változó (`DATABASE_URL`,
`SESSION_SECRET`) elég a bejelentkezés működéséhez.

### c) Supabase adatbázis inicializálása

1. Hozz létre egy projektet a [supabase.com](https://supabase.com) dashboardon (ha még nincs).
2. Kapcsolati stringet a **Settings → Database → Connection string** alól szerezd meg:
   - Migrációhoz (`drizzle-kit push`) a **direkt kapcsolat** (5432 port) ajánlott.
   - Futó appnak/serverless-nek a **Connection Pooling (pgbouncer, 6543 port)** ajánlott.
3. Állítsd be lokálisan a `DATABASE_URL`-t (pl. `.env` fájlban, ami nincs commitolva),
   majd futtasd:
   ```bash
   npm run db:push
   ```
   Ez létrehozza/frissíti a táblákat a `shared/schema.ts` alapján, migrációs fájlok
   módosítása nélkül.
4. Ellenőrizd a Supabase Table Editorban, hogy a `users`, `sessions`, `positions` stb.
   táblák létrejöttek.

### Megjegyzés

A `.replit` és a Replit-specifikus Vite pluginok (`@replit/vite-plugin-*`) a projektben
maradtak, hogy a fejlesztés a Replit felületén továbbra is zökkenőmentes legyen — ezek
csak `REPL_ID` környezeti változó megléte esetén töltődnek be, Vercel-en nincs rájuk
szükség és nem is aktiválódnak.
