import { config } from './config.js';
import { initDb, pool, q } from './db.js';
import { log, error } from './logger.js';
import { botInfo, getUpdates, deleteWebhook } from './telegram.js';
import { seedSources, scanNews } from './sources.js';
import { publishNext } from './publisher.js';
import { processCommentUpdate } from './moderation.js';
import { handleCommand } from './commands.js';

let polling = false;
let scanning = false;
let publishing = false;

async function isPaused() {
  const v = (await q(`SELECT value FROM settings WHERE key='paused'`)).rows[0]?.value;
  return v === '1';
}

async function pollUpdatesOnce() {
  if (polling) return;
  polling = true;
  try {
    let offset = Number((await q(`SELECT value FROM settings WHERE key='offset'`)).rows[0]?.value || 0);
    const updates = await getUpdates(offset, 10);
    for (const u of updates) {
      offset = u.update_id + 1;
      await q(`INSERT INTO settings(key,value) VALUES('offset',$1) ON CONFLICT(key) DO UPDATE SET value=$1`, [String(offset)]);
      const msg = u.message;
      if (!msg) continue;
      if (msg.text?.startsWith('/')) await handleCommand(msg);
      await processCommentUpdate(msg);
    }
  } catch (e) {
    error('BOT', 'poll failed', { error: e.message });
  } finally {
    polling = false;
  }
}

async function safeScan() {
  if (scanning) return;
  scanning = true;
  try {
    await scanNews();
  } catch (e) {
    error('NEWS', 'scan failed', { error: e.message });
  } finally {
    scanning = false;
  }
}

async function safePublish() {
  if (publishing) return;
  publishing = true;
  try {
    if (!await isPaused()) await publishNext();
  } catch (e) {
    error('PUBLISH', 'publish failed', { error: e.message });
  } finally {
    publishing = false;
  }
}

async function main() {
  if (!config.databaseUrl || !config.telegramToken || !config.anthropicKey) {
    throw new Error('Missing required environment variables: DATABASE_URL, TELEGRAM_BOT_TOKEN, ANTHROPIC_API_KEY');
  }

  await initDb();
  await seedSources();
  await deleteWebhook(false);

  const me = await botInfo();
  log('BOOT', 'started', {
    bot: me.username,
    autoPublish: config.autoPublish,
    fastModel: config.fastModel,
    strongModel: config.strongModel
  });

  // Start responding to Telegram immediately; the first RSS+AI scan can take time.
  await pollUpdatesOnce();
  setInterval(pollUpdatesOnce, config.moderationIntervalMs);

  // Start recurring jobs before the first scan, so a slow feed/API can't block the bot.
  setInterval(safeScan, config.newsIntervalMs);
  setInterval(safePublish, 60_000);

  // Run discovery in the background instead of blocking bot replies.
  void safeScan();
  void safePublish();
}

process.on('SIGTERM', async () => { await pool.end(); process.exit(0); });
process.on('SIGINT', async () => { await pool.end(); process.exit(0); });

main().catch(e => {
  error('BOOT', 'fatal', { error: e.message });
  process.exit(1);
});
