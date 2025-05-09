'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
  changeUserPassword,
} from '@/lib/db/queries';
import { requireAdmin } from '@/lib/rbac/middleware';
import { generateRandomPassword } from '@/lib/utils';

// User actions
export async function fetchUsers() {
  await requireAdmin();
  return await getUsers();
}

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin'], {
    required_error: 'Please select a role',
  }),
});

export type UserFormState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
};

export async function addUser(
  prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();

  try {
    const validatedFields = userSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
    });

    await createUser(validatedFields.email, validatedFields.password);

    // If the role is admin, update the role
    if (validatedFields.role === 'admin') {
      const users = await getUsers();
      const user = users.find((u) => u.email === validatedFields.email);
      if (user) {
        await updateUserRole(user.id, 'admin');
      }
    }

    revalidatePath('/admin/users');
    return { status: 'success', message: 'User created successfully' };
  } catch (error) {
    console.error('Failed to create user:', error);
    if (error instanceof z.ZodError) {
      return {
        status: 'error',
        message: error.errors[0].message,
      };
    }

    // Handle duplicate email
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return {
        status: 'error',
        message: 'A user with this email already exists',
      };
    }

    return {
      status: 'error',
      message: 'Failed to create user. Please try again.',
    };
  }
}

export async function updateRole(userId: string, role: 'user' | 'admin') {
  await requireAdmin();

  try {
    await updateUserRole(userId, role);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

export async function removeUser(userId: string) {
  await requireAdmin();

  try {
    await deleteUser(userId);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function resetPassword(userId: string) {
  await requireAdmin();

  try {
    // Generate a new random password
    const newPassword = generateRandomPassword(12);

    // Update the user's password in the database
    await changeUserPassword(userId, newPassword);

    // In a real implementation, you would send this via email
    // For now, we'll just return it
    return {
      success: true,
      newPassword,
    };
  } catch (error) {
    console.error('Failed to reset password:', error);
    return {
      success: false,
      error: 'Failed to reset password',
    };
  }
}
