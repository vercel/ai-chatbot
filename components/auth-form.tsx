import Form from 'next/form';

import { Input } from './ui/input';
import { Label } from './ui/label';

import { Turnstile } from 'next-turnstile';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  handleTurnstileStatus,
  turnstileRef,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  handleTurnstileStatus: (
    status: 'success' | 'error' | 'expired' | 'required',
  ) => void;
  turnstileRef: React.MutableRefObject<string | undefined>;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Email Address
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          Password
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          required
        />
      </div>
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        retry="auto"
        refreshExpired="auto"
        sandbox={process.env.NODE_ENV === 'development'}
        onError={() => {
          handleTurnstileStatus('error');
        }}
        onExpire={() => {
          handleTurnstileStatus('expired');
        }}
        onLoad={() => {
          handleTurnstileStatus('required');
        }}
        onVerify={(token) => {
          handleTurnstileStatus('success');
        }}
      />

      {children}
    </Form>
  );
}
