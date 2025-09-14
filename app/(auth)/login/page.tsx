import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        redirectUrl="/"
      />
    </div>
  );
}
