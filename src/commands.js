import { q } from './db.js';
import { config } from './config.js';
import { sendText } from './telegram.js';

export async function handleCommand(msg) {
  if (!msg?.text?.startsWith('/')) return false;
  if (msg.from?.id !== config.adminUserId) return true;
  const [cmd, ...rest] = msg.text.trim().split(/\s+/);
  const arg = rest.join(' ');
  if (cmd === '/id') { await sendText(msg.chat.id,`Your Telegram ID: ${msg.from.id}`); return true; }
  if (cmd === '/status') {
    const p = await q(`SELECT COUNT(*) filter(where status='QUEUED') queued, COUNT(*) filter(where status='PUBLISHED') published FROM posts`);
    await sendText(msg.chat.id,`FIGHT ARCHIVE\nQueued: ${p.rows[0].queued}\nPublished: ${p.rows[0].published}\nAuto publish: ${config.autoPublish?'ON':'OFF'}`); return true;
  }
  if (cmd === '/queue') {
    const rows = (await q(`SELECT id,post_type,text,total_score FROM posts p LEFT JOIN events e ON e.id=p.event_id WHERE p.status='QUEUED' ORDER BY p.created_at ASC LIMIT 5`)).rows;
    await sendText(msg.chat.id,rows.length?rows.map(x=>`#${x.id} ${x.post_type} ${(x.total_score||0)}\n${x.text}`).join('\n\n'):'Queue is empty'); return true;
  }
  if (cmd === '/pause') { await q(`INSERT INTO settings(key,value) VALUES('paused','1') ON CONFLICT(key) DO UPDATE SET value='1'`); await sendText(msg.chat.id,'Publishing paused'); return true; }
  if (cmd === '/resume') { await q(`INSERT INTO settings(key,value) VALUES('paused','0') ON CONFLICT(key) DO UPDATE SET value='0'`); await sendText(msg.chat.id,'Publishing resumed'); return true; }
  if (cmd === '/stats') {
    const r = await q(`SELECT COUNT(*) posts, COUNT(*) FILTER(WHERE created_at::date=CURRENT_DATE) today_posts FROM posts`);
    await sendText(msg.chat.id,`Posts total: ${r.rows[0].posts}\nToday: ${r.rows[0].today_posts}`); return true;
  }
  if (cmd === '/ad') {
    if (!arg) { await sendText(msg.chat.id,'Usage: /ad your text'); return true; }
    await q(`INSERT INTO ads(text,status) VALUES($1,'QUEUED')`,[arg]);
    await sendText(msg.chat.id,'Ad added to queue.'); return true;
  }
  return true;
}
