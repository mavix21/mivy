import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { jwt } from "better-auth/plugins";
import { jwtClient } from "better-auth/client/plugins";
import { env } from "./lib/env";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  plugins: [nextCookies(), jwt(), jwtClient()],
});
