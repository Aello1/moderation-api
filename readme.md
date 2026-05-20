# Moderation API

An AI-powered content moderation API that analyzes text for harmful content using multiple AI providers and two analysis modes.

## Features

- **Single mode** — Analyzes a single text using Hugging Face's `toxic-bert` model
- **Context mode** — Analyzes a full conversation with context awareness using LLMs (Groq, Gemini, OpenAI)
- Multi-provider architecture — switch AI providers via environment variable
- Moderation history with filtering and pagination
- Statistics endpoint
- Rate limiting
- Swagger documentation

## Requirements

- Node.js 18+
- PostgreSQL

## Installation

1. Clone the repository

\`\`\`bash
git clone https://github.com/Aello1/moderation-api.git
cd moderation-api
\`\`\`

2. Install dependencies

\`\`\`bash
npm install
\`\`\`

3. Create your `.env` file

\`\`\`bash
cp .env.example .env
\`\`\`

4. Fill in your credentials in `.env`

5. Set up the database

\`\`\`bash
npx prisma db push
\`\`\`

6. Start the server

\`\`\`bash
npm run dev
\`\`\`

## API Documentation

Swagger UI available at `http://localhost:3000/docs`

## Usage

### Single mode

\`\`\`json
POST /api/moderate
{
  "mode": "single",
  "text": "I hate you"
}
\`\`\`

### Context mode

\`\`\`json
POST /api/moderate
{
  "mode": "context",
  "messages": [
    { "username": "alice", "role": "user", "content": "hey" },
    { "username": "bob", "role": "user", "content": "I will destroy you" }
  ]
}
\`\`\`

### Get moderation logs

\`\`\`
GET /api/logs?flagged=true&action=block&page=1&limit=10
\`\`\`

### Get statistics

\`\`\`
GET /api/stats
\`\`\`

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `HF_API_KEY` | Hugging Face API key | — |
| `GROQ_API_KEY` | Groq API key | — |
| `AI_PROVIDER` | AI provider for context mode (`groq`) | `groq` |
| `PORT` | Server port | `3000` |

## Tech Stack

- TypeScript + Node.js
- Express
- PostgreSQL + Prisma
- Hugging Face — toxic-bert
- Groq — Llama 3.3 70B
- Swagger UI

## License

MIT with Commons Clause — free for non-commercial use. Contact for commercial licensing.