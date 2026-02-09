import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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

  return httpServer;
}
