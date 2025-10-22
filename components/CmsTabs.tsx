"use client";

import { CheckCircle, History, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Doc } from "@/lib/types";
import AuditTrailDialog from "./AuditTrailDialog";

type CmsTabsProps = {
  approvedDocs: Doc[];
  pendingDocs: Doc[];
};

export default function CmsTabs({ approvedDocs, pendingDocs }: CmsTabsProps) {
  const [pending, setPending] = useState<Doc[]>(pendingDocs);
  const [approved, setApproved] = useState<Doc[]>(approvedDocs);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  const handleApprove = (doc: Doc) => {
    setPending((prev) => prev.filter((d) => d.id !== doc.id));
    setApproved((prev) => [
      ...prev,
      {
        ...doc,
        status: "Live",
        updated: new Date().toISOString().split("T")[0],
      },
    ]);
    toast.success("Approved", { description: `"${doc.title}" is now live.` });
  };

  const handleReject = (doc: Doc) => {
    setPending((prev) => prev.filter((d) => d.id !== doc.id));
    toast.error("Rejected", {
      description: `"${doc.title}" has been dismissed.`,
    });
  };

  return (
    <>
      <Tabs className="w-full" defaultValue="approved">
        <TabsList>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="pending">
            Pending{" "}
            {pending.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Approved Tab */}
        <TabsContent className="mt-6" value="approved">
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.source}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.updated}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        variant="default"
                      >
                        Live
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => setAuditDialogOpen(true)}
                        size="sm"
                        variant="ghost"
                      >
                        <History className="mr-2 h-4 w-4" />
                        History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent className="mt-6" value="pending">
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((doc) => (
              <Card
                className="border-border transition-colors hover:border-primary/50"
                key={doc.id}
              >
                <CardHeader>
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-muted-foreground text-sm">
                  <div>
                    Source: <span className="font-medium">{doc.source}</span>
                  </div>
                  <div>Discovered: {doc.discovered}</div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button onClick={() => handleApprove(doc)} size="sm">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(doc)}
                    size="sm"
                    variant="outline"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {pending.length === 0 && (
              <div className="col-span-2 py-12 text-center text-muted-foreground">
                No pending items. All content has been reviewed.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AuditTrailDialog
        onOpenChange={setAuditDialogOpen}
        open={auditDialogOpen}
      />
    </>
  );
}
