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
import { TWINS } from "@/lib/mockData";
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

  const getTwinNames = (twinIds?: string[]) => {
    if (!twinIds || twinIds.length === 0) return "No twins assigned";
    const twinNames = twinIds
      .map((id) => TWINS.find((t) => t.id === id)?.name)
      .filter(Boolean);
    return twinNames.length > 0 ? twinNames.join(", ") : "No twins assigned";
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
              <TableHead>Platform Role</TableHead>
              <TableHead>Twin Assignments</TableHead>
              <TableHead>Last Active</TableHead>
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
                  <Badge
                    variant={
                      user.platformRole === "platform_admin" ? "default" : "outline"
                    }
                  >
                    {user.platformRole === "platform_admin"
                      ? "Platform Admin"
                      : "User"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="max-w-xs truncate">
                    {getTwinNames(user.twinAssignments)}
                  </div>
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
