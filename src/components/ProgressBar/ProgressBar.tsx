import styles from './ProgressBar.module.css';

interface Props {
  value: number;
  total: number;
}

export function ProgressBar({ value, total }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${pct}%` }} />
    </div>
  );
}
