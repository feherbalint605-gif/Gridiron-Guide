import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We don't strictly need a DB table for hardcoded data, but we'll define the shape here
// so both frontend and backend share the types.

export * from "./models/auth";

export const positions = pgTable("positions", {
  id: text("id").primaryKey(), // e.g., 'qb', 'wr'
  name: text("name").notNull(),
  description: text("description").notNull(),
  details: jsonb("details").$type<PositionDetails>().notNull(),
});

export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  positionId: text("position_id").notNull(),
  week: integer("week").notNull(),
  workoutTitle: text("workout_title").notNull(),
  exerciseName: text("exercise_name").notNull(),
  setIndex: integer("set_index").notNull(),
  weight: integer("weight").notNull(), // in lbs
});

export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true });
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;

// JSON structures for the complex data
export const workoutSchema = z.object({
  type: z.enum(["strength", "agility", "technique"]),
  title: z.string(),
  exercises: z.array(z.object({
    name: z.string(),
    sets: z.string(),
    reps: z.string(),
    notes: z.string().optional()
  }))
});

export const dietSchema = z.object({
  meal: z.string(), // Breakfast, Lunch, etc.
  items: z.array(z.string()),
  calories: z.string().optional(),
  protein: z.string().optional()
});

export const positionDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  roleInfo: z.string(),
  workouts: z.object({
    gym: z.array(workoutSchema),
    field: z.array(workoutSchema)
  }),
  diet: z.object({
    meals: z.array(dietSchema),
    proteinTarget: z.string()
  }),
  filmStudy: z.array(z.string()).optional()
});

export type Position = typeof positions.$inferSelect;
export type PositionDetails = z.infer<typeof positionDetailsSchema>;
