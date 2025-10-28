"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Clock,
  Search as SearchIcon,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import InsightReviewDrawer from "@/components/InsightReviewDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type InsightChunk,
  MOCK_INSIGHT_CHUNKS,
} from "@/lib/mockDiscoveryData";

type StatusFilter = "pending" | "live" | "dismissed" | "all";
type SortField = "title" | "source" | "flagged" | "status" | "firstSeen";
type SortDirection = "asc" | "desc";

const NEW_CHUNK_TEMPLATES: Partial<InsightChunk>[] = [
  {
    title: "Led transformation of Allscripts to cloud-based platform",
    meaning:
      "Under Glen's leadership, Allscripts underwent a major strategic shift from on-premise software to cloud-based solutions, positioning the company for modern healthcare delivery.",
    quote:
      "Moving to the cloud wasn't just about technology—it was about enabling healthcare providers to access critical information anywhere, anytime, and collaborate more effectively across care teams.",
    sourceType: "perplexity",
    sourceName: "Perplexity Scan",
    sourceDomain: "healthcareitnews.com",
    flaggedCount: 0,
  },
  {
    title: "Advocates for interoperability in healthcare systems",
    meaning:
      "Glen has been a strong proponent of healthcare data interoperability, believing that seamless data exchange between systems is essential for quality care.",
    quote:
      "Healthcare can't improve if systems don't talk to each other. Patients shouldn't suffer because their data is trapped in silos. True interoperability isn't optional—it's essential.",
    sourceType: "perplexity",
    sourceName: "Perplexity Scan",
    sourceDomain: "healthit.gov",
    flaggedCount: 0,
  },
  {
    title: "Emphasizes importance of user experience in health tech",
    meaning:
      "Glen believes healthcare technology must be as intuitive as consumer apps, with excellent user experience being critical to adoption and outcomes.",
    quote:
      "If a doctor has to click 20 times to do something that should take 2 clicks, they won't use it—and patients suffer. Great UX in healthcare isn't a luxury; it's a patient safety issue.",
    sourceType: "perplexity",
    sourceName: "Perplexity Scan",
    sourceDomain: "mobihealthnews.com",
    flaggedCount: 0,
  },
];

export default function DiscoveryPage() {
  const [chunks, setChunks] = useState<InsightChunk[]>(MOCK_INSIGHT_CHUNKS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<InsightChunk | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastScanTime, setLastScanTime] = useState("Oct 27, 2024, 2:30 PM");
  const [scanFrequency, setScanFrequency] = useState<string>("24h");
  const [moreTagsOpen, setMoreTagsOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Calculate tag counts from all chunks
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    chunks.forEach((chunk) => {
      chunk.tags?.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [chunks]);

  // Available tags sorted by count
  const availableTags = useMemo(() => {
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag);
  }, [tagCounts]);

  // Debounced search with useMemo
  const filteredChunks = useMemo(() => {
    let filtered = chunks;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((chunk) => chunk.status === statusFilter);
    }

    // Apply tag filter (OR logic - show insights matching ANY selected tag)
    if (selectedTags.length > 0) {
      filtered = filtered.filter((chunk) =>
        chunk.tags?.some((tag) => selectedTags.includes(tag))
      );
    }

    // Apply search filter (searches across all statuses)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (chunk) =>
          chunk.title.toLowerCase().includes(query) ||
          chunk.meaning.toLowerCase().includes(query) ||
          chunk.quote.toLowerCase().includes(query) ||
          chunk.sourceDomain?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
          case "title":
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case "source":
            aValue = (a.sourceDomain || a.sourceName || "").toLowerCase();
            bValue = (b.sourceDomain || b.sourceName || "").toLowerCase();
            break;
          case "flagged":
            aValue = a.flaggedCount;
            bValue = b.flaggedCount;
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          case "firstSeen":
            aValue = new Date(a.firstSeenAt).getTime();
            bValue = new Date(b.firstSeenAt).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [chunks, statusFilter, selectedTags, searchQuery, sortField, sortDirection]);

  // Count per status
  const statusCounts = useMemo(() => {
    const pending = chunks.filter((c) => c.status === "pending").length;
    const live = chunks.filter((c) => c.status === "live").length;
    const dismissed = chunks.filter((c) => c.status === "dismissed").length;
    return { pending, live, dismissed, all: chunks.length };
  }, [chunks]);

  const handleRunPerplexityScan = () => {
    setIsScanning(true);
    toast.info("Scanning...", {
      description: "Running Perplexity scan for new insights",
    });

    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const newChunks: InsightChunk[] = NEW_CHUNK_TEMPLATES.slice(
        0,
        Math.floor(Math.random() * 3) + 3
      ).map((template, index) => ({
        id: `chunk-new-${Date.now()}-${index}`,
        title: template.title!,
        meaning: template.meaning!,
        quote: template.quote!,
        sourceType: template.sourceType!,
        sourceName: template.sourceName!,
        sourceDomain: template.sourceDomain,
        status: "pending" as const,
        flaggedCount: 0,
        relationships: [],
        firstSeenAt: dateStr,
      }));

      setChunks((prev) => [...newChunks, ...prev]);
      setLastScanTime(dateStr);
      setIsScanning(false);
      toast.success(`Found ${newChunks.length} new insights`, {
        description: "New knowledge insights added to pending review",
      });
    }, 2000);
  };

  const handleRowClick = (chunk: InsightChunk) => {
    setSelectedChunk(chunk);
    setDrawerOpen(true);
  };

  const handleApprove = (
    chunk: InsightChunk,
    editedTitle: string,
    editedMeaning: string,
    editedTags?: string[]
  ) => {
    const now = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    setChunks((prev) =>
      prev.map((c) =>
        c.id === chunk.id
          ? {
              ...c,
              title: editedTitle,
              meaning: editedMeaning,
              tags: editedTags || c.tags,
              status: "live" as const,
              relationships: [
                ...c.relationships,
                {
                  type: "approved_by" as const,
                  actor: "Aaron Thomas",
                  at: now,
                },
              ],
            }
          : c
      )
    );

    toast.success("Approved", {
      description: `"${editedTitle}" is now live`,
    });
  };

  const handleDismiss = (chunk: InsightChunk, reason: string) => {
    const now = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    setChunks((prev) =>
      prev.map((c) =>
        c.id === chunk.id
          ? {
              ...c,
              status: "dismissed" as const,
              relationships: [
                ...c.relationships,
                {
                  type: "dismissed_by" as const,
                  actor: "Aaron Thomas",
                  at: now,
                  reason,
                },
              ],
            }
          : c
      )
    );

    toast.info("Dismissed", {
      description: `"${chunk.title}" has been dismissed`,
    });
  };

  const getStatusBadge = (status: InsightChunk["status"]) => {
    switch (status) {
      case "pending":
        return {
          color:
            "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
          label: "Pending",
        };
      case "live":
        return {
          color:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          label: "Live",
        };
      case "dismissed":
        return {
          color:
            "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400",
          label: "Dismissed",
        };
      default:
        return { color: "", label: "" };
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getFlaggedHistoryText = (chunk: InsightChunk) => {
    const flagged = chunk.relationships.filter(
      (r) => r.type === "flagged_from"
    );
    if (flagged.length === 0) return "—";

    const sources = flagged
      .map((r) => `${r.source?.domain || "Unknown"} (${r.at.split(",")[0]})`)
      .join(", ");

    return `Flagged ${flagged.length}x from: ${sources}`;
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field with default ascending direction
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const getNextScanTime = () => {
    const lastDate = new Date(lastScanTime);
    let nextDate: Date;

    switch (scanFrequency) {
      case "24h":
        nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "48h":
        nextDate = new Date(lastDate.getTime() + 48 * 60 * 60 * 1000);
        break;
      case "3d":
        nextDate = new Date(lastDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        break;
      case "7d":
        nextDate = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "manual":
        return "Manual only";
      default:
        nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return nextDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl">Knowledge</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Review and approve knowledge insights from automated scans
          </p>
          <div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
            <Clock className="h-3 w-3" />
            <span>
              Last scan: {lastScanTime} • Next scheduled: {getNextScanTime()}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select onValueChange={setScanFrequency} value={scanFrequency}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Scan frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Every 24 hours</SelectItem>
              <SelectItem value="48h">Every 48 hours</SelectItem>
              <SelectItem value="3d">Every 3 days</SelectItem>
              <SelectItem value="7d">Every 7 days</SelectItem>
              <SelectItem value="manual">Manual only</SelectItem>
            </SelectContent>
          </Select>
          <Button disabled={isScanning} onClick={handleRunPerplexityScan}>
            <Sparkles
              className={`h-4 w-4 ${isScanning ? "animate-pulse" : ""}`}
            />
            Run Discovery
          </Button>
        </div>
      </div>

      {/* Tag Filter Chips */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={`cursor-pointer transition-colors ${
              selectedTags.length === 0
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
            onClick={() => setSelectedTags([])}
            variant={selectedTags.length === 0 ? "default" : "secondary"}
          >
            All
          </Badge>
          {availableTags.slice(0, 6).map((tag) => (
            <Badge
              className={`cursor-pointer transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              key={tag}
              onClick={() => toggleTag(tag)}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
            >
              {tag} ({tagCounts[tag]})
            </Badge>
          ))}
          {availableTags.length > 6 && (
            <Popover open={moreTagsOpen} onOpenChange={setMoreTagsOpen}>
              <PopoverTrigger asChild>
                <Badge
                  className="cursor-pointer bg-muted text-muted-foreground hover:bg-muted/80"
                  variant="secondary"
                >
                  +{availableTags.length - 6} more
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Badge>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">All Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.slice(6).map((tag) => (
                      <Badge
                        key={tag}
                        className={`cursor-pointer transition-colors ${
                          selectedTags.includes(tag)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                        onClick={() => {
                          toggleTag(tag);
                          setMoreTagsOpen(false);
                        }}
                        variant={selectedTags.includes(tag) ? "default" : "secondary"}
                      >
                        {tag} ({tagCounts[tag]})
                      </Badge>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      {/* Global Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search across all knowledge insights..."
          value={searchQuery}
        />
      </div>

      {/* Status Tabs */}
      <Tabs
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        value={statusFilter}
      >
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {statusCounts.pending > 0 && (
              <Badge className="ml-2" variant="secondary">
                {statusCounts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="live">
            Live
            {statusCounts.live > 0 && (
              <Badge className="ml-2" variant="secondary">
                {statusCounts.live}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dismissed">
            Dismissed
            {statusCounts.dismissed > 0 && (
              <Badge className="ml-2" variant="secondary">
                {statusCounts.dismissed}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">
            All
            <Badge className="ml-2" variant="secondary">
              {statusCounts.all}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value={statusFilter}>
          {filteredChunks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <SearchIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mt-6 mb-2 font-medium text-lg">
                {searchQuery
                  ? "No matching insights"
                  : statusFilter === "pending"
                    ? "No pending insights"
                    : statusFilter === "live"
                      ? "No live insights"
                      : statusFilter === "dismissed"
                        ? "No dismissed insights"
                        : "No insights yet"}
              </h3>
              <p className="max-w-sm text-muted-foreground text-sm">
                {searchQuery
                  ? "Try adjusting your search query or filter"
                  : statusFilter === "pending"
                    ? "Run a Perplexity scan to discover new knowledge chunks"
                    : "No insights found in this category"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="w-[40%] cursor-pointer select-none hover:bg-accent/50"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center">
                        Title
                        {getSortIcon("title")}
                      </div>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell w-[20%]">Tags</TableHead>
                    <TableHead
                      className="hidden md:table-cell w-[15%] cursor-pointer select-none hover:bg-accent/50"
                      onClick={() => handleSort("source")}
                    >
                      <div className="flex items-center">
                        Source
                        {getSortIcon("source")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="hidden lg:table-cell w-[10%] text-center cursor-pointer select-none hover:bg-accent/50"
                      onClick={() => handleSort("flagged")}
                    >
                      <div className="flex items-center justify-center">
                        Flagged
                        {getSortIcon("flagged")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="w-[10%] cursor-pointer select-none hover:bg-accent/50"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon("status")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="hidden xl:table-cell w-[auto] cursor-pointer select-none hover:bg-accent/50"
                      onClick={() => handleSort("firstSeen")}
                    >
                      <div className="flex items-center">
                        First Seen
                        {getSortIcon("firstSeen")}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChunks.map((chunk) => {
                    const statusBadge = getStatusBadge(chunk.status);
                    return (
                      <TableRow
                        className="cursor-pointer hover:bg-accent/50"
                        key={chunk.id}
                        onClick={() => handleRowClick(chunk)}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-start gap-2">
                            {chunk.isDuplicate && (
                              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                            )}
                            <span className="font-medium text-base">
                              {chunk.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-4">
                          {chunk.tags && chunk.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              <Badge
                                className="rounded-full text-xs"
                                variant="secondary"
                              >
                                {chunk.tags[0]}
                              </Badge>
                              {chunk.tags.length > 1 && (
                                <Badge
                                  className="rounded-full text-xs"
                                  variant="outline"
                                >
                                  +{chunk.tags.length - 1}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-4 text-muted-foreground text-sm">
                          {chunk.sourceDomain || chunk.sourceName || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell py-4 text-center">
                          {chunk.flaggedCount > 0 ? (
                            <Badge variant="secondary">
                              {chunk.flaggedCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            className={`rounded-full px-2 py-0.5 text-xs ${statusBadge.color}`}
                            variant="outline"
                          >
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell whitespace-nowrap py-4 text-muted-foreground text-sm">
                          {chunk.firstSeenAt}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Drawer */}
      <InsightReviewDrawer
        chunk={selectedChunk}
        onApprove={handleApprove}
        onDismiss={handleDismiss}
        onOpenChange={setDrawerOpen}
        open={drawerOpen}
      />
    </div>
  );
}
