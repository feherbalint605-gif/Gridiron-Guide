import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { workoutLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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

  app.post("/api/user/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { role } = req.body;
    if (!['athlete', 'coach'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const user = req.user as any;
    const userId = user.id || user.claims?.sub;
    
    if (!userId) return res.status(401).json({ message: "User not found" });

    const [updatedUser] = await db.update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
      
    res.json(updatedUser);
  });

  // Set athlete's selected position
  app.post("/api/user/position", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.claims?.sub;
    if (!userId) return res.sendStatus(401);
    const { positionId } = req.body;
    const [updated] = await db.update(users).set({ selectedPositionId: positionId }).where(eq(users.id, userId)).returning();
    res.json(updated);
  });

  // Athlete joins a coach
  app.post("/api/user/join-coach", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.claims?.sub;
    if (!userId) return res.sendStatus(401);
    const { coachId } = req.body;
    const [updated] = await db.update(users).set({ coachId }).where(eq(users.id, userId)).returning();
    res.json(updated);
  });

  // List all coaches (for athlete to pick from)
  app.get("/api/coaches", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const coaches = await db.select().from(users).where(eq(users.role, "coach"));
    res.json(coaches);
  });

  // Coach: get my athletes (with their position and logs summary)
  app.get("/api/coach/athletes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.claims?.sub;
    if (!userId) return res.sendStatus(401);
    const athletes = await db.select().from(users).where(eq(users.coachId, userId));
    res.json(athletes);
  });

  // Coach: get specific athlete's workout logs for a position
  app.get("/api/coach/athletes/:athleteId/logs/:positionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const coachId = user.claims?.sub;
    if (!coachId) return res.sendStatus(401);

    const { athleteId, positionId } = req.params;
    // Verify this athlete belongs to this coach
    const [athlete] = await db.select().from(users).where(and(eq(users.id, athleteId), eq(users.coachId, coachId)));
    if (!athlete) return res.status(403).json({ message: "Athlete not found" });

    // athlete's numeric user id for workout_logs table
    const numericId = parseInt(String(athleteId).replace(/\D/g, "")) || 0;
    const logs = await db.select().from(workoutLogs).where(
      and(eq(workoutLogs.userId, numericId), eq(workoutLogs.positionId, positionId))
    );
    res.json(logs);
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
