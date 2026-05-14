import type { Category } from '../../types';
import styles from './CategoryBadge.module.css';

const LABELS: Record<Category, string> = {
  error: 'Erro',
  suggestion: 'Sugestão',
  approval: 'Aprovação',
};

interface Props {
  category: Category;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'md' }: Props) {
  return (
    <span className={`${styles.badge} ${styles[category]} ${size === 'sm' ? styles.sm : ''}`}>
      {LABELS[category]}
    </span>
  );
}
