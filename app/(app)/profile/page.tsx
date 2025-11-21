import { redirect } from "next/navigation";
import { getUserProfile } from "./actions";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getUserProfile();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-12 pt-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          These details are visible to your teammates across Splx. Keep them up
          to date so people know who they are collaborating with.
        </p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}




