import { signIn } from "@/app/(auth)/auth";
import { Button } from "@/components/ui/button";

export function GithubAuthForm() {
  return (
    <div>
      <form
        className="flex flex-col gap-4 px-4 sm:px-16"
        action={async () => {
          "use server";
          try {
            await signIn("github");
          } finally {
          }
        }}
      >
        <Button type="submit">Signin with GitHub</Button>
      </form>
    </div>
  );
}
