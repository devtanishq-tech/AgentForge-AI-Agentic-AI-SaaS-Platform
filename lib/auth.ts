import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { schema } from "@/db/schema/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // if we database , is mysql or sqllite
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
});
