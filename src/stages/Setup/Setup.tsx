import { useState } from 'react';
import type { ProjectType } from '../../types';
import { useAppDispatch, useAppState } from '../../store/useAppStore';
import styles from './Setup.module.css';

const PROJECT_TYPES: { value: ProjectType; label: string; desc: string; icon: string }[] = [
  { value: 'casual_game', label: 'Jogo Casual', desc: 'Tom leve, direto, divertido. Emojis aceitáveis.', icon: '🎮' },
  { value: 'formal_app', label: 'App Formal', desc: 'Tom profissional, neutro. Terminologia técnica.', icon: '💼' },
  { value: 'mixed', label: 'Outro / Misto', desc: 'Produto com seções de tons diferentes.', icon: '⚡' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', label: 'Português BR', flag: '🇧🇷' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export function Setup() {
  const dispatch = useAppDispatch();
  const { config } = useAppState();
  const [projectType, setProjectType] = useState<ProjectType>(config.projectType);
  const [sourceLang, setSourceLang] = useState(config.sourceLang || 'en');
  const [targetLangs, setTargetLangs] = useState<string[]>(config.targetLangs);
  const [warn, setWarn] = useState('');

  function handleSelectAnchor(code: string) {
    setSourceLang(code);
    setTargetLangs((prev) => prev.filter((l) => l !== code));
  }

  function handleToggleTarget(code: string) {
    if (code === sourceLang) return;
    setTargetLangs((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code],
    );
  }

  function handleContinue() {
    if (!projectType) { setWarn('Selecione o tipo de projeto.'); return; }
    if (!sourceLang) { setWarn('Selecione o idioma original.'); return; }
    if (targetLangs.length === 0) { setWarn('Selecione ao menos um idioma alvo.'); return; }
    setWarn('');
    dispatch({ type: 'SET_CONFIG', payload: { projectType, sourceLang, targetLangs } });
    dispatch({ type: 'SET_STAGE', payload: 'upload' });
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headline}>
          <h1 className={styles.title}>Configuração do projeto</h1>
          <p className={styles.subtitle}>
            Defina o contexto antes de começar — isso guia toda a análise.
          </p>
        </div>

        <section className={styles.section}>
          <label className={styles.sectionLabel}>Tipo de projeto</label>
          <div className={styles.cards}>
            {PROJECT_TYPES.map((pt) => (
              <button
                key={pt.value}
                className={`${styles.typeCard} ${projectType === pt.value ? styles.selected : ''}`}
                onClick={() => setProjectType(pt.value)}
              >
                <span className={styles.icon}>{pt.icon}</span>
                <span className={styles.cardLabel}>{pt.label}</span>
                <span className={styles.cardDesc}>{pt.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <label className={styles.sectionLabel}>Idioma original (âncora)</label>
          <p className={styles.sectionHint}>O idioma-fonte dos textos — geralmente a primeira coluna de texto.</p>
          <div className={styles.langGrid}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`${styles.langBtn} ${sourceLang === l.code ? styles.langAnchor : ''}`}
                onClick={() => handleSelectAnchor(l.code)}
              >
                <span className={styles.langFlag}>{l.flag}</span>
                <span className={styles.langLabel}>{l.label}</span>
                <span className={styles.langCode}>
                  {sourceLang === l.code ? '◆' : l.code}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <label className={styles.sectionLabel}>Idiomas alvo para análise</label>
          <p className={styles.sectionHint}>Selecione os idiomas que deseja analisar.</p>
          <div className={styles.langGrid}>
            {LANGUAGES.map((l) => {
              const isAnchor = l.code === sourceLang;
              const isSelected = targetLangs.includes(l.code);
              return (
                <button
                  key={l.code}
                  className={`${styles.langBtn} ${isAnchor ? styles.langDisabled : ''} ${isSelected && !isAnchor ? styles.langSelected : ''}`}
                  onClick={() => handleToggleTarget(l.code)}
                  disabled={isAnchor}
                >
                  <span className={styles.langFlag}>{l.flag}</span>
                  <span className={styles.langLabel}>{l.label}</span>
                  <span className={styles.langCode}>
                    {isAnchor ? '—' : isSelected ? '✓' : l.code}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {warn && <p className={styles.warn}>{warn}</p>}

        <button className={styles.cta} onClick={handleContinue}>
          Continuar → Upload
        </button>
      </div>
    </div>
  );
}
