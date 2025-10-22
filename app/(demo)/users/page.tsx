import UsersTable from "@/components/UsersTable";
import { USERS } from "@/lib/mockData";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">User Management</h1>
        <p className="mt-1 text-muted-foreground">
          Manage team access and permissions
        </p>
      </div>

      <UsersTable initialUsers={USERS} />
    </div>
  );
}
