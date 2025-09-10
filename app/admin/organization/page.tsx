import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, organization, organizationInvitation } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import Link from 'next/link';
import { InviteUserForm } from './invite-user-form';

export default async function OrganizationPage() {
  const session = await auth();

  if (!session?.user) {
    return <div>Unauthorized</div>;
  }

  // Get organization details
  const [orgDetails] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, session.user.organizationId));

  // Get all users in the organization
  const orgUsers = await db
    .select({
      id: user.id,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(eq(user.organizationId, session.user.organizationId))
    .orderBy(user.email);

  // Get pending invitations
  const pendingInvitations = await db
    .select()
    .from(organizationInvitation)
    .where(and(
      eq(organizationInvitation.organizationId, session.user.organizationId),
      eq(organizationInvitation.status, 'pending')
    ))
    .orderBy(organizationInvitation.createdAt);

  // Get user counts by role
  const roleCounts = await Promise.all([
    db.select({ count: count() }).from(user).where(and(eq(user.organizationId, session.user.organizationId), eq(user.role, 'admin'))),
    db.select({ count: count() }).from(user).where(and(eq(user.organizationId, session.user.organizationId), eq(user.role, 'compliance_officer'))),
    db.select({ count: count() }).from(user).where(and(eq(user.organizationId, session.user.organizationId), eq(user.role, 'employee'))),
  ]);

  const [adminCount, complianceCount, employeeCount] = roleCounts.map(r => r[0].count);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'compliance_officer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization and team members
        </p>
      </div>

      {/* Organization Info */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Organization Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
            <p className="text-lg">{orgDetails.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Organization Slug</label>
            <p className="text-lg font-mono">{orgDetails.slug}</p>
          </div>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Admins</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Compliance Officers</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{complianceCount}</div>
            <p className="text-xs text-muted-foreground">Review COI reports</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Employees</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{employeeCount}</div>
            <p className="text-xs text-muted-foreground">Submit COI reports</p>
          </div>
        </div>
      </div>

      {/* Invite New User */}
      {session.user.role === 'admin' && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Invite New User</h2>
          <InviteUserForm />
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Pending Invitations</h2>
            <p className="text-sm text-muted-foreground">
              Invitations that haven&apos;t been accepted yet
            </p>
          </div>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Role</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Sent</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvitations.map((invitation) => (
                  <tr key={invitation.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">{invitation.email}</td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getRoleColor(invitation.role)}`}>
                        {invitation.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-sm text-muted-foreground">
                      {invitation.createdAt.toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle text-sm text-muted-foreground">
                      {invitation.expiresAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Current Users */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            All users in your organization
          </p>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Role</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgUsers.map((orgUser) => (
                <tr key={orgUser.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="flex items-center space-x-2">
                      <span>{orgUser.email}</span>
                      {orgUser.id === session.user.id && (
                        <span className="text-xs text-muted-foreground">(you)</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getRoleColor(orgUser.role)}`}>
                      {orgUser.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    {session.user.role === 'admin' && orgUser.id !== session.user.id && (
                      <button className="inline-flex items-center justify-center rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground shadow transition-colors hover:bg-muted/90">
                        Edit Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}