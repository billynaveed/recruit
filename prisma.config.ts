// Prisma 7 no longer auto-loads .env in the config context, so load it here.
// This makes `prisma generate`/`migrate`/`db push`/`db seed` pick up .env
// after `cp .env.example .env`, with no extra steps.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
});
