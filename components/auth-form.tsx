import Form from 'next/form';

import { Input } from './ui/input';
import { Label } from './ui/label';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-medium dark:text-zinc-400"
        >
          Email Address
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-white/50 dark:bg-zinc-800/50 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 text-md md:text-sm"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-medium dark:text-zinc-400"
        >
          Password
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-white/50 dark:bg-zinc-800/50 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 text-md md:text-sm"
          type="password"
          placeholder="Enter your password"
          required
        />
      </div>

      {children}
    </Form>
  );
}
