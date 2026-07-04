import { users, type User, type UserWithPassword, type UpsertUser } from "@shared/models/auth";
import { db } from "../db";
import { eq } from "drizzle-orm";

const PUBLIC_COLUMNS = {
  id: users.id,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  profileImageUrl: users.profileImageUrl,
  role: users.role,
  coachId: users.coachId,
  selectedPositionId: users.selectedPositionId,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmailWithPassword(email: string): Promise<UserWithPassword | undefined>;
  createUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select(PUBLIC_COLUMNS).from(users).where(eq(users.id, id));
    return user;
  }

  // Only used internally by the login flow to verify the password hash.
  // Never send this over the API.
  async getUserByEmailWithPassword(email: string): Promise<UserWithPassword | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning(PUBLIC_COLUMNS);
    return user;
  }
}

export const authStorage = new AuthStorage();
