import Anthropic from '@anthropic-ai/sdk';
import type { AppConfig, ParsedRow, AnalysisResult, Category } from '../types';

const MODEL = 'claude-haiku-4-5';

function getClient(): Anthropic {
  const key = import.meta.env.VITE_ANTHROPIC_KEY as string | undefined;
  if (!key) throw new Error('VITE_ANTHROPIC_KEY não definida no arquivo .env');
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
}

function friendlyError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('429') || msg.includes('rate_limit') || msg.includes('overloaded')) {
    return new Error(
      'Limite de requisições da API Claude atingido. Aguarde alguns segundos e tente novamente.'
    );
  }
  if (msg.includes('401') || msg.includes('authentication') || msg.includes('invalid x-api-key')) {
    return new Error('Chave da API inválida. Verifique o valor de VITE_ANTHROPIC_KEY no arquivo .env.');
  }
  return err instanceof Error ? err : new Error(msg);
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes('429') || msg.includes('overloaded') || msg.includes('529');
      if (!isRetryable || attempt === retries - 1) throw friendlyError(err);
      await new Promise((r) => setTimeout(r, (attempt + 1) * 15000));
    }
  }
  throw new Error('Número máximo de tentativas atingido.');
}

function extractText(response: Anthropic.Message): string {
  const block = response.content.find((b) => b.type === 'text');
  return block && block.type === 'text' ? block.text.trim() : '';
}

export async function detectProjectContext(
  config: AppConfig,
  sampleRows: ParsedRow[]
): Promise<string> {
  const client = getClient();

  const samples = sampleRows
    .slice(0, 5)
    .map((r, i) => `${i + 1}. ${r.sourceText}`)
    .join('\n');

  const prompt = `Você é um especialista em localização. Analise estas strings e descreva em 2-3 frases o contexto do projeto.
Tipo declarado: ${config.projectType}. Informe: gênero/domínio, tom, padrões de formatação observados.
Responda SOMENTE o texto descritivo, sem JSON.

Strings de amostra:
${samples}`;

  const response = await withRetry(() =>
    client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
  );

  return extractText(response);
}

interface RawResult {
  rowIndex: number;
  category: string;
  explanation: string;
  severity?: string;
  correction?: string;
  errorCode?: string;
  errorType?: string;
}

function parseJsonSafe(text: string): RawResult[] {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  try {
    return JSON.parse(cleaned) as RawResult[];
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as RawResult[];
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function analyseRows(
  config: AppConfig,
  targetLang: string,
  rows: ParsedRow[]
): Promise<AnalysisResult[]> {
  const client = getClient();

  const lines = rows
    .map((r) => `${r.rowIndex} | ${r.sourceText} | ${r.translations[targetLang] ?? ''}`)
    .join('\n');

  const prompt = `Você é um especialista em QA de localização.
CONTEXTO DO PROJETO: ${config.detectedContext}
TIPO: ${config.projectType} | IDIOMA FONTE: ${config.sourceLang} | IDIOMA ALVO: ${targetLang}

Categorize cada tradução. Campos obrigatórios:
- rowIndex: número da linha
- category: "error" | "suggestion" | "approval"
- explanation: 1-2 frases explicando o problema ou aprovação
- severity: "alto" | "medio" | "baixo" (apenas para errors e suggestions)
- errorCode: código curto do tipo de problema ex: "TAG_BREAK", "MISTRANSLATION", "TONE", "MISSING" (apenas para errors)
- errorType: descrição curta do tipo de erro em português ex: "Tag quebrada", "Mistradução" (apenas para errors)
- correction: sugestão de texto corrigido (apenas para errors e suggestions)

Regras:
- error: mistradução, tom errado, tags quebradas ({0}, %s, <b>), texto ausente
- suggestion: correto mas poderia encaixar melhor no contexto/tom
- approval: correto, tom adequado, bem formatado (omita severity/errorCode/errorType/correction)

Responda APENAS com um JSON array sem markdown:
[{ "rowIndex": N, "category": "...", "explanation": "...", "severity": "...", "errorCode": "...", "errorType": "...", "correction": "..." }]

TRADUÇÕES:
${lines}`;

  const response = await withRetry(() =>
    client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
  );

  const raw = parseJsonSafe(extractText(response));
  const rowMap = new Map(rows.map((r) => [r.rowIndex, r]));

  return raw.map((item): AnalysisResult => {
    const row = rowMap.get(item.rowIndex);
    const validCategories: Category[] = ['error', 'suggestion', 'approval'];
    const category: Category = validCategories.includes(item.category as Category)
      ? (item.category as Category)
      : 'error';

    return {
      rowIndex: item.rowIndex,
      sourceText: row?.sourceText ?? '',
      targetLang,
      translatedText: row?.translations[targetLang] ?? '',
      category,
      explanation: item.explanation ?? 'Falha ao interpretar resposta da IA.',
      severity: item.severity as AnalysisResult['severity'],
      correction: item.correction,
      errorCode: item.errorCode,
      errorType: item.errorType,
    };
  });
}
