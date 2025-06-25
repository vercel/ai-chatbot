import { db } from '@/lib/db';
import { user as userSchema, type User } from '@/lib/db/schema'; // Ensure User type is exported or use InferSelectModel
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Assuming shadcn/ui table components

// If User type isn't directly exported from schema.ts with all fields,
// we might need to define a specific type here or use InferSelectModel.
// For now, assuming User type from schema includes id, email, isAdmin, walletBalance.

async function getUsers(): Promise<User[]> {
  // Select specific fields to avoid over-fetching, especially password
  return db
    .select({
      id: userSchema.id,
      email: userSchema.email,
      isAdmin: userSchema.isAdmin,
      walletBalance: userSchema.walletBalance,
      // Do NOT select userSchema.password
    })
    .from(userSchema)
    .orderBy(userSchema.email); // Order by email for consistent listing
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Admin - User Management</h1>
      <p className="mb-4">Total users: {users.length}</p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Is Admin?</TableHead>
              <TableHead className="text-right">Wallet Balance</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-center">
                  {user.isAdmin ? 'Yes' : 'No'}
                </TableCell>
                <TableCell className="text-right">
                  {user.walletBalance}
                </TableCell>
                <TableCell className="text-center">
                  {/* Placeholder for actions like Edit Wallet, Toggle Admin */}
                  {/* These would typically be forms or links to other pages/dialogs */}
                  <button className="text-blue-500 hover:underline disabled:text-gray-400" disabled>
                    Edit
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Optional: Add revalidation if needed, though admin pages might not need to be super fresh always
// export const revalidate = 60; // Revalidate every 60 seconds
