"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, UserRole } from "@/lib/types";

type InviteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (user: User) => void;
};

export default function InviteUserDialog({
  open,
  onOpenChange,
  onInvite,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    const localPart = email.split("@")[0] ?? "";
    const name = localPart
      ? localPart.charAt(0).toUpperCase() + localPart.slice(1)
      : email;

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      role,
      lastActive: "Invited",
    };

    onInvite(newUser);
    toast.success("Invitation sent", {
      description: `Invited ${email} as ${role === "admin" ? "Admin" : "Viewer"}`,
    });

    setEmail("");
    setRole("viewer");
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation to join the Glen AI platform
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              autoFocus
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={(v) => setRole(v as UserRole)} value={role}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  Viewer — Chat access only
                </SelectItem>
                <SelectItem value="admin">Admin — Full CMS and user access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit">Send Invitation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
