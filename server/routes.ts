import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication first
  await setupAuth(app);
  registerAuthRoutes(app);
  
  app.get(api.positions.list.path, async (_req, res) => {
    const positions = await storage.getPositions();
    res.json(positions);
  });

  app.get(api.positions.get.path, async (req, res) => {
    const id = req.params.id;
    const details = await storage.getPositionDetails(id);
    
    if (!details) {
      return res.status(404).json({ message: "Position not found" });
    }
    
    res.json(details);
  });

  app.get("/api/workout-logs/:positionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.id || user.claims?.sub || "999";
    
    // Ensure numeric ID for database
    const dbUserId = typeof userId === 'number' ? userId : parseInt(String(userId).replace(/\D/g, '')) || 999;
    
    const logs = await storage.getWorkoutLogs(dbUserId, req.params.positionId);
    res.json(logs);
  });

  app.post("/api/workout-logs", async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthorized attempt to save log");
      return res.status(401).json({ message: "Jelentkezz be a mentéshez!" });
    }
    try {
      const user = req.user as any;
      const userId = user.id || user.claims?.sub || "999";
      
      const logData = {
        ...req.body,
        userId: typeof userId === 'number' ? userId : parseInt(String(userId).replace(/\D/g, '')) || 999,
        week: parseInt(req.body.week),
        setIndex: parseInt(req.body.setIndex),
        weight: parseInt(req.body.weight) || 0,
        reps: parseInt(req.body.reps) || 0
      };
      
      const log = await storage.saveWorkoutLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error saving workout log:", error);
      res.status(500).json({ message: "Hiba történt a mentés során." });
    }
  });

  return httpServer;
}
