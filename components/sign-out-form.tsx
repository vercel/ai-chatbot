"use client";

import { signOut } from "@/lib/auth-client";

export const SignOutForm = () => {
  return (
    <form className="w-full">
      <button
        className="w-full px-1 py-0.5 text-left text-red-500"
        type="button"
        onClick={() => signOut()}
      >
        Sign out
      </button>
    </form>
  );
};
