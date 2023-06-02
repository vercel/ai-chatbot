import { migrate } from "drizzle-orm/vercel-postgres/migrator";
import { db } from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

// @ts-ignore
migrate(db, {
  migrationsFolder: "lib/db/migrations",
})
  .then(() => {
    console.log("Migration was succesfull!");
  })
  .catch((err) => {
    console.error("Migration failed:", err);
  })
  .finally(() => {
    console.info("Migration finished");
  });
