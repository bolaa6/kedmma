'use strict';
// نسخة احتياطية كاملة + عدّاد المساحة (للمسؤول بس)
module.exports = function (d) {
  const { route, need, all, one, run, audit, now, todayStr, isPg } = d;
  const LIMIT_MB = Math.max(50, Number(process.env.STORAGE_LIMIT_MB) || 512); // الخطة المجانية في Neon حوالي 512MB
  const MAX_BYTES = 4200000; // Vercel بيقبل رد لحد 4.5MB تقريباً

  // الجداول اللي بتدخل النسخة. الجلسات والمحاولات والإشعارات واللعب المؤقت مش مهمة.
  const TABLES = ['users', 'profiles', 'birthdays', 'daily', 'mass', 'confession', 'attendance', 'notes', 'readings', 'badges', 'badge_defs',
    'daily_content', 'cheers', 'lessons', 'lesson_reads', 'contests', 'quiz_answers', 'resources', 'game_questions', 'game_stars', 'pending_users',
    'reset_requests', 'must_change', 'audit', 'kv'];
  const kvSet = (k, v) => run('INSERT INTO kv (k,v) VALUES ($1,$2) ON CONFLICT (k) DO UPDATE SET v=excluded.v', [k, String(v)]);

  route('GET', '/api/admin/storage', async (ctx) => {
    need(ctx.user, ['admin']);
    const n = async (sql) => Number((await one(sql)).n) || 0;
    const gal = { count: await n('SELECT COUNT(*) n FROM gallery'), bytes: await n('SELECT COALESCE(SUM(LENGTH(data)+LENGTH(thumb)),0) n FROM gallery') };
    const profile = { count: await n('SELECT COUNT(*) n FROM photos'), bytes: await n('SELECT COALESCE(SUM(LENGTH(data)),0) n FROM photos') };
    let total = null;
    if (isPg) { try { total = Number((await one('SELECT pg_database_size(current_database()) AS n')).n); } catch { total = null; } }
    const used = total === null ? gal.bytes + profile.bytes : total;
    const limit = LIMIT_MB * 1048576;
    const last = await one("SELECT v FROM kv WHERE k='last_backup'");
    return { gallery: gal, profile_photos: profile, total, used, limit, percent: Math.min(100, Math.round((used / limit) * 100)), estimated: total === null, last_backup: last ? last.v : '' };
  });

  route('GET', '/api/admin/backup', async (ctx) => {
    need(ctx.user, ['admin']);
    const out = { app: 'sunday-school', version: 1, created_at: now(), tables: {}, note: 'ملف حساس: فيه بيانات الأولاد وأرقام التليفونات وكلمات السر مشفّرة. احفظه في مكان آمن.' };
    for (const t of TABLES) out.tables[t] = await all(`SELECT * FROM ${t}`);
    out.tables.gallery_index = await all('SELECT id,title,by_name,created_at FROM gallery ORDER BY id');
    const withPhotos = { ...out.tables, photos: await all('SELECT * FROM photos') };
    let body = JSON.stringify({ ...out, tables: withPhotos });
    if (Buffer.byteLength(body) > MAX_BYTES) { out.skipped = 'صور الأولاد الشخصية (الحجم كبير)'; body = JSON.stringify(out); }
    if (Buffer.byteLength(body) > MAX_BYTES) { const e = new Error('حجم النسخة كبير'); e.status = 413; throw e; }
    await kvSet('last_backup', now());
    await audit(ctx.user, 'نسخة احتياطية', null, '', `${Math.round(Buffer.byteLength(body) / 1024)} KB`);
    return { raw: body, type: 'application/json; charset=utf-8', filename: `backup-${todayStr()}.json` };
  });
};
