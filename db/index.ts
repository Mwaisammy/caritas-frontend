import "dotenv/config"
import { drizzle } from 'drizzle-orm/neon-http';

const databaseURL = process.env.DATABASE_URL as string;

if (!databaseURL) {
    throw new Error("DATABASE_URL is not set");
}

export const db = drizzle(databaseURL);
