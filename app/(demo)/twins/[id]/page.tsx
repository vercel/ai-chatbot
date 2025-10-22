"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Save, CheckCircle2, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { TWINS, APPROVED_DOCS, USERS } from "@/lib/mockData";
import type { Twin, Doc, User, TwinPermission } from "@/lib/types";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export default function TwinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [twins, setTwins] = useLocalStorage<Twin[]>("demo-twins", TWINS);
  const twin = twins.find((t) => t.id === id);

  const [name, setName] = useState(twin?.name || "");
  const [description, setDescription] = useState(twin?.description || "");
  const [capabilities, setCapabilities] = useState(twin?.capabilities || {
    text: true,
    voice: false,
    avatar: false,
  });
  const [knowledgeSources, setKnowledgeSources] = useState<string[]>(
    twin?.knowledgeSources || []
  );
  const [avatarId, setAvatarId] = useState(twin?.avatarId || "");
  const [voiceId, setVoiceId] = useState(twin?.voiceId || "");
  const [permissions, setPermissions] = useState<TwinPermission[]>(
    twin?.permissions || []
  );
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"owner" | "editor" | "viewer">("editor");

  if (!twin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-xl">Twin not found</h2>
          <p className="mb-4 text-muted-foreground">
            The twin you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/twins")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Twins
          </Button>
        </div>
      </div>
    );
  }

  // Calculate completion percentage
  const calculateCompletion = (): number => {
    let completed = 0;
    const total = 6;

    if (name) completed++;
    if (description) completed++;
    if (knowledgeSources.length > 0) completed++;
    if (capabilities.text || capabilities.voice || capabilities.avatar) completed++;
    if (capabilities.avatar && avatarId) completed++;
    if (capabilities.voice && voiceId) completed++;

    return Math.round((completed / total) * 100);
  };

  const getMissingRequirements = (): string[] => {
    const missing: string[] = [];

    if (!name) missing.push("Twin name");
    if (!description) missing.push("Persona & purpose");
    if (knowledgeSources.length === 0) missing.push("At least one knowledge source");
    if (!capabilities.text && !capabilities.voice && !capabilities.avatar) {
      missing.push("At least one capability enabled");
    }
    if (capabilities.avatar && !avatarId) missing.push("Avatar ID for video capability");
    if (capabilities.voice && !voiceId) missing.push("Voice ID for voice capability");

    return missing;
  };

  const completion = calculateCompletion();
  const missingRequirements = getMissingRequirements();
  const canActivate = missingRequirements.length === 0;

  const handleSave = () => {
    const updatedTwin: Twin = {
      ...twin,
      name,
      description,
      capabilities,
      knowledgeSources,
      avatarId: avatarId || undefined,
      voiceId: voiceId || undefined,
      trainingStatus: knowledgeSources.length > 0 ? "in_progress" : "not_started",
      permissions,
    };

    setTwins((prev) => prev.map((t) => (t.id === twin.id ? updatedTwin : t)));
    toast.success("Changes saved", {
      description: "Twin configuration has been updated.",
    });
  };

  const addPermission = () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    if (permissions.some((p) => p.userId === selectedUserId)) {
      toast.error("User already has access");
      return;
    }

    setPermissions((prev) => [...prev, { userId: selectedUserId, role: selectedRole }]);
    setSelectedUserId("");
    toast.success("User added", { description: "Access granted to this twin." });
  };

  const removePermission = (userId: string) => {
    setPermissions((prev) => prev.filter((p) => p.userId !== userId));
    toast.info("User removed", { description: "Access revoked from this twin." });
  };

  const getUserById = (userId: string): User | undefined => {
    return USERS.find((u) => u.id === userId);
  };

  const availableUsers = USERS.filter(
    (user) => !permissions.some((p) => p.userId === user.id)
  );

  const handleActivate = () => {
    if (!canActivate) {
      toast.error("Cannot activate", {
        description: "Please complete all required fields first.",
      });
      return;
    }

    const updatedTwin: Twin = {
      ...twin,
      name,
      description,
      capabilities,
      knowledgeSources,
      avatarId: avatarId || undefined,
      voiceId: voiceId || undefined,
      status: "active",
      trainingStatus: "complete",
    };

    setTwins((prev) => prev.map((t) => (t.id === twin.id ? updatedTwin : t)));
    toast.success("Twin activated!", {
      description: `${name} is now live and ready to chat.`,
    });
    router.push("/twins");
  };

  const handleDeactivate = () => {
    const updatedTwin: Twin = {
      ...twin,
      status: "draft",
      trainingStatus: "not_started",
    };

    setTwins((prev) => prev.map((t) => (t.id === twin.id ? updatedTwin : t)));
    toast.info("Twin deactivated", {
      description: `${twin.name} is now in draft mode and no longer accessible.`,
    });
  };

  const toggleKnowledgeSource = (docId: string) => {
    setKnowledgeSources((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/twins")}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Twins
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-2xl">{twin.name}</h1>
            <Badge
              className={
                twin.status === "active"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
              }
            >
              {twin.status}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Configure your AI twin's knowledge, capabilities, and behavior
          </p>
        </div>
        <div className="flex gap-2">
          {twin.status === "active" && (
            <Button variant="outline" onClick={handleDeactivate}>
              <PowerOff className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          )}
          <Button variant="outline" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          <Button
            onClick={handleActivate}
            disabled={!canActivate || twin.status === "active"}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {twin.status === "active" ? "Active" : "Activate Twin"}
          </Button>
        </div>
      </div>

      {/* Configuration Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration Progress</CardTitle>
          <CardDescription>
            Complete all required fields to activate your twin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{completion}% Complete</span>
              <span className="text-muted-foreground">
                {missingRequirements.length > 0
                  ? `${missingRequirements.length} requirement${missingRequirements.length > 1 ? "s" : ""} remaining`
                  : "Ready to activate"}
              </span>
            </div>
            <Progress value={completion} />
          </div>

          {missingRequirements.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="mb-2 font-medium text-sm">Missing Requirements:</div>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {missingRequirements.map((req) => (
                  <li key={req} className="text-amber-700 dark:text-amber-300">
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canActivate && twin.status === "draft" && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium text-sm">All requirements met! Ready to activate.</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Define your twin's identity and purpose</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Twin Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sarah Chen AI"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Persona & Purpose *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the twin's voice, priorities, and key focus areas..."
                rows={6}
              />
              <p className="text-muted-foreground text-xs">
                Define tone, strategic themes, and communication style
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>Enable interaction modes for this twin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Text Chat</Label>
                <div className="text-muted-foreground text-sm">
                  Enable text-based conversations
                </div>
              </div>
              <Switch
                checked={capabilities.text}
                onCheckedChange={(checked) =>
                  setCapabilities((prev) => ({ ...prev, text: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Voice Chat</Label>
                  <div className="text-muted-foreground text-sm">
                    Enable voice conversations
                  </div>
                </div>
                <Switch
                  checked={capabilities.voice}
                  onCheckedChange={(checked) =>
                    setCapabilities((prev) => ({ ...prev, voice: checked }))
                  }
                />
              </div>
              {capabilities.voice && (
                <Input
                  placeholder="Voice Model ID (e.g., en-US-Neural)"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Video Avatar</Label>
                  <div className="text-muted-foreground text-sm">
                    Enable video avatar experience
                  </div>
                </div>
                <Switch
                  checked={capabilities.avatar}
                  onCheckedChange={(checked) =>
                    setCapabilities((prev) => ({ ...prev, avatar: checked }))
                  }
                />
              </div>
              {capabilities.avatar && (
                <Input
                  placeholder="HeyGen Avatar ID"
                  value={avatarId}
                  onChange={(e) => setAvatarId(e.target.value)}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Knowledge Base</CardTitle>
            <CardDescription>
              Select approved content sources to train this twin *
            </CardDescription>
          </CardHeader>
          <CardContent>
            {APPROVED_DOCS.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No approved documents available. Add content in the Knowledge Base section.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {APPROVED_DOCS.map((doc: Doc) => (
                  <div
                    key={doc.id}
                    onClick={() => toggleKnowledgeSource(doc.id)}
                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                      knowledgeSources.includes(doc.id)
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">{doc.title}</div>
                          {knowledgeSources.includes(doc.id) && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs">
                          {doc.source} • Updated {doc.updated}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {knowledgeSources.length > 0 && (
              <div className="mt-4 text-sm">
                <span className="font-medium">{knowledgeSources.length}</span> knowledge
                source{knowledgeSources.length > 1 ? "s" : ""} selected
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Permissions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Permissions</CardTitle>
            <CardDescription>
              Manage who can access and edit this twin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add User Section */}
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedRole}
                onValueChange={(value) =>
                  setSelectedRole(value as "owner" | "editor" | "viewer")
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={addPermission}>Add</Button>
            </div>

            {/* Permissions List */}
            {permissions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                No users assigned. Add users to grant access to this twin.
              </div>
            ) : (
              <div className="space-y-2">
                {permissions.map((permission) => {
                  const user = getUserById(permission.userId);
                  if (!user) return null;

                  return (
                    <div
                      key={permission.userId}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            permission.role === "owner"
                              ? "default"
                              : permission.role === "editor"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {permission.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePermission(permission.userId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="mb-1 font-medium">Permission Roles:</div>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>
                  <strong>Owner:</strong> Full control - can delete, activate/deactivate
                </li>
                <li>
                  <strong>Editor:</strong> Can modify configuration and knowledge base
                </li>
                <li>
                  <strong>Viewer:</strong> Read-only access to twin configuration
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
