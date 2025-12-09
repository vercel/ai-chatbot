"use client";

import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import {
  Activity,
  Circle,
  MessageSquare,
  Users as UsersIcon,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
  status: "online" | "away" | "typing";
}

interface AIPresence {
  status: "thinking" | "suggesting" | "idle";
  currentLine?: number;
  suggestion?: string;
}

interface CollabSession {
  artifactId: string;
  users: User[];
  aiPresence: AIPresence;
  content: string;
  language: string;
}

export function CollaborativeWorkspace({ artifactId }: { artifactId: string }) {
  const [session, setSession] = useState<CollabSession | null>(null);
  const [content, setContent] = useState("");
  const [connected, setConnected] = useState(false);
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );
  const wsRef = useRef<WebSocket | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    initializeCollaboration();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [artifactId]);

  const initializeCollaboration = async () => {
    // Initialize WebSocket connection
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({
          type: "join",
          artifactId,
          userId: "current-user-id",
          userName: "You",
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "session-update":
          setSession(message.session);
          setContent(message.session.content);
          break;
        case "cursor-move":
          setCursors(new Map(cursors.set(message.userId, message.cursor)));
          break;
        case "content-change":
          setContent(message.content);
          break;
        case "ai-suggestion":
          // Show AI suggestion
          break;
      }
    };

    ws.onerror = () => {
      setConnected(false);
    };

    wsRef.current = ws;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!value || !wsRef.current) return;

    setContent(value);

    wsRef.current.send(
      JSON.stringify({
        type: "edit",
        artifactId,
        content: value,
      })
    );
  };

  const handleCursorMove = (event: any) => {
    if (!wsRef.current) return;

    const position = event.position;
    wsRef.current.send(
      JSON.stringify({
        type: "cursor",
        artifactId,
        position,
      })
    );
  };

  if (!session) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
          <p className="text-muted-foreground">
            Connecting to collaboration session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-3">
            <UsersIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl">Collaborative Workspace</h1>
            <p className="text-muted-foreground">
              Real-time editing with AI teammate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className="px-3 py-1"
            variant={connected ? "default" : "destructive"}
          >
            <Circle
              className={`mr-2 h-2 w-2 ${connected ? "fill-green-500" : "fill-red-500"}`}
            />
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Active Users */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">Active Collaborators</h3>
            <Badge variant="secondary">{session.users.length + 1}</Badge>
          </div>

          <div className="-space-x-2 flex">
            {session.users.map((user) => (
              <div className="relative" key={user.id}>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <div
                    className="flex h-full w-full items-center justify-center font-medium text-white text-xs"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0)}
                  </div>
                </Avatar>
                {user.status === "typing" && (
                  <div className="-bottom-1 -right-1 absolute h-3 w-3 animate-pulse rounded-full border border-background bg-blue-500" />
                )}
                {user.status === "online" && (
                  <div className="-bottom-1 -right-1 absolute h-3 w-3 rounded-full border border-background bg-green-500" />
                )}
              </div>
            ))}

            {/* AI Presence */}
            <div className="relative">
              <Avatar className="h-8 w-8 border-2 border-background bg-gradient-to-br from-purple-500 to-pink-500">
                <Zap className="h-4 w-4 text-white" />
              </Avatar>
              {session.aiPresence.status !== "idle" && (
                <div className="-bottom-1 -right-1 absolute h-3 w-3 animate-pulse rounded-full border border-background bg-purple-500" />
              )}
            </div>
          </div>
        </div>

        {/* AI Status */}
        {session.aiPresence.status !== "idle" && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20"
            initial={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 animate-pulse text-purple-500" />
              <span className="text-purple-700 dark:text-purple-300">
                AI is {session.aiPresence.status}
                {session.aiPresence.currentLine &&
                  ` at line ${session.aiPresence.currentLine}`}
              </span>
            </div>
            {session.aiPresence.suggestion && (
              <div className="mt-2 text-muted-foreground text-xs">
                💡 {session.aiPresence.suggestion}
              </div>
            )}
          </motion.div>
        )}
      </Card>

      {/* Editor */}
      <Card className="p-4">
        <div className="relative">
          {/* Remote Cursors */}
          {Array.from(cursors.entries()).map(([userId, cursor]) => {
            const user = session.users.find((u) => u.id === userId);
            if (!user) return null;

            return (
              <motion.div
                animate={{ x: cursor.x, y: cursor.y }}
                className="pointer-events-none absolute z-10"
                key={userId}
                style={{
                  left: cursor.x,
                  top: cursor.y,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div
                  className="h-5 w-0.5"
                  style={{ backgroundColor: user.color }}
                />
                <div
                  className="whitespace-nowrap rounded px-2 py-0.5 text-white text-xs"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name}
                </div>
              </motion.div>
            );
          })}

          {/* Monaco Editor */}
          <Editor
            height="500px"
            language={session.language}
            onChange={handleEditorChange}
            onMount={(editor) => {
              editorRef.current = editor;
              editor.onDidChangeCursorPosition(handleCursorMove);
            }}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: "on",
              rulers: [80],
              wordWrap: "on",
              formatOnPaste: true,
              formatOnType: true,
            }}
            theme="vs-dark"
            value={content}
          />
        </div>
      </Card>

      {/* Chat Sidebar */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <h3 className="font-medium">Team Chat</h3>
        </div>
        <div className="max-h-40 space-y-2 overflow-y-auto">
          <div className="py-4 text-center text-muted-foreground text-sm">
            Chat messages will appear here...
          </div>
        </div>
      </Card>
    </div>
  );
}
