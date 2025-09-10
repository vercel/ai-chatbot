'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function InviteUserForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const role = formData.get('role') as string;

      const response = await fetch('/api/organization/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Invitation sent successfully!');
        // Reset form
        (event.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      toast.error('An error occurred while sending the invitation');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="user@example.com"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            <option value="employee">Employee</option>
            <option value="compliance_officer">Compliance Officer</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </form>
  );
}