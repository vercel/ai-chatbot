'use server';

import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/app/(auth)/auth';

/**
 * Role-based access control middleware
 * Use this on server components to check if the user has the required role
 * @param requiredRole - The role required to access the resource
 * @returns A function that throws a redirect if the user doesn't have the required role
 */
export async function requireRole(requiredRole: UserRole) {
  const session = await auth();

  // Not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // User doesn't have the required role
  if (
    session.user.role !== requiredRole &&
    !(requiredRole === 'user' && session.user.role === 'admin')
  ) {
    // Admins can access user routes, but users cannot access admin routes
    redirect('/');
  }
}

/**
 * Check if the current user has admin access
 * @returns Boolean indicating if the user has admin access
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === 'admin' || false;
}

/**
 * Middleware to protect admin routes
 * Will redirect to home page if the user is not an admin
 */
export async function requireAdmin() {
  return requireRole('admin');
}
