import { apiClient } from './api-client';

export async function signOut() {
  // Clear the token from localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
  // Redirect to login page
  window.location.href = '/login';
}

export async function getSession(): Promise<{ user: { id: string; type: 'guest' | 'regular' } } | null> {
  try {
    // Get the token from localStorage
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Get organization details which will include user info
    const org = await apiClient.getOrganization();
    return {
      user: {
        id: org.id,
        type: org.type || 'regular'
      }
    };
  } catch (error) {
    return null;
  }
} 