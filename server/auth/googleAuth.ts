import passport from "passport";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

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

function claimsFromProfile(profile: Profile) {
  return {
    sub: profile.id,
    email: profile.emails?.[0]?.value,
    first_name: profile.name?.givenName,
    last_name: profile.name?.familyName,
    profile_image_url: profile.photos?.[0]?.value,
  };
}

async function upsertUser(claims: ReturnType<typeof claimsFromProfile>) {
  await authStorage.upsertUser({
    id: claims.sub,
    email: claims.email,
    firstName: claims.first_name,
    lastName: claims.last_name,
    profileImageUrl: claims.profile_image_url,
  });
}

export async function setupAuth(app: Express) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set to enable Google login.",
    );
  }

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Keep track of registered strategies, one per hostname, so the app can
  // run behind multiple domains (Replit dev domain, custom domain, Vercel
  // domain) without hardcoding a single callback URL. Every domain used
  // must be added as an authorized redirect URI in the Google Cloud
  // Console: https://<domain>/api/callback
  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `google:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const protocol = domain.includes("localhost") ? "http" : "https";
      const strategy = new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: `${protocol}://${domain}/api/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const claims = claimsFromProfile(profile);
            await upsertUser(claims);
            done(null, { claims });
          } catch (err) {
            done(err as Error);
          }
        },
      );
      passport.use(strategyName, strategy);
      registeredStrategies.add(strategyName);
    }
    return strategyName;
  };

  passport.serializeUser((user: any, cb) => {
    cb(null, user);
  });
  passport.deserializeUser((user: any, cb) => {
    cb(null, user);
  });

  app.get("/api/login", (req, res, next) => {
    const hostname = req.get("x-forwarded-host") || req.hostname;
    const strategyName = ensureStrategy(hostname);
    passport.authenticate(strategyName, {
      scope: ["profile", "email"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const hostname = req.get("x-forwarded-host") || req.hostname;
    const strategyName = ensureStrategy(hostname);
    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
