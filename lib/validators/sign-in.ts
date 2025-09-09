import { z } from "zod";

export const SignInSchema = z.object({
  email: z.email(),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});
export type SignIn = z.infer<typeof SignInSchema>;
