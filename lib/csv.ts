export interface CsvOptions {
  bom?: boolean;
  headers?: string[];
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[], opts?: CsvOptions): string {
  if (rows.length === 0 && (!opts?.headers || opts.headers.length === 0)) {
    return opts?.bom ? '\uFEFF' : '';
  }

  const headers = opts?.headers ?? Object.keys(rows[0] ?? {});
  const lines: string[] = [];

  // Header row
  lines.push(headers.map(escapeCsvCell).join(','));

  // Data rows
  for (const row of rows) {
    const rowValues = headers.map((header) => escapeCsvCell(row[header]));
    lines.push(rowValues.join(','));
  }

  const csvBody = lines.join('\r\n') + '\r\n';
  return opts?.bom ? `\uFEFF${csvBody}` : csvBody;
}
