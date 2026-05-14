import { useCallback } from 'react';
import { parseSheet } from '../lib/sheetParser';
import { detectColumns } from '../lib/columnDetector';
import { useAppDispatch, useAppState } from '../store/useAppStore';
import type { ParsedRow } from '../types';

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

      const parsed: ParsedRow[] = rows.map((row, i) => {
        const translations: Record<string, string> = {};
        for (const col of detected) {
          if (!col.isSource) {
            translations[col.langCode] = row[col.header] ?? '';
          }
        }
        return {
          rowIndex: i,
          key: undefined,
          sourceText: row[sourceCol.header] ?? '',
          translations,
        };
      }).filter((r) => r.sourceText.trim() !== '');

      dispatch({ type: 'SET_PARSED_ROWS', payload: parsed });
    },
    [dispatch, config.sourceLang]
  );

  return { processFile };
}
