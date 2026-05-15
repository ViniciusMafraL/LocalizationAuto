import { useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAnalysisRunner } from '../../hooks/useAnalysisRunner';
import { useAppState } from '../../store/useAppStore';
import styles from './Analyse.module.css';

export function Analyse() {
  const { config, languageReports, batchProgress } = useAppState();
  const { run } = useAnalysisRunner();
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      run();
    }
  }, [run]);

  const langs = config.inputMode === 'image' ? ['__image__'] : config.targetLangs;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headline}>
          <div className={styles.loaderDots}>
            <span /><span /><span />
          </div>
          <h1 className={styles.title}>
            {config.inputMode === 'image' ? 'Analisando screenshot...' : 'Analisando idiomas...'}
          </h1>
          <p className={styles.subtitle}>
            {config.inputMode === 'image'
              ? 'Aguarde — o modelo está lendo todos os textos'
              : 'Processando um idioma por vez'}
          </p>
        </div>

        {/* Language chips */}
        <div className={styles.langChips}>
          {langs.map((lang) => {
            const report = languageReports[lang];
            const status = report?.status ?? 'pending';
            const isActive = batchProgress?.langCode === lang;
            return (
              <div
                key={lang}
                className={`${styles.langChip} ${isActive ? styles.chipActive : ''} ${status === 'done' ? styles.chipDone : ''} ${status === 'error' ? styles.chipError : ''}`}
              >
                <span className={styles.chipFlag}>
                  {lang === '__image__' ? '📸' : '🌐'}
                </span>
                <span>{lang === '__image__' ? 'Screenshot' : lang}</span>
                <span className={styles.chipStatus}>
                  {status === 'pending' && '⏳'}
                  {status === 'analyzing' && '⏳'}
                  {status === 'done' && '✅'}
                  {status === 'error' && '❌'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Batch panel */}
        {batchProgress && (
          <div className={styles.batchPanel}>
            <div className={styles.batchLangLabel}>
              <span>{batchProgress.langFlag}</span>
              <span>{batchProgress.langName}</span>
            </div>
            <div className={styles.batchLotLabel}>
              Lote {batchProgress.batchIndex}/{batchProgress.totalBatches}
              {batchProgress.batchSize > 0 && ` · ${batchProgress.batchSize} strings`}
            </div>
            <div className={styles.batchBarWrap}>
              <div
                className={styles.batchBarFill}
                style={{
                  width: batchProgress.totalBatches > 0
                    ? `${Math.round((batchProgress.batchIndex / batchProgress.totalBatches) * 100)}%`
                    : '0%',
                }}
              />
            </div>
            <div className={styles.batchStringsRow}>
              <span>{batchProgress.stringsDone} strings analisadas</span>
              <span>de {batchProgress.stringsTotal}</span>
            </div>
            {batchProgress.log.length > 0 && (
              <div className={styles.batchLog}>
                {batchProgress.log.map((entry) => (
                  <div
                    key={entry.id}
                    className={`${styles.batchLogLine} ${entry.status === 'done' ? styles.logDone : ''} ${entry.status === 'error' ? styles.logErr : ''} ${entry.status === 'active' ? styles.logActive : ''}`}
                  >
                    {entry.status === 'done' && '✅ '}
                    {entry.status === 'error' && '❌ '}
                    {entry.status === 'active' && '⏳ '}
                    {entry.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Individual lang cards */}
        <div className={styles.cards}>
          {langs.map((lang) => {
            const report = languageReports[lang];
            const status = report?.status ?? 'pending';
            const progress = report?.progress ?? 0;
            const total = report?.total ?? 0;
            const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

            return (
              <div key={lang} className={`${styles.card} ${styles[status] ?? ''}`}>
                <div className={styles.cardTop}>
                  <span className={styles.langCode}>
                    {lang === '__image__' ? '📸 Screenshot' : lang}
                  </span>
                  <div className={styles.statusIcon}>
                    {status === 'analyzing' && <Loader2 size={18} className={styles.spinner} />}
                    {status === 'done' && <CheckCircle2 size={18} className={styles.iconDone} />}
                    {status === 'error' && <XCircle size={18} className={styles.iconError} />}
                  </div>
                </div>

                <div className={styles.statusText}>
                  {status === 'pending' && 'Aguardando...'}
                  {status === 'analyzing' && (lang === '__image__' ? 'Analisando...' : `${progress} / ${total} linhas`)}
                  {status === 'done' && (lang === '__image__' ? 'Análise concluída' : `${total} linhas concluídas`)}
                  {status === 'error' && 'Erro na análise'}
                </div>

                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: status === 'done' ? '100%' : `${pct}%` }}
                  />
                </div>

                {status === 'done' && report && (
                  <div className={styles.mini}>
                    <span className={styles.miniError}>{report.errorCount} erros</span>
                    <span className={styles.miniSug}>{report.suggestionCount} sugestões</span>
                    <span className={styles.miniOk}>{report.approvalCount} ok</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
