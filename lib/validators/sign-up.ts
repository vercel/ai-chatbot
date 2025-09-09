import { z } from 'zod';
import { passwordSchema } from './password';

export const SignUpSchema = z.object({
  email: z.email(),
  password: passwordSchema
});

export type SignUp = z.infer<typeof SignUpSchema>;
