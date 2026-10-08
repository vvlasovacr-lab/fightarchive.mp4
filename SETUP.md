# FIGHT ARCHIVE Agent — setup

## 1. Local requirements

Node.js 20+ and PostgreSQL are required.

```bash
npm install
cp .env.example .env
npm run db:init
npm run check
npm start
```

## 2. Telegram

- Create the bot with BotFather.
- Add it as admin to FIGHT ARCHIVE channel with post/edit/delete rights.
- Link your discussion group to the channel.
- Add the bot as group admin with Delete Messages and Ban Users.
- In BotFather, disable Privacy Mode if Telegram does not deliver ordinary comments to the bot.
- Use /id in a private chat with the bot to get your Telegram numeric ID.
- Fill TELEGRAM_CHANNEL_ID, TELEGRAM_DISCUSSION_GROUP_ID, ADMIN_TELEGRAM_USER_ID.

## 3. Anthropic

Add ANTHROPIC_API_KEY. Models are configurable in env.

## 4. Railway

Create a Railway project from this GitHub repository. Add a PostgreSQL service. Add the environment variables from .env.example. Set AUTO_PUBLISH=false for the first test, then turn it on after you verify the bot and source pipeline.

## 5. Important

The MVP does not download arbitrary copyrighted videos. It uses article sources and text links. Media ingestion can be expanded later with allowed/licensed sources.
