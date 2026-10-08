import { config } from './config.js';

const base = `https://api.telegram.org/bot${config.telegramToken}`;

export async function tg(method, body = {}) {
  const res = await fetch(`${base}/${method}`, {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description || 'unknown error'}`);
  return data.result;
}

export async function sendText(chatId, text, options = {}) {
  return tg('sendMessage', { chat_id: chatId, text, disable_web_page_preview: false, ...options });
}

export async function deleteMessage(chatId, messageId) {
  return tg('deleteMessage', { chat_id: chatId, message_id: messageId });
}

export async function banUser(chatId, userId) {
  return tg('banChatMember', { chat_id: chatId, user_id: userId, revoke_messages: false });
}

export async function getUpdates(offset = 0, timeout = 25) {
  return tg('getUpdates', { offset, timeout, allowed_updates: ['message','channel_post'] });
}

export async function deleteWebhook(dropPending = false) {
  return tg('deleteWebhook', { drop_pending_updates: dropPending });
}

export async function getChatMemberCount(chatId) {
  return tg('getChatMemberCount', { chat_id: chatId });
}

export async function botInfo() { return tg('getMe'); }
