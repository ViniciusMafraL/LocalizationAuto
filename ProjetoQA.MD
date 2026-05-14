# Plano de Implementação — LocQA (Badge v0.1 MVP)

## Contexto

O projeto é uma ferramenta browser-based para QA automatizado de planilhas de localização (traduções de jogos/apps). O usuário faz upload de uma planilha `.xlsx`/`.csv`, a ferramenta detecta as colunas de idioma, envia as traduções em lotes para a API Gemini e gera um relatório categorizado em **Erros / Sugestões / Aprovações** por idioma — com resultados aparecendo em tempo real de forma progressiva.

**Decisões confirmadas pelo usuário:**
- TypeScript
- API Key via arquivo `.env` local (`VITE_GEMINI_KEY`)
- Tipo de projeto selecionado pelo usuário no Setup; IA analisa linhas de amostra da planilha para complementar o contexto automaticamente
- Dark mode

---

## Stack e Scaffold

```
npm create vite@latest . -- --template react-ts
```

**Dependências:**
- `xlsx` — parse de .xlsx/.csv no browser (SheetJS)
- `@google/generative-ai` — SDK oficial Gemini para browser
- `lucide-react` — ícones (minimal, tree-shakeable)

**Fontes (Google Fonts, no `index.html`):**
- `Syne` — headings, títulos de stage, step indicator
- `DM Mono` — badges, códigos de idioma, headers técnicos
- `Literata` — texto de explicação nos cards de resultado

---

## Estrutura de Pastas

```
src/
├── main.tsx
├── App.tsx                    # Roteador de stages
├── index.css                  # CSS custom properties + font imports
├── types/index.ts             # Todos os tipos TypeScript compartilhados
├── store/useAppStore.ts       # useReducer + Context — estado global
├── stages/
│   ├── Setup/Setup.tsx        # Etapa 1
│   ├── Upload/Upload.tsx      # Etapa 2
│   └── Report/Report.tsx      # Etapa 3
├── components/
│   ├── StageHeader/           # Indicador de progresso 1→2→3
│   ├── DropZone/              # Drag-and-drop da planilha
│   ├── ColumnMapper/          # Confirmar/corrigir colunas detectadas
│   ├── ResultCard/            # Card de resultado por linha
│   ├── LanguageSection/       # Grupo colapsável por idioma
│   ├── CategoryBadge/         # Erro / Sugestão / Aprovação
│   └── ProgressBar/           # Progresso do lote atual
├── lib/
│   ├── sheetParser.ts         # SheetJS: buffer → headers + rows
│   ├── columnDetector.ts      # Detecção de idiomas nos cabeçalhos
│   └── geminiClient.ts        # Prompt builder, chamada API, parser JSON
└── hooks/
    ├── useFileParser.ts        # Orquestra drop → parse → detect
    └── useAnalysisRunner.ts    # Loop de lotes Gemini + dispatch de resultados
```

---

## Tipos Principais (`src/types/index.ts`)

```typescript
type Stage = 'setup' | 'upload' | 'report';
type ProjectType = 'casual_game' | 'formal_app' | 'mixed';
type Category = 'error' | 'suggestion' | 'approval';

interface AppConfig {
  projectType: ProjectType;
  sourceLang: string;
  targetLangs: string[];
  detectedContext: string; // gerado pela IA após análise de amostra
}

interface ParsedRow { rowIndex: number; key?: string; sourceText: string; translations: Record<string, string>; }
interface DetectedColumn { colIndex: number; header: string; langCode: string; isSource: boolean; }
interface AnalysisResult { rowIndex: number; sourceText: string; targetLang: string; translatedText: string; category: Category; explanation: string; }
interface LanguageReport { langCode: string; status: 'pending' | 'analyzing' | 'done' | 'error'; results: AnalysisResult[]; errorCount: number; suggestionCount: number; approvalCount: number; }
```

---

## Fluxo em 3 Etapas

### Etapa 1 — Setup (`stages/Setup`)
- Seleção do tipo de projeto: 3 radio cards (Casual Game / Formal App / Mixed)
- Seleção do idioma fonte (dropdown)
- Botão "Continuar" → avança para Upload

> API key lida diretamente de `import.meta.env.VITE_GEMINI_KEY` — sem input na UI.

### Etapa 2 — Upload (`stages/Upload`)

1. **DropZone** aceita `.xlsx` / `.csv`
2. `useFileParser` → `sheetParser.ts` (SheetJS) → retorna headers + rows
3. `columnDetector.ts` detecta colunas de idioma via duas passagens:
   - **Pass 1:** código exato (`pt-br`, `en`, `fr`, `es`, `de`)
   - **Pass 2:** nome natural multilíngue (`"Inglês"`, `"Frances"`, `"Portugues BR"`, `"Espanol"` etc.)
4. **ColumnMapper** exibe tabela de confirmação — usuário pode corrigir detecções erradas
5. Ao confirmar: envia **5 linhas de amostra** ao Gemini com meta-prompt de contexto:

```
Você é um especialista em localização. Analise estas strings e descreva em 2-3 frases o contexto do projeto.
Tipo declarado: {projectType}. Informe: gênero/domínio, tom, padrões de formatação observados.
Responda SOMENTE o texto descritivo, sem JSON.
```

O contexto gerado é salvo em `config.detectedContext` e mostrado no cabeçalho do Report.

6. Transição para Report, disparando `useAnalysisRunner`

### Etapa 3 — Report (`stages/Report`)

**`useAnalysisRunner` (hook principal):**

```
para cada targetLang em config.targetLangs:
  dispatch INIT_LANGUAGE_REPORT
  dispatch SET_LANGUAGE_STATUS('analyzing')
  
  dividir parsedRows em lotes de 15 linhas
  
  para cada lote:
    construir prompt com contexto + lote
    chamar Gemini → parsear JSON
    para cada resultado:
      dispatch APPEND_RESULT  ← ResultCard aparece em tempo real
    atualizar progresso
  
  dispatch SET_LANGUAGE_STATUS('done')
```

**Prompt de análise QA:**
```
Você é um especialista em QA de localização.
CONTEXTO DO PROJETO: {detectedContext}
TIPO: {projectType} | IDIOMA FONTE: {sourceLang} | IDIOMA ALVO: {targetLang}

Categorize cada tradução como "error" | "suggestion" | "approval".
- error: mistradução, tom errado, tags quebradas ({0}, %s), texto ausente
- suggestion: correto mas poderia encaixar melhor no contexto/tom do projeto
- approval: correto, tom adequado, bem formatado

Responda APENAS com um JSON array:
[{ "rowIndex": N, "category": "...", "explanation": "1-2 frases" }]

TRADUÇÕES:
{linhas numeradas: índice | fonte | tradução}
```

**Parser defensivo:** remove markdown fences (` ```json `) antes de `JSON.parse`. Fallback: extrai array via regex. Linhas com erro de parse recebem `category: 'error'` com explicação de falha.

---

## Report UI

```
[ 🔍 Filtrar por texto...  ] [ Todos | Erros | Sugestões | Aprovações ]

Contexto detectado: "Jogo casual mobile com tom amigável e energético..."

▼ PT-BR  ████████░░ 12/20   [2 Erros] [5 Sugestões] [5 Aprovações]
  ┌─────────────────────────────────────────────────────┐
  │ EN: "Tap to continue"                               │
  │ PT-BR: "Toque para continuar"          [Aprovação]  │
  │ Tradução natural e adequada ao tom do jogo.         │
  └─────────────────────────────────────────────────────┘

▷ FR   [Pendente...]
▷ ES   [Pendente...]
```

**Cores dos badges:**
- Erro: `#FF4D4D` (vermelho)
- Sugestão: `#FFB800` (âmbar)
- Aprovação: `#2ECC71` (verde)

**Filtro de busca:** filtra source text + translation + explanation dos resultados já carregados. Não re-chama a API.

---

## Variável de Ambiente

Arquivo `.env` na raiz do projeto:
```
VITE_GEMINI_KEY=sua_chave_aqui
```

Arquivo `.env.example` commitado (sem a chave real). `.env` no `.gitignore`.

**Modelo Gemini:** `gemini-2.0-flash` — mais rápido e barato para o volume de chamadas do MVP. Qualidade suficiente para QA de localização.

---

## Sequência de Execução

| Fase | Tarefas |
|------|---------|
| **1 — Scaffold** | `npm create vite`, instalar deps, estrutura de pastas, tipos, store, CSS variables, router de stages |
| **2 — Pipeline de dados** | `columnDetector.ts`, `sheetParser.ts`, `useFileParser`, `DropZone`, `ColumnMapper`, Upload stage completo |
| **3 — Integração Gemini** | `geminiClient.ts` (prompt builder + parser), `useAnalysisRunner`, teste com planilha real |
| **4 — Report UI** | `CategoryBadge`, `ResultCard`, `ProgressBar`, `LanguageSection`, `Report.tsx` com filtro e tabs |
| **5 — Setup + polish** | Setup stage, `StageHeader`, CSS modules em todos os componentes, edge cases, estados de erro/loading |

---

## Verificação (como testar)

1. `npm run dev` → `localhost:5173`
2. Criar `.env` com `VITE_GEMINI_KEY`
3. Setup: selecionar "Casual Game", idioma fonte "English"
4. Upload: arrastar planilha `.xlsx` com colunas `en`, `pt-br`, `fr`
5. Confirmar colunas detectadas → verificar contexto gerado pela IA
6. Report: acompanhar resultados aparecendo progressivamente
7. Usar filtro de busca e tabs de categoria
8. Testar com planilha vazia, células em branco, cabeçalho ambíguo ("Portugues")

---

## Arquivos Críticos

- [src/types/index.ts](src/types/index.ts) — âncora de todos os tipos
- [src/lib/columnDetector.ts](src/lib/columnDetector.ts) — peça mais frágil, requer dados reais para calibrar
- [src/lib/geminiClient.ts](src/lib/geminiClient.ts) — prompt template + parser defensivo + chamada API
- [src/hooks/useAnalysisRunner.ts](src/hooks/useAnalysisRunner.ts) — loop de lotes, controla todas as transições de estado
- [src/store/useAppStore.ts](src/store/useAppStore.ts) — reducer central, todas as atualizações de estado passam aqui
