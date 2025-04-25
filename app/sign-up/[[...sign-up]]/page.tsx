import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            // Hide elements related to the password strategy if they still appear
            dividerRow: { display: 'none' }, // Hides the "or" separator
            formField__identifier: { display: 'none' }, // Hides email/username field+label
            formField__password: { display: 'none' }, // Hides password input + label
            formButtonPrimary: { display: 'none' }, // Hides the main submit button
            footerAction: { display: 'none' }, // Hides the "Already have an account?" link
            footer: { display: 'none' }, // Hides the "Secured by Clerk" footer
          },
        }}
      />
    </div>
  );
}
