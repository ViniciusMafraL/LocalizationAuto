import { useState } from 'react';
import { Search, RotateCcw, AlertCircle, Lightbulb, CheckCircle } from 'lucide-react';
import { useAppDispatch, useAppState } from '../../store/useAppStore';
import { ResultCard } from '../../components/ResultCard/ResultCard';
import type { Category } from '../../types';
import styles from './Report.module.css';

type FilterCategory = Category | 'all';

const CATEGORY_TABS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'error', label: 'Erros' },
  { key: 'suggestion', label: 'Sugestões' },
  { key: 'approval', label: 'Aprovações' },
];

export function Report() {
  const dispatch = useAppDispatch();
  const { config, languageReports } = useAppState();

  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');

  const langs = config.targetLangs;
  const reports = Object.values(languageReports);

  const selectedLang = activeLang ?? langs[0] ?? null;
  const currentReport = selectedLang ? languageReports[selectedLang] : null;

  const totalErrors = reports.reduce((s, r) => s + r.errorCount, 0);
  const totalSuggestions = reports.reduce((s, r) => s + r.suggestionCount, 0);
  const totalApprovals = reports.reduce((s, r) => s + r.approvalCount, 0);

  const filtered = (currentReport?.results ?? []).filter((r) => {
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

  function handleReset() {
    dispatch({ type: 'RESET' });
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.headline}>
            <h1 className={styles.title}>Relatório de QA</h1>
            {config.detectedContext && (
              <p className={styles.context}>{config.detectedContext}</p>
            )}
          </div>
          <button className={styles.resetBtn} onClick={handleReset}>
            <RotateCcw size={14} />
            Novo projeto
          </button>
        </div>

        {/* Summary stats */}
        <div className={styles.stats}>
          <div className={`${styles.stat} ${styles.statError}`}>
            <AlertCircle size={18} />
            <span className={styles.statNum}>{totalErrors}</span>
            <span className={styles.statLabel}>Erros</span>
          </div>
          <div className={`${styles.stat} ${styles.statSuggestion}`}>
            <Lightbulb size={18} />
            <span className={styles.statNum}>{totalSuggestions}</span>
            <span className={styles.statLabel}>Sugestões</span>
          </div>
          <div className={`${styles.stat} ${styles.statApproval}`}>
            <CheckCircle size={18} />
            <span className={styles.statNum}>{totalApprovals}</span>
            <span className={styles.statLabel}>Aprovações</span>
          </div>
        </div>

        {/* Language tabs */}
        <div className={styles.langTabs}>
          {langs.map((lang) => {
            const rep = languageReports[lang];
            const isActive = lang === selectedLang;
            return (
              <button
                key={lang}
                className={`${styles.langTab} ${isActive ? styles.langTabActive : ''}`}
                onClick={() => setActiveLang(lang)}
              >
                <span className={styles.langTabCode}>{lang}</span>
                {rep && (
                  <span className={styles.langTabBadge}>
                    {rep.errorCount > 0 && (
                      <span className={styles.badgeError}>{rep.errorCount}</span>
                    )}
                    {rep.suggestionCount > 0 && (
                      <span className={styles.badgeSug}>{rep.suggestionCount}</span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Filtrar por texto..."
              className={styles.searchInput}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className={styles.tabs}>
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeCategory === tab.key ? styles.tabActive : ''}`}
                onClick={() => setActiveCategory(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className={styles.results}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              {currentReport?.results.length === 0
                ? 'Sem resultados para este idioma.'
                : 'Nenhum resultado para o filtro atual.'}
            </div>
          ) : (
            filtered.map((r) => (
              <ResultCard key={`${r.rowIndex}-${r.targetLang}`} result={r} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}
