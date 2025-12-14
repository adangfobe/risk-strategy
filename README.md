# Risk Battle Simulator

A mobile-first web application that replaces traditional dice-rolling in Risk board games with AI-powered tactical battle simulations.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **AI Engine**: OpenAI API (GPT-4o-mini)
- **Package Manager**: pnpm
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Then add your OpenAI API key to `.env.local`

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Home/battle setup screen
│   ├── battle/       # Battle simulation view
│   └── api/          # API routes
├── components/       # React components
├── engine/           # Battle simulation engine
├── strategies/       # Strategy definitions
├── simulation/       # Animation and rendering
├── store/            # Zustand state management
├── types/            # TypeScript type definitions
└── lib/              # Utility functions and config
```

## Development Status

🚧 **In Progress** - Phase 1 Complete

- ✅ Project scaffolding and configuration
- ✅ Directory structure
- ⏳ Strategy system (Phase 2)
- ⏳ Battle UI (Phase 3)
- ⏳ AI integration (Phase 4)
- ⏳ Animation system (Phase 5)

## License

Private project

