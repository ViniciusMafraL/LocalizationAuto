import Anthropic from '@anthropic-ai/sdk';
import type { AppConfig, ParsedRow, AnalysisResult } from '../types';

const MODEL = 'claude-sonnet-4-20250514';
const BASE_WAITS = [0, 15000, 30000, 50000];

export const API_KEY_STORAGE = 'locqa_anthropic_key';

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? '';
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE);
}

function getClient(): Anthropic {
  const key = getStoredApiKey() || (import.meta.env.VITE_ANTHROPIC_KEY as string | undefined);
  if (!key) throw new Error('API key não configurada. Acesse as configurações para inserir sua chave.');
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
}

function friendlyError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('429') || msg.includes('rate_limit') || msg.includes('overloaded') || msg.includes('529')) {
    return new Error('Limite de requisições da API Claude atingido. Aguarde e tente novamente.');
  }
  if (msg.includes('401') || msg.includes('authentication') || msg.includes('invalid x-api-key')) {
    return new Error('Chave da API inválida. Verifique sua chave nas configurações.');
  }
  return err instanceof Error ? err : new Error(msg);
}

async function withRetry<T>(fn: () => Promise<T>, onRetry?: (attempt: number, waitSec: number) => void): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    if (attempt > 1) {
      const jitter = Math.random() * 5000;
      const wait = BASE_WAITS[attempt - 1] + jitter;
      onRetry?.(attempt, Math.round(wait / 1000));
      await new Promise((r) => setTimeout(r, wait));
    }
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes('429') || msg.includes('529') || msg.includes('503') ||
        msg.includes('overloaded') || msg.includes('Failed to fetch') || msg.includes('NetworkError');
      if (!isRetryable || attempt === 4) throw friendlyError(err);
    }
  }
  throw friendlyError(lastErr);
}

function extractText(response: Anthropic.Message): string {
  const block = response.content.find((b) => b.type === 'text');
  return block && block.type === 'text' ? block.text.trim() : '';
}

// ── JSON parser 3 camadas ──

function sanitizeJsonString(str: string): string {
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = str.charCodeAt(i);
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\') { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString) {
      if (code === 0x0a) { result += '\\n'; continue; }
      if (code === 0x0d) { result += '\\r'; continue; }
      if (code === 0x09) { result += '\\t'; continue; }
      if (code < 0x20) { result += '\\u' + code.toString(16).padStart(4, '0'); continue; }
    }
    result += ch;
  }
  return result;
}

function extractFieldsFromObject(objStr: string): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  const fieldRe = /"(\w+)"\s*:\s*("(?:[^"\\]|\\.)*"|\d+|true|false|null)/g;
  let m: RegExpExecArray | null;
  while ((m = fieldRe.exec(objStr)) !== null) {
    try { obj[m[1]] = JSON.parse(m[2]); } catch { obj[m[1]] = m[2]; }
  }
  return obj;
}

function extractArray(str: string, arrayName: string): Record<string, unknown>[] {
  const arrMatch = str.match(new RegExp(`"${arrayName}"\\s*:\\s*\\[([\\s\\S]*?)\\](?=\\s*[,}])`));
  if (!arrMatch) return [];
  const content = arrMatch[1].trim();
  if (!content) return [];
  const objects: Record<string, unknown>[] = [];
  let depth = 0, objStart = -1;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') { if (depth === 0) objStart = i; depth++; }
    else if (content[i] === '}') {
      depth--;
      if (depth === 0 && objStart >= 0) {
        const objStr = content.substring(objStart, i + 1);
        try { objects.push(JSON.parse(sanitizeJsonString(objStr))); }
        catch { objects.push(extractFieldsFromObject(objStr)); }
        objStart = -1;
      }
    }
  }
  return objects.filter((o) => Object.keys(o).length > 0);
}

interface RawLangResponse {
  summary?: { total_texts: number; errors: number; warnings: number; ok: number };
  errors?: Record<string, unknown>[];
  suggestions?: Record<string, unknown>[];
  ok?: Record<string, unknown>[];
}

function parseRobust(raw: string): RawLangResponse {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Chaves JSON não encontradas');
  const jsonStr = cleaned.substring(start, end + 1);

  // Tentativa 1: parse direto
  try { return JSON.parse(jsonStr) as RawLangResponse; } catch { /* continua */ }

  // Tentativa 2: sanitizar e tentar de novo
  try { return JSON.parse(sanitizeJsonString(jsonStr)) as RawLangResponse; } catch { /* continua */ }

  // Tentativa 3: reconstrução manual via regex
  const numMatch = (key: string) => {
    const m = jsonStr.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
    return m ? parseInt(m[1]) : 0;
  };
  return {
    summary: {
      total_texts: numMatch('total_texts'),
      errors: numMatch('errors'),
      warnings: numMatch('warnings'),
      ok: numMatch('ok'),
    },
    errors: extractArray(jsonStr, 'errors'),
    suggestions: extractArray(jsonStr, 'suggestions'),
    ok: extractArray(jsonStr, 'ok'),
  };
}

// ── System prompt ──

const TYPE_LABEL: Record<string, string> = {
  casual_game: 'jogo casual (tom leve, engajante, divertido)',
  formal_app: 'aplicativo formal (tom profissional, neutro, preciso)',
  mixed: 'produto misto',
};

const LANG_NAME: Record<string, string> = {
  en: 'English', 'pt-br': 'Português BR', 'pt-BR': 'Português BR',
  pt: 'Português', fr: 'Français', 'fr-FR': 'Français',
  es: 'Español', de: 'Deutsch', it: 'Italiano',
  ja: '日本語', ko: '한국어', 'zh-cn': '中文 (简体)', 'zh-tw': '中文 (繁體)', ru: 'Русский',
};

function buildSystem(config: AppConfig, targetLang: string): string {
  const tl = TYPE_LABEL[config.projectType] ?? config.projectType;
  const langName = LANG_NAME[targetLang] ?? targetLang;
  return `Você é um especialista sênior em QA de Localização para jogos e aplicativos digitais, com foco em ${langName}.

Projeto: ${tl}
Idioma original: ${config.sourceLang}
Idioma analisado: ${targetLang} (${langName})

CONTEXTO IMPORTANTE: As traduções foram geradas automaticamente via Google Translate (fórmula GOOGLETRANSLATE do Google Sheets). Sua tarefa é identificar:
1. Erros de tradução automática — frases sem sentido, literais demais, saídas de contexto
2. Falta de localização regional — expressões que não são naturais para falantes nativos de ${langName}
3. Erros de ortografia e gramática na tradução
4. Problemas de tom — muito formal ou muito informal para o tipo de projeto
5. Referências culturais que não foram adaptadas
6. Placeholders/variáveis ({0}, {name}, %s, etc.) que foram perdidos ou alterados na tradução
7. Textos que ficaram em inglês (não traduzidos)

RETORNE APENAS JSON PURO. Sem markdown, sem texto antes/depois. Começa com { termina com }.

{
  "summary": { "total_texts": <N>, "errors": <N>, "warnings": <N>, "ok": <N> },
  "errors": [{
    "id": "E001",
    "type": "spelling|grammar|truncation|untranslated|inconsistency|machine_translation|context",
    "key": "<string key da planilha>",
    "source": "<texto original em ${config.sourceLang}>",
    "translated": "<tradução atual com problema>",
    "correction": "<sugestão de correção em ${langName}>",
    "description": "<explicação objetiva do problema>",
    "severity": "critical|high"
  }],
  "suggestions": [{
    "id": "W001",
    "type": "regionalism|tone|formality|cultural|machine_translation|context",
    "key": "<string key>",
    "source": "<texto original>",
    "translated": "<tradução atual>",
    "better": "<versão melhorada em ${langName}>",
    "description": "<explicação da sugestão>"
  }],
  "ok": [{
    "id": "OK001",
    "key": "<string key>",
    "source": "<texto original>",
    "translated": "<tradução aprovada>",
    "note": "<motivo breve>"
  }]
}

Analise TODAS as strings. Arrays vazios [] se não houver itens.
total_texts = errors.length + suggestions.length + ok.length`;
}

// ── Converte resposta raw da API para AnalysisResult[] ──

function convertToResults(raw: RawLangResponse, targetLang: string, rowMap: Map<number, ParsedRow>): AnalysisResult[] {
  const results: AnalysisResult[] = [];

  for (const e of raw.errors ?? []) {
    const rowIndex = typeof e.rowIndex === 'number' ? e.rowIndex : -1;
    const row = rowMap.get(rowIndex);
    results.push({
      rowIndex,
      key: (e.key as string) || row?.key,
      sourceText: (e.source as string) || row?.sourceText || '',
      targetLang,
      translatedText: (e.translated as string) || row?.translations[targetLang] || '',
      category: 'error',
      explanation: (e.description as string) || '',
      errorType: e.type as string,
      severity: (e.severity as AnalysisResult['severity']) || 'high',
      correction: e.correction as string,
    });
  }

  for (const s of raw.suggestions ?? []) {
    const rowIndex = typeof s.rowIndex === 'number' ? s.rowIndex : -1;
    const row = rowMap.get(rowIndex);
    results.push({
      rowIndex,
      key: (s.key as string) || row?.key,
      sourceText: (s.source as string) || row?.sourceText || '',
      targetLang,
      translatedText: (s.translated as string) || row?.translations[targetLang] || '',
      category: 'suggestion',
      explanation: (s.description as string) || '',
      errorType: s.type as string,
      better: s.better as string,
    });
  }

  for (const o of raw.ok ?? []) {
    const rowIndex = typeof o.rowIndex === 'number' ? o.rowIndex : -1;
    const row = rowMap.get(rowIndex);
    results.push({
      rowIndex,
      key: (o.key as string) || row?.key,
      sourceText: (o.source as string) || row?.sourceText || '',
      targetLang,
      translatedText: (o.translated as string) || row?.translations[targetLang] || '',
      category: 'approval',
      explanation: (o.note as string) || '',
      note: o.note as string,
    });
  }

  return results;
}

// ── Public API ──

export async function analyseRows(
  config: AppConfig,
  targetLang: string,
  rows: ParsedRow[],
  onRetry?: (attempt: number, waitSec: number) => void,
): Promise<AnalysisResult[]> {
  const client = getClient();

  const block = rows
    .map((r, i) => {
      const absIdx = r.rowIndex;
      const key = r.key || `row_${absIdx}`;
      const src = r.sourceText;
      const tgt = r.translations[targetLang] ?? '';
      return `[${i + 1}] KEY:"${key}" | ${config.sourceLang}:"${src}" | ${targetLang}:"${tgt}"`;
    })
    .join('\n');

  const userPrompt = `Analise a qualidade da tradução ${config.sourceLang} → ${targetLang} neste lote de ${rows.length} strings:\n\n${block}\n\nRetorne o JSON completo apenas para estas ${rows.length} strings.`;

  const response = await withRetry(
    () =>
      client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: buildSystem(config, targetLang),
        messages: [{ role: 'user', content: userPrompt }],
      }),
    onRetry,
  );

  const raw = parseRobust(extractText(response));
  const rowMap = new Map(rows.map((r) => [r.rowIndex, r]));
  return convertToResults(raw, targetLang, rowMap);
}

