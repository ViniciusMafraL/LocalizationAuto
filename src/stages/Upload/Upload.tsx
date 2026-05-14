import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { DropZone } from '../../components/DropZone/DropZone';
import { ColumnMapper } from '../../components/ColumnMapper/ColumnMapper';
import { useFileParser } from '../../hooks/useFileParser';
import { useAppDispatch, useAppState } from '../../store/useAppStore';
import { detectProjectContext } from '../../lib/claudeClient';
import type { DetectedColumn } from '../../types';
import styles from './Upload.module.css';

type UploadStep = 'drop' | 'mapping' | 'generating';

export function Upload() {
  const dispatch = useAppDispatch();
  const { config, detectedColumns, parsedRows } = useAppState();
  const { processFile } = useFileParser();
  const [step, setStep] = useState<UploadStep>('drop');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setError('');
    setFileName(file.name);
    await processFile(file);
    setStep('mapping');
  }

  function handleColumnsChange(updated: DetectedColumn[]) {
    dispatch({ type: 'SET_DETECTED_COLUMNS', payload: updated });
    const targetLangs = updated.filter((c) => !c.isSource).map((c) => c.langCode);
    dispatch({ type: 'SET_CONFIG', payload: { targetLangs } });
  }

  async function handleConfirm() {
    setStep('generating');
    setError('');
    try {
      const context = await detectProjectContext(config, parsedRows.slice(0, 5));
      dispatch({ type: 'SET_CONFIG', payload: { detectedContext: context } });
      dispatch({ type: 'SET_STAGE', payload: 'analyse' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar contexto via Claude.');
      setStep('mapping');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headline}>
          <h1 className={styles.title}>Upload da planilha</h1>
          <p className={styles.subtitle}>
            Suporte a <code>.xlsx</code> e <code>.csv</code>. A primeira linha deve ser o cabeçalho.
          </p>
        </div>

        {step === 'drop' && (
          <DropZone onFile={handleFile} />
        )}

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
                onConfirm={handleConfirm}
              />
            ) : (
              <div className={styles.noColumns}>
                <p>Nenhuma coluna de idioma detectada automaticamente.</p>
                <p className={styles.hint}>
                  Verifique se os cabeçalhos da planilha contêm códigos de idioma (ex: <code>en</code>, <code>pt-br</code>, <code>fr</code>).
                </p>
                <button className={styles.retry} onClick={() => setStep('drop')}>
                  Tentar outro arquivo
                </button>
              </div>
            )}
          </>
        )}

        {step === 'generating' && (
          <div className={styles.generating}>
            <Loader2 size={32} className={styles.spinner} />
            <p className={styles.genLabel}>Analisando contexto do projeto via Claude...</p>
            <p className={styles.genSub}>Isso leva alguns segundos.</p>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
