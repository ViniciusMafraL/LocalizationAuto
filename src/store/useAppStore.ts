import { createContext, useContext, useReducer, type Dispatch } from 'react';
import type { AppState, AppAction, LanguageReport } from '../types';

const initialState: AppState = {
  stage: 'setup',
  config: {
    projectType: 'casual_game',
    sourceLang: 'en',
    targetLangs: [],
    detectedContext: '',
  },
  parsedRows: [],
  detectedColumns: [],
  languageReports: {},
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STAGE':
      return { ...state, stage: action.payload };

    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };

    case 'SET_PARSED_ROWS':
      return { ...state, parsedRows: action.payload };

    case 'SET_DETECTED_COLUMNS':
      return { ...state, detectedColumns: action.payload };

    case 'INIT_LANGUAGE_REPORT': {
      const report: LanguageReport = {
        langCode: action.payload.langCode,
        status: 'pending',
        results: [],
        errorCount: 0,
        suggestionCount: 0,
        approvalCount: 0,
        progress: 0,
        total: action.payload.total,
      };
      return {
        ...state,
        languageReports: { ...state.languageReports, [action.payload.langCode]: report },
      };
    }

    case 'SET_LANGUAGE_STATUS':
      return {
        ...state,
        languageReports: {
          ...state.languageReports,
          [action.payload.langCode]: {
            ...state.languageReports[action.payload.langCode],
            status: action.payload.status,
          },
        },
      };

    case 'APPEND_RESULT': {
      const lang = action.payload.targetLang;
      const existing = state.languageReports[lang];
      if (!existing) return state;
      const cat = action.payload.category;
      return {
        ...state,
        languageReports: {
          ...state.languageReports,
          [lang]: {
            ...existing,
            results: [...existing.results, action.payload],
            errorCount: existing.errorCount + (cat === 'error' ? 1 : 0),
            suggestionCount: existing.suggestionCount + (cat === 'suggestion' ? 1 : 0),
            approvalCount: existing.approvalCount + (cat === 'approval' ? 1 : 0),
          },
        },
      };
    }

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        languageReports: {
          ...state.languageReports,
          [action.payload.langCode]: {
            ...state.languageReports[action.payload.langCode],
            progress: action.payload.progress,
          },
        },
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export const AppStateContext = createContext<AppState>(initialState);
export const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function useAppState() {
  return useContext(AppStateContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}

export function useAppReducer() {
  return useReducer(reducer, initialState);
}
