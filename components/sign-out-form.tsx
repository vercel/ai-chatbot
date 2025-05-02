import Form from 'next/form';

import { signOutAction } from '@/app/(auth)/actions';

interface SignOutFormProps {
  onClose?: () => void;
}

export const SignOutForm = ({ onClose }: SignOutFormProps) => {
  return (
    <Form
      className="w-full"
      action={async () => {
        await signOutAction('/');
        if (onClose) {
          onClose();
        }
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        Sign out
      </button>
    </Form>
  );
};
