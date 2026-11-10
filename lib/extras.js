'use strict';
// ميزات إضافية:
//  1) تنبيه الخدام بالأولاد الغايبين   2) تذكير يومي للولد   3) إشارات الإنجاز (بتتدار من الموقع)
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
  const { route, need, bad, all, one, run, now, todayStr, clean, audit, starsFor, levelStep, birthdaysToday, birthdayMessage, STAFF, asKidId, HttpError } = d;

  const kvGet = async (k) => { const r = await one('SELECT v FROM kv WHERE k=$1', [k]); return r ? r.v : null; };
  const kvSet = (k, v) => run('INSERT INTO kv (k,v) VALUES ($1,$2) ON CONFLICT (k) DO UPDATE SET v=excluded.v', [k, String(v)]);

  const toDate = (s) => new Date(s + 'T00:00:00Z');
  const dayNum = (s) => Math.floor(toDate(s).getTime() / 864e5);
  const dayDiff = (a, b) => dayNum(b) - dayNum(a);
  const addDays = (s, n) => { const x = toDate(s); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  function maxRun(days) {
    const a = [...new Set(days)].sort();
    let best = 0, cur = 0, prev = null;
    for (const x of a) { cur = prev && dayDiff(prev, x) === 1 ? cur + 1 : 1; if (cur > best) best = cur; prev = x; }
    return best;
  }

  async function seed() { await seedContent(); await seedBadges(); }
  async function seedContent() {
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

  // ====================== 3) إشارات الإنجاز (بتتدار من الموقع) ======================
  // القواعد اللي الموقع يقدر يحسبها لوحده. أي إشارة تانية بتبقى "يدوية" والخادم يمنحها.
  const RULES = {
    prayer_days: ['أيام الصلاة (إجمالي)', (s) => s.prayerDays],
    prayer_run: ['أيام صلاة ورا بعض', (s) => s.prayerRun],
    gospel_days: ['أيام قراءة الإنجيل (إجمالي)', (s) => s.gospelDays],
    gospel_run: ['أيام قراءة ورا بعض', (s) => s.gospelRun],
    readings: ['عدد القراءات اللي كتبها', (s) => s.readings],
    mass: ['عدد القداسات', (s) => s.mass],
    conf: ['عدد شهور الاعتراف', (s) => s.conf],
    att: ['عدد مرات حضور الاجتماع', (s) => s.att],
    stars: ['مجموع النجوم', (s) => s.stars],
  };
  const RULES_LIST = Object.entries(RULES).map(([rule, [label]]) => ({ rule, label }));
  // الإشارات الأولية (بتتنقل لقاعدة البيانات مرة واحدة، وبعدها بتتعدّل من الموقع)
  const DEFAULT_BADGES = [
    ['first_prayer', '🙏', 'أول صلاة', 'سجّلت أول يوم صلاة', 'prayer_days', 1],
    ['prayer_7', '🔥', 'مصلّي مواظب', 'صلّيت 7 أيام ورا بعض', 'prayer_run', 7],
    ['prayer_30', '🌟', 'قلب بيصلّي', 'صلّيت 30 يوم', 'prayer_days', 30],
    ['first_reading', '📖', 'أول قراءة', 'قريت وكتبت أول مرة', 'readings', 1],
    ['reading_7', '📚', 'قارئ مواظب', 'قريت الإنجيل 7 أيام ورا بعض', 'gospel_run', 7],
    ['reading_30', '🏅', 'تلميذ الكلمة', 'قريت الإنجيل 30 يوم', 'gospel_days', 30],
    ['mass_4', '⛪', 'محب القداس', 'رحت 4 قداسات', 'mass', 4],
    ['confession_3', '🕊️', 'مواظب على الاعتراف', 'اعترفت 3 شهور', 'conf', 3],
    ['attend_4', '🎒', 'حاضر دايماً', 'حضرت 4 اجتماعات', 'att', 4],
    ['attend_10', '🏆', 'بطل الحضور', 'حضرت 10 اجتماعات', 'att', 10],
    ['stars_100', '⭐', '100 نجمة', 'جمعت 100 نجمة', 'stars', 100],
    ['stars_500', '👑', '500 نجمة', 'جمعت 500 نجمة', 'stars', 500],
  ];
  async function seedBadges() {
    const first = await one("INSERT INTO kv (k,v) VALUES ('badges_seeded','1') ON CONFLICT (k) DO NOTHING RETURNING k");
    if (!first) return;
    let i = 0;
    for (const [code, icon, title, desc, rule, need] of DEFAULT_BADGES)
      await run("INSERT INTO badge_defs (code,icon,title,description,kind,rule,need,active,sort,created_at) VALUES ($1,$2,$3,$4,'auto',$5,$6,1,$7,$8) ON CONFLICT (code) DO NOTHING", [code, icon, title, desc, rule, need, ++i, now()]);
  }
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
  // بيمنح أي إشارة تلقائية استحقها الولد ويرجّع الجديد بس. أي خطأ هنا مايوقفش العملية الأساسية.
  async function award(uid, st) {
    try {
      const defs = await all("SELECT code,icon,title,rule,need FROM badge_defs WHERE kind='auto' AND active=1 ORDER BY sort,id");
      if (!defs.length) return [];
      const s = st || await stats(uid);
      const have = new Set((await all('SELECT code FROM badges WHERE user_id=$1', [uid])).map((r) => r.code));
      const fresh = [];
      for (const b of defs) {
        const rule = RULES[b.rule];
        if (!rule || have.has(b.code) || rule[1](s) < Number(b.need)) continue;
        await run('INSERT INTO badges (user_id,code,earned_at) VALUES ($1,$2,$3) ON CONFLICT (user_id,code) DO NOTHING', [uid, b.code, now()]);
        fresh.push({ code: b.code, title: b.title, icon: b.icon });
      }
      return fresh;
    } catch (e) { console.error('award', e); return []; }
  }
  async function badgeList(uid) {
    const s = await stats(uid);
    const fresh = await award(uid, s);
    const defs = await all('SELECT code,icon,title,description,kind,rule,need,active FROM badge_defs ORDER BY sort,id');
    const got = new Map((await all('SELECT code,earned_at FROM badges WHERE user_id=$1', [uid])).map((r) => [r.code, r.earned_at]));
    return {
      fresh,
      // الإشارة الموقوفة بتظهر بس للأولاد اللي خدوها قبل كده
      list: defs.filter((d) => Number(d.active) || got.has(d.code)).map((d) => {
        const rule = d.kind === 'auto' ? RULES[d.rule] : null, need = Number(d.need);
        return { code: d.code, icon: d.icon, title: d.title, desc: d.description, kind: d.kind, need, have: rule ? Math.min(rule[1](s), need) : 0, earned: got.has(d.code), earned_at: got.get(d.code) || '' };
      }),
    };
  }
  route('GET', '/api/badges', async (ctx) => {
    need(ctx.user, ['kid']);
    const r = await badgeList(Number(ctx.user.id));
    return { badges: r.list, new_badges: r.fresh };
  });

  // ----- إدارة الإشارات من الموقع (المسؤول والخدام) -----
  const BADGE_ADMIN = ['admin', 'servant'];
  const defRow = (r) => ({ id: Number(r.id), code: r.code, icon: r.icon, title: r.title, description: r.description, kind: r.kind, rule: r.rule, need: Number(r.need), active: !!Number(r.active), earned_count: Number(r.earned_count || 0) });
  function badgeFields(b, base) {
    const icon = clean(b.icon === undefined ? base.icon : b.icon, 8);
    const title = clean(b.title === undefined ? base.title : b.title, 40);
    const description = clean(b.description === undefined ? base.description : b.description, 100);
    if (!icon) throw bad('اختار أيقونة (إيموجي)');
    if (title.length < 2) throw bad('اكتب اسم الإشارة');
    return { icon, title, description };
  }
  function ruleFields(b, base) {
    const rule = b.rule === undefined ? base.rule : String(b.rule);
    const need = Number(b.need === undefined ? base.need : b.need);
    if (!RULES[rule]) throw bad('اختار الشرط');
    if (!Number.isInteger(need) || need < 1 || need > 10000) throw bad('الرقم لازم يكون من 1 إلى 10000');
    return { rule, need };
  }
  route('GET', '/api/admin/badges', async (ctx) => {
    need(ctx.user, STAFF);
    const rows = await all('SELECT d.*, (SELECT COUNT(*) FROM badges b WHERE b.code=d.code) AS earned_count FROM badge_defs d ORDER BY d.sort, d.id');
    return { badges: rows.map(defRow), rules: RULES_LIST };
  });
  route('POST', '/api/admin/badges', async (ctx) => {
    need(ctx.user, BADGE_ADMIN);
    const b = ctx.body;
    const kind = b.kind === 'manual' ? 'manual' : 'auto';
    const f = badgeFields(b, { icon: '', title: '', description: '' });
    const r = kind === 'auto' ? ruleFields(b, { rule: '', need: 1 }) : { rule: '', need: 1 };
    const next = Number((await one('SELECT COALESCE(MAX(sort),0)+1 n FROM badge_defs')).n);
    await run("INSERT INTO badge_defs (code,icon,title,description,kind,rule,need,active,sort,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8,$9)",
      ['x_' + crypto.randomBytes(5).toString('hex'), f.icon, f.title, f.description, kind, r.rule, r.need, next, now()]);
    await audit(ctx.user, 'إضافة إشارة', null, f.title, kind === 'auto' ? `${RULES[r.rule][0]}: ${r.need}` : 'يدوية');
    return { ok: true };
  });
  route('PATCH', '/api/admin/badges/:id', async (ctx) => {
    need(ctx.user, BADGE_ADMIN);
    const def = await one('SELECT * FROM badge_defs WHERE id=$1', [Number(ctx.params.id)]);
    if (!def) throw new HttpError(404, 'الإشارة مش موجودة');
    const b = ctx.body;
    const f = badgeFields(b, def);
    const r = def.kind === 'auto' ? ruleFields(b, def) : { rule: '', need: 1 };
    const active = b.active === undefined ? Number(def.active) : (b.active ? 1 : 0);
    await run('UPDATE badge_defs SET icon=$1,title=$2,description=$3,rule=$4,need=$5,active=$6 WHERE id=$7', [f.icon, f.title, f.description, r.rule, r.need, active, Number(def.id)]);
    await audit(ctx.user, 'تعديل إشارة', null, f.title, active ? '' : 'موقوفة');
    return { ok: true };
  });
  route('DELETE', '/api/admin/badges/:id', async (ctx) => {
    need(ctx.user, ['admin']);
    const def = await one('SELECT id,title FROM badge_defs WHERE id=$1', [Number(ctx.params.id)]);
    if (!def) throw new HttpError(404, 'الإشارة مش موجودة');
    await run('DELETE FROM badge_defs WHERE id=$1', [Number(def.id)]);
    await audit(ctx.user, 'حذف إشارة', null, def.title, '');
    return { ok: true };
  });
  // منح وسحب إشارة يدوية لولد
  route('POST', '/api/staff/badge-give', async (ctx) => {
    need(ctx.user, BADGE_ADMIN);
    const id = await asKidId(ctx.body.user_id);
    const def = await one("SELECT code,icon,title FROM badge_defs WHERE code=$1 AND kind='manual'", [String(ctx.body.code || '')]);
    if (!def) throw bad('الإشارة دي مش موجودة أو مش يدوية');
    const first = await one('INSERT INTO badges (user_id,code,earned_at) VALUES ($1,$2,$3) ON CONFLICT (user_id,code) DO NOTHING RETURNING code', [id, def.code, now()]);
    if (!first) throw bad('الولد معاه الإشارة دي بالفعل');
    const kid = await one('SELECT name FROM users WHERE id=$1', [id]);
    await audit(ctx.user, 'منح إشارة', id, kid.name, def.title);
    await addCheer(ctx.user.name, id, `خدت إشارة جديدة: ${def.icon} ${def.title}`);
    return { ok: true };
  });
  route('POST', '/api/staff/badge-revoke', async (ctx) => {
    need(ctx.user, BADGE_ADMIN);
    const id = await asKidId(ctx.body.user_id);
    const def = await one("SELECT code,title FROM badge_defs WHERE code=$1 AND kind='manual'", [String(ctx.body.code || '')]);
    if (!def) throw bad('الإشارة دي مش يدوية'); // التلقائية بترجع لوحدها طالما الشرط متحقق
    await run('DELETE FROM badges WHERE user_id=$1 AND code=$2', [id, def.code]);
    const kid = await one('SELECT name FROM users WHERE id=$1', [id]);
    await audit(ctx.user, 'سحب إشارة', id, kid.name, def.title);
    return { ok: true };
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
    const manual = await all("SELECT code,icon,title FROM badge_defs WHERE kind='manual' AND active=1 ORDER BY sort,id");
    return { badges: b.list.filter((x) => x.earned), manual, readings };
  });



  // ====================== الشخصية اللي بتكبر + الألقاب (للولد نفسه بس) ======================
  // اللقب مبني على المستوى الرقمي الموجود (كل level_step نجمة). مفيش أي مسار بيرجّع لقب ولد لولد تاني.
  const DEFAULT_STAGES = [{ name: 'مبتدئ', from: 1 }, { name: 'مجتهد', from: 3 }, { name: 'بطل', from: 6 }, { name: 'قدوة', from: 10 }];
  async function getStages() {
    try {
      const raw = await kvGet('stages');
      const a = raw ? JSON.parse(raw) : null;
      if (Array.isArray(a) && a.length === 4 && a.every((x) => x && typeof x.name === 'string' && Number.isInteger(x.from))) return a;
    } catch { /* الافتراضي */ }
    return DEFAULT_STAGES;
  }
  route('GET', '/api/my-character', async (ctx) => {
    need(ctx.user, ['kid']);
    const uid = Number(ctx.user.id);
    const [stars, step, stages] = [(await starsFor(uid)).total, await levelStep(), await getStages()];
    const level = Math.floor(Math.max(0, stars) / step) + 1;
    let idx = 0;
    stages.forEach((st, i) => { if (level >= st.from) idx = i; });
    const next = stages[idx + 1] || null;
    const base = (stages[idx].from - 1) * step;
    const top = next ? (next.from - 1) * step : base;
    const pct = next ? Math.max(4, Math.min(100, Math.round(((stars - base) / (top - base)) * 100))) : 100;
    // ترقية لقب: بنقارن بآخر لقب الولد شافه (أول مرة بنسجّل من غير احتفال)
    const seenRaw = await kvGet('stage_seen:' + uid);
    const promoted = seenRaw !== null && idx > Number(seenRaw);
    if (seenRaw === null || idx !== Number(seenRaw)) await kvSet('stage_seen:' + uid, idx);
    return {
      stage: idx, stage_name: stages[idx].name, level, stars, pct, promoted,
      next_name: next ? next.name : '', to_next: next ? Math.max(0, top - stars) : 0,
    };
  });
  route('GET', '/api/admin/stages', async (ctx) => {
    need(ctx.user, ['admin']);
    return { stages: await getStages() };
  });
  route('POST', '/api/admin/stages', async (ctx) => {
    need(ctx.user, ['admin']);
    const a = Array.isArray(ctx.body.stages) ? ctx.body.stages : [];
    if (a.length !== 4) throw bad('لازم 4 ألقاب');
    const out = a.map((x) => ({ name: clean(x && x.name, 20), from: Number(x && x.from) }));
    if (out.some((x) => !x.name)) throw bad('اكتب اسم كل لقب');
    if (out.some((x) => !Number.isInteger(x.from) || x.from < 1 || x.from > 99)) throw bad('رقم المستوى لازم يكون من 1 إلى 99');
    if (out[0].from !== 1) throw bad('أول لقب لازم يبدأ من المستوى 1');
    for (let i = 1; i < 4; i++) if (out[i].from <= out[i - 1].from) throw bad('كل لقب لازم يبدأ من مستوى أعلى من اللي قبله');
    await kvSet('stages', JSON.stringify(out));
    return { ok: true };
  });

  // ====================== عدّاد المواظبة ======================
  // اليوم بيتحسب لو الولد صلّى أو قرأ. السلسلة ما بتتقطعش إلا لما يعدّي يوم كامل من غير حاجة.
  async function streakOf(uid) {
    const today = todayStr();
    const rows = await all('SELECT day FROM daily WHERE user_id=$1 AND (prayed=1 OR gospel=1) AND day>=$2', [uid, addDays(today, -400)]);
    const set = new Set(rows.map((r) => r.day));
    let cur = 0, d = set.has(today) ? today : addDays(today, -1);
    while (set.has(d)) { cur++; d = addDays(d, -1); }
    return {
      current: cur, best: maxRun([...set]), today_done: set.has(today),
      last7: Array.from({ length: 7 }, (_, i) => { const day = addDays(today, i - 6); return { day, done: set.has(day) }; }),
    };
  }
  route('GET', '/api/streak', async (ctx) => {
    need(ctx.user, ['kid']);
    return streakOf(Number(ctx.user.id));
  });

  // ====================== تشجيع من الخادم ======================
  // رسالة للولد (تشجيع أو منح إشارة) + إشعار لو مفعّل التنبيهات
  async function addCheer(byName, id, text) {
    await run('INSERT INTO cheers (user_id,by_name,text,seen,created_at) VALUES ($1,$2,$3,0,$4)', [id, byName, text, now()]);
    await run('DELETE FROM cheers WHERE user_id=$1 AND id NOT IN (SELECT id FROM cheers WHERE user_id=$1 ORDER BY id DESC LIMIT 20)', [id]);
    try {
      const subs = await all('SELECT endpoint FROM push_subs WHERE user_id=$1', [id]);
      if (subs.length) { await kvSet('cheer_push:' + id, Date.now()); await push.sendTo(subs); }
    } catch (e) { console.error('cheer push', e); }
  }
  route('POST', '/api/staff/cheer', async (ctx) => {
    need(ctx.user, ['admin', 'servant']);
    const id = await asKidId(ctx.body.user_id);
    const text = clean(ctx.body.text, 140);
    if (text.length < 2) throw bad('اكتب رسالة التشجيع');
    await addCheer(ctx.user.name, id, text);
    const kid = await one('SELECT name FROM users WHERE id=$1', [id]);
    await audit(ctx.user, 'تشجيع', id, kid.name, text);
    return { ok: true };
  });
  route('GET', '/api/cheers', async (ctx) => {
    need(ctx.user, ['kid']);
    const rows = await all('SELECT id,by_name,text,seen,created_at FROM cheers WHERE user_id=$1 ORDER BY id DESC LIMIT 10', [Number(ctx.user.id)]);
    return { cheers: rows.map((r) => ({ id: Number(r.id), by_name: r.by_name, text: r.text, seen: !!Number(r.seen), created_at: r.created_at })) };
  });
  route('POST', '/api/cheers/seen', async (ctx) => {
    need(ctx.user, ['kid']);
    await run('UPDATE cheers SET seen=1 WHERE user_id=$1', [Number(ctx.user.id)]);
    return { ok: true };
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
    // لو الخادم لسه باعت له تشجيع (آخر 10 دقايق)، الإشعار يبقى رسالة الخادم
    const cp = await kvGet('cheer_push:' + uid);
    if (cp && Date.now() - Number(cp) < 10 * 60000) {
      const c = await one('SELECT by_name,text FROM cheers WHERE user_id=$1 AND seen=0 ORDER BY id DESC LIMIT 1', [uid]);
      if (c) return { title: 'رسالة من ' + c.by_name, body: c.text };
    }
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
