import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          baseTheme: dark,
          variables: {
            colorBackground: '#09090B',
          },
          elements: {
            // Hide elements potentially remaining after disabling password strategy
            dividerRow: { display: 'none' }, // Hides the "or" separator
            formField__identifier: { display: 'none' }, // Hides email/username field+label
            formButtonPrimary: { display: 'none' }, // Hides the main submit button
            footerAction: { display: 'none' }, // Hides the "Don't have an account?" link
            footer: { display: 'none' }, // Hides the "Secured by Clerk" footer
          },
        }}
      />
    </div>
  );
}
