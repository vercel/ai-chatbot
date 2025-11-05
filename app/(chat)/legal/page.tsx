import { auth } from "@/app/(auth)/auth";
import { LegalDashboard } from "@/components/legal/legal-dashboard";
import { redirect } from "next/navigation";

export default async function LegalPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Lawyer Mate
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Your AI-powered legal assistant
          </p>
        </div>
        
        <LegalDashboard userId={session.user.id} />
      </div>
    </div>
  );
}