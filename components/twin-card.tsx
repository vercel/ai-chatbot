"use client";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Twin } from "@/lib/types";
import { cn } from "@/lib/utils";

type TwinCardProps = {
  twin?: Twin;
  isPlaceholder?: boolean;
  onClick?: () => void;
};

export default function TwinCard({
  twin,
  isPlaceholder,
  onClick,
}: TwinCardProps) {
  if (isPlaceholder) {
    return (
      <motion.button
        className={cn(
          "group relative flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border border-dashed bg-gradient-to-br from-primary/10 to-accent-cyan/10 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
        )}
        onClick={onClick}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="rounded-full bg-primary/20 p-4 transition-colors group-hover:bg-primary/30">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <div className="font-medium text-lg">Create New Glen AI</div>
        <div className="text-muted-foreground text-sm">
          Create a new Glen AI instance
        </div>
      </motion.button>
    );
  }

  if (!twin) {
    return null;
  }

  const statusColors: Record<Twin["status"], string> = {
    active: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    draft: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
    placeholder: "",
  };

  return (
    <Link href={`/twins/${twin.id}`}>
      <motion.div
        className={cn(
          "group relative flex h-56 flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-black/10 hover:shadow-lg cursor-pointer"
        )}
        whileHover={{ y: -4 }}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <Badge className={statusColors[twin.status]}>{twin.status}</Badge>
          </div>

          <div>
            <h3 className="font-semibold text-lg">{twin.name}</h3>
            {twin.description && (
              <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                {twin.description}
              </p>
            )}
          </div>
        </div>

        {twin.createdAt && (
          <div className="text-muted-foreground text-xs">
            Created {twin.createdAt}
          </div>
        )}
      </motion.div>
    </Link>
  );
}
