import { generateDummyPassword } from "./db/utils";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";

export const guestRegex = /^(guest-\d+|temp-.+@.+)$/;

export const DUMMY_PASSWORD = generateDummyPassword();
