"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";

type Status = {
  connected: boolean;
  expiresInSeconds: number | null;
};

export default function GoogleDriveSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    try {
      const res = await fetch("/api/integrations/google/status");
      if (!res.ok) {
        setStatus({ connected: false, expiresInSeconds: null });
        return;
      }
      const json = (await res.json()) as Status;
      setStatus(json);
    } catch {
      setStatus({ connected: false, expiresInSeconds: null });
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  const connectUrl = `/api/integrations/google/authorize?returnTo=${encodeURIComponent(
    "/settings"
  )}`;

  async function disconnect() {
    setLoading(true);
    try {
      await fetch("/api/integrations/google/disconnect", { method: "POST" });
      await loadStatus();
    } finally {
      setLoading(false);
    }
  }

  async function indexAll() {
    setLoading(true);
    try {
      await fetch("/api/drive/index/run", { method: "POST" });
    } finally {
      setLoading(false);
    }
  }

  const NotConnected = (
    <Card className="max-w-3xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span aria-hidden className="inline-block size-6 rounded-sm bg-gradient-to-tr from-yellow-500 to-blue-600" />
              <h3 className="text-2xl font-semibold">Google Drive Integration</h3>
            </div>
            <p className="text-muted-foreground">
              Connect your Google Drive to access and analyze your documents
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <XCircle className="text-muted-foreground" aria-hidden />
                <span className="font-medium">Not Connected</span>
              </span>
              <Badge variant="outline">Inactive</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="min-w-32">
              <a href={connectUrl} aria-label="Connect Google Drive">
                Connect <ExternalLink aria-hidden />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const Connected = (
    <Card className="max-w-3xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span aria-hidden className="inline-block size-6 rounded-sm bg-gradient-to-tr from-yellow-500 to-blue-600" />
              <h3 className="text-2xl font-semibold">Google Drive Integration</h3>
            </div>
            <p className="text-muted-foreground">
              Your Google Drive is connected. You can disconnect or run indexing.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1 text-green-600">
                <CheckCircle2 className="text-green-600" aria-hidden />
                <span className="font-medium">Connected</span>
              </span>
              <Badge variant="secondary">Active</Badge>
              {typeof status?.expiresInSeconds === "number" && (
                <span className="text-sm text-muted-foreground">
                  Token refresh in ~{status.expiresInSeconds}s
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={indexAll}
              disabled={loading}
              aria-label="Index all Google Drive files"
            >
              {loading ? <Loader2 className="animate-spin" /> : null}
              Index All
            </Button>
            <Button
              variant="destructive"
              onClick={disconnect}
              disabled={loading}
              aria-label="Disconnect Google Drive"
            >
              {loading ? <Loader2 className="animate-spin" /> : null}
              Disconnect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return status?.connected ? Connected : NotConnected;
}
