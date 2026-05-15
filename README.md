# LocalizationAuto
Projeto de localização de jogos com IA Claude

# LocQA — Localization QA Assistant

Browser-based tool for automated quality assurance of game/app localization spreadsheets using Google Gemini AI.

## Overview

**LocQA** helps teams quickly validate translations by uploading `.xlsx` or `.csv` files containing localized strings across multiple languages. The tool:

1. Detects language columns automatically
2. Analyzes translations through Claude Haiku 4.5 with context-awareness
3. Categorizes results as **Errors**, **Suggestions**, or **Approvals**
4. Displays results progressively in real-time

## Key Features

- 🔍 **Auto Language Detection** — Recognizes language codes and natural language names in column headers
- 🤖 **Context-Aware Analysis** — Claude Haiku analyzes a sample of strings to understand the project type and tone
- 📊 **Real-Time Results** — Translation reviews appear progressively as the AI processes batches
- 🎯 **Categorized Reports** — Errors (mistranslations, broken tags), Suggestions (correct but improvable), Approvals
- 🔤 **Three Project Types** — Casual Games, Formal Apps, Mixed (influences tone/style analysis)
- 📝 **Searchable Results** — Filter results by text, language, or category
- 🌙 **Dark Mode** — Clean, accessible UI with custom typography

## Tech Stack

- **React 18** + **TypeScript** — Type-safe UI
- **Vite 6** — Fast dev server and optimized build
- **SheetJS (XLSX)** — Parse `.xlsx`/`.csv` in the browser
- **Anthropic SDK** — Claude Haiku 4.5 API client
- **Lucide React** — Minimal, tree-shakeable icons
- **CSS Modules** — Component-scoped styling

## Project Structure

```
src/
├── main.tsx                    # App entry
├── App.tsx                     # Stage router
├── index.css                   # Global styles, CSS variables
├── types/index.ts              # Shared TypeScript types
├── store/useAppStore.ts        # Global state (useReducer + Context)
├── stages/
│   ├── Setup/                  # Step 1: Choose project type & source language
│   ├── Upload/                 # Step 2: Upload file, detect/confirm columns
│   └── Report/                 # Step 3: View analysis results with filtering
├── components/                 # Reusable UI components
│   ├── StageHeader/            # Progress indicator (Setup → Upload → Report)
│   ├── DropZone/               # Drag-and-drop file input
│   ├── ColumnMapper/           # Confirm detected language columns
│   ├── ResultCard/             # Individual translation review card
│   ├── LanguageSection/        # Collapsible language group
│   ├── CategoryBadge/          # Error/Suggestion/Approval badge
│   └── ProgressBar/            # Batch processing progress
├── lib/
│   ├── sheetParser.ts          # SheetJS integration
│   ├── columnDetector.ts       # Detect language columns
│   └── claudeClient.ts         # Claude API calls & response parsing
└── hooks/
    ├── useFileParser.ts        # Orchestrate file upload & parsing
    └── useAnalysisRunner.ts    # Main analysis loop, batch processing
```

## Workflow

### Stage 1: Setup
- User selects project type (Casual Game / Formal App / Mixed)
- Choose source language (e.g., English)
- Proceed to upload

### Stage 2: Upload
1. Drag-and-drop `.xlsx` or `.csv` file
2. Auto-detect language columns (exact codes + natural names)
3. Confirm/correct detected columns in modal table
4. AI generates project context description from 5-line sample
5. Proceed to report generation

### Stage 3: Report
1. LocQA sends translations in 15-line batches to Gemini
2. Each language processes in parallel
3. Results display in real-time as they arrive:
   - **Errors** (mistranslations, broken tags, missing text)
   - **Suggestions** (correct but could fit tone/context better)
   - **Approvals** (correct, well-formatted, contextually appropriate)
4. Filter results by keyword, language, or category
5. View metadata: detected project context, progress per language

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```
VITE_ANTHROPIC_KEY=your_anthropic_api_key_here
```

- Get an API key: [Anthropic Console](https://console.anthropic.com)
- `.env` is in `.gitignore` — never commit your key
- Use `.env.example` as a template

### Claude Model

Default model: `claude-haiku-4-5-20251001` (Claude Haiku 4.5)

Recommended for this project because:
- Fast API responses (important for batch processing)
- Affordable pricing at scale
- Excellent text analysis capabilities
- Ideal for localization QA and linguistic review

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens `http://localhost:5173` with hot-reload.

### Build

```bash
npm run build
```

Produces optimized bundle in `dist/`.

### Preview

```bash
npm run preview
```

Serve the production build locally for testing.

## Testing Checklist

1. **Setup Stage**
   - [ ] Select project type
   - [ ] Choose source language
   - [ ] "Continue" button advances to Upload

2. **Upload Stage**
   - [ ] Drag-drop `.xlsx` or `.csv`
   - [ ] Language columns auto-detected (check console for details)
   - [ ] Column mapper shows confirmed languages
   - [ ] Context description appears and makes sense
   - [ ] "Analyze" button starts report

3. **Report Stage**
   - [ ] Results appear progressively (not all at once)
   - [ ] Results grouped by language
   - [ ] Error/Suggestion/Approval badges appear with correct colors
   - [ ] Text search filters results in real-time
   - [ ] Category tabs work (All, Errors, Suggestions, Approvals)
   - [ ] Progress bar updates during batch processing

4. **Edge Cases**
   - [ ] Empty cells in translations
   - [ ] Missing target language columns
   - [ ] Ambiguous language names ("Portugues" vs "PT-BR")
   - [ ] Spreadsheets with only 1-2 rows
   - [ ] Very long translation strings

## Type System

All types are centralized in [src/types/index.ts](src/types/index.ts):

- **Stage** — Navigation state: `'setup' | 'upload' | 'report'`
- **ProjectType** — Context for AI analysis
- **Category** — Result classification: `'error' | 'suggestion' | 'approval'`
- **AppConfig** — User selections + AI-generated context
- **ParsedRow** — Row data with translations
- **AnalysisResult** — Single translation review
- **LanguageReport** — Aggregated results for one language

## Styling

- **Font Stack:**
  - `Syne` — Headers, titles
  - `DM Mono` — Language codes, technical text
  - `Literata` — Result explanations
- **Color System:** CSS custom properties in `index.css`
- **Layout:** CSS Grid + Flexbox
- **Scoping:** CSS Modules per component

## Key Files

| File | Purpose |
|------|---------|
| [src/types/index.ts](src/types/index.ts) | Type definitions (anchor for all state) |
| [src/store/useAppStore.ts](src/store/useAppStore.ts) | Global state reducer |
| [src/lib/columnDetector.ts](src/lib/columnDetector.ts) | Language column detection logic |
| [src/lib/claudeClient.ts](src/lib/claudeClient.ts) | Claude API integration & prompt templates |
| [src/hooks/useAnalysisRunner.ts](src/hooks/useAnalysisRunner.ts) | Main batch processing loop |
| [ProjetoQA.MD](ProjetoQA.MD) | Detailed implementation plan |

## Known Limitations

- **API Key Requirement** — Must have valid Anthropic API key to run analysis
- **Browser Parsing Only** — Large files (>10MB) may slow down parsing
- **Batch Size** — Currently processes 15 rows per API call (tunable in `useAnalysisRunner`)
- **Language Detection** — Works well for standard ISO codes, may struggle with non-standard header names
- **Text-Only Analysis** — Analyzes translation text only; no image/OCR support

## Future Enhancements

- Export results to PDF or Excel
- Batch API key management
- Custom prompt templates per project
- Glossary/terminology checking
- Integration with translation management tools (e.g., Crowdin)
- Integration with Claude vision for UI string detection (optional)
- Prompt caching for repeated analyses

## Contributing

This is an MVP (v0.1) project. To contribute:

1. Check [ProjetoQA.MD](ProjetoQA.MD) for implementation details
2. Ensure TypeScript types are updated in [src/types/index.ts](src/types/index.ts)
3. Test edge cases before submitting changes
4. Keep components in CSS Modules for isolation

## License

MIT

---

**Project Status:** MVP (v0.1) — Core features complete, ready for user testing.
