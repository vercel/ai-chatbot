interface SpreadsheetData {
  headers: string[];
  rows: string[][];
}

export function exportToCSV(
  content: string,
  filename = 'spreadsheet.csv',
): void {
  try {
    const data = JSON.parse(content) as SpreadsheetData;
    if (!data?.headers || !data?.rows) {
      throw new Error('Invalid spreadsheet data');
    }

    // Normalize rows to ensure they have the same length as headers
    const normalizedRows = data.rows.map((row) => {
      const normalizedRow = [...row];
      while (normalizedRow.length < data.headers.length) {
        normalizedRow.push('');
      }
      return normalizedRow;
    });

    // Create CSV content
    const csvContent = [
      data.headers.join(','),
      ...normalizedRows.map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma or quotes
            const escaped = String(cell || '').replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"')
              ? `"${escaped}"`
              : escaped;
          })
          .join(','),
      ),
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return;
  } catch (error) {
    throw new Error('Failed to export CSV: ' + (error as Error).message);
  }
}
