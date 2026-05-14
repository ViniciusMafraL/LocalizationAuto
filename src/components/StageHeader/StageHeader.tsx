import type { Stage } from '../../types';
import styles from './StageHeader.module.css';

const STAGES: { key: Stage; label: string; num: number }[] = [
  { key: 'setup', label: 'Configuração', num: 1 },
  { key: 'upload', label: 'Upload', num: 2 },
  { key: 'analyse', label: 'Análise', num: 3 },
  { key: 'report', label: 'Relatório', num: 4 },
];

interface Props {
  current: Stage;
}

export function StageHeader({ current }: Props) {
  const currentIdx = STAGES.findIndex((s) => s.key === current);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandLoc}>Loc</span>
        <span className={styles.brandQA}>QA</span>
        <span className={styles.brandBadge}>v0.1</span>
      </div>
      <nav className={styles.steps}>
        {STAGES.map((stage, idx) => {
          const state =
            idx < currentIdx ? 'done' : idx === currentIdx ? 'active' : 'pending';
          return (
            <div key={stage.key} className={`${styles.step} ${styles[state]}`}>
              <span className={styles.stepNum}>{state === 'done' ? '✓' : stage.num}</span>
              <span className={styles.stepLabel}>{stage.label}</span>
              {idx < STAGES.length - 1 && <span className={styles.connector} />}
            </div>
          );
        })}
      </nav>
    </header>
  );
}
