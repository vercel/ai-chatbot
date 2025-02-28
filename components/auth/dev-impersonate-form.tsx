'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { impersonateUser } from '@/app/(auth)/dev-auth-actions';

export function DevImpersonateForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await impersonateUser(email);
      
      if (result.status === 'success') {
        router.push('/');
        router.refresh();
      } else if (result.status === 'not_found') {
        setError('User not found');
      } else {
        setError('Failed to impersonate user');
      }
    } catch (error) {
      setError('An error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter user email to impersonate"
          required
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
      >
        {isLoading ? 'Impersonating...' : 'Impersonate User'}
      </button>
    </form>
  );
} 