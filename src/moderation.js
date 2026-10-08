import { q } from './db.js';
import { config } from './config.js';
import { deleteMessage, banUser } from './telegram.js';
import { moderateComment } from './ai.js';
import { error } from './logger.js';

export async function processCommentUpdate(msg) {
  if (!msg || String(msg.chat?.id) !== String(config.discussionGroupId)) return false;
  if (!msg.text || !msg.from || msg.from.is_bot) return false;

  await q(`INSERT INTO comments(telegram_message_id,chat_id,user_id,username,text) VALUES($1,$2,$3,$4,$5) ON CONFLICT(telegram_message_id) DO NOTHING`,[
    msg.message_id,msg.chat.id,msg.from.id,msg.from.username||'',msg.text
  ]);

  try {
    const decision = await moderateComment({text:msg.text,username:msg.from.username||'',user_id:msg.from.id});
    if (Number(decision.confidence || 0) < config.moderationThreshold) decision.action = 'KEEP';

    await q(`UPDATE comments SET status=$1,moderation_confidence=$2,moderation_reason=$3,moderated_at=NOW() WHERE telegram_message_id=$4`,[
      decision.action,decision.confidence||0,decision.reason||'',msg.message_id
    ]);

    await q(`INSERT INTO moderation_actions(telegram_message_id,user_id,action,reason,confidence) VALUES($1,$2,$3,$4,$5)`,[
      msg.message_id,msg.from.id,decision.action,decision.reason||'',decision.confidence||0
    ]);

    if (decision.action === 'DELETE' || decision.action === 'BAN') {
      try { await deleteMessage(msg.chat.id,msg.message_id); } catch (e) { error('MODERATION','delete failed',{message_id:msg.message_id,error:e.message}); }
    }
    if (decision.action === 'BAN') {
      try { await banUser(msg.chat.id,msg.from.id); } catch (e) { error('MODERATION','ban failed',{user_id:msg.from.id,error:e.message}); }
    }
  } catch (e) {
    error('MODERATION','AI moderation failed',{message_id:msg.message_id,error:e.message});
  }
  return true;
}
