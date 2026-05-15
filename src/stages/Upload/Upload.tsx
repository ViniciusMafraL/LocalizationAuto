import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { DropZone } from '../../components/DropZone/DropZone';
import { ColumnMapper } from '../../components/ColumnMapper/ColumnMapper';
import { useFileParser } from '../../hooks/useFileParser';
import { useAppDispatch, useAppState } from '../../store/useAppStore';
import type { DetectedColumn } from '../../types';
import styles from './Upload.module.css';

type UploadStep = 'drop' | 'mapping';

export function Upload() {
  const dispatch = useAppDispatch();
  const { config, detectedColumns, parsedRows } = useAppState();
  const { processFile } = useFileParser();

  const [step, setStep] = useState<UploadStep>('drop');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  async function handleSheetFile(file: File) {
    setError('');
    setFileName(file.name);
    dispatch({ type: 'SET_FILE_NAME', payload: file.name });
    await processFile(file);
    setStep('mapping');
  }

  function handleColumnsChange(updated: DetectedColumn[]) {
    dispatch({ type: 'SET_DETECTED_COLUMNS', payload: updated });
  }

  function handleConfirmSheet() {
    const selectedLangs = config.targetLangs;
    function langMatch(selected: string, detected: string): boolean {
      if (selected.toLowerCase() === detected.toLowerCase()) return true;
      return selected.toLowerCase().split('-')[0] === detected.toLowerCase().split('-')[0];
    }

    const targetLangs = detectedColumns
      .filter((c) => !c.isSource && selectedLangs.some((s) => langMatch(s, c.langCode)))
      .map((c) => c.langCode);

    if (targetLangs.length === 0) {
      setError(
        'Nenhuma coluna encontrada para os idiomas selecionados. Verifique os cabeçalhos da planilha.',
      );
      return;
    }
    dispatch({ type: 'SET_CONFIG', payload: { targetLangs } });
    dispatch({ type: 'SET_STAGE', payload: 'analyse' });
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headline}>
          <h1 className={styles.title}>Selecione o arquivo</h1>
          <p className={styles.subtitle}>
            Planilha com as strings do projeto para análise de localização.
          </p>
        </div>

        {step === 'drop' && <DropZone onFile={handleSheetFile} />}

        {step === 'mapping' && (
          <>
            <div className={styles.fileChip}>
              <FileSpreadsheet size={14} />
              <span>{fileName}</span>
              <span className={styles.rowCount}>{parsedRows.length} linhas</span>
            </div>
            {detectedColumns.length > 0 ? (
              <ColumnMapper
                columns={detectedColumns}
                sourceLang={config.sourceLang}
                onChange={handleColumnsChange}
                onConfirm={handleConfirmSheet}
              />
            ) : (
              <div className={styles.noColumns}>
                <p>Nenhuma coluna de idioma detectada automaticamente.</p>
                <p className={styles.hint}>
                  Verifique se os cabeçalhos contêm códigos de idioma (ex: <code>en</code>, <code>pt-BR</code>, <code>fr</code>).
                </p>
                <button className={styles.retry} onClick={() => setStep('drop')}>
                  Tentar outro arquivo
                </button>
              </div>
            )}
          </>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.backBtn} onClick={() => dispatch({ type: 'SET_STAGE', payload: 'setup' })}>
          ← Voltar
        </button>
      </div>
    </div>
  );
}
