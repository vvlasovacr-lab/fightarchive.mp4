import { config } from './config.js';

async function ask(model, system, user, maxTokens = 900) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type':'application/json',
      'x-api-key': config.anthropicKey,
      'anthropic-version':'2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages:[{role:'user',content:user}] }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${body?.error?.message || 'unknown error'}`);
  return body.content?.map(x=>x.text||'').join('') || '';
}

function jsonFrom(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned no JSON');
  return JSON.parse(match[0]);
}

export async function scoreEvent(event) {
  const system = `You are the editor of a Russian combat-sports Telegram media brand. Score news for audience value. Return JSON only with importance, novelty, viral_potential, audience_fit, decision, reason. Scores 0-10. decision must be PUBLISH_CANDIDATE or SKIP.`;
  const raw = await ask(config.fastModel, system, JSON.stringify(event), 450);
  return jsonFrom(raw);
}

export async function generatePost(event, article) {
  const system = `You write concise Russian Telegram posts for FIGHT ARCHIVE. Style: energetic, direct, no filler, no fake clickbait. Create one short post. Return JSON only: post_type, text. Do not invent facts. If uncertain, say so.`;
  const raw = await ask(config.strongModel, system, JSON.stringify({event,article}), 700);
  return jsonFrom(raw);
}

export async function moderateComment(comment) {
  const system = `You moderate comments for a Russian combat-sports Telegram group. Return JSON only: category (NORMAL, SPAM, SCAM, ADVERTISEMENT, BOT, HARASSMENT, TOXIC, OFF_TOPIC, SUSPICIOUS), confidence 0..1, action (KEEP, DELETE, BAN), reason. Be conservative. Never ban solely for profanity or disagreement.`;
  const raw = await ask(config.fastModel, system, comment, 450);
  return jsonFrom(raw);
}
