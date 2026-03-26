# CostLeak

> Stop bleeding money on unnecessary API calls.

CostLeak helps early-stage builders identify inefficient API usage patterns and get specific, actionable cost-saving recommendations — before their bill surprises them.

## Features

- Submit plain-English descriptions of your API usage
- Get 2–3 structured, actionable recommendations
- Save useful fixes to your personal library
- 6 example scenarios included for demo/testing
- Works without an OpenAI key (mock fallback included)

## Local Setup

### Prerequisites

- Node.js 18+
- npm

### Steps

1. **Clone and install**
   ```bash
   git clone <repo>
   cd costleak
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenAI API key (optional — app works without it using mock data).

3. **Set up the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite file path (e.g. `file:./dev.db`) |
| `OPENAI_API_KEY` | OpenAI API key (optional — app uses mock data if missing) |
| `SESSION_SECRET` | Secret for JWT signing (min 32 chars) |

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signup` | Create account |
| `/login` | Log in |
| `/dashboard` | Analyze API usage |
| `/library` | View saved recommendations |

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Prisma 7** + SQLite (via libsql adapter)
- **OpenAI API** (gpt-4o-mini)
- **Tailwind CSS v4**
- **JWT** (via jose) for session auth
