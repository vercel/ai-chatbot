'use client';

import { useFormState } from 'react-dom';
import { ReactNode } from 'react';

interface AuthFormProps {
  action: (formData: FormData) => void;
  defaultEmail?: string;
  children: ReactNode;
}

export function AuthForm({ action, defaultEmail = '', children }: AuthFormProps) {
  const [_, formAction] = useFormState(async (_state, formData) => {
    action(formData);
    return {};
  }, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-zinc-200">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          required
          placeholder="work@email.com"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:bg-zinc-800 dark:text-white"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-200">
          Enter password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="********"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:bg-zinc-800 dark:text-white"
        />
      </div>

      {children}
    </form>
  );
}
