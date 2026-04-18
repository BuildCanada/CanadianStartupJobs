// Export all schema definitions from this file
// Add your table schemas here or import them from separate files

import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  remoteOk: boolean("remote_ok").notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  description: text("description").notNull(),
  company: text("company").notNull(),
  jobBoardUrl: text("job_board_url"),
  postingUrl: text("posting_url"),
  isAtAStartup: boolean("is_at_a_startup"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

