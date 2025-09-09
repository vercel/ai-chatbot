import { z } from 'zod';
import { passwordSchema } from './password';

export const SignInSchema = z.object({
  email: z.email(),
  password: passwordSchema
});
export type SignIn = z.infer<typeof SignInSchema>;
