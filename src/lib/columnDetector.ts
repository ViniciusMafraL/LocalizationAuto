import type { DetectedColumn } from '../types';

const LANG_CODE_MAP: Record<string, string> = {
  // ISO codes
  en: 'en', eng: 'en', english: 'en', inglês: 'en', ingles: 'en',
  'pt-br': 'pt-br', ptbr: 'pt-br', 'pt_br': 'pt-br', portuguese: 'pt-br',
  'portugues br': 'pt-br', 'português': 'pt-br', portugues: 'pt-br',
  pt: 'pt', 'pt-pt': 'pt',
  fr: 'fr', fra: 'fr', french: 'fr', français: 'fr', frances: 'fr', francés: 'fr',
  es: 'es', esp: 'es', spanish: 'es', español: 'es', espanol: 'es', espanhol: 'es',
  de: 'de', deu: 'de', german: 'de', deutsch: 'de', alemão: 'de', alemao: 'de',
  it: 'it', ita: 'it', italian: 'it', italiano: 'it',
  ja: 'ja', jpn: 'ja', japanese: 'ja', japonês: 'ja', japones: 'ja',
  ko: 'ko', kor: 'ko', korean: 'ko', coreano: 'ko',
  zh: 'zh', zho: 'zh', chinese: 'zh', chinês: 'zh', chines: 'zh',
  'zh-cn': 'zh-cn', zhcn: 'zh-cn',
  'zh-tw': 'zh-tw', zhtw: 'zh-tw',
  ru: 'ru', rus: 'ru', russian: 'ru', russo: 'ru',
  ar: 'ar', ara: 'ar', arabic: 'ar', árabe: 'ar', arabe: 'ar',
  nl: 'nl', nld: 'nl', dutch: 'nl', holandês: 'nl', holandes: 'nl',
  pl: 'pl', pol: 'pl', polish: 'pl', polonês: 'pl', polones: 'pl',
  tr: 'tr', tur: 'tr', turkish: 'tr', turco: 'tr',
  sv: 'sv', swe: 'sv', swedish: 'sv', sueco: 'sv',
  da: 'da', dan: 'da', danish: 'da', dinamarquês: 'da',
  fi: 'fi', fin: 'fi', finnish: 'fi', finlandês: 'fi',
  nb: 'nb', nor: 'nb', norwegian: 'nb', norueguês: 'nb',
  cs: 'cs', cze: 'cs', czech: 'cs', tcheco: 'cs',
  hu: 'hu', hun: 'hu', hungarian: 'hu', húngaro: 'hu',
  ro: 'ro', ron: 'ro', romanian: 'ro', romeno: 'ro',
  uk: 'uk', ukr: 'uk', ukrainian: 'uk', ucraniano: 'uk',
  vi: 'vi', vie: 'vi', vietnamese: 'vi', vietnamita: 'vi',
  th: 'th', tha: 'th', thai: 'th', tailandês: 'th',
  id: 'id', ind: 'id', indonesian: 'id', indonésio: 'id',
  ms: 'ms', msa: 'ms', malay: 'ms', malaio: 'ms',
};

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function detectLang(header: string): string | null {
  const norm = normalise(header);
  if (LANG_CODE_MAP[norm]) return LANG_CODE_MAP[norm];
  // Try without spaces (ptbr → pt-br)
  const compact = norm.replace(/\s/g, '');
  if (LANG_CODE_MAP[compact]) return LANG_CODE_MAP[compact];
  // Substring match for "Portuguese BR", "pt_br", etc.
  for (const [key, code] of Object.entries(LANG_CODE_MAP)) {
    if (norm.includes(key) || key.includes(norm)) return code;
  }
  return null;
}

export function detectColumns(headers: string[], sourceLang: string): DetectedColumn[] {
  const results: DetectedColumn[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const langCode = detectLang(header);
    if (!langCode) continue;
    if (seen.has(langCode)) continue;
    seen.add(langCode);
    results.push({
      colIndex: i,
      header,
      langCode,
      isSource: langCode === sourceLang,
    });
  }

  return results;
}
