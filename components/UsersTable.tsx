"use client";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "@/lib/types";
import InviteUserDialog from "./InviteUserDialog";

type UsersTableProps = {
  initialUsers: User[];
};

export default function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleInvite = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    setDialogOpen(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Admin":
        return "default";
      case "Editor":
        return "secondary";
      case "Viewer":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-medium text-lg">Team Members</h2>
          <p className="text-muted-foreground text-sm">
            {users.length} {users.length === 1 ? "member" : "members"}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} type="button">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    {user.email && (
                      <div className="text-muted-foreground text-xs">
                        {user.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.access}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.lastActive}
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
    </>
  );
}
