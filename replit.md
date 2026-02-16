# replit.md

## Overview

Football Training App — a web application for American football players to access position-specific workout and diet plans. Users select a position (QB, WR, RB, LB, DB, OL, DL) and view detailed gym/field workouts, diet plans with protein targets, and meal breakdowns. The app features a dark mode design with neon blue/cyan accents and a sporty, modern interface.

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
- **Server Entry**: `server/index.ts` creates an HTTP server, registers routes, and serves static files in production or sets up Vite dev middleware in development
- **API Routes**: Defined in `server/routes.ts`, using a shared route manifest from `shared/routes.ts`
  - `GET /api/positions` — list all positions
  - `GET /api/positions/:id` — get detailed position data (workouts, diet, film study)
- **Route Manifest**: `shared/routes.ts` defines API paths, methods, and Zod response schemas. The `buildUrl` helper handles parameter substitution

### Data Layer
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod integration
- **Schema**: Defined in `shared/schema.ts`
  - `positions` table: `id` (text PK), `name`, `description`, `details` (JSONB containing workouts, diet, film study)
  - `users` table: For Replit Auth user storage
  - `sessions` table: For session management
- **Storage Pattern**: `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation. All data access goes through the exported `storage` singleton
- **Migrations**: Drizzle Kit configured in `drizzle.config.ts`, migrations output to `./migrations`. Use `npm run db:push` to push schema changes

### Authentication
- **Provider**: Replit Auth (OpenID Connect)
- **Implementation**: Located in `server/replit_integrations/auth/`
  - `replitAuth.ts`: OIDC discovery, passport strategy, session middleware using `connect-pg-simple`
  - `routes.ts`: `/api/auth/user` endpoint for fetching the current user
  - `storage.ts`: User upsert/get operations against the `users` table
- **Client Side**: `useAuth` hook in `client/src/hooks/use-auth.ts` checks authentication status and redirects to `/api/login` if unauthenticated
- **Session**: Stored in PostgreSQL `sessions` table, 1-week TTL, requires `SESSION_SECRET` env var

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
- **PostgreSQL Database**: Required. Connection via `DATABASE_URL` environment variable. Used for positions data, user accounts, and session storage
- **Replit Auth (OIDC)**: Authentication provider. Requires `REPL_ID` and `SESSION_SECRET` environment variables. Issuer URL defaults to `https://replit.com/oidc`

### Key npm Packages
- **Server**: express, drizzle-orm, pg, passport, express-session, connect-pg-simple, openid-client, memoizee
- **Client**: react, @tanstack/react-query, wouter, framer-motion, radix-ui primitives, tailwindcss, lucide-react, zod
- **Build**: vite, esbuild, tsx, @vitejs/plugin-react

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner`: Dev banner (dev only)