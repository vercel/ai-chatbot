import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export type UserType = "guest" | "regular";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    fields: {
      name: "name",
      type: "type",
    },
    additionalFields: {},
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
});
