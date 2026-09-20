import { z } from 'zod';
import { emailField } from '@/lib/validation';

// Sign-in only checks that both fields are filled in and the email is well formed.
// Password *strength* rules apply when a password is set, never when signing in with an existing one.
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required').max(64, 'Password is too long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
