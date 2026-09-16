import { db } from "@/db";
import { betterAuth } from "better-auth";
import { jwt, phoneNumber } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema"


const authBaseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const jwtIssuer = process.env.BETTER_AUTH_JWT_ISSUER || authBaseURL;
const jwtAudience = process.env.BETTER_AUTH_JWT_AUDIENCE || "go-api";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    phoneNumber({
        sendOTP: ({ phoneNumber, code}, ctx ) => {
            // Implement sending OTP code via SMS
        }
    }),
    jwt({
        jwt: {
            issuer: jwtIssuer,
            audience: jwtAudience,
            definePayload: ({ user }) => ({
                email: user.email,
                name: user.name,
            }),
        },
    })],
    baseURL: authBaseURL,
});