'use server';

import { z } from 'zod';

import { createUser, getUser } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { organization } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

import { signIn } from './auth';

async function getOrCreateDefaultOrganization(): Promise<string> {
  let defaultOrg = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, 'default'))
    .limit(1);

  if (defaultOrg.length === 0) {
    defaultOrg = await db
      .insert(organization)
      .values({
        name: 'Default Organization',
        slug: 'default',
      })
      .returning();
  }

  return defaultOrg[0].id;
}

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
    | 'invalid_data';
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

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }
    
    const defaultOrgId = await getOrCreateDefaultOrganization();
    await createUser(validatedData.email, validatedData.password, defaultOrgId);
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
