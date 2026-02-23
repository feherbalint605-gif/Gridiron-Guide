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
    const logs = await storage.getWorkoutLogs(req.user!.id, req.params.positionId);
    res.json(logs);
  });

  app.post("/api/workout-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const logData = {
        ...req.body,
        userId: req.user!.id,
        week: parseInt(req.body.week),
        setIndex: parseInt(req.body.setIndex),
        weight: parseInt(req.body.weight) || 0,
        reps: parseInt(req.body.reps) || 0
      };
      const log = await storage.saveWorkoutLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error saving workout log:", error);
      res.status(500).json({ message: "Failed to save workout log" });
    }
  });

  return httpServer;
}
