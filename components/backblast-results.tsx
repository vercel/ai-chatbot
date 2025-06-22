'use client';

import { memo, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import type { Backblast } from '@/lib/db/schema.f3';
import { cn } from '@/lib/utils';

// Helper function to format date ranges
// If the range spans from the first day to the last day of the same month,
// it will display as "Month Year" instead of "Month Day, Year - Month Day, Year"
const formatDateRange = (startDateStr: string, endDateStr: string): string => {
  try {
    // Parse dates
    const [startYear, startMonth, startDay] = startDateStr
      .split('-')
      .map(Number);
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    // Check if it's the same month and year
    if (startYear === endYear && startMonth === endMonth) {
      // Check if start date is the first day of the month
      const isFirstDay = startDay === 1;

      // Check if end date is the last day of the month
      const lastDayOfMonth = new Date(endYear, endMonth, 0).getDate();
      const isLastDay = endDay === lastDayOfMonth;

      // If it spans the full month, show just "Month Year"
      if (isFirstDay && isLastDay) {
        return format(startDate, 'MMMM yyyy');
      }
    }

    // Otherwise show the full range
    return `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`;
  } catch (e) {
    // Fallback to raw strings if parsing fails
    return `${startDateStr} - ${endDateStr}`;
  }
};

interface BackblastResultsProps {
  results: Backblast[] | any;
  queryType: string;
  isLoading?: boolean;
}

interface BackblastContentProps {
  backblast: Backblast;
  isExpanded?: boolean;
  showExpandButton?: boolean;
}

const BackblastContent = ({
  backblast,
  isExpanded,
  showExpandButton = true,
}: BackblastContentProps) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-lg">{backblast.ao}</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(backblast.date), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="mb-1">
            Q: {backblast.q}
          </Badge>
          <div className="text-sm text-muted-foreground">
            <div>Pax: {backblast.pax_count}</div>
            {backblast.fng_count > 0 && <div>FNGs: {backblast.fng_count}</div>}
          </div>
        </div>
      </div>

      {backblast.fngs && backblast.fng_count > 0 && (
        <div className="mb-2">
          <span className="text-sm font-medium">FNGs: </span>
          <span className="text-sm text-muted-foreground">
            {backblast.fngs}
          </span>
        </div>
      )}

      <Separator className="my-2" />

      <div className="text-sm relative">
        <div
          className={cn('text-muted-foreground', !expanded && 'line-clamp-3')}
        >
          <Markdown>{backblast.backblast}</Markdown>
        </div>

        <div className="flex items-center justify-end gap-2 mt-2">
          {showExpandButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="size-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="size-4 mr-1" />
                  Show More
                </>
              )}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
            <Maximize2 className="size-4 mr-1" />
            Full View
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {backblast.ao} -{' '}
              {format(new Date(backblast.date), 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">Q: {backblast.q}</Badge>
              <Badge variant="secondary">Pax: {backblast.pax_count}</Badge>
              {backblast.fng_count > 0 && (
                <Badge variant="secondary">FNGs: {backblast.fng_count}</Badge>
              )}
            </div>
            {backblast.fngs && backblast.fng_count > 0 && (
              <div className="mb-4">
                <span className="font-medium">FNGs: </span>
                <span className="text-muted-foreground">{backblast.fngs}</span>
              </div>
            )}
            <Separator className="mb-4" />
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{backblast.backblast}</Markdown>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const PureBackblastResults = ({
  results,
  queryType,
  isLoading,
}: BackblastResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
        <span className="ml-2 text-muted-foreground">
          Querying backblasts...
        </span>
      </div>
    );
  }

  // Handle error results
  if (results?.error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Query Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{results.error}</p>
        </CardContent>
      </Card>
    );
  }

  // Handle stats results
  if (queryType === 'stats' && typeof results === 'object') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>F3 Statistics</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDateRange(results.startDate, results.endDate)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Total Backblasts</p>
              <p className="text-2xl font-bold">
                {results.totalBackblasts ?? 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Pax (cumulative)</p>
              <p className="text-2xl font-bold">{results.totalPax ?? 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total FNGs</p>
              <p className="text-2xl font-bold">{results.totalFNGs ?? 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Average Pax per Workout</p>
              <p className="text-2xl font-bold">
                {results.averagePaxPerWorkout
                  ? Math.round(results.averagePaxPerWorkout * 10) / 10
                  : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle top AOs/Qs results
  if (
    (queryType === 'topAOs' || queryType === 'topQs') &&
    Array.isArray(results?.results)
  ) {
    const title = queryType === 'topAOs' ? 'Top Areas of Operation' : 'Top Qs';
    const field = queryType === 'topAOs' ? 'ao' : 'q';

    // Sort results by count (desc) and then by name (asc)
    const sortedResults = [...results.results].sort((a, b) => {
      // First sort by count (descending)
      const countDiff = b.count - a.count;
      if (countDiff !== 0) return countDiff;

      // If counts are equal, sort alphabetically by name
      return a[field].localeCompare(b[field]);
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {results.startDate && results.endDate && (
            <p className="text-sm text-muted-foreground">
              {formatDateRange(results.startDate, results.endDate)}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedResults.map((item, index) => {
              // Check if this item is tied for first (matches highest count)
              const highestCount = sortedResults[0].count;
              const isFirstPlace = item.count === highestCount;

              return (
                <div
                  key={`${item[field]}-${item.count}-${index}`}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg',
                    isFirstPlace
                      ? 'bg-[#ac0f02] text-white'
                      : 'bg-muted text-foreground',
                  )}
                >
                  <span className="font-medium">{item[field]}</span>
                  <Badge
                    variant={isFirstPlace ? 'outline' : 'secondary'}
                    className={isFirstPlace ? 'text-white border-white' : ''}
                  >
                    {item.count} workouts
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle backblast list results
  if (Array.isArray(results)) {
    if (results.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No Backblasts Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No backblasts match your query criteria.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            F3 Backblasts ({results.length} result
            {results.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((backblast: Backblast) => (
              <div key={backblast.id} className="border rounded-lg p-4">
                <BackblastContent backblast={backblast} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback for unexpected result types
  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Results</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

export const BackblastResults = memo(PureBackblastResults);
