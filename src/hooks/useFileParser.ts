import { useCallback } from 'react';
import { parseSheet } from '../lib/sheetParser';
import { detectColumns } from '../lib/columnDetector';
import { useAppDispatch, useAppState } from '../store/useAppStore';
import type { ParsedRow } from '../types';

const KEY_PATTERNS = ['key', 'id', 'chave', 'string_id', 'string id', 'name', 'token', 'identifier', 'keys'];

function detectKeyColumn(headers: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const pat of KEY_PATTERNS) {
    const idx = lower.findIndex((h) => h === pat || h.includes(pat));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function useFileParser() {
  const dispatch = useAppDispatch();
  const { config } = useAppState();

  const processFile = useCallback(
    async (file: File) => {
      const buffer = await file.arrayBuffer();
      const { headers, rows } = parseSheet(buffer);

      const detected = detectColumns(headers, config.sourceLang);
      dispatch({ type: 'SET_DETECTED_COLUMNS', payload: detected });

      const sourceCol = detected.find((c) => c.isSource);
      if (!sourceCol) return;

      const keyColIdx = detectKeyColumn(headers);

      const parsed: ParsedRow[] = rows
        .map((row, i) => {
          const translations: Record<string, string> = {};
          for (const col of detected) {
            if (!col.isSource) {
              translations[col.langCode] = row[col.header] ?? '';
            }
          }
          const keyVal = keyColIdx >= 0 ? row[headers[keyColIdx]] : undefined;
          return {
            rowIndex: i + 1,
            key: keyVal && String(keyVal).trim() ? String(keyVal).trim() : undefined,
            sourceText: row[sourceCol.header] ?? '',
            translations,
          };
        })
        .filter((r) => r.sourceText.trim() !== '');

      dispatch({ type: 'SET_PARSED_ROWS', payload: parsed });
    },
    [dispatch, config.sourceLang],
  );

  return { processFile };
}
