import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./localAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    console.log("[AUTH/USER] Request received:", req.method, req.path);
    try {
      const userId = req.user.claims.sub;
      console.log("[AUTH/USER] Fetching user:", userId);
      const user = await authStorage.getUser(userId);
      console.log("[AUTH/USER] Sending 200");
      res.json(user);
    } catch (error) {
      console.error("[AUTH/USER ERROR]", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
