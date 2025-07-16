import { withAuth } from '@workos-inc/authkit-nextjs';

export default async function AuthKitTestPage() {
  const result = await withAuth({ ensureSignedIn: true });

  return (
    <div>
      <h1>Hello, AuthKit!</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
