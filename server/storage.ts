import { type Position, type PositionDetails, users, positions as positionsTable } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPositions(): Promise<Position[]>;
  getPositionDetails(id: string): Promise<PositionDetails | undefined>;
  updatePositionDetails(id: string, details: PositionDetails): Promise<void>;
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
}

export const storage = new DatabaseStorage();
