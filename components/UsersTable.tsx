"use client";
import { Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User, UserRole } from "@/lib/types";
import InviteUserDialog from "./InviteUserDialog";

type UsersTableProps = {
  initialUsers: User[];
};

export default function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);

  // Assume first user is current user (in real app, get from auth context)
  const currentUserId = initialUsers[0]?.id;

  const handleInvite = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    setDialogOpen(false);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
    toast({
      type: "success",
      description: `User role changed to ${newRole === "admin" ? "Admin" : "Viewer"}`,
    });
  };

  const handleRemoveClick = (user: User) => {
    setUserToRemove(user);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = () => {
    if (userToRemove) {
      setUsers((prev) => prev.filter((user) => user.id !== userToRemove.id));
      toast({
        type: "success",
        description: "User removed",
      });
      setRemoveDialogOpen(false);
      setUserToRemove(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium text-lg">Team Members</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            {users.length} {users.length === 1 ? "member" : "members"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} type="button">
          <UserPlus className="h-4 w-4" />
          Invite
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-[100px]">Remove</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    onValueChange={(value) =>
                      handleRoleChange(user.id, value as UserRole)
                    }
                    value={user.role}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.lastActive}
                </TableCell>
                <TableCell>
                  <Button
                    disabled={user.id === currentUserId}
                    onClick={() => handleRemoveClick(user)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InviteUserDialog
        onInvite={handleInvite}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
      />

      <AlertDialog onOpenChange={setRemoveDialogOpen} open={removeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {userToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
