import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { workoutLogs, athletePlanOverrides, coachComments, playbookPlays } from "@shared/schema";
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

    // If athlete has a coach, check for a custom plan override
    if (req.isAuthenticated()) {
      const user = req.user as any;
      const athleteId = user.claims?.sub;
      if (athleteId) {
        const [dbUser] = await db.select().from(users).where(eq(users.id, athleteId));
        if (dbUser?.coachId) {
          const [override] = await db.select().from(athletePlanOverrides).where(
            and(eq(athletePlanOverrides.coachId, dbUser.coachId), eq(athletePlanOverrides.athleteId, athleteId), eq(athletePlanOverrides.positionId, id))
          );
          if (override) return res.json(override.details);
        }
      }
    }

    const details = await storage.getPositionDetails(id);
    if (!details) return res.status(404).json({ message: "Position not found" });
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

  // Athlete joins a coach (by coachId or email)
  app.post("/api/user/join-coach", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.claims?.sub;
    if (!userId) return res.sendStatus(401);
    const { coachId, email } = req.body;

    let resolvedCoachId = coachId;

    if (!resolvedCoachId && email) {
      const [coach] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
      if (!coach) return res.status(404).json({ message: "Nem találtunk ilyen e-mail című edzőt." });
      if (coach.role !== "coach") return res.status(400).json({ message: "Ez a felhasználó nem edző." });
      resolvedCoachId = coach.id;
    }

    if (!resolvedCoachId) return res.status(400).json({ message: "Érvénytelen kérés." });

    const [updated] = await db.update(users).set({ coachId: resolvedCoachId }).where(eq(users.id, userId)).returning();
    res.json(updated);
  });

  // Athlete leaves their coach
  app.post("/api/user/leave-coach", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.claims?.sub;
    if (!userId) return res.sendStatus(401);
    const [updated] = await db.update(users).set({ coachId: null }).where(eq(users.id, userId)).returning();
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

  // Coach: get plan for athlete (override or default)
  app.get("/api/coach/athletes/:athleteId/plan/:positionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const coachId = user.claims?.sub;
    if (!coachId) return res.sendStatus(401);
    const { athleteId, positionId } = req.params;

    const [override] = await db.select().from(athletePlanOverrides).where(
      and(eq(athletePlanOverrides.coachId, coachId), eq(athletePlanOverrides.athleteId, athleteId), eq(athletePlanOverrides.positionId, positionId))
    );
    if (override) return res.json(override.details);

    const details = await storage.getPositionDetails(positionId);
    if (!details) return res.status(404).json({ message: "Position not found" });
    res.json(details);
  });

  // Coach: save plan override for athlete
  app.post("/api/coach/athletes/:athleteId/plan/:positionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const coachId = user.claims?.sub;
    if (!coachId) return res.sendStatus(401);
    const { athleteId, positionId } = req.params;
    const details = req.body;

    const [upserted] = await db.insert(athletePlanOverrides)
      .values({ coachId, athleteId, positionId, details })
      .onConflictDoUpdate({
        target: [athletePlanOverrides.coachId, athletePlanOverrides.athleteId, athletePlanOverrides.positionId],
        set: { details, updatedAt: new Date() }
      })
      .returning();
    res.json(upserted);
  });

  // Coach: get comments for athlete's position
  app.get("/api/coach/athletes/:athleteId/comments/:positionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const coachId = user.claims?.sub;
    if (!coachId) return res.sendStatus(401);
    const { athleteId, positionId } = req.params;

    const comments = await db.select().from(coachComments).where(
      and(eq(coachComments.coachId, coachId), eq(coachComments.athleteId, athleteId), eq(coachComments.positionId, positionId))
    );
    res.json(comments);
  });

  // Coach: save/update a comment
  app.post("/api/coach/comment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const coachId = user.claims?.sub;
    if (!coachId) return res.sendStatus(401);
    const { athleteId, positionId, workoutTitle, exerciseName, comment } = req.body;

    const [upserted] = await db.insert(coachComments)
      .values({ coachId, athleteId, positionId, workoutTitle, exerciseName, comment })
      .onConflictDoUpdate({
        target: [coachComments.coachId, coachComments.athleteId, coachComments.positionId, coachComments.workoutTitle, coachComments.exerciseName],
        set: { comment, updatedAt: new Date() }
      })
      .returning();
    res.json(upserted);
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

  // Athlete: get their coach's comments for a position
  app.get("/api/my-coach-comments/:positionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const athleteId = user.claims?.sub;
    if (!athleteId) return res.sendStatus(401);

    // Look up which coach this athlete belongs to
    const [dbUser] = await db.select().from(users).where(eq(users.id, athleteId));
    if (!dbUser?.coachId) return res.json([]);

    const comments = await db.select().from(coachComments).where(
      and(
        eq(coachComments.coachId, dbUser.coachId),
        eq(coachComments.athleteId, athleteId),
        eq(coachComments.positionId, req.params.positionId)
      )
    );
    res.json(comments);
  });

  // ── Playbook CRUD ──

  const requireCoach = async (req: any, res: any): Promise<string | null> => {
    if (!req.isAuthenticated()) { res.sendStatus(401); return null; }
    const user = req.user as any;
    const coachId = user.claims?.sub;
    if (!coachId) { res.sendStatus(401); return null; }
    const [dbUser] = await db.select().from(users).where(eq(users.id, coachId));
    if (!dbUser || dbUser.role !== 'coach') { res.status(403).json({ message: "Coach only" }); return null; }
    return coachId;
  };

  app.get("/api/playbook", async (req, res) => {
    const coachId = await requireCoach(req, res);
    if (!coachId) return;
    const rows = await db.select().from(playbookPlays).where(eq(playbookPlays.coachId, coachId)).orderBy(playbookPlays.createdAt);
    res.json(rows);
  });

  app.post("/api/playbook", async (req, res) => {
    const coachId = await requireCoach(req, res);
    if (!coachId) return;
    const { name, data } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: "Name required" });
    if (!data || typeof data !== 'object') return res.status(400).json({ message: "Invalid play data" });
    const [play] = await db.insert(playbookPlays).values({ coachId, name: name.trim(), data }).returning();
    res.json(play);
  });

  app.put("/api/playbook/:id", async (req, res) => {
    const coachId = await requireCoach(req, res);
    if (!coachId) return;
    const id = parseInt(req.params.id);
    const { name, data } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: "Name required" });
    if (!data || typeof data !== 'object') return res.status(400).json({ message: "Invalid play data" });
    const [play] = await db.update(playbookPlays).set({ name: name.trim(), data }).where(
      and(eq(playbookPlays.id, id), eq(playbookPlays.coachId, coachId))
    ).returning();
    if (!play) return res.status(404).json({ message: "Not found" });
    res.json(play);
  });

  app.delete("/api/playbook/:id", async (req, res) => {
    const coachId = await requireCoach(req, res);
    if (!coachId) return;
    const id = parseInt(req.params.id);
    await db.delete(playbookPlays).where(
      and(eq(playbookPlays.id, id), eq(playbookPlays.coachId, coachId))
    );
    res.sendStatus(204);
  });

  app.get("/api/my-playbook", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const athleteId = user.claims?.sub;
    if (!athleteId) return res.sendStatus(401);
    const [dbUser] = await db.select().from(users).where(eq(users.id, athleteId));
    if (!dbUser?.coachId) return res.json([]);
    const rows = await db.select().from(playbookPlays).where(eq(playbookPlays.coachId, dbUser.coachId)).orderBy(playbookPlays.createdAt);
    res.json(rows);
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
