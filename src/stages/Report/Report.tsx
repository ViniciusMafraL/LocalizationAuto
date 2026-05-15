import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useAppDispatch, useAppState } from '../../store/useAppStore';
import type { AnalysisResult } from '../../types';
import styles from './Report.module.css';

const TYPE_LABELS: Record<string, string> = {
  spelling: 'Ortografia', grammar: 'Gramática', truncation: 'Truncamento',
  untranslated: 'Não traduzido', inconsistency: 'Inconsistência',
  regionalism: 'Regionalismo', tone: 'Tom', formality: 'Formalidade',
  cultural: 'Cultural', machine_translation: 'Tradução automática', context: 'Fora de contexto',
};

const SEV_LABEL: Record<string, string> = { critical: 'Crítico', high: 'Alto', medium: 'Médio' };

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

function ResultItem({ result }: { result: AnalysisResult }) {
  const isError = result.category === 'error';
  const isSug = result.category === 'suggestion';
  const isOk = result.category === 'approval';

  return (
    <div className={`${styles.reportItem} ${isError ? styles.itemErr : isSug ? styles.itemWarn : styles.itemOk}`}>
      <div className={`${styles.riIcon} ${isError ? styles.iconErr : isSug ? styles.iconWarn : styles.iconOk}`}>
        {isError ? '🚨' : isSug ? '💡' : '✅'}
      </div>
      <div className={styles.riBody}>
        {result.key && (
          <div className={styles.riKey}>KEY: {result.key}</div>
        )}
        <div className={styles.riLabel}>
          {result.errorType && (TYPE_LABELS[result.errorType] || result.errorType)}
          {result.key && !result.errorType && result.key}
        </div>
        <div className={styles.riText}>{result.explanation}</div>
        {isError && (
          <div className={styles.riCompare}>
            <div className={styles.riOriginal}>
              <span className={styles.srcLabel}>source</span>
              {result.sourceText}
            </div>
            <div className={`${styles.riOriginal} ${styles.errorText}`}>
              <span className={styles.srcLabel}>tradução</span>
              {result.translatedText}
            </div>
            {result.correction && (
              <div className={styles.riCorrection}>
                <span className={styles.srcLabel}>correção</span>
                {result.correction}
              </div>
            )}
          </div>
        )}
        {isSug && (
          <div className={styles.riCompare}>
            <div className={styles.riOriginal}>
              <span className={styles.srcLabel}>source</span>
              {result.sourceText}
            </div>
            <div className={styles.riOriginal}>
              <span className={styles.srcLabel}>tradução atual</span>
              {result.translatedText}
            </div>
            {result.better && (
              <div className={styles.riCorrection}>
                <span className={styles.srcLabel}>sugestão</span>
                {result.better}
              </div>
            )}
          </div>
        )}
        {isOk && (
          <div className={styles.riCompare}>
            <div className={styles.riOriginal}>
              <span className={styles.srcLabel}>source</span>
              {result.sourceText}
            </div>
            <div className={styles.riOriginal}>
              <span className={styles.srcLabel}>tradução</span>
              {result.translatedText}
            </div>
          </div>
        )}
      </div>
      {isError && result.severity && (
        <div className={`${styles.riBadge} ${styles.badgeErr}`}>
          {SEV_LABEL[result.severity] ?? result.severity}
        </div>
      )}
      {isSug && (
        <div className={`${styles.riBadge} ${styles.badgeWarn}`}>Sugestão</div>
      )}
      {isOk && (
        <div className={`${styles.riBadge} ${styles.badgeOk}`}>OK</div>
      )}
    </div>
  );
}

type InnerTab = 'errors' | 'suggestions' | 'ok';

function LangSection({ lang }: { lang: string }) {
  const { languageReports } = useAppState();
  const report = languageReports[lang];
  const results = report?.results ?? [];

  const errors = results.filter((r) => r.category === 'error');
  const suggestions = results.filter((r) => r.category === 'suggestion');
  const approvals = results.filter((r) => r.category === 'approval');

  const defaultTab: InnerTab = errors.length > 0 ? 'errors' : suggestions.length > 0 ? 'suggestions' : 'ok';
  const [activeTab, setActiveTab] = useState<InnerTab>(defaultTab);

  if (!report) return null;

  const activeResults = activeTab === 'errors' ? errors : activeTab === 'suggestions' ? suggestions : approvals;

  return (
    <div className={styles.langSection}>
      <div className={styles.langSectionHeader}>
        <span className={styles.lshFlag}>{getLangMeta(lang).flag}</span>
        <div className={styles.lshMeta}>
          <div className={styles.lshName}>{getLangMeta(lang).name}</div>
        </div>
        <div className={styles.lshCounts}>
          <span className={`${styles.lshCount} ${styles.cErr}`}>🚨 {errors.length} erro{errors.length !== 1 ? 's' : ''}</span>
          <span className={`${styles.lshCount} ${styles.cWarn}`}>💡 {suggestions.length} sugestão{suggestions.length !== 1 ? 'ões' : ''}</span>
          <span className={`${styles.lshCount} ${styles.cOk}`}>✅ {approvals.length} ok</span>
        </div>
      </div>

      {report.apiError && (
        <div className={styles.apiError}>
          <span>❌</span>
          <span>Erro na análise: {report.apiError}</span>
        </div>
      )}

      <div className={styles.innerTabs}>
        <button
          className={`${styles.itab} ${styles.itErr} ${activeTab === 'errors' ? styles.itabActive : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          <span>Erros</span>
          <span className={`${styles.itabBadge} ${styles.badgeErrInner}`}>{errors.length}</span>
        </button>
        <button
          className={`${styles.itab} ${styles.itWarn} ${activeTab === 'suggestions' ? styles.itabActive : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          <span>Sugestões</span>
          <span className={`${styles.itabBadge} ${styles.badgeWarnInner}`}>{suggestions.length}</span>
        </button>
        <button
          className={`${styles.itab} ${styles.itOk} ${activeTab === 'ok' ? styles.itabActive : ''}`}
          onClick={() => setActiveTab('ok')}
        >
          <span>Acertos</span>
          <span className={`${styles.itabBadge} ${styles.badgeOkInner}`}>{approvals.length}</span>
        </button>
      </div>

      <div className={styles.innerPanel}>
        {activeResults.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              {activeTab === 'errors' ? '✅' : activeTab === 'suggestions' ? '💡' : '📋'}
            </div>
            <div className={styles.emptyText}>
              {activeTab === 'errors' ? 'Nenhum erro encontrado.' : activeTab === 'suggestions' ? 'Sem sugestões.' : 'Sem textos aprovados.'}
            </div>
          </div>
        ) : (
          activeResults.map((r, i) => (
            <ResultItem key={`${r.rowIndex}-${i}`} result={r} />
          ))
        )}
      </div>
    </div>
  );
}

export function Report() {
  const dispatch = useAppDispatch();
  const { config, languageReports, fileName } = useAppState();

  const langs = config.targetLangs;
  const [activeLang, setActiveLang] = useState<string>(langs[0] ?? '');

  const reports = Object.values(languageReports);
  const totalErrors = reports.reduce((s, r) => s + r.errorCount, 0);
  const totalSuggestions = reports.reduce((s, r) => s + r.suggestionCount, 0);
  const totalApprovals = reports.reduce((s, r) => s + r.approvalCount, 0);
  const totalStrings = reports.reduce((s, r) => s + (r.results?.length ?? 0), 0);

  const analyzingCount = langs.filter((l) => {
    const status = languageReports[l]?.status;
    return status === 'pending' || status === 'analyzing';
  }).length;

  function handleReset() {
    dispatch({ type: 'RESET' });
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Top bar */}
        <div className={styles.topBar}>
          <h1 className={styles.title}>Relatório de QA</h1>
          <button className={styles.resetBtn} onClick={handleReset}>
            <RotateCcw size={14} />
            + Nova análise
          </button>
        </div>

        {/* Analyzing banner */}
        {analyzingCount > 0 && (
          <div className={styles.analyzingBanner}>
            <div className={styles.bannerDots}>
              <span /><span /><span />
            </div>
            <span>
              Analisando {analyzingCount} idioma{analyzingCount !== 1 ? 's' : ''} restante{analyzingCount !== 1 ? 's' : ''}...
            </span>
          </div>
        )}

        {/* File meta */}
        {fileName && (
          <div className={styles.analyzeHeader}>
            <div className={styles.analyzeThumb}>📊</div>
            <div className={styles.analyzeMeta}>
              <div className={styles.metaName}>{fileName}</div>
              <div className={styles.metaTags}>
                <span className={`${styles.metaTag} ${styles.tagLang}`}>{config.sourceLang}</span>
                <span className={`${styles.metaTag} ${styles.tagType}`}>
                  {config.projectType === 'casual_game' ? '🎮 Casual' : config.projectType === 'formal_app' ? '💼 Formal' : '⚡ Misto'}
                </span>
                <span className={`${styles.metaTag} ${styles.tagMode}`}>📊 Planilha</span>
              </div>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className={styles.dashSummary}>
          <div className={`${styles.summaryCard} ${styles.sErr}`}>
            <div className={styles.summaryNum}>{totalErrors}</div>
            <div className={styles.summaryLabel}>Erros totais</div>
          </div>
          <div className={`${styles.summaryCard} ${styles.sWarn}`}>
            <div className={styles.summaryNum}>{totalSuggestions}</div>
            <div className={styles.summaryLabel}>Sugestões totais</div>
          </div>
          <div className={`${styles.summaryCard} ${styles.sOk}`}>
            <div className={styles.summaryNum}>{totalApprovals}</div>
            <div className={styles.summaryLabel}>Acertos totais</div>
          </div>
          <div className={`${styles.summaryCard} ${styles.sTotal}`}>
            <div className={styles.summaryNum}>{totalStrings}</div>
            <div className={styles.summaryLabel}>Strings analisadas</div>
          </div>
        </div>

        {/* Language nav */}
        <div className={styles.langNav}>
          {langs.map((lang) => {
            const rep = languageReports[lang];
            const meta = getLangMeta(lang);
            const isReady = rep?.status === 'done' || rep?.status === 'error';
            const isActive = lang === activeLang;
            return (
              <button
                key={lang}
                className={`${styles.langNavBtn} ${isActive ? styles.langNavActive : ''} ${!isReady ? styles.langNavPending : ''}`}
                onClick={() => isReady && setActiveLang(lang)}
                disabled={!isReady}
              >
                <span className={styles.lnbFlag}>{meta.flag}</span>
                <span>{meta.name}</span>
                <span className={styles.lnbBadge}>
                  {!isReady ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>⏳</span>
                  ) : (
                    <>
                      {rep && rep.errorCount > 0 && <span className={styles.lnbErr}>E{rep.errorCount}</span>}
                      {rep && rep.suggestionCount > 0 && <span className={styles.lnbWarn}>S{rep.suggestionCount}</span>}
                      {rep && <span className={styles.lnbOk}>✓{rep.approvalCount}</span>}
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Language sections */}
        {activeLang && languageReports[activeLang]?.status === 'done' && (
          <LangSection key={activeLang} lang={activeLang} />
        )}

        {/* Pending state for selected lang */}
        {activeLang && languageReports[activeLang]?.status !== 'done' && languageReports[activeLang]?.status !== 'error' && (
          <div className={styles.langLoadingCard}>
            <span style={{ fontSize: 28 }}>{getLangMeta(activeLang).flag}</span>
            <div style={{ flex: 1 }}>
              <div className={styles.llcTitle}>{getLangMeta(activeLang).name} — analisando...</div>
              <div className={styles.llcBar}>
                <div className={styles.llcBarFill} />
              </div>
              <div className={styles.llcSub}>Aguardando resultados...</div>
            </div>
            <div className={styles.llcBadge}>⏳ em fila</div>
          </div>
        )}

      </div>
    </div>
  );
}
