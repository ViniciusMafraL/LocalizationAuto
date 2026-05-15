export type Stage = 'setup' | 'upload' | 'analyse' | 'report';
export type ProjectType = 'casual_game' | 'formal_app' | 'mixed';
export type Category = 'error' | 'suggestion' | 'approval';

export interface AppConfig {
  projectType: ProjectType;
  sourceLang: string;
  targetLangs: string[];
}

export interface ParsedRow {
  rowIndex: number;
  key?: string;
  sourceText: string;
  translations: Record<string, string>;
}

export interface DetectedColumn {
  colIndex: number;
  header: string;
  langCode: string;
  isSource: boolean;
}

export interface AnalysisResult {
  rowIndex: number;
  key?: string;
  sourceText: string;
  targetLang: string;
  translatedText: string;
  category: Category;
  explanation: string;
  errorType?: string;
  severity?: 'critical' | 'high' | 'medium';
  correction?: string;
  better?: string;
  note?: string;
}

export interface BatchProgress {
  langCode: string;
  langName: string;
  langFlag: string;
  batchIndex: number;
  totalBatches: number;
  batchSize: number;
  stringsDone: number;
  stringsTotal: number;
  log: { id: string; label: string; status: 'active' | 'done' | 'error' }[];
}

export interface LanguageReport {
  langCode: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  results: AnalysisResult[];
  errorCount: number;
  suggestionCount: number;
  approvalCount: number;
  progress: number;
  total: number;
  apiError?: string;
}

export interface AppState {
  stage: Stage;
  config: AppConfig;
  parsedRows: ParsedRow[];
  detectedColumns: DetectedColumn[];
  languageReports: Record<string, LanguageReport>;
  batchProgress: BatchProgress | null;
  fileName: string;
}

export type AppAction =
  | { type: 'SET_STAGE'; payload: Stage }
  | { type: 'SET_CONFIG'; payload: Partial<AppConfig> }
  | { type: 'SET_PARSED_ROWS'; payload: ParsedRow[] }
  | { type: 'SET_DETECTED_COLUMNS'; payload: DetectedColumn[] }
  | { type: 'INIT_LANGUAGE_REPORT'; payload: { langCode: string; total: number } }
  | { type: 'SET_LANGUAGE_STATUS'; payload: { langCode: string; status: LanguageReport['status']; apiError?: string } }
  | { type: 'APPEND_RESULT'; payload: AnalysisResult }
  | { type: 'UPDATE_PROGRESS'; payload: { langCode: string; progress: number } }
  | { type: 'SET_BATCH_PROGRESS'; payload: BatchProgress | null }
  | { type: 'SET_FILE_NAME'; payload: string }
  | { type: 'RESET' };
