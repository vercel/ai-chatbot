import { z } from "zod";

export const SignUpSchema = z.object({
    email: z.email(),
    password: z.string().min(6, {
      message: "Password must be at least 6 characters",
    }),
});
  
export type SignUp = z.infer<typeof SignUpSchema>;