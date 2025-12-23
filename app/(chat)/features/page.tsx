import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";

export default async function FeaturesPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-hidden">
        <iframe
          className="h-full w-full border-0"
          src="/features/demo"
          title="TiQology Features Demo"
        />
      </div>
    </div>
  );
}
