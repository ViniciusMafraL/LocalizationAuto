import { useCallback } from 'react';
import { analyseRows } from '../lib/claudeClient';
import { useAppDispatch, useAppState } from '../store/useAppStore';
import type { BatchProgress } from '../types';

const BATCH_SIZE = 30;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const LANG_META: Record<string, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇺🇸' },
  'pt-BR': { name: 'Português BR', flag: '🇧🇷' },
  'pt-br': { name: 'Português BR', flag: '🇧🇷' },
  pt: { name: 'Português', flag: '🇵🇹' },
  'fr-FR': { name: 'Français', flag: '🇫🇷' },
  fr: { name: 'Français', flag: '🇫🇷' },
  es: { name: 'Español', flag: '🇪🇸' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  it: { name: 'Italiano', flag: '🇮🇹' },
};

function getLangMeta(code: string) {
  return LANG_META[code] ?? { name: code, flag: '🌐' };
}

export function useAnalysisRunner() {
  const dispatch = useAppDispatch();
  const { config, parsedRows } = useAppState();

  const run = useCallback(async () => {
    const targetLangs = config.targetLangs;

    for (const lang of targetLangs) {
      dispatch({ type: 'INIT_LANGUAGE_REPORT', payload: { langCode: lang, total: parsedRows.length } });
    }

    let firstLangDone = false;

    for (let li = 0; li < targetLangs.length; li++) {
      const lang = targetLangs[li];
      const meta = getLangMeta(lang);
      const batches = chunk(parsedRows, BATCH_SIZE);
      const totalBatches = batches.length;
      const log: BatchProgress['log'] = [];

      dispatch({ type: 'SET_LANGUAGE_STATUS', payload: { langCode: lang, status: 'analyzing' } });

      let processed = 0;

      try {
        for (let b = 0; b < batches.length; b++) {
          const batch = batches[b];
          const batchLabel = `Lote ${b + 1}/${totalBatches} · ${batch.length} strings`;
          const logId = `${lang}-${b}`;

          log.push({ id: logId, label: batchLabel, status: 'active' });

          dispatch({
            type: 'SET_BATCH_PROGRESS',
            payload: {
              langCode: lang,
              langName: meta.name,
              langFlag: meta.flag,
              batchIndex: b + 1,
              totalBatches,
              batchSize: batch.length,
              stringsDone: processed,
              stringsTotal: parsedRows.length,
              log: [...log],
            },
          });

          try {
            const results = await analyseRows(config, lang, batch);
            for (const result of results) {
              dispatch({ type: 'APPEND_RESULT', payload: result });
            }
            log[log.length - 1].status = 'done';
          } catch (batchErr) {
            log[log.length - 1].status = 'error';
          }

          processed += batch.length;
          dispatch({ type: 'UPDATE_PROGRESS', payload: { langCode: lang, progress: processed } });

          dispatch({
            type: 'SET_BATCH_PROGRESS',
            payload: {
              langCode: lang,
              langName: meta.name,
              langFlag: meta.flag,
              batchIndex: b + 1,
              totalBatches,
              batchSize: batch.length,
              stringsDone: processed,
              stringsTotal: parsedRows.length,
              log: [...log],
            },
          });

          // Pausa entre lotes (exceto no último)
          if (b < batches.length - 1) {
            await sleep(2000);
          }
        }

        dispatch({ type: 'SET_LANGUAGE_STATUS', payload: { langCode: lang, status: 'done' } });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        dispatch({ type: 'SET_LANGUAGE_STATUS', payload: { langCode: lang, status: 'error', apiError: msg } });
      }

      // Ao terminar o primeiro idioma, navega para o relatório progressivo
      if (!firstLangDone) {
        firstLangDone = true;
        dispatch({ type: 'SET_BATCH_PROGRESS', payload: null });
        dispatch({ type: 'SET_STAGE', payload: 'report' });
      }

      // Pausa entre idiomas (exceto no último)
      if (li < targetLangs.length - 1) {
        await sleep(3000);
      }
    }

    dispatch({ type: 'SET_BATCH_PROGRESS', payload: null });
  }, [dispatch, config, parsedRows]);

  return { run };
}
