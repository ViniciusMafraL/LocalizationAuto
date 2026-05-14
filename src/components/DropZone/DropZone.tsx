import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import styles from './DropZone.module.css';

interface Props {
  onFile: (file: File) => void;
}

export function DropZone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'csv') onFile(file);
    },
    [onFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <label
      className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept=".xlsx,.csv"
        className={styles.input}
        onChange={onInputChange}
      />
      <Upload size={32} strokeWidth={1.5} className={styles.icon} />
      <p className={styles.primary}>Arraste sua planilha aqui</p>
      <p className={styles.secondary}>ou clique para selecionar · .xlsx / .csv</p>
    </label>
  );
}
