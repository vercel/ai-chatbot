import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.ATLAS_DB_HOST!,
  port: Number(process.env.ATLAS_DB_PORT!),
  user: process.env.ATLAS_DB_USER!,
  database: process.env.ATLAS_DB_NAME!,
  password: process.env.ATLAS_DB_PASSWORD!,
});

export const atlasdb = drizzle(connection);
