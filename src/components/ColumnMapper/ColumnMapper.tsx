import { useState } from 'react';
import type { DetectedColumn } from '../../types';
import styles from './ColumnMapper.module.css';

const LANG_OPTIONS = [
  'en', 'pt-br', 'pt', 'fr', 'es', 'de', 'it', 'ja', 'ko', 'zh', 'zh-cn', 'zh-tw',
  'ru', 'ar', 'nl', 'pl', 'tr', 'sv', 'da', 'fi', 'nb', 'cs', 'hu', 'ro', 'uk',
  'vi', 'th', 'id', 'ms',
];

interface Props {
  columns: DetectedColumn[];
  sourceLang: string;
  onChange: (updated: DetectedColumn[]) => void;
  onConfirm: () => void;
}

export function ColumnMapper({ columns, sourceLang, onChange, onConfirm }: Props) {
  const [local, setLocal] = useState<DetectedColumn[]>(columns);

  function updateLang(idx: number, langCode: string) {
    const updated = local.map((col, i) =>
      i === idx ? { ...col, langCode, isSource: langCode === sourceLang } : col
    );
    setLocal(updated);
    onChange(updated);
  }

  function toggleSource(idx: number) {
    const updated = local.map((col, i) => ({
      ...col,
      isSource: i === idx,
    }));
    setLocal(updated);
    onChange(updated);
  }

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Colunas detectadas</h3>
      <p className={styles.sub}>Revise e corrija se necessário antes de continuar.</p>
      <div className={styles.table}>
        <div className={styles.headerRow}>
          <span>Cabeçalho original</span>
          <span>Idioma detectado</span>
          <span>Fonte</span>
        </div>
        {local.map((col, i) => (
          <div key={col.colIndex} className={styles.row}>
            <span className={styles.colHeader}>{col.header}</span>
            <select
              className={styles.select}
              value={col.langCode}
              onChange={(e) => updateLang(i, e.target.value)}
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              className={`${styles.sourceBtn} ${col.isSource ? styles.active : ''}`}
              onClick={() => toggleSource(i)}
              title="Definir como idioma fonte"
            >
              {col.isSource ? '★' : '☆'}
            </button>
          </div>
        ))}
      </div>
      <button className={styles.confirmBtn} onClick={onConfirm}>
        Confirmar e analisar →
      </button>
    </div>
  );
}
