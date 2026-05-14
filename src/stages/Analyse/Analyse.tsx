import { useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAnalysisRunner } from '../../hooks/useAnalysisRunner';
import { useAppState } from '../../store/useAppStore';
import styles from './Analyse.module.css';

export function Analyse() {
  const { config, languageReports } = useAppState();
  const { run } = useAnalysisRunner();
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      run();
    }
  }, [run]);

  const langs = config.targetLangs;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headline}>
          <h1 className={styles.title}>Analisando traduções</h1>
          <p className={styles.subtitle}>
            Claude está revisando cada idioma. Isso pode levar alguns minutos.
          </p>
        </div>

        <div className={styles.cards}>
          {langs.map((lang) => {
            const report = languageReports[lang];
            const status = report?.status ?? 'pending';
            const progress = report?.progress ?? 0;
            const total = report?.total ?? 0;
            const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

            return (
              <div key={lang} className={`${styles.card} ${styles[status]}`}>
                <div className={styles.cardTop}>
                  <span className={styles.langCode}>{lang}</span>
                  <div className={styles.statusIcon}>
                    {status === 'analyzing' && <Loader2 size={18} className={styles.spinner} />}
                    {status === 'done' && <CheckCircle2 size={18} className={styles.iconDone} />}
                    {status === 'error' && <XCircle size={18} className={styles.iconError} />}
                  </div>
                </div>

                <div className={styles.statusText}>
                  {status === 'pending' && 'Aguardando...'}
                  {status === 'analyzing' && `${progress} / ${total} linhas`}
                  {status === 'done' && `${total} linhas concluídas`}
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
