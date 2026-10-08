const required = ['TELEGRAM_BOT_TOKEN','TELEGRAM_CHANNEL_ID','TELEGRAM_DISCUSSION_GROUP_ID','ADMIN_TELEGRAM_USER_ID','ANTHROPIC_API_KEY','DATABASE_URL'];
for (const key of required) {
  if (!process.env[key]) console.warn(`[CONFIG] Missing ${key}`);
}

export const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  channelId: process.env.TELEGRAM_CHANNEL_ID || '',
  discussionGroupId: process.env.TELEGRAM_DISCUSSION_GROUP_ID || '',
  adminUserId: Number(process.env.ADMIN_TELEGRAM_USER_ID || 0),
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  fastModel: process.env.ANTHROPIC_FAST_MODEL || 'claude-haiku-5-5',
  strongModel: process.env.ANTHROPIC_STRONG_MODEL || 'claude-sonnet-5-5',
  databaseUrl: process.env.DATABASE_URL || '',
  autoPublish: process.env.AUTO_PUBLISH === 'true',
  newsIntervalMs: Number(process.env.NEWS_SCAN_INTERVAL_MIN || 20) * 60_000,
  archiveIntervalMs: Number(process.env.ARCHIVE_SCAN_INTERVAL_MIN || 240) * 60_000,
  moderationIntervalMs: Number(process.env.MODERATION_SCAN_INTERVAL_SEC || 20) * 1000,
  dailyReportHour: Number(process.env.DAILY_REPORT_HOUR || 21),
  maxPostsPerDay: Number(process.env.MAX_POSTS_PER_DAY || 12),
  minPostIntervalMs: Number(process.env.MIN_POST_INTERVAL_MIN || 25) * 60_000,
  newsScoreThreshold: Number(process.env.NEWS_SCORE_THRESHOLD || 6.8),
  moderationThreshold: Number(process.env.MODERATION_CONFIDENCE_THRESHOLD || 0.92),
};
