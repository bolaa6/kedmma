'use strict';
// ميزات إضافية:
//  1) تنبيه الخدام بالأولاد الغايبين   2) تذكير يومي للولد   3) شارات الإنجاز
//  4) آية أو قصة اليوم                 5) الولد يكتب اللي قراه من الإنجيل (من غير كتابة الزرار بيفضل مقفول)
const crypto = require('node:crypto');
const push = require('./push');

const MIN_NOTE = 20;      // أقل عدد حروف للي الولد يكتبه
const MIN_WORDS = 4;      // أقل عدد كلمات
const ABSENT_SESSIONS = 2; // يتعمله تنبيه لو غاب آخر كام اجتماع ورا بعض
const STALE_DAYS = 28;    // لو آخر اجتماع بقاله أكتر من كده (إجازة) منبعتش تنبيهات غياب

// ---------- محتوى أولي لآية/قصة اليوم (المسؤول يقدر يزوّد أو يمسح) ----------
const SEED = [
  ['verse', '', 'الرب راعيّ فلا يعوزني شيء.', 'مزمور 23: 1'],
  ['story', 'زكا والشجرة', 'زكا كان راجل غني بس قصير القامة، وعايز يشوف يسوع وسط الزحمة. جري وطلع شجرة جميز. يسوع وقف تحت الشجرة وقاله: "يا زكا أسرع وانزل لأني اليوم ينبغي أن أمكث في بيتك". نزل زكا فرحان، ووعد إنه يرجّع الفلوس لكل واحد ظلمه. اللي بيدوّر على يسوع بقلبه، يسوع بيدوّر عليه الأول.', ''],
  ['verse', '', 'أستطيع كل شيء في المسيح الذي يقويني.', 'فيلبي 4: 13'],
  ['verse', '', 'الله محبة.', '1 يوحنا 4: 8'],
  ['story', 'الابن اللي رجع', 'ابن طلب من أبوه ياخد نصيبه من الفلوس ويسافر، وصرفها كلها لحد ما بقى جعان ومالوش حد. فكّر يرجع لبيت أبوه. من بعيد شافه أبوه، جري عليه وحضنه وعمله حفلة كبيرة. كده ربنا معانا: مهما بعدنا، لما نرجع له بيفتح لنا حضنه.', ''],
  ['verse', '', 'اطلبوا أولاً ملكوت الله وبره وهذه كلها تزاد لكم.', 'متى 6: 33'],
  ['verse', '', 'كلمتك سراج لرجلي ونور لسبيلي.', 'مزمور 119: 105'],
  ['story', 'داود وجليات', 'جليات كان عملاق وكل الجيش خايف منه، إلا داود الراعي الصغير. داود مالبسش درع ولا خد سيف، خد خمسة حجارة ملساء ومقلاعه وقال: "أنا آتي إليك باسم رب الجنود". رمى حجر واحد ووقع العملاق. الإيمان بربنا أقوى من أي خوف.', ''],
  ['verse', '', 'لا تخف لأني معك.', 'إشعياء 41: 10'],
  ['verse', '', 'افرحوا في الرب كل حين.', 'فيلبي 4: 4'],
  ['story', 'الولد وخمس أرغفة', 'الناس كانوا كتير وجعانين، وماكانش معاهم أكل. ولد صغير كان معاه خمس أرغفة وسمكتين، وقدّمهم ليسوع بحب. يسوع بارك الأكل وفرّقه، فأكل خمسة آلاف راجل وزاد كمان. اللي نقدّمه لربنا حتى لو قليل، ربنا بيباركه ويكتّره.', ''],
  ['verse', '', 'تعالوا إليّ يا جميع المتعبين والثقيلي الأحمال وأنا أريحكم.', 'متى 11: 28'],
  ['verse', '', 'أنا هو نور العالم، من يتبعني فلا يمشي في الظلمة بل يكون له نور الحياة.', 'يوحنا 8: 12'],
  ['story', 'السامري الطيب', 'راجل وقع في الطريق واتضرب وسابوه، ومرّ عليه اتنين وكملوا من غير ما يساعدوه. بعدين جه واحد سامري، وقف وداوى جروحه وخده لحد مكان آمن ودفع تكاليف علاجه. يسوع قال لنا: "اذهب أنت أيضاً واصنع هكذا". قريبك هو أي حد محتاج مساعدتك.', ''],
  ['verse', '', 'صلّوا بلا انقطاع.', '1 تسالونيكي 5: 17'],
  ['verse', '', 'هذه هي وصيتي أن تحبوا بعضكم بعضاً.', 'يوحنا 15: 12'],
];

module.exports = function (d) {
  const { route, need, bad, all, one, run, now, todayStr, clean, starsFor, birthdaysToday, birthdayMessage, STAFF, asKidId, HttpError } = d;

  const kvGet = async (k) => { const r = await one('SELECT v FROM kv WHERE k=$1', [k]); return r ? r.v : null; };
  const kvSet = (k, v) => run('INSERT INTO kv (k,v) VALUES ($1,$2) ON CONFLICT (k) DO UPDATE SET v=excluded.v', [k, String(v)]);

  const toDate = (s) => new Date(s + 'T00:00:00Z');
  const dayNum = (s) => Math.floor(toDate(s).getTime() / 864e5);
  const dayDiff = (a, b) => dayNum(b) - dayNum(a);
  function maxRun(days) {
    const a = [...new Set(days)].sort();
    let best = 0, cur = 0, prev = null;
    for (const x of a) { cur = prev && dayDiff(prev, x) === 1 ? cur + 1 : 1; if (cur > best) best = cur; prev = x; }
    return best;
  }

  async function seed() {
    const first = await one("INSERT INTO kv (k,v) VALUES ('content_seeded','1') ON CONFLICT (k) DO NOTHING RETURNING k");
    if (!first) return;
    for (const [kind, title, text, ref] of SEED)
      await run('INSERT INTO daily_content (kind,title,text,ref,created_at) VALUES ($1,$2,$3,$4,$5)', [kind, title, text, ref, now()]);
  }

  // ====================== 5) كتابة القراءة ======================
  function readingProblem(ref, note) {
    if (ref.length < 3) return 'اكتب اسم الإصحاح اللي قريته (مثلاً: يوحنا 3)';
    const words = note.split(/\s+/).filter(Boolean).length;
    const uniq = new Set(note.replace(/\s/g, '')).size;
    if (note.length < MIN_NOTE || words < MIN_WORDS || uniq < 8) return `اكتب بكلامك إيه اللي فهمته من القراءة (${MIN_NOTE} حرف على الأقل)`;
    return '';
  }
  route('GET', '/api/reading', async (ctx) => {
    need(ctx.user, ['kid']);
    const r = await one('SELECT ref,note FROM readings WHERE user_id=$1 AND day=$2', [Number(ctx.user.id), todayStr()]);
    return { reading: r ? { ref: r.ref, note: r.note } : null, min_chars: MIN_NOTE, min_words: MIN_WORDS };
  });
  route('PUT', '/api/reading', async (ctx) => {
    need(ctx.user, ['kid']);
    const uid = Number(ctx.user.id);
    const day = todayStr();
    const ref = clean(ctx.body.ref, 80);
    const note = clean(ctx.body.note, 800);
    const problem = readingProblem(ref, note);
    if (problem) throw bad(problem);
    await run(`INSERT INTO readings (user_id,day,ref,note,updated_at) VALUES ($1,$2,$3,$4,$5)
               ON CONFLICT (user_id,day) DO UPDATE SET ref=excluded.ref, note=excluded.note, updated_at=excluded.updated_at`, [uid, day, ref, note, now()]);
    // النجمة بتتحسب من هنا بس: مفيش قراءة من غير كتابة
    await run(`INSERT INTO daily (user_id,day,prayed,gospel) VALUES ($1,$2,0,1)
               ON CONFLICT (user_id,day) DO UPDATE SET gospel=1`, [uid, day]);
    return { ok: true, stars: await starsFor(uid), new_badges: await award(uid) };
  });

  // ====================== 3) شارات الإنجاز ======================
  const BADGES = [
    { code: 'first_prayer', icon: '🙏', title: 'أول صلاة', desc: 'سجّلت أول يوم صلاة', need: 1, val: (s) => s.prayerDays },
    { code: 'prayer_7', icon: '🔥', title: 'مصلّي مواظب', desc: 'صلّيت 7 أيام ورا بعض', need: 7, val: (s) => s.prayerRun },
    { code: 'prayer_30', icon: '🌟', title: 'قلب بيصلّي', desc: 'صلّيت 30 يوم', need: 30, val: (s) => s.prayerDays },
    { code: 'first_reading', icon: '📖', title: 'أول قراءة', desc: 'قريت وكتبت أول مرة', need: 1, val: (s) => s.readings },
    { code: 'reading_7', icon: '📚', title: 'قارئ مواظب', desc: 'قريت الإنجيل 7 أيام ورا بعض', need: 7, val: (s) => s.gospelRun },
    { code: 'reading_30', icon: '🏅', title: 'تلميذ الكلمة', desc: 'قريت الإنجيل 30 يوم', need: 30, val: (s) => s.gospelDays },
    { code: 'mass_4', icon: '⛪', title: 'محب القداس', desc: 'رحت 4 قداسات', need: 4, val: (s) => s.mass },
    { code: 'confession_3', icon: '🕊️', title: 'مواظب على الاعتراف', desc: 'اعترفت 3 شهور', need: 3, val: (s) => s.conf },
    { code: 'attend_4', icon: '🎒', title: 'حاضر دايماً', desc: 'حضرت 4 اجتماعات', need: 4, val: (s) => s.att },
    { code: 'attend_10', icon: '🏆', title: 'بطل الحضور', desc: 'حضرت 10 اجتماعات', need: 10, val: (s) => s.att },
    { code: 'stars_100', icon: '⭐', title: '100 نجمة', desc: 'جمعت 100 نجمة', need: 100, val: (s) => s.stars },
    { code: 'stars_500', icon: '👑', title: '500 نجمة', desc: 'جمعت 500 نجمة', need: 500, val: (s) => s.stars },
  ];
  async function stats(uid) {
    const rows = await all('SELECT day,prayed,gospel FROM daily WHERE user_id=$1', [uid]);
    const pr = rows.filter((r) => Number(r.prayed)).map((r) => r.day);
    const gs = rows.filter((r) => Number(r.gospel)).map((r) => r.day);
    const n = async (sql) => Number((await one(sql, [uid])).n) || 0;
    return {
      prayerDays: pr.length, prayerRun: maxRun(pr), gospelDays: gs.length, gospelRun: maxRun(gs),
      readings: await n('SELECT COUNT(*) n FROM readings WHERE user_id=$1'),
      mass: await n('SELECT COALESCE(SUM(attended),0) n FROM mass WHERE user_id=$1'),
      conf: await n('SELECT COALESCE(SUM(done),0) n FROM confession WHERE user_id=$1'),
      att: await n('SELECT COUNT(*) n FROM attendance WHERE user_id=$1'),
      stars: (await starsFor(uid)).total,
    };
  }
  // بيمنح أي شارة استحقها الولد ويرجّع الجديد بس. أي خطأ هنا مايوقفش العملية الأساسية.
  async function award(uid, st) {
    try {
      const s = st || await stats(uid);
      const have = new Set((await all('SELECT code FROM badges WHERE user_id=$1', [uid])).map((r) => r.code));
      const fresh = [];
      for (const b of BADGES) {
        if (have.has(b.code) || b.val(s) < b.need) continue;
        await run('INSERT INTO badges (user_id,code,earned_at) VALUES ($1,$2,$3) ON CONFLICT (user_id,code) DO NOTHING', [uid, b.code, now()]);
        fresh.push({ code: b.code, title: b.title, icon: b.icon });
      }
      return fresh;
    } catch (e) { console.error('award', e); return []; }
  }
  async function badgeList(uid) {
    const s = await stats(uid);
    const fresh = await award(uid, s);
    const got = new Map((await all('SELECT code,earned_at FROM badges WHERE user_id=$1', [uid])).map((r) => [r.code, r.earned_at]));
    return {
      fresh,
      list: BADGES.map((b) => ({ code: b.code, icon: b.icon, title: b.title, desc: b.desc, need: b.need, have: Math.min(b.val(s), b.need), earned: got.has(b.code), earned_at: got.get(b.code) || '' })),
    };
  }
  route('GET', '/api/badges', async (ctx) => {
    need(ctx.user, ['kid']);
    const r = await badgeList(Number(ctx.user.id));
    return { badges: r.list, new_badges: r.fresh };
  });

  // ====================== 4) آية أو قصة اليوم ======================
  route('GET', '/api/daily-content', async (ctx) => {
    need(ctx.user);
    const total = Number((await one('SELECT COUNT(*) n FROM daily_content')).n) || 0;
    if (!total) return { item: null };
    const r = await one('SELECT id,kind,title,text,ref FROM daily_content ORDER BY id LIMIT 1 OFFSET $1', [dayNum(todayStr()) % total]);
    return { item: r ? { id: Number(r.id), kind: r.kind, title: r.title, text: r.text, ref: r.ref } : null };
  });
  route('GET', '/api/admin/content', async (ctx) => {
    need(ctx.user, ['admin']);
    return { items: (await all('SELECT id,kind,title,text,ref FROM daily_content ORDER BY id')).map((r) => ({ ...r, id: Number(r.id) })) };
  });
  route('POST', '/api/admin/content', async (ctx) => {
    need(ctx.user, ['admin']);
    const kind = ctx.body.kind === 'story' ? 'story' : 'verse';
    const text = clean(ctx.body.text, 900);
    const title = clean(ctx.body.title, 80);
    const ref = clean(ctx.body.ref, 60);
    if (text.length < 5) throw bad('اكتب النص');
    if (kind === 'story' && !title) throw bad('اكتب عنوان القصة');
    await run('INSERT INTO daily_content (kind,title,text,ref,created_at) VALUES ($1,$2,$3,$4,$5)', [kind, title, text, ref, now()]);
    return { ok: true };
  });
  route('DELETE', '/api/admin/content/:id', async (ctx) => {
    need(ctx.user, ['admin']);
    await run('DELETE FROM daily_content WHERE id=$1', [Number(ctx.params.id)]);
    return { ok: true };
  });

  // ====================== 1) الأولاد الغايبين ======================
  async function absentKids() {
    const today = todayStr();
    const sessions = (await all('SELECT DISTINCT day FROM attendance WHERE day<=$1 ORDER BY day DESC LIMIT $2', [today, ABSENT_SESSIONS])).map((r) => r.day);
    if (sessions.length < ABSENT_SESSIONS) return { sessions, kids: [] };
    if (dayDiff(sessions[0], today) > STALE_DAYS) return { sessions, kids: [], stale: true };
    const kids = await all(`SELECT u.id,u.name,u.created_at,u.phone,p.mother_phone,p.father_phone FROM users u LEFT JOIN profiles p ON p.user_id=u.id
                            WHERE u.role='kid' AND u.id NOT IN (SELECT user_id FROM pending_users) ORDER BY u.name`);
    const present = new Set((await all(`SELECT DISTINCT user_id FROM attendance WHERE day IN (${sessions.map((_, i) => '$' + (i + 1)).join(',')})`, sessions)).map((r) => Number(r.user_id)));
    const last = new Map((await all('SELECT user_id, MAX(day) d FROM attendance GROUP BY user_id')).map((r) => [Number(r.user_id), r.d]));
    const oldest = sessions[sessions.length - 1];
    return {
      sessions,
      kids: kids.filter((k) => !present.has(Number(k.id)) && String(k.created_at).slice(0, 10) <= oldest)
        .map((k) => ({ id: Number(k.id), name: k.name, last: last.get(Number(k.id)) || '', phone: k.mother_phone || k.father_phone || k.phone || '' })),
    };
  }
  route('GET', '/api/staff/absent', async (ctx) => {
    need(ctx.user, STAFF);
    const r = await absentKids();
    return { n: ABSENT_SESSIONS, ...r };
  });

  // بيانات إضافية في صفحة الولد عند الخدام: الشارات + اللي كتبه عن قراءته
  route('GET', '/api/staff/kid-extras/:id', async (ctx) => {
    need(ctx.user, STAFF);
    const id = await asKidId(ctx.params.id);
    const b = await badgeList(id);
    const readings = await all('SELECT day,ref,note FROM readings WHERE user_id=$1 ORDER BY day DESC LIMIT 20', [id]);
    return { badges: b.list.filter((x) => x.earned), readings };
  });

  // ====================== 2) رسائل الإشعارات ======================
  const ACTUAL = (s) => Number(s) || 0;
  const namesLine = (arr) => arr.slice(0, 6).join('، ') + (arr.length > 6 ? ' وغيرهم' : '');
  async function staffMessage() {
    const today = todayStr();
    const parts = [];
    const bd = await birthdaysToday();
    if (bd.length) parts.push(birthdayMessage(bd));
    const raw = await kvGet('staff_alert');
    let al = null;
    try { al = raw ? JSON.parse(raw) : null; } catch { al = null; }
    if (al && al.day === today && Array.isArray(al.names) && al.names.length)
      parts.push({ title: 'أولاد محتاجين افتقاد', body: `غابوا ${al.n === 2 ? 'آخر اجتماعين' : 'آخر ' + al.n + ' اجتماعات'}: ${namesLine(al.names)}.` });
    if (parts.length === 1) return parts[0];
    if (parts.length > 1) return { title: 'تنبيهات النهارده', body: parts.map((p) => p.body).join(' ') };
    return null;
  }
  async function kidMessage(uid) {
    const r = (await one('SELECT prayed,gospel FROM daily WHERE user_id=$1 AND day=$2', [uid, todayStr()])) || { prayed: 0, gospel: 0 };
    if (!ACTUAL(r.gospel)) return { title: 'وقت قراءة الإنجيل', body: 'لسه ماقريتش الإنجيل النهارده. اقرا واكتب اللي فهمته وخد نجمتك.' };
    if (!ACTUAL(r.prayed)) return { title: 'متنساش صلاتك', body: 'علّم على صلاتك النهارده وخد نجمتك.' };
    return { title: 'برافو عليك', body: 'خلّصت كل حاجة النهارده. ربنا يبارك حياتك.' };
  }
  // الموبايل بيسأل هنا عن نص الإشعار بعد ما يوصله
  route('GET', '/api/push/message', async (ctx) => {
    need(ctx.user, ['admin', 'servant', 'kid']);
    if (ctx.user.role === 'kid') {
      const t = await one("SELECT v FROM kv WHERE k='push_test'");
      if (t && Date.now() - JSON.parse(t.v).ts < 10 * 60000) return { title: 'تنبيه تجريبي', body: 'التنبيهات شغالة على الجهاز ده.' };
      return kidMessage(Number(ctx.user.id));
    }
    const m = await staffMessage();
    if (m) return m;
    const t = await one("SELECT v FROM kv WHERE k='push_test'");
    if (t && Date.now() - JSON.parse(t.v).ts < 10 * 60000) return { title: 'تنبيه تجريبي', body: 'التنبيهات شغالة على الجهاز ده.' };
    return { title: 'متابعة مدارس الأحد', body: 'افتح الموقع.' };
  });

  // ====================== الكرون ======================
  function cronOk(req) {
    const secret = process.env.CRON_SECRET;
    const authz = String(req.headers.authorization || '');
    const okSecret = secret && authz.length === ('Bearer ' + secret).length && crypto.timingSafeEqual(Buffer.from(authz), Buffer.from('Bearer ' + secret));
    const okCron = !secret && /^vercel-cron/.test(String(req.headers['user-agent'] || ''));
    if (!okSecret && !okCron) throw new HttpError(401, 'غير مصرح');
  }
  // الصبح: أعياد الميلاد + الغايبين (إشعار واحد للخدام)
  async function morning() {
    const today = todayStr();
    const bd = await birthdaysToday();
    const bdNew = bd.length > 0 && (await kvGet('bday_push_last')) !== today;
    const ab = await absentKids();
    const sig = ab.kids.length ? `${Math.floor(dayNum(today) / 7)}:${ab.kids.map((k) => k.id).join(',')}` : '';
    const abNew = !!sig && (await kvGet('absence_sig')) !== sig;
    if (!bdNew && !abNew) return { ok: true, skipped: 'nothing-new', birthdays: bd.length, absent: ab.kids.length };
    if (abNew) await kvSet('staff_alert', JSON.stringify({ day: today, names: ab.kids.map((k) => k.name), n: ABSENT_SESSIONS }));
    const subs = await all("SELECT s.endpoint FROM push_subs s JOIN users u ON u.id=s.user_id WHERE u.role IN ('admin','servant')");
    const r = await push.sendTo(subs);
    if (r.sent) { if (bdNew) await kvSet('bday_push_last', today); if (abNew) await kvSet('absence_sig', sig); }
    return { ok: true, birthdays: bd.length, absent: ab.kids.length, ...r };
  }
  // المغرب: تذكير للأولاد اللي لسه ماخلّصوش صلاة وقراءة النهارده
  async function evening() {
    const today = todayStr();
    if ((await kvGet('kid_push_last')) === today) return { ok: true, skipped: 'already-sent' };
    const subs = await all(`SELECT s.endpoint FROM push_subs s JOIN users u ON u.id=s.user_id
      WHERE u.role='kid' AND u.id NOT IN (SELECT user_id FROM pending_users)
      AND NOT EXISTS (SELECT 1 FROM daily dd WHERE dd.user_id=u.id AND dd.day=$1 AND dd.prayed=1 AND dd.gospel=1)`, [today]);
    if (!subs.length) return { ok: true, kids: 0 };
    const r = await push.sendTo(subs);
    if (r.sent) await kvSet('kid_push_last', today);
    return { ok: true, ...r };
  }
  route('GET', '/api/cron/morning', async (ctx) => { cronOk(ctx.req); return morning(); });
  route('GET', '/api/cron/birthdays', async (ctx) => { cronOk(ctx.req); return morning(); }); // اسم قديم، لسه شغال
  route('GET', '/api/cron/evening', async (ctx) => { cronOk(ctx.req); return evening(); });

  return { seed, award };
};
