# FIGHT ARCHIVE Agent — Project Rules

## Purpose
Autonomous Telegram media system for FIGHT ARCHIVE.

## Runtime
- Node.js 20+
- TypeScript ESM
- PostgreSQL
- grammY
- Anthropic Messages API
- node-cron
- RSS ingestion

## Non-negotiables
- Never commit secrets.
- Never touch unrelated projects/directories.
- Never auto-ban on low-confidence moderation.
- Never publish unverified breaking claims as facts.
- Do not download/reupload arbitrary copyrighted video by default.
- Keep all thresholds configurable via environment variables or settings.
- Prefer reliable sources and deduplicate events.

## Pipeline
Sources -> ingest -> dedupe -> score -> fact-check -> content -> queue -> publish -> analytics.
Comments -> moderation -> keep/delete/ban.

## Telegram
The bot is an admin of the channel and linked discussion group. Keep permissions minimal. Admin commands are restricted by ADMIN_TELEGRAM_USER_ID.

## Deployment
Designed for Railway with PostgreSQL. DATABASE_URL comes from Railway service variables.

## Coding
- Keep modules small.
- Handle external API failures.
- Use structured logs with scopes.
- Run npm run check and npm run build before commits.
