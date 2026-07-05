import { createApp } from "./app";
import type { Express } from "express";

// Vercel serverless entry point. Builds the Express app once per cold start
// and reuses it across warm invocations (Vercel keeps the module cache
// between calls to the same function instance). Static frontend files are
// served directly by Vercel from dist/public (see vercel.json), not from
// this function.
let appPromise: Promise<Express> | null = null;

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[UNCAUGHT EXCEPTION]", error);
});

async function getApp(): Promise<Express> {
  if (!appPromise) {
    console.log("[VERCEL] Creating Express app (cold start)...");
    appPromise = createApp().then(({ app }) => {
      console.log("[VERCEL] Express app created.");
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  console.log("[VERCEL] Incoming request:", req.method, req.url);
  try {
    const app = await getApp();
    return (app as any)(req, res);
  } catch (err) {
    console.error("[VERCEL HANDLER ERROR]", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
