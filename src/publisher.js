import { q } from './db.js';
import { config } from './config.js';
import { sendText } from './telegram.js';
import { log, error } from './logger.js';

export async function publishNext() {
  if (!config.autoPublish) return;
  const since = new Date(Date.now() - config.minPostIntervalMs);
  const recent = await q(`SELECT 1 FROM posts WHERE status='PUBLISHED' AND published_at > $1`,[since]);
  if (recent.rowCount) return;
  const daily = await q(`SELECT COUNT(*) FROM posts WHERE status='PUBLISHED' AND published_at::date = CURRENT_DATE`);
  if (Number(daily.rows[0].count) >= config.maxPostsPerDay) return;
  const row = (await q(`SELECT id,text FROM posts WHERE status='QUEUED' ORDER BY scheduled_at NULLS FIRST, created_at ASC LIMIT 1`)).rows[0];
  if (!row) return;
  try {
    const msg = await sendText(config.channelId,row.text);
    await q(`UPDATE posts SET status='PUBLISHED',telegram_message_id=$1,published_at=NOW() WHERE id=$2`,[msg.message_id,row.id]);
    await q(`UPDATE events SET status='PUBLISHED',published_at=NOW() WHERE id=(SELECT event_id FROM posts WHERE id=$1)`,[row.id]);
    log('PUBLISH','published',{post_id:row.id,message_id:msg.message_id});
  } catch (e) { error('PUBLISH','failed',{post_id:row.id,error:e.message}); }
}
