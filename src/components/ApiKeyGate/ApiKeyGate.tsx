import { useState, type ReactNode } from 'react';
import { getStoredApiKey, saveApiKey, clearApiKey } from '../../lib/claudeClient';
import styles from './ApiKeyGate.module.css';

interface Props {
  children: ReactNode;
}

export function ApiKeyGate({ children }: Props) {
  const [key, setKey] = useState(getStoredApiKey);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  function handleSave() {
    const trimmed = input.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      setError('A chave deve começar com sk-ant-');
      return;
    }
    saveApiKey(trimmed);
    setKey(trimmed);
    setInput('');
    setError('');
    setShowSettings(false);
  }

  function handleClear() {
    clearApiKey();
    setKey('');
    setShowSettings(false);
  }

  if (!key) {
    return (
      <div className={styles.gate}>
        <div className={styles.card}>
          <div className={styles.logo}>🔑</div>
          <h1 className={styles.title}>LocQA</h1>
          <p className={styles.desc}>
            Insira sua chave da API Anthropic para usar o LocQA. A chave é salva localmente no seu
            navegador e nunca enviada a terceiros.
          </p>
          <div className={styles.inputRow}>
            <input
              className={styles.keyInput}
              type="password"
              placeholder="sk-ant-api03-..."
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button className={styles.saveBtn} onClick={handleSave}>
              Salvar
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <a
            className={styles.hint}
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
          >
            Obter chave no console Anthropic →
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <button className={styles.settingsBtn} onClick={() => setShowSettings(true)} title="Configurações da API">
        ⚙
      </button>
      {showSettings && (
        <div className={styles.overlay} onClick={() => setShowSettings(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Configurações de API</h2>
            <p className={styles.modalDesc}>Chave atual:</p>
            <div className={styles.keyPreview}>
              {key.slice(0, 14)}{'•'.repeat(12)}{key.slice(-4)}
            </div>
            <div className={styles.modalActions}>
              <div className={styles.inputRow}>
                <input
                  className={styles.keyInput}
                  type="password"
                  placeholder="Nova chave sk-ant-..."
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button className={styles.saveBtn} onClick={handleSave} disabled={!input.trim()}>
                  Trocar
                </button>
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button className={styles.clearBtn} onClick={handleClear}>
                Remover chave
              </button>
            </div>
            <button className={styles.closeBtn} onClick={() => setShowSettings(false)}>✕</button>
          </div>
        </div>
      )}
    </>
  );
}
