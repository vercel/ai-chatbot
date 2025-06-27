import { DatabaseIcon, CheckIcon, XIcon } from './icons';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface SnowflakeSqlCallProps {
  args: {
    query: string;
  };
  isReadonly: boolean;
}

interface SnowflakeSqlResultProps {
  result: {
    success?: boolean;
    error?: boolean;
    query: string;
    data?: any[];
    rowCount?: number;
    message?: string;
  };
  isReadonly: boolean;
}

export const SnowflakeSqlCall = memo(
  ({ args, isReadonly }: SnowflakeSqlCallProps) => {
    return (
      <div className="border rounded-xl p-4 flex flex-row gap-3 items-start bg-background">
        <div className="flex items-center justify-center size-8 shrink-0 rounded-full border bg-background">
          <DatabaseIcon size={16} />
        </div>

        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="size-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            <div className="text-sm font-medium">Executing SQL Query</div>
          </div>

          <div className="text-sm text-muted-foreground">
            Running query against Snowflake database...
          </div>

          <div className="mt-2">
            <div className="text-xs text-muted-foreground mb-1">SQL Query:</div>
            <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm overflow-x-auto">
              <code className="text-foreground whitespace-pre-wrap break-words">
                {args.query}
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

SnowflakeSqlCall.displayName = 'SnowflakeSqlCall';

export const SnowflakeSqlResult = memo(
  ({ result, isReadonly }: SnowflakeSqlResultProps) => {
    const isSuccess = result.success && !result.error;
    const isError = result.error || !result.success;

    return (
      <div className="border rounded-xl p-4 flex flex-row gap-3 items-start bg-background">
        <div
          className={cn(
            'flex items-center justify-center size-8 shrink-0 rounded-full border',
            isSuccess
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200',
          )}
        >
          {isSuccess ? (
            <div className="text-green-600">
              <CheckIcon size={16} />
            </div>
          ) : (
            <div className="text-red-600">
              <XIcon size={16} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {isSuccess ? 'Query Executed Successfully' : 'Query Failed'}
            </div>
            {isSuccess && result.rowCount !== undefined && (
              <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                {result.rowCount} row{result.rowCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {isSuccess
              ? `Query completed ${result.rowCount ? `returning ${result.rowCount} rows` : 'successfully'}`
              : result.message || 'An error occurred while executing the query'}
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-2">SQL Query:</div>
            <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm overflow-x-auto">
              <code className="text-foreground whitespace-pre-wrap break-words">
                {result.query}
              </code>
            </div>
          </div>

          {isSuccess && result.data && result.data.length > 0 && (
            <SnowflakeDataTable data={result.data} />
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm font-medium text-red-800 mb-1">
                Error Details
              </div>
              <div className="text-sm text-red-700">
                {result.message || 'Unknown error occurred'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

SnowflakeSqlResult.displayName = 'SnowflakeSqlResult';

interface SnowflakeDataTableProps {
  data: Record<string, any>[];
}

const SnowflakeDataTable = memo(({ data }: SnowflakeDataTableProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-lg">
        No data returned from query
      </div>
    );
  }

  const columns = Object.keys(data[0]);
  const maxRows = 100; // Limit displayed rows for performance
  const displayData = data.slice(0, maxRows);
  const hasMoreRows = data.length > maxRows;

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">Query Results:</div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayData.map((row, index) => (
                <tr key={JSON.stringify(row)} className="hover:bg-muted/30">
                  {columns.map((column) => (
                    <td key={column} className="p-3 whitespace-nowrap max-w-xs">
                      <div className="truncate" title={String(row[column])}>
                        {formatCellValue(row[column])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMoreRows && (
          <div className="p-3 bg-muted/30 border-t text-center text-sm text-muted-foreground">
            Showing {maxRows} of {data.length} rows
          </div>
        )}
      </div>
    </div>
  );
});

SnowflakeDataTable.displayName = 'SnowflakeDataTable';

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  if (typeof value === 'number') {
    // Format numbers with appropriate precision
    return value % 1 === 0 ? value.toString() : value.toFixed(2);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
