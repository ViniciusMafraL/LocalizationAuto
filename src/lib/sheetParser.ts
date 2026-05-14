import * as XLSX from 'xlsx';

export interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseSheet(buffer: ArrayBuffer): SheetData {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  });

  if (raw.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(raw[0]);
  const rows = raw.map((r) =>
    Object.fromEntries(headers.map((h) => [h, String(r[h] ?? '')]))
  );

  return { headers, rows };
}
