import Parser from 'rss-parser';
import { q } from './db.js';
import { config } from './config.js';
import { log, error } from './logger.js';
import { scoreEvent, generatePost } from './ai.js';

const parser = new Parser({timeout: 15_000});

const DEFAULT_SOURCES = [
  ['MMA Fighting','https://www.mmafighting.com/rss/index.xml','mma',0.9],
  ['MMA Junkie','https://mmajunkie.usatoday.com/feed','mma',0.9],
  ['BoxingScene','https://www.boxingscene.com/rss.xml','boxing',0.9],
  ['Sherdog','https://www.sherdog.com/rss/news.xml','mma',0.85],
];

export async function seedSources() {
  for (const [name,url,category,reliability] of DEFAULT_SOURCES) {
    await q(`INSERT INTO sources(name,url,category,reliability) VALUES($1,$2,$3,$4) ON CONFLICT(url) DO NOTHING`,[name,url,category,reliability]);
  }
}

function canonicalKey(item) {
  const title = (item.title || '').toLowerCase().replace(/[^a-z0-9а-яё]+/gi,' ').trim();
  return title.slice(0,180);
}

export async function scanNews() {
  const sources = (await q(`SELECT * FROM sources WHERE enabled=true ORDER BY reliability DESC`)).rows;
  let discovered = 0;
  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of (feed.items || []).slice(0,15)) {
        if (!item.title || !item.link) continue;
        const exists = await q(`SELECT 1 FROM articles WHERE url=$1`,[item.link]);
        if (exists.rowCount) continue;
        const key = canonicalKey(item);
        const ev = await q(`SELECT id FROM events WHERE canonical_key=$1`,[key]);
        let eventId;
        if (ev.rowCount) {
          eventId = ev.rows[0].id;
        } else {
          const scored = await scoreEvent({title:item.title, excerpt:item.contentSnippet || item.content || '', category:source.category, source:source.name});
          const total = Number(((scored.importance||0)*0.25 + (scored.novelty||0)*0.2 + (scored.viral_potential||0)*0.3 + Number(source.reliability)*10*0.15 + (scored.audience_fit||0)*0.1).toFixed(2));
          const inserted = await q(`INSERT INTO events(canonical_key,title,summary,category,importance,novelty,viral_potential,source_reliability,audience_fit,total_score,status,raw_json) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,[
            key,item.title,item.contentSnippet||'',source.category,scored.importance||0,scored.novelty||0,scored.viral_potential||0,Number(source.reliability)*10,scored.audience_fit||0,total,total>=config.newsScoreThreshold?'SCORED':'SKIPPED',JSON.stringify({score:scored,source:source.name})
          ]);
          eventId = inserted.rows[0].id;
          discovered++;
        }
        await q(`INSERT INTO articles(event_id,source_id,title,url,published_at,excerpt,raw_json) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(url) DO NOTHING`,[
          eventId,source.id,item.title,item.link,item.isoDate?new Date(item.isoDate):null,item.contentSnippet||'',JSON.stringify({feedTitle:feed.title||'',author:item.creator||''})
        ]);
      }
    } catch (e) { error('NEWS',`source failed`,{source:source.name,error:e.message}); }
  }

  const candidates = (await q(`SELECT e.*, a.title article_title, a.url article_url, a.excerpt article_excerpt FROM events e JOIN LATERAL (SELECT * FROM articles WHERE event_id=e.id ORDER BY created_at DESC LIMIT 1) a ON true WHERE e.status='SCORED' AND e.total_score >= $1 AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.event_id=e.id) ORDER BY e.total_score DESC LIMIT 5`,[config.newsScoreThreshold])).rows;
  for (const row of candidates) {
    try {
      const generated = await generatePost({id:row.id,title:row.title,summary:row.summary,category:row.category,total_score:row.total_score},{title:row.article_title,url:row.article_url,excerpt:row.article_excerpt});
      await q(`INSERT INTO posts(event_id,post_type,text,status) VALUES($1,$2,$3,'QUEUED')`,[row.id,generated.post_type,generated.text]);
      await q(`UPDATE events SET status='QUEUED' WHERE id=$1`,[row.id]);
    } catch (e) { error('CONTENT','generation failed',{event_id:row.id,error:e.message}); }
  }
  log('NEWS','scan complete',{discovered,queued:candidates.length});
}
