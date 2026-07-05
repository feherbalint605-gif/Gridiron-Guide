import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { authStorage } from "./storage";

const scrypt = promisify(scryptCallback);

// Platform-agnostic session setup. Sessions live in Postgres so this works
// identically on Replit and on stateless/serverless hosts like Vercel,
// since state is never kept in server memory between requests.
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(hashHex, "hex");
  if (storedKey.length !== derivedKey.length) return false;
  return timingSafeEqual(storedKey, derivedKey);
}

export async function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set to enable login.");
  }

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email: string, password: string, done) => {
        try {
          const user = await authStorage.getUserByEmailWithPassword(email.trim().toLowerCase());
          if (!user || !user.password) {
            return done(null, false, { message: "Hibás e-mail vagy jelszó." });
          }
          const valid = await verifyPassword(password, user.password);
          if (!valid) {
            return done(null, false, { message: "Hibás e-mail vagy jelszó." });
          }
          const { password: _omit, ...publicUser } = user;
          return done(null, { claims: { sub: publicUser.id } });
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );

  passport.serializeUser((user: any, cb) => {
    cb(null, user);
  });
  passport.deserializeUser((user: any, cb) => {
    cb(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    console.log("[REGISTER] Request received:", req.method, req.path, req.body);
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      const firstName = req.body.firstName ? String(req.body.firstName) : undefined;
      const lastName = req.body.lastName ? String(req.body.lastName) : undefined;

      console.log("[REGISTER] Parsed input:", { email, firstName, lastName, passwordLength: password.length });

      if (!email || !email.includes("@")) {
        console.log("[REGISTER] Validation failed: invalid email");
        return res.status(400).json({ message: "Érvényes e-mail cím szükséges." });
      }
      if (password.length < 8) {
        console.log("[REGISTER] Validation failed: password too short");
        return res.status(400).json({ message: "A jelszónak legalább 8 karakternek kell lennie." });
      }

      const existing = await authStorage.getUserByEmailWithPassword(email);
      if (existing) {
        console.log("[REGISTER] User already exists:", email);
        return res.status(409).json({ message: "Ez az e-mail cím már regisztrálva van." });
      }

      const hashed = await hashPassword(password);
      console.log("[REGISTER] Password hashed, creating user...");
      const user = await authStorage.createUser({
        email,
        password: hashed,
        firstName,
        lastName,
      });
      console.log("[REGISTER] User created:", user.id, user.email);

      req.login({ claims: { sub: user.id } }, (err) => {
        if (err) {
          console.error("[REGISTER LOGIN ERROR]", err);
          return next(err);
        }
        console.log("[REGISTER] Login session created, sending 200");
        res.json(user);
      });
    } catch (err) {
      console.error("[REGISTER ERROR]", err);
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("[LOGIN] Request received:", req.method, req.path, req.body);
    passport.authenticate("local", (err: Error | null, user: any, info: { message?: string } | undefined) => {
      if (err) {
        console.error("[LOGIN PASSPORT ERROR]", err);
        return next(err);
      }
      if (!user) {
        console.log("[LOGIN] Authentication failed:", info?.message || "unknown reason");
        return res.status(401).json({ message: info?.message || "Hibás e-mail vagy jelszó." });
      }
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error("[LOGIN SESSION ERROR]", loginErr);
          return next(loginErr);
        }
        console.log("[LOGIN] Session created for user:", user.claims?.sub);
        const fullUser = await authStorage.getUser(user.claims.sub);
        console.log("[LOGIN] Sending 200 with user:", fullUser?.id, fullUser?.email);
        res.json(fullUser);
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.sendStatus(200);
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
