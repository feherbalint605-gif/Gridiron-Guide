import { createApp } from "./app";
import type { Express } from "express";

// Vercel serverless entry point. Builds the Express app once per cold start
// and reuses it across warm invocations (Vercel keeps the module cache
// between calls to the same function instance). Static frontend files are
// served directly by Vercel from dist/public (see vercel.json), not from
// this function.
let appPromise: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = createApp().then(({ app }) => app);
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return (app as any)(req, res);
}
