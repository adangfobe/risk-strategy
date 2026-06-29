# Risk Battle Simulator

A mobile-first PWA that replaces traditional dice-rolling in Risk board games with AI-powered tactical battle simulations. Players pick territories on an interactive map and speak their strategies — no fixed strategy cards required.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **AI Engine**: Google Gemini (configurable model via env)
- **Voice**: Deepgram Nova-3 transcription
- **Map**: Interactive SVG with pinch-zoom/pan
- **PWA**: `@ducanh2912/next-pwa` (production only)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Add your API keys:
   - `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/apikey)
   - `DEEPGRAM_API_KEY` — [Deepgram Console](https://console.deepgram.com/)
   - `GEMINI_MODEL` — optional, defaults to `gemini-2.5-flash`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Select battle** — Tap an attacking territory, then an adjacent target on the interactive map
2. **Set troops** — Enter attacker and defender troop counts
3. **Record strategies** — Each player records a freeform spoken strategy (or types it manually)
4. **Simulate** — Gemini evaluates both plans against geography, troop ratios, and military history
5. **View results** — See winner, casualties, narrative, and per-side strategy assessments

## Project Structure

```
src/
├── app/              # Next.js pages and API routes
│   ├── page.tsx      # Battle setup (map + voice + troops)
│   ├── battle/       # Simulation results
│   └── api/          # /simulate (Gemini) + /transcribe (Deepgram)
├── components/       # RiskMap, StrategyRecorder
├── engine/           # AI simulation engine
├── lib/map/          # 42 territories + board SVG paths
├── strategies/       # Internal AI knowledge base (not user-selectable)
├── store/            # Zustand state
└── types/            # TypeScript definitions
```

## License

Private project
