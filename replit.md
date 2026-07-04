# replit.md

## Overview

Football Training App — a web application for American football players to access position-specific workout and diet plans. Users select a position (QB, WR, RB, LB, DB, OL, DL) and view detailed gym/field workouts, diet plans with protein targets, and meal breakdowns. Coaches can manage athlete plans, add comments, and design offense playbook plays with an SVG-based play designer. Plays are organized into folders (stored as `folder` column on `playbook_plays` table). Athletes see coach-customized plans and can view the coach's playbook organized as folders → play thumbnails → full play detail view. The app features a dark mode design with neon blue/cyan accents and a sporty, modern interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, bundled by Vite
- **Styling**: Tailwind CSS with CSS custom properties for theming (dark mode with neon cyan accents). Custom fonts: Oxanium (display), Inter (body)
- **Component Library**: shadcn/ui (New York style) with Radix UI primitives. Components live in `client/src/components/ui/`
- **Animations**: Framer Motion for page transitions, hover effects, and card interactions
- **Routing**: wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state. No dedicated client state library
- **Custom Components**: `NeonCard`, `WorkoutCard`, `DietCard` in `client/src/components/`
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend
- **Framework**: Express.js running on Node with TypeScript (executed via tsx)
- **App Factory**: `server/app.ts` builds and wires the Express app (middleware, routes, error handler) without starting a listener — shared by both entry points below
- **Server Entry (long-running host, e.g. Replit)**: `server/index.ts` calls `createApp()`, then serves static files in production or sets up Vite dev middleware in development, then starts listening
- **Server Entry (Vercel serverless)**: `api/index.ts` calls `createApp()` once per cold start and forwards each request to the Express app; static frontend files are served by Vercel directly from `dist/public` (see `vercel.json`)
- **API Routes**: Defined in `server/routes.ts`, using a shared route manifest from `shared/routes.ts`
  - `GET /api/positions` — list all positions
  - `GET /api/positions/:id` — get detailed position data (workouts, diet, film study)
- **Route Manifest**: `shared/routes.ts` defines API paths, methods, and Zod response schemas. The `buildUrl` helper handles parameter substitution

### Data Layer
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod integration
- **Schema**: Defined in `shared/schema.ts`
  - `positions` table: `id` (text PK), `name`, `description`, `details` (JSONB containing workouts, diet, film study)
  - `users` table: User storage (id = Google profile id, email, name, avatar, role, coach/team links)
  - `sessions` table: For session management
- **Storage Pattern**: `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation. All data access goes through the exported `storage` singleton
- **Migrations**: Drizzle Kit configured in `drizzle.config.ts`, migrations output to `./migrations`. Use `npm run db:push` to push schema changes

### Authentication
- **Provider**: Google OAuth (via `passport-google-oauth20`) — platform-independent, works the same on Replit and on external hosts (e.g. Vercel)
- **Implementation**: Located in `server/auth/`
  - `googleAuth.ts`: Registers a Google OAuth strategy per hostname (supports multiple domains — dev, custom domain, Vercel domain — each must be added as an authorized redirect URI in the Google Cloud Console as `https://<domain>/api/callback`), session middleware using `connect-pg-simple`
  - `routes.ts`: `/api/auth/user` endpoint for fetching the current user
  - `storage.ts`: User upsert/get operations against the `users` table
- **Client Side**: `useAuth` hook in `client/src/hooks/use-auth.ts` checks authentication status and redirects to `/api/login` if unauthenticated
- **Session**: Stored in PostgreSQL `sessions` table (works unchanged in serverless since state is never kept in memory between requests), 1-week TTL, requires `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` env vars

### Build System
- **Development**: `npm run dev` runs `tsx server/index.ts` which sets up Vite dev server with HMR
- **Production Build**: `npm run build` runs `script/build.ts` which:
  1. Builds the client with Vite (output to `dist/public`)
  2. Bundles the server with esbuild (output to `dist/index.cjs`), externalizing most deps except an allowlist
- **Production Start**: `npm start` runs `node dist/index.cjs`

### Shared Code
- `shared/schema.ts`: Database table definitions and Zod validation schemas (workout, diet, position details)
- `shared/routes.ts`: API route manifest with paths and response types
- `shared/models/auth.ts`: Auth-related table definitions (users, sessions)

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connection via `DATABASE_URL` environment variable (currently a Supabase Postgres instance, pgbouncer/pooling port 6543). Used for positions data, user accounts, and session storage
- **Google OAuth**: Authentication provider. Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars, plus `SESSION_SECRET` for signing session cookies. Each domain the app runs on must be added as an authorized redirect URI in the Google Cloud Console

### Key npm Packages
- **Server**: express, drizzle-orm, pg, passport, passport-google-oauth20, express-session, connect-pg-simple, memoizee
- **Client**: react, @tanstack/react-query, wouter, framer-motion, radix-ui primitives, tailwindcss, lucide-react, zod
- **Build**: vite, esbuild, tsx, @vitejs/plugin-react

### Replit-Specific Plugins (dev-only, optional)
- `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` — dynamically imported in `vite.config.ts` only when `REPL_ID` is set, so the build is unaffected when these aren't installed on other platforms (e.g. Vercel)

### Deployment Targets
- **Replit**: Runs via `npm run dev` / `npm start` as before, no changes needed
- **Vercel**: `vercel.json` builds the client with `npm run build` and serves `dist/public` statically; API requests are routed to the serverless function in `api/index.ts`, which wraps the same Express app (`server/app.ts`) used by the Replit entry point. See `README.md` for setup steps