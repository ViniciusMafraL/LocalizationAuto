import { useState } from 'react';
import type { ProjectType } from '../../types';
import { useAppDispatch, useAppState } from '../../store/useAppStore';
import styles from './Setup.module.css';

const PROJECT_TYPES: { value: ProjectType; label: string; desc: string; icon: string }[] = [
  { value: 'casual_game', label: 'Casual Game', desc: 'Tom leve, energético, frases curtas', icon: '🎮' },
  { value: 'formal_app', label: 'Formal App', desc: 'Tom profissional, técnico, preciso', icon: '💼' },
  { value: 'mixed', label: 'Mixed', desc: 'Contexto variado, tom misto', icon: '🔀' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt-br', label: 'Português BR', flag: '🇧🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh-cn', label: '中文 (简体)', flag: '🇨🇳' },
  { code: 'zh-tw', label: '中文 (繁體)', flag: '🇹🇼' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export function Setup() {
  const dispatch = useAppDispatch();
  const { config } = useAppState();
  const [projectType, setProjectType] = useState<ProjectType>(config.projectType);
  const [sourceLang, setSourceLang] = useState(config.sourceLang);

  function handleContinue() {
    dispatch({ type: 'SET_CONFIG', payload: { projectType, sourceLang } });
    dispatch({ type: 'SET_STAGE', payload: 'upload' });
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headline}>
          <h1 className={styles.title}>Configuração do projeto</h1>
          <p className={styles.subtitle}>
            Defina o contexto para que a IA calibre suas análises.
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
          <label className={styles.sectionLabel}>Idioma fonte (original)</label>
          <div className={styles.langGrid}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`${styles.langBtn} ${sourceLang === l.code ? styles.langSelected : ''}`}
                onClick={() => setSourceLang(l.code)}
              >
                <span className={styles.langFlag}>{l.flag}</span>
                <span className={styles.langLabel}>{l.label}</span>
                <span className={styles.langCode}>{l.code}</span>
              </button>
            ))}
          </div>
        </section>

        <button className={styles.cta} onClick={handleContinue}>
          Continuar →
        </button>
      </div>
    </div>
  );
}
