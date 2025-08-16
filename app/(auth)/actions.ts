'use server';

import { z } from 'zod';

import { 
  createUser, 
  getUser,
  getInvitationByToken,
  updateInvitationStatus,
} from '@/lib/db/queries';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data'
    | 'invalid_token'
    | 'expired_token';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    // Get the invitation token from form data
    const token = formData.get('token') as string;
    
    if (!token) {
      return { status: 'invalid_token' };
    }

    // Validate the invitation token
    const invitation = await getInvitationByToken(token);
    
    if (!invitation) {
      return { status: 'invalid_token' };
    }

    // Check if invitation is expired
    if (new Date(invitation.expiresAt) < new Date()) {
      return { status: 'expired_token' };
    }

    // Check if invitation has already been used or revoked
    if (invitation.status !== 'pending') {
      return { status: 'invalid_token' };
    }

    // Check if the email matches the invitation
    if (invitation.email !== validatedData.email) {
      return { status: 'invalid_data' };
    }

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }

    // Create the user with the inviter reference
    await createUser(
      validatedData.email, 
      validatedData.password,
      invitation.invitedBy,
    );

    // Mark the invitation as accepted
    await updateInvitationStatus(token, 'accepted');

    // Sign in the new user
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
