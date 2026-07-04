---
name: Football training app auth migration
description: Why auth ended up as email+password with a specific session user shape, for the Replit/Vercel/Supabase migration of the football training app.
---

The app was migrated off Replit Auth to be platform-independent (Replit + Vercel + Supabase Postgres). Auth went through two iterations: Google OAuth first, then the user switched to email+password.

**Decision: use `passport-local` + Node's built-in `crypto.scrypt` for password hashing, not bcrypt.**
**Why:** avoids native-module build issues across different hosts (Replit vs Vercel serverless), and needs no external provider dashboard/redirect-URI setup — fully portable.

**Decision: the session user object is always `{ claims: { sub: userId } }`, regardless of auth method used.**
**Why:** `server/routes.ts` and other server code reference `user.claims?.sub` extensively (a holdover from the original Replit OIDC auth). Keeping this shape avoids touching every handler when the auth method changes. Any future auth strategy swap should preserve this shape unless a full refactor of `server/routes.ts` is also in scope.

**Decision: `User` type (shared/models/auth.ts) omits `password`; a separate `UserWithPassword` type is used only internally in the login/verify flow.**
**Why:** prevents accidentally leaking the password hash through any endpoint that returns `User`.

**Environment note:** this project's `DATABASE_URL` (Supabase pooler) can go stale/unreachable ("tenant/user not found") independent of app code — always verify DB reachability with a direct `pg` connection test before assuming a schema-push or auth failure is caused by application code.
