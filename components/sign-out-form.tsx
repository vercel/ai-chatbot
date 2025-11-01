"use client";

import { useRouter } from "next/navigation";
import { authclient } from "@/lib/auth-client";

export const SignOutForm = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    await authclient.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      className="w-full px-1 py-0.5 text-left text-red-500"
      onClick={handleSignOut}
      type="button"
    >
      Sign out
    </button>
  );
};
