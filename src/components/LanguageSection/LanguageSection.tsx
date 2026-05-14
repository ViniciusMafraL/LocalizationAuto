import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LanguageReport, Category } from '../../types';
import { CategoryBadge } from '../CategoryBadge/CategoryBadge';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { ResultCard } from '../ResultCard/ResultCard';
import styles from './LanguageSection.module.css';

interface Props {
  report: LanguageReport;
  filter: string;
  activeCategory: Category | 'all';
}

export function LanguageSection({ report, filter, activeCategory }: Props) {
  const [open, setOpen] = useState(true);

  const filtered = report.results.filter((r) => {
    if (activeCategory !== 'all' && r.category !== activeCategory) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return (
        r.sourceText.toLowerCase().includes(q) ||
        r.translatedText.toLowerCase().includes(q) ||
        r.explanation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusLabel: Record<LanguageReport['status'], string> = {
    pending: 'Pendente',
    analyzing: 'Analisando...',
    done: 'Concluído',
    error: 'Erro',
  };

  return (
    <section className={styles.section}>
      <button className={styles.toggle} onClick={() => setOpen((o) => !o)}>
        <span className={styles.chevron}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className={styles.langCode}>{report.langCode.toUpperCase()}</span>
        <span className={styles.statusDot} data-status={report.status} />
        {report.status === 'analyzing' && (
          <div className={styles.progressWrap}>
            <ProgressBar value={report.progress} total={report.total} />
            <span className={styles.progressText}>
              {report.progress}/{report.total}
            </span>
          </div>
        )}
        {report.status !== 'analyzing' && (
          <span className={styles.statusText}>{statusLabel[report.status]}</span>
        )}
        <div className={styles.counts}>
          {report.errorCount > 0 && (
            <CategoryBadge category="error" size="sm" />
          )}
          {report.suggestionCount > 0 && (
            <CategoryBadge category="suggestion" size="sm" />
          )}
          {report.approvalCount > 0 && (
            <CategoryBadge category="approval" size="sm" />
          )}
          {report.status === 'done' && (
            <span className={styles.countDetail}>
              {report.errorCount}E · {report.suggestionCount}S · {report.approvalCount}A
            </span>
          )}
        </div>
      </button>

      {open && filtered.length > 0 && (
        <div className={styles.cards}>
          {filtered.map((r) => (
            <ResultCard key={`${r.rowIndex}-${r.targetLang}`} result={r} />
          ))}
        </div>
      )}

      {open && filtered.length === 0 && report.results.length > 0 && (
        <p className={styles.noMatch}>Nenhum resultado para o filtro atual.</p>
      )}

      {open && report.status === 'pending' && report.results.length === 0 && (
        <p className={styles.noMatch}>Aguardando análise...</p>
      )}
    </section>
  );
}
