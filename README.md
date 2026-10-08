# FIGHT ARCHIVE Agent

Автономный Telegram media bot для FIGHT ARCHIVE: сбор новостей, AI-оценка и генерация постов, очередь публикаций, комментарии и AI-модерация, рекламная очередь и daily analytics.

## 1. Локально

```bash
npm install
cp .env.example .env
npm run dev
```

Нужен Node.js 20+ и PostgreSQL.

## 2. Telegram

1. Создай бота через BotFather.
2. Добавь бота администратором канала.
3. Создай/привяжи Discussion Group к каналу.
4. Добавь бота администратором Discussion Group с правом удаления сообщений и блокировки пользователей.
5. Узнай numeric user id своего Telegram аккаунта и запиши его в `ADMIN_TELEGRAM_USER_ID`.
6. Заполни `TELEGRAM_CHANNEL_ID` и `TELEGRAM_DISCUSSION_GROUP_ID`.

## 3. Anthropic

Создай API key и положи его в `ANTHROPIC_API_KEY`. Для дешёвых проверок используется `claude-haiku-5-5`, а для написания постов — `claude-sonnet-5-5`; обе модели можно поменять через env.

## 4. Railway

Создай проект, добавь PostgreSQL и затем deploy этого репозитория. Railway автоматически предоставляет `DATABASE_URL` для Postgres service reference. Секреты добавляются через Variables.

## 5. Важно

По умолчанию бот рассчитан на автоматическую публикацию после заполнения токенов. Перед первым запуском проверь feed whitelist, права Telegram и `AUTO_PUBLISH`.

Этот MVP намеренно не скачивает произвольные чужие видео: для media используется безопасная ссылка/разрешённый URL, а спорные материалы лучше пропускать.
