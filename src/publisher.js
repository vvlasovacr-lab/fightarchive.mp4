import { q } from './db.js';
import { config } from './config.js';
import { sendText } from './telegram.js';
import { log, error } from './logger.js';

async function publishTextRow(row, kind='post') {
  const msg = await sendText(config.channelId, row.text);
  if (kind === 'post') {
    await q(`UPDATE posts SET status='PUBLISHED',telegram_message_id=$1,published_at=NOW() WHERE id=$2`,[msg.message_id,row.id]);
    await q(`UPDATE events SET status='PUBLISHED',published_at=NOW() WHERE id=(SELECT event_id FROM posts WHERE id=$1)`,[row.id]);
  } else {
    await q(`UPDATE ads SET status='PUBLISHED',published_at=NOW() WHERE id=$1`,[row.id]);
  }
  return msg;
}

export async function publishNext() {
  if (!config.autoPublish) return;

  const since = new Date(Date.now() - config.minPostIntervalMs);
  const recent = await q(`SELECT 1 FROM posts WHERE status='PUBLISHED' AND published_at > $1`,[since]);
  if (recent.rowCount) return;

  const daily = await q(`SELECT COUNT(*) FROM posts WHERE status='PUBLISHED' AND published_at::date = CURRENT_DATE`);
  if (Number(daily.rows[0].count) >= config.maxPostsPerDay) return;

  const ad = (await q(`SELECT id,text FROM ads WHERE status IN ('QUEUED','SCHEDULED') AND (scheduled_at IS NULL OR scheduled_at <= NOW()) ORDER BY scheduled_at NULLS FIRST, created_at ASC LIMIT 1`)).rows[0];
  if (ad) {
    try {
      const msg = await publishTextRow(ad,'ad');
      log('PUBLISH','ad published',{ad_id:ad.id,message_id:msg.message_id});
    } catch (e) {
      error('PUBLISH','ad failed',{ad_id:ad.id,error:e.message});
    }
    return;
  }

  const row = (await q(`SELECT id,text FROM posts WHERE status='QUEUED' ORDER BY scheduled_at NULLS FIRST, created_at ASC LIMIT 1`)).rows[0];
  if (!row) return;

  try {
    const msg = await publishTextRow(row,'post');
    log('PUBLISH','published',{post_id:row.id,message_id:msg.message_id});
  } catch (e) {
    error('PUBLISH','failed',{post_id:row.id,error:e.message});
  }
}
