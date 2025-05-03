import { apiClient } from './api-client';

export type UserType = 'guest' | 'regular';

export interface User {
  id: string;
  email: string;
  type: UserType;
}

export interface Session {
  user: User;
  expires: string;
}

export function signOut() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

export async function getSession(): Promise<Session | null> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Get user info from API
    const user = await apiClient.getMe();
    return {
      user: {
        id: user.id,
        email: user.email,
        type: user.type || 'regular'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };
  } catch (error) {
    return null;
  }
} 