# ChoreChamp

> Gamification-Plattform für Haushaltsaufgaben - Familien und WGs helfen, Aufgaben fair zu verteilen und durch Punkte, Belohnungen und Levels zu motivieren.

## Vision

ChoreChamp macht Haushaltsaufgaben zum Spiel. Durch Punkte, Levels und individuelle Belohnungen werden Aufgaben fair verteilt und die Motivation steigt - für die ganze Familie oderWG.

## Features

- **Haushalts-Management**: Erstelle einen Haushalt und lade Mitglieder per Einladungscode ein
- **Aufgaben-Verwaltung**: Erstelle, weise zu und erledige Aufgaben mit verschiedenen Schwierigkeitsgraden
- **Wiederkehrende Aufgaben**: Tägliche, wöchentliche oder monatliche Aufgaben automatisch zurücksetzen
- **Gamification**:
  - Punkte für erledigte Aufgaben sammeln
  - Levels aufsteigen basierend auf Gesamtpunkten
  - Achievements und Badges freischalten
  - Individuelle Belohnungen erstellen und Punkte einlösen
- **Leaderboard**: Vergleiche deine Punkte mit anderen Haushaltsmitgliedern

## Tech Stack

| Category | Tool |
|----------|------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **Deployment** | Vercel |
| **Validation** | Zod + react-hook-form |

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Susa-Sek/chorechamp.git
cd chorechamp
npm install
```

### 2. Supabase Setup

1. Create Supabase Project: [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local`
3. Add your Supabase credentials

### 3. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
chorechamp/
├── src/
│   ├── app/              Pages (Next.js App Router)
│   ├── components/
│   │   └── ui/           shadcn/ui components
│   ├── hooks/            Custom React hooks
│   └── lib/              Utilities (supabase.ts, utils.ts)
├── features/             Feature specifications
│   ├── INDEX.md          Feature status overview
│   └── PROJ-*.md         Individual feature specs
├── docs/
│   └── PRD.md            Product Requirements Document
└── .claude/              AI development workflow config
```

## Feature Roadmap

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | User Authentication | Planned |
| P0 (MVP) | Household Management | Planned |
| P0 (MVP) | Chore Management | Planned |
| P0 (MVP) | Recurring Tasks | Planned |
| P0 (MVP) | Gamification - Points | Planned |
| P1 | Rewards System | Planned |
| P1 | Levels & Badges | Planned |
| P2 | Statistics Dashboard | Planned |
| P2 | Mobile App | Planned |

## Development Workflow

This project uses an AI-powered development workflow with specialized skills:

1. `/requirements` - Create feature spec from idea
2. `/architecture` - Design tech architecture
3. `/frontend` - Build UI components
4. `/backend` - Build APIs, database, RLS policies
5. `/qa` - Test against acceptance criteria
6. `/deploy` - Deploy to Vercel

## Scripts

```bash
npm run dev        # Development server (localhost:3000)
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint
```

## License

MIT License