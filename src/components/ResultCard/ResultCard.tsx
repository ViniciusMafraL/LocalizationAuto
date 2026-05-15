import type { AnalysisResult } from '../../types';
import { CategoryBadge } from '../CategoryBadge/CategoryBadge';
import styles from './ResultCard.module.css';

interface Props {
  result: AnalysisResult;
}

export function ResultCard({ result }: Props) {
  const severityLabel: Record<string, string> = {
    alto: 'Alto',
    medio: 'Médio',
    baixo: 'Baixo',
  };

  return (
    <div className={`${styles.card} ${styles[result.category]}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {result.errorType && (
            <span className={styles.errorType}>{result.errorType}</span>
          )}
          {result.severity && (
            <span className={`${styles.severity} ${styles[`sev_${result.severity}`]}`}>
              {severityLabel[result.severity] ?? result.severity}
            </span>
          )}
        </div>
        <CategoryBadge category={result.category} size="sm" />
      </div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Fonte</span>
          <span className={styles.rowValue}>{result.sourceText || <em className={styles.empty}>—</em>}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Tradução</span>
          <span className={styles.rowValue}>{result.translatedText || <em className={styles.empty}>— sem tradução —</em>}</span>
        </div>
        {result.correction && (
          <div className={`${styles.row} ${styles.correctionRow}`}>
            <span className={styles.rowLabel}>Correção</span>
            <span className={styles.rowValueCorrection}>{result.correction}</span>
          </div>
        )}
      </div>

      <div className={styles.explanation}>{result.explanation}</div>
    </div>
  );
}
