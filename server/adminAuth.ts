import type { Express, RequestHandler } from "express";
import { randomBytes, randomInt, createHash, timingSafeEqual } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { adminLoginAttempts, adminSessions } from "@shared/schema";
import { authStorage } from "./auth/storage";
import { verifyPassword } from "./auth/localAuth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_COOKIE = "admin_session";
const CODE_TTL_MS = 5 * 60 * 1000; // 5 perc
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 óra
const MAX_ATTEMPTS = 5;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function getCookie(req: any, name: string): string | undefined {
  const header = req.headers?.cookie;
  if (!header) return undefined;
  const parts: string[] = header.split(";").map((c: string) => c.trim());
  const match = parts.find((c: string) => c.startsWith(name + "="));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

export function registerAdminAuthRoutes(app: Express) {
  // 1. lépés: email + jelszó ellenőrzés, ha jó, kód megy emailben
  app.post("/api/admin/request-login", async (req, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");

      if (!ADMIN_EMAIL || email !== ADMIN_EMAIL) {
        return res.status(401).json({ message: "Hibás e-mail vagy jelszó." });
      }

      const user = await authStorage.getUserByEmailWithPassword(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Hibás e-mail vagy jelszó." });
      }
      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Hibás e-mail vagy jelszó." });
      }

      const code = randomInt(100000, 999999).toString();
      const id = randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + CODE_TTL_MS);

      await db.insert(adminLoginAttempts).values({
        id,
        codeHash: hashCode(code),
        expiresAt,
        used: false,
        attempts: 0,
      });

      await resend.emails.send({
        from: process.env.ADMIN_FROM_EMAIL || "onboarding@resend.dev",
        to: ADMIN_EMAIL,
        subject: "Admin belépési kód — Gridiron Guide",
        text: `A belépési kódod: ${code}\n\nEz a kód 5 percig érvényes.`,
      });

      res.json({ attemptId: id });
    } catch (err) {
      console.error("[ADMIN LOGIN ERROR]", err);
      res.status(500).json({ message: "Hiba történt." });
    }
  });

  // 2. lépés: kód ellenőrzése, admin session cookie kiadása
  app.post("/api/admin/verify-login", async (req, res) => {
    try {
      const { attemptId, code } = req.body;
      if (!attemptId || !code) {
        return res.status(400).json({ message: "Hiányzó adatok." });
      }

      const [attempt] = await db.select().from(adminLoginAttempts).where(eq(adminLoginAttempts.id, attemptId));

      if (!attempt || attempt.used || new Date(attempt.expiresAt).getTime() < Date.now()) {
        return res.status(401).json({ message: "Lejárt vagy érvénytelen kód." });
      }

      if (attempt.attempts >= MAX_ATTEMPTS) {
        return res.status(429).json({ message: "Túl sok próbálkozás." });
      }

      const isValid = safeCompare(hashCode(String(code)), attempt.codeHash);

      if (!isValid) {
        await db.update(adminLoginAttempts)
          .set({ attempts: attempt.attempts + 1 })
          .where(eq(adminLoginAttempts.id, attemptId));
        return res.status(401).json({ message: "Hibás kód." });
      }

      await db.update(adminLoginAttempts).set({ used: true }).where(eq(adminLoginAttempts.id, attemptId));

      const token = randomBytes(32).toString("hex");
      const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
      await db.insert(adminSessions).values({ token, expiresAt: sessionExpiresAt });

      res.cookie(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: SESSION_TTL_MS,
      });

      res.json({ ok: true });
    } catch (err) {
      console.error("[ADMIN VERIFY ERROR]", err);
      res.status(500).json({ message: "Hiba történt." });
    }
  });

  // Van-e már érvényes admin munkamenet ebben a böngészőben?
  app.get("/api/admin/check", async (req, res) => {
    const token = getCookie(req, ADMIN_COOKIE);
    if (!token) return res.json({ ok: false });

    const [session] = await db.select().from(adminSessions).where(eq(adminSessions.token, token));
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      return res.json({ ok: false });
    }
    res.json({ ok: true });
  });

  app.post("/api/admin/logout", async (req, res) => {
    const token = getCookie(req, ADMIN_COOKIE);
    if (token) {
      await db.delete(adminSessions).where(eq(adminSessions.token, token));
    }
    res.clearCookie(ADMIN_COOKIE);
    res.json({ ok: true });
  });
}

// Ezt a middleware-t fogjuk használni a jövőbeli admin-végpontoknál
// (userek listázása, tiltás stb.)
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const token = getCookie(req, ADMIN_COOKIE);
  if (!token) return res.status(401).json({ message: "Admin bejelentkezés szükséges." });

  const [session] = await db.select().from(adminSessions).where(eq(adminSessions.token, token));
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    return res.status(401).json({ message: "Admin munkamenet lejárt." });
  }
  next();
};
