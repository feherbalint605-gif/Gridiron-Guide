import { type Position, type PositionDetails, type WorkoutLog, type InsertWorkoutLog, users, positions as positionsTable, workoutLogs } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getPositions(): Promise<Position[]>;
  getPositionDetails(id: string): Promise<PositionDetails | undefined>;
  updatePositionDetails(id: string, details: PositionDetails): Promise<void>;
  // Workout Logs
  getWorkoutLogs(userId: number, positionId: string): Promise<WorkoutLog[]>;
  saveWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
}

export class DatabaseStorage implements IStorage {
  async getPositions(): Promise<Position[]> {
    return await db.select().from(positionsTable);
  }

  async getPositionDetails(id: string): Promise<PositionDetails | undefined> {
    const [pos] = await db.select().from(positionsTable).where(eq(positionsTable.id, id));
    return pos?.details;
  }

  async updatePositionDetails(id: string, details: PositionDetails): Promise<void> {
    await db.update(positionsTable).set({ details }).where(eq(positionsTable.id, id));
  }

  async getWorkoutLogs(userId: number, positionId: string): Promise<WorkoutLog[]> {
    console.log("Fetching logs for userId:", userId, "positionId:", positionId);
    const result = await db.select().from(workoutLogs).where(
      and(
        eq(workoutLogs.userId, userId),
        eq(workoutLogs.positionId, positionId)
      )
    );
    console.log("Found logs count:", result.length);
    return result;
  }

  async saveWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    if (!log.userId) {
      throw new Error("userId is required to save workout log");
    }
    const [existing] = await db.select().from(workoutLogs).where(
      and(
        eq(workoutLogs.userId, log.userId),
        eq(workoutLogs.positionId, log.positionId),
        eq(workoutLogs.week, log.week),
        eq(workoutLogs.workoutTitle, log.workoutTitle),
        eq(workoutLogs.exerciseName, log.exerciseName),
        eq(workoutLogs.setIndex, log.setIndex)
      )
    );

    if (existing) {
      const [updated] = await db.update(workoutLogs)
        .set({ weight: log.weight, reps: log.reps })
        .where(eq(workoutLogs.id, existing.id))
        .returning();
      return updated;
    }

    const [newLog] = await db.insert(workoutLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
