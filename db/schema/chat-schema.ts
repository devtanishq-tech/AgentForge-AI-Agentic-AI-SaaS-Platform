import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { schema } from "./auth-schema";
// postsql auto deleted thread data if user data are get delected
export const thread = pgTable("theread", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  userid: text("user_id")
    .notNull()
    .references(() => schema.user.id, {
      onDelete: "cascade",
    }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});
