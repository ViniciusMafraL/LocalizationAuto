import { useCallback } from 'react';
import { analyseRows } from '../lib/claudeClient';
import { useAppDispatch, useAppState } from '../store/useAppStore';

const BATCH_SIZE = 15;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function useAnalysisRunner() {
  const dispatch = useAppDispatch();
  const { config, parsedRows } = useAppState();

  const run = useCallback(async () => {
    const targetLangs = config.targetLangs;

    for (const lang of targetLangs) {
      dispatch({ type: 'INIT_LANGUAGE_REPORT', payload: { langCode: lang, total: parsedRows.length } });
    }

    for (const lang of targetLangs) {
      dispatch({ type: 'SET_LANGUAGE_STATUS', payload: { langCode: lang, status: 'analyzing' } });

      const batches = chunk(parsedRows, BATCH_SIZE);
      let processed = 0;

      try {
        for (const batch of batches) {
          const results = await analyseRows(config, lang, batch);
          for (const result of results) {
            dispatch({ type: 'APPEND_RESULT', payload: result });
          }
          processed += batch.length;
          dispatch({ type: 'UPDATE_PROGRESS', payload: { langCode: lang, progress: processed } });
        }
        dispatch({ type: 'SET_LANGUAGE_STATUS', payload: { langCode: lang, status: 'done' } });
      } catch (err) {
        console.error(`Erro ao analisar ${lang}:`, err);
        dispatch({ type: 'SET_LANGUAGE_STATUS', payload: { langCode: lang, status: 'error' } });
      }
    }

    dispatch({ type: 'SET_STAGE', payload: 'report' });
  }, [dispatch, config, parsedRows]);

  return { run };
}
