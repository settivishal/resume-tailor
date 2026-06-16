# Resume Tailor AI

Minimal MVP to tailor a LaTeX resume to a job description using AI-generated patches.

## Flow

1. Paste job description
2. Paste LaTeX resume
3. Click **Generate Suggestions**
4. Review patches (accept/reject each)
5. Accepted patches apply to your LaTeX
6. Live PDF preview updates automatically

## Setup

```bash
cp .env.example .env.local
# Add your OpenAI API key to .env.local

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## PDF compilation

The `/api/compile` route tries local `pdflatex` first, then falls back to [latexonline.cc](https://latexonline.cc).

For best results locally, install a TeX distribution (MacTeX, TeX Live, etc.).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- OpenAI API for patch suggestions
- No auth, database, or backend beyond two API routes
