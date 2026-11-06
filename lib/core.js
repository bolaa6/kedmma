'use strict';
// منطق الموقع (المسارات + الصلاحيات). يشتغل على Vercel وعلى الجهاز بنفس الكود.
const crypto = require('node:crypto');
const { db } = require('./db');

const all = async (sql, p) => (await db.q(sql, p)).rows;
const one = async (sql, p) => (await db.q(sql, p)).rows[0];
const run = async (sql, p) => { await db.q(sql, p); };
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

// ---------- أدوات مساعدة ----------
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
function normPhone(v) {
  let s = String(v || '').replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d)).replace(/[\s\-()]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  return s;
}
const validPhone = (s) => /^\d{8,15}$/.test(s);
const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

function hashPass(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(pw, salt, 32);
  return salt.toString('hex') + ':' + h.toString('hex');
}
function checkPass(pw, stored) {
  const [s, h] = String(stored).split(':');
  if (!s || !h) return false;
  const calc = crypto.scryptSync(pw, Buffer.from(s, 'hex'), 32);
  const real = Buffer.from(h, 'hex');
  return real.length === calc.length && crypto.timingSafeEqual(real, calc);
}

const cairoFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' });
const todayStr = () => cairoFmt.format(new Date());
const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
const toDate = (s) => new Date(s + 'T00:00:00Z');
const fmtDate = (d) => d.toISOString().slice(0, 10);
function addDays(s, n) { const d = toDate(s); d.setUTCDate(d.getUTCDate() + n); return fmtDate(d); }
// الأسبوع يبدأ يوم السبت
function weekStart(s) { const d = toDate(s); const back = (d.getUTCDay() + 1) % 7; return addDays(s, -back); }
const monthOf = (s) => s.slice(0, 7);
// شهر الاعتراف الخاص بأسبوع: شهر آخر يوم في الأسبوع لكن لا يتخطى الشهر الحالي
const confMonth = (end) => monthOf(end < todayStr() ? end : todayStr());

// ---------- التهيئة وحساب المسؤول ----------
let initPromise = null;
function init() {
  if (!initPromise) {
    initPromise = (async () => {
      await db.init();
      const has = await one("SELECT id FROM users WHERE role='admin' LIMIT 1");
      if (has) return;
      const phone = normPhone(process.env.ADMIN_PHONE);
      const pw = process.env.ADMIN_PASSWORD;
      if (!validPhone(phone) || !pw || pw.length < 6) {
        console.log('لا يوجد حساب مسؤول. اضبط ADMIN_PHONE و ADMIN_PASSWORD (6 حروف على الأقل).');
        return;
      }
      await run("INSERT INTO users (phone,name,pass,role,created_at) VALUES ($1,$2,$3,'admin',$4)",
        [phone, clean(process.env.ADMIN_NAME, 60) || 'المسؤول', hashPass(pw), now()]);
      console.log('تم إنشاء حساب المسؤول');
    })().catch((e) => { initPromise = null; throw e; });
  }
  return initPromise;
}

// ---------- الجلسات ----------
const SESSION_DAYS = 30;
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await run('INSERT INTO sessions (token,user_id,expires) VALUES ($1,$2,$3)', [sha(token), userId, Date.now() + SESSION_DAYS * 864e5]);
  return token;
}
function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
async function currentUser(req) {
  const t = parseCookies(req).sid;
  if (!t) return null;
  const row = await one('SELECT u.id,u.phone,u.name,u.role,s.expires FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=$1', [sha(t)]);
  if (!row) return null;
  if (Number(row.expires) < Date.now()) { await run('DELETE FROM sessions WHERE token=$1', [sha(t)]); return null; }
  return row;
}
function setCookie(res, req, token, maxAgeSec) {
  const secure = req.headers['x-forwarded-proto'] === 'https' || (req.socket && req.socket.encrypted) ? '; Secure' : '';
  res.setHeader('Set-Cookie', `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`);
}

// منع التخمين: 8 محاولات كل 10 دقائق لكل رقم وجهاز (محفوظة في القاعدة)
async function tooMany(key) {
  const r = await one('SELECT CAST(COUNT(*) AS INTEGER) n FROM attempts WHERE key=$1 AND ts>$2', [key, Date.now() - 600000]);
  return Number(r.n) >= 8;
}
async function noteAttempt(key) {
  await run('INSERT INTO attempts (key,ts) VALUES ($1,$2)', [key, Date.now()]);
  await run('DELETE FROM attempts WHERE ts<$1', [Date.now() - 600000]);
}

// ---------- النجوم ----------
const emptyStars = { prayer: 0, gospel: 0, mass: 0, confession: 0, attendance: 0, adjust: 0, total: 0 };
async function allStars() {
  const map = new Map();
  const add = async (sql, key) => {
    for (const r of await all(sql)) {
      const o = map.get(Number(r.user_id)) || { prayer: 0, gospel: 0, mass: 0, confession: 0, attendance: 0, adjust: 0 };
      o[key] = Number(r.n); map.set(Number(r.user_id), o);
    }
  };
  await add('SELECT user_id, CAST(SUM(prayed) AS INTEGER) n FROM daily GROUP BY user_id', 'prayer');
  await add('SELECT user_id, CAST(SUM(gospel) AS INTEGER) n FROM daily GROUP BY user_id', 'gospel');
  await add('SELECT user_id, CAST(SUM(attended) AS INTEGER) n FROM mass GROUP BY user_id', 'mass');
  await add('SELECT user_id, CAST(SUM(done) AS INTEGER) n FROM confession GROUP BY user_id', 'confession');
  await add('SELECT user_id, CAST(COUNT(*) AS INTEGER) n FROM attendance GROUP BY user_id', 'attendance');
  await add('SELECT user_id, CAST(SUM(delta) AS INTEGER) n FROM notes GROUP BY user_id', 'adjust');
  for (const o of map.values()) o.total = o.prayer + o.gospel + o.mass + o.confession + o.attendance + o.adjust;
  return map;
}
async function starsFor(userId) { return (await allStars()).get(Number(userId)) || { ...emptyStars }; }

// ---------- بيانات الولد ----------
async function profileOf(userId) {
  const u = await one('SELECT id,phone,name,created_at FROM users WHERE id=$1', [userId]);
  const p = (await one('SELECT * FROM profiles WHERE user_id=$1', [userId])) || {};
  let siblings = [];
  try { siblings = JSON.parse(p.siblings || '[]'); } catch { /* تجاهل */ }
  const ph = await one('SELECT updated_at FROM photos WHERE user_id=$1', [userId]);
  return {
    id: Number(u.id), name: u.name, phone: u.phone, joined: u.created_at, photo: ph ? ph.updated_at : '',
    mother_phone: p.mother_phone || '', father_phone: p.father_phone || '', address: p.address || '',
    confessor: p.confessor || '', school: p.school || '', siblings,
    complete: !!(p.mother_phone && p.father_phone && p.address && p.confessor && p.school),
  };
}
async function weekData(userId, start) {
  const end = addDays(start, 6);
  const days = {};
  for (const r of await all('SELECT day,prayed,gospel FROM daily WHERE user_id=$1 AND day BETWEEN $2 AND $3', [userId, start, end]))
    days[r.day] = { prayed: !!Number(r.prayed), gospel: !!Number(r.gospel) };
  const m = await one('SELECT attended FROM mass WHERE user_id=$1 AND week_start=$2', [userId, start]);
  const conf = await one('SELECT done FROM confession WHERE user_id=$1 AND month=$2', [userId, confMonth(end)]);
  const att = (await all('SELECT day FROM attendance WHERE user_id=$1 AND day BETWEEN $2 AND $3', [userId, start, end])).map((r) => r.day);
  return { start, end, days, mass: !!(m && Number(m.attended)), confession: !!(conf && Number(conf.done)), confession_month: confMonth(end), attendance: att };
}

// ---------- أدوات HTTP ----------
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (msg) => new HttpError(400, msg);

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return {};
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new HttpError(415, 'نوع الطلب غير مدعوم');
  if (req.body !== undefined && req.body !== null) { // Vercel بيقرأ الجسم لوحده
    if (typeof req.body === 'string') { try { return req.body ? JSON.parse(req.body) : {}; } catch { throw bad('بيانات غير صحيحة'); } }
    return req.body;
  }
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > 400000) { reject(new HttpError(413, 'الطلب كبير')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(bad('بيانات غير صحيحة')); } });
    req.on('error', reject);
  });
}
function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
const STAFF = ['admin', 'servant', 'viewer'];
const MARKERS = ['admin', 'servant'];
function need(user, roles) {
  if (!user) throw new HttpError(401, 'سجّل الدخول الأول');
  if (roles && !roles.includes(user.role)) throw new HttpError(403, 'مش مسموح لك بالعملية دي');
}
async function asKidId(v) {
  const id = Number(v);
  const k = Number.isInteger(id) ? await one("SELECT id FROM users WHERE id=$1 AND role='kid'", [id]) : null;
  if (!k) throw new HttpError(404, 'الولد غير موجود');
  return id;
}

// ---------- المسارات ----------
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler });

route('POST', '/api/register', async (ctx) => {
  const b = ctx.body;
  const name = clean(b.name, 60), phone = normPhone(b.phone), pw = String(b.password || '');
  if (name.length < 3) throw bad('اكتب اسمك بالكامل');
  if (!validPhone(phone)) throw bad('رقم الموبايل غير صحيح');
  if (pw.length < 6) throw bad('كلمة السر لازم تكون 6 حروف أو أرقام على الأقل');
  if (await one('SELECT id FROM users WHERE phone=$1', [phone])) throw bad('الرقم ده مسجل قبل كده. جرّب تسجيل الدخول');
  const r = await one("INSERT INTO users (phone,name,pass,role,created_at) VALUES ($1,$2,$3,'kid',$4) RETURNING id", [phone, name, hashPass(pw), now()]);
  await run('INSERT INTO profiles (user_id,updated_at) VALUES ($1,$2)', [r.id, now()]);
  return { token: await createSession(Number(r.id)), ok: true };
});

route('POST', '/api/login', async (ctx) => {
  const phone = normPhone(ctx.body.phone), pw = String(ctx.body.password || '');
  const key = ctx.ip + '|' + phone;
  if (await tooMany(key)) throw new HttpError(429, 'محاولات كتير. استنى شوية وجرّب تاني');
  const u = await one('SELECT * FROM users WHERE phone=$1', [phone]);
  if (!u || !checkPass(pw, u.pass)) { await noteAttempt(key); throw new HttpError(401, 'الرقم أو كلمة السر غلط'); }
  return { token: await createSession(Number(u.id)), ok: true };
});

route('POST', '/api/logout', async (ctx) => {
  const t = parseCookies(ctx.req).sid;
  if (t) await run('DELETE FROM sessions WHERE token=$1', [sha(t)]);
  return { ok: true, clear: true };
});

route('GET', '/api/me', async (ctx) => {
  const u = ctx.user;
  if (!u) return { user: null };
  const uid = Number(u.id);
  const out = { user: { id: uid, name: u.name, phone: u.phone, role: u.role }, today: todayStr() };
  if (u.role === 'kid') { out.profile = await profileOf(uid); out.stars = await starsFor(uid); }
  return out;
});

route('POST', '/api/password', async (ctx) => {
  need(ctx.user);
  const old = String(ctx.body.old || ''), nw = String(ctx.body.password || '');
  const row = await one('SELECT pass FROM users WHERE id=$1', [ctx.user.id]);
  if (!checkPass(old, row.pass)) throw bad('كلمة السر الحالية غلط');
  if (nw.length < 6) throw bad('كلمة السر الجديدة لازم تكون 6 على الأقل');
  await run('UPDATE users SET pass=$1 WHERE id=$2', [hashPass(nw), ctx.user.id]);
  return { ok: true };
});

// ----- الولد: البيانات الشخصية (تعديل فقط، بدون حذف) -----
route('PUT', '/api/profile', async (ctx) => {
  need(ctx.user, ['kid']);
  const b = ctx.body, id = Number(ctx.user.id);
  const name = clean(b.name, 60);
  if (name.length < 3) throw bad('اكتب اسمك بالكامل');
  const mother = normPhone(b.mother_phone), father = normPhone(b.father_phone);
  if (!validPhone(mother)) throw bad('رقم موبايل ماما غير صحيح');
  if (!validPhone(father)) throw bad('رقم موبايل بابا غير صحيح');
  const address = clean(b.address, 300), confessor = clean(b.confessor, 80), school = clean(b.school, 80);
  if (address.length < 8) throw bad('اكتب العنوان بالتفصيل');
  if (!confessor) throw bad('اكتب اسم أب الاعتراف');
  if (!school) throw bad('اكتب اسم المدرسة');
  const list = Array.isArray(b.siblings) ? b.siblings : [];
  if (list.length > 15) throw bad('عدد الإخوات كبير');
  const siblings = list.map((s) => ({ name: clean(s && s.name, 60), age: clean(s && s.age, 3), grade: clean(s && s.grade, 40) }));
  for (const s of siblings) if (!s.name) throw bad('اكتب اسم كل أخ أو أخت');
  const cur = await profileOf(id);
  if (siblings.length < cur.siblings.length) throw bad('مينفعش تحذف أخ أو أخت. عدّل البيانات بس');
  await run('UPDATE users SET name=$1 WHERE id=$2', [name, id]);
  await run('UPDATE profiles SET mother_phone=$1,father_phone=$2,address=$3,confessor=$4,school=$5,siblings=$6,updated_at=$7 WHERE user_id=$8',
    [mother, father, address, confessor, school, JSON.stringify(siblings), now(), id]);
  return { profile: await profileOf(id) };
});

// ----- الولد: المتابعة الأسبوعية -----
const kidDayLimit = () => addDays(todayStr(), -14);
route('GET', '/api/week', async (ctx) => {
  need(ctx.user, ['kid']);
  const q = ctx.query.get('start');
  const start = weekStart(isDay(q) ? q : todayStr());
  if (start > todayStr()) throw bad('الأسبوع ده لسه مجاش');
  const uid = Number(ctx.user.id);
  return { week: await weekData(uid, start), today: todayStr(), stars: await starsFor(uid), min_day: kidDayLimit() };
});
route('PUT', '/api/day', async (ctx) => {
  need(ctx.user, ['kid']);
  const uid = Number(ctx.user.id);
  const { day } = ctx.body;
  if (!isDay(day)) throw bad('تاريخ غير صحيح');
  if (day > todayStr()) throw bad('مينفعش تسجل يوم لسه مجاش');
  if (day < kidDayLimit()) throw bad('الفترة انتهت. أقدم يوم تقدر تسجله هو ' + kidDayLimit());
  const cur = (await one('SELECT prayed,gospel FROM daily WHERE user_id=$1 AND day=$2', [uid, day])) || { prayed: 0, gospel: 0 };
  const prayed = ctx.body.prayed === undefined ? Number(cur.prayed) : (ctx.body.prayed ? 1 : 0);
  const gospel = ctx.body.gospel === undefined ? Number(cur.gospel) : (ctx.body.gospel ? 1 : 0);
  await run(`INSERT INTO daily (user_id,day,prayed,gospel) VALUES ($1,$2,$3,$4)
             ON CONFLICT (user_id,day) DO UPDATE SET prayed=excluded.prayed, gospel=excluded.gospel`, [uid, day, prayed, gospel]);
  return { ok: true, stars: await starsFor(uid) };
});
route('PUT', '/api/mass', async (ctx) => {
  need(ctx.user, ['kid']);
  const uid = Number(ctx.user.id);
  const ws = ctx.body.week_start;
  if (!isDay(ws) || weekStart(ws) !== ws) throw bad('أسبوع غير صحيح');
  if (ws > todayStr()) throw bad('الأسبوع ده لسه مجاش');
  if (addDays(ws, 6) < kidDayLimit()) throw bad('الفترة انتهت');
  await run(`INSERT INTO mass (user_id,week_start,attended) VALUES ($1,$2,$3)
             ON CONFLICT (user_id,week_start) DO UPDATE SET attended=excluded.attended`, [uid, ws, ctx.body.attended ? 1 : 0]);
  return { ok: true, stars: await starsFor(uid) };
});
route('PUT', '/api/confession', async (ctx) => {
  need(ctx.user, ['kid']);
  const uid = Number(ctx.user.id);
  const m = String(ctx.body.month || '');
  const thisMonth = monthOf(todayStr()), prev = monthOf(addDays(thisMonth + '-01', -1));
  if (m !== thisMonth && m !== prev) throw bad('تقدر تسجل الاعتراف للشهر ده أو الشهر اللي فات بس');
  await run(`INSERT INTO confession (user_id,month,done) VALUES ($1,$2,$3)
             ON CONFLICT (user_id,month) DO UPDATE SET done=excluded.done`, [uid, m, ctx.body.confession ? 1 : 0]);
  return { ok: true, stars: await starsFor(uid) };
});
route('GET', '/api/my-stars', async (ctx) => {
  need(ctx.user, ['kid']);
  const uid = Number(ctx.user.id);
  const notes = await all('SELECT text,delta,created_at FROM notes WHERE user_id=$1 AND delta<>0 ORDER BY id DESC LIMIT 30', [uid]);
  return { stars: await starsFor(uid), notes: notes.map((n) => ({ ...n, delta: Number(n.delta) })) };
});

// ----- الخدام والمتابعين -----
route('GET', '/api/staff/overview', async (ctx) => {
  need(ctx.user, STAFF);
  const q = ctx.query.get('start');
  const start = weekStart(isDay(q) ? q : todayStr());
  const end = addDays(start, 6);
  const kids = await all(`SELECT u.id,u.name,u.phone,p.school,p.mother_phone,p.father_phone,p.confessor,p.address,ph.updated_at AS photo
                          FROM users u LEFT JOIN profiles p ON p.user_id=u.id LEFT JOIN photos ph ON ph.user_id=u.id WHERE u.role='kid' ORDER BY u.name`);
  const stars = await allStars();
  const daily = await all('SELECT user_id,day,prayed,gospel FROM daily WHERE day BETWEEN $1 AND $2', [start, end]);
  const massRows = await all('SELECT user_id FROM mass WHERE week_start=$1 AND attended=1', [start]);
  const confRows = await all('SELECT user_id FROM confession WHERE month=$1 AND done=1', [confMonth(end)]);
  const attRows = await all('SELECT user_id,day FROM attendance WHERE day BETWEEN $1 AND $2', [start, end]);
  const byKid = new Map(kids.map((k) => [Number(k.id), { id: Number(k.id), name: k.name, phone: k.phone, school: k.school || '', photo: k.photo || '', days: {}, mass: false, confession: false, attendance: [], stars: stars.get(Number(k.id)) || { ...emptyStars }, complete: !!(k.mother_phone && k.father_phone && k.address && k.confessor && k.school) }]));
  for (const r of daily) { const k = byKid.get(Number(r.user_id)); if (k) k.days[r.day] = { prayed: !!Number(r.prayed), gospel: !!Number(r.gospel) }; }
  for (const r of massRows) { const k = byKid.get(Number(r.user_id)); if (k) k.mass = true; }
  for (const r of confRows) { const k = byKid.get(Number(r.user_id)); if (k) k.confession = true; }
  for (const r of attRows) { const k = byKid.get(Number(r.user_id)); if (k) k.attendance.push(r.day); }
  return { start, end, today: todayStr(), kids: [...byKid.values()], confession_month: confMonth(end) };
});

route('GET', '/api/staff/kid/:id', async (ctx) => {
  need(ctx.user, STAFF);
  const id = await asKidId(ctx.params.id);
  const from = addDays(todayStr(), -27);
  const days = await all('SELECT day,prayed,gospel FROM daily WHERE user_id=$1 AND day>=$2 ORDER BY day DESC', [id, from]);
  const masses = (await all('SELECT week_start FROM mass WHERE user_id=$1 AND attended=1 ORDER BY week_start DESC LIMIT 12', [id])).map((r) => r.week_start);
  const conf = (await all('SELECT month FROM confession WHERE user_id=$1 AND done=1 ORDER BY month DESC LIMIT 12', [id])).map((r) => r.month);
  const att = (await all('SELECT day FROM attendance WHERE user_id=$1 ORDER BY day DESC LIMIT 20', [id])).map((r) => r.day);
  const notes = await all('SELECT n.id,n.text,n.delta,n.created_at,u.name by_name FROM notes n LEFT JOIN users u ON u.id=n.by_user WHERE n.user_id=$1 ORDER BY n.id DESC LIMIT 50', [id]);
  return {
    profile: await profileOf(id), stars: await starsFor(id),
    days: days.map((d) => ({ day: d.day, prayed: !!Number(d.prayed), gospel: !!Number(d.gospel) })),
    masses, confessions: conf, attendance: att,
    notes: notes.map((n) => ({ ...n, id: Number(n.id), delta: Number(n.delta) })),
  };
});

route('GET', '/api/staff/attendance', async (ctx) => {
  need(ctx.user, STAFF);
  const day = ctx.query.get('day');
  if (!isDay(day)) throw bad('تاريخ غير صحيح');
  return { day, present: (await all('SELECT user_id FROM attendance WHERE day=$1', [day])).map((r) => Number(r.user_id)) };
});
route('POST', '/api/staff/attendance', async (ctx) => {
  need(ctx.user, MARKERS);
  const { day, present } = ctx.body;
  if (!isDay(day)) throw bad('تاريخ غير صحيح');
  if (day > todayStr()) throw bad('مينفعش تسجل حضور ليوم لسه مجاش');
  if (!Array.isArray(present)) throw bad('قائمة غير صحيحة');
  const ids = [...new Set(present.map(Number))].filter((n) => Number.isInteger(n));
  const kidIds = new Set((await all("SELECT id FROM users WHERE role='kid'")).map((r) => Number(r.id)));
  const valid = ids.filter((i) => kidIds.has(i));
  await db.tx(async (q) => {
    await q('DELETE FROM attendance WHERE day=$1', [day]);
    for (const id of valid) await q('INSERT INTO attendance (user_id,day,by_user) VALUES ($1,$2,$3)', [id, day, ctx.user.id]);
  });
  return { ok: true, count: valid.length };
});
route('POST', '/api/staff/note', async (ctx) => {
  need(ctx.user, MARKERS);
  const id = await asKidId(ctx.body.user_id);
  const text = clean(ctx.body.text, 300);
  const delta = Number(ctx.body.delta || 0);
  if (!text) throw bad('اكتب الملاحظة');
  if (!Number.isInteger(delta) || delta < -20 || delta > 20) throw bad('عدد النجوم لازم يكون من -20 إلى 20');
  await run('INSERT INTO notes (user_id,text,delta,by_user,created_at) VALUES ($1,$2,$3,$4,$5)', [id, text, delta, ctx.user.id, now()]);
  return { ok: true, stars: await starsFor(id) };
});


// ----- صورة البروفايل -----
route('PUT', '/api/photo', async (ctx) => {
  need(ctx.user, ['kid']);
  const d = String(ctx.body.data || '');
  if (d.length > 200000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(d)) throw bad('الصورة غير صالحة');
  const buf = Buffer.from(d.split(',')[1], 'base64');
  if (buf.length < 100 || buf[0] !== 0xff || buf[1] !== 0xd8) throw bad('الصورة غير صالحة');
  const uid = Number(ctx.user.id), t = now();
  await run(`INSERT INTO photos (user_id,data,updated_at) VALUES ($1,$2,$3)
             ON CONFLICT (user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`, [uid, d, t]);
  return { ok: true, photo: t };
});
route('GET', '/api/photo/:id', async (ctx) => {
  need(ctx.user);
  const id = Number(ctx.params.id);
  if (Number(ctx.user.id) !== id && !STAFF.includes(ctx.user.role)) throw new HttpError(403, 'مش مسموح لك بالعملية دي');
  const row = await one('SELECT data FROM photos WHERE user_id=$1', [id]);
  if (!row) throw new HttpError(404, 'مفيش صورة');
  return { image: Buffer.from(row.data.split(',')[1], 'base64') };
});

// ----- المسؤول: حذف حساب -----
route('DELETE', '/api/admin/user/:id', async (ctx) => {
  need(ctx.user, ['admin']);
  const id = Number(ctx.params.id);
  const u = await one('SELECT id,role FROM users WHERE id=$1', [id]);
  if (!u) throw new HttpError(404, 'الحساب غير موجود');
  if (u.role === 'admin') throw bad('مينفعش تحذف حساب المسؤول');
  await db.tx(async (q) => {
    await q('UPDATE notes SET by_user=NULL WHERE by_user=$1', [id]);
    await q('UPDATE attendance SET by_user=NULL WHERE by_user=$1', [id]);
    for (const t of ['notes', 'attendance', 'daily', 'mass', 'confession', 'photos', 'profiles', 'sessions']) await q(`DELETE FROM ${t} WHERE user_id=$1`, [id]);
    await q('DELETE FROM users WHERE id=$1', [id]);
  });
  return { ok: true };
});

// ----- المسؤول -----
route('GET', '/api/admin/staff', async (ctx) => {
  need(ctx.user, ['admin']);
  return { staff: (await all("SELECT id,name,phone,role FROM users WHERE role IN ('admin','servant','viewer') ORDER BY role,name")).map((u) => ({ ...u, id: Number(u.id) })) };
});
route('POST', '/api/admin/staff', async (ctx) => {
  need(ctx.user, ['admin']);
  const name = clean(ctx.body.name, 60), phone = normPhone(ctx.body.phone), pw = String(ctx.body.password || '');
  const role = ctx.body.role;
  if (name.length < 3) throw bad('اكتب الاسم');
  if (!validPhone(phone)) throw bad('رقم الموبايل غير صحيح');
  if (pw.length < 6) throw bad('كلمة السر 6 على الأقل');
  if (!['servant', 'viewer'].includes(role)) throw bad('الصلاحية غير صحيحة');
  if (await one('SELECT id FROM users WHERE phone=$1', [phone])) throw bad('الرقم ده مسجل قبل كده');
  await run('INSERT INTO users (phone,name,pass,role,created_at) VALUES ($1,$2,$3,$4,$5)', [phone, name, hashPass(pw), role, now()]);
  return { ok: true };
});
route('PATCH', '/api/admin/staff/:id', async (ctx) => {
  need(ctx.user, ['admin']);
  const u = await one("SELECT id,role FROM users WHERE id=$1 AND role IN ('servant','viewer')", [Number(ctx.params.id)]);
  if (!u) throw new HttpError(404, 'غير موجود');
  if (ctx.body.role !== undefined) {
    if (!['servant', 'viewer'].includes(ctx.body.role)) throw bad('الصلاحية غير صحيحة');
    await run('UPDATE users SET role=$1 WHERE id=$2', [ctx.body.role, u.id]);
  }
  return { ok: true };
});
route('POST', '/api/admin/reset-password', async (ctx) => {
  need(ctx.user, ['admin']);
  const id = Number(ctx.body.user_id), pw = String(ctx.body.password || '');
  if (pw.length < 6) throw bad('كلمة السر 6 على الأقل');
  const u = await one("SELECT id FROM users WHERE id=$1 AND role<>'admin'", [id]);
  if (!u) throw new HttpError(404, 'غير موجود');
  await run('UPDATE users SET pass=$1 WHERE id=$2', [hashPass(pw), id]);
  await run('DELETE FROM sessions WHERE user_id=$1', [id]);
  return { ok: true };
});
route('DELETE', '/api/admin/note/:id', async (ctx) => {
  need(ctx.user, ['admin']);
  await run('DELETE FROM notes WHERE id=$1', [Number(ctx.params.id)]);
  return { ok: true };
});
route('GET', '/api/admin/export.csv', async (ctx) => {
  need(ctx.user, ['admin']);
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const kids = await all("SELECT id FROM users WHERE role='kid' ORDER BY name");
  const stars = await allStars();
  const head = ['الاسم', 'موبايل الولد', 'موبايل ماما', 'موبايل بابا', 'العنوان', 'أب الاعتراف', 'المدرسة', 'الإخوات', 'إجمالي النجوم'];
  const rows = [];
  for (const k of kids) {
    const p = await profileOf(Number(k.id));
    const sib = p.siblings.map((s) => `${s.name} (${s.age || '-'} سنة، ${s.grade || '-'})`).join(' | ');
    rows.push([p.name, p.phone, p.mother_phone, p.father_phone, p.address, p.confessor, p.school, sib, (stars.get(Number(k.id)) || emptyStars).total].map(esc).join(','));
  }
  return { raw: '﻿' + [head.map(esc).join(','), ...rows].join('\r\n'), type: 'text/csv; charset=utf-8', filename: 'kids.csv' };
});

// ---------- المعالج الرئيسي ----------
async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  try {
    await init();
    const r = routes.find((x) => x.method === req.method && x.re.test(url.pathname));
    if (!r) throw new HttpError(404, 'غير موجود');
    const body = await readBody(req);
    const ctx = {
      req, body, query: url.searchParams, user: await currentUser(req),
      params: url.pathname.match(r.re).groups || {},
      ip: String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '').split(',')[0].trim(),
    };
    const out = await r.handler(ctx);
    if (out && out.image) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400' });
      return res.end(out.image);
    }
    if (out && out.raw !== undefined) {
      res.writeHead(200, { 'Content-Type': out.type, 'Content-Disposition': `attachment; filename="${out.filename}"`, 'Cache-Control': 'no-store' });
      return res.end(out.raw);
    }
    if (out && out.token) { setCookie(res, req, out.token, SESSION_DAYS * 86400); delete out.token; }
    if (out && out.clear) { setCookie(res, req, '', 0); delete out.clear; }
    send(res, 200, out);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e);
    send(res, 500, { error: 'حصلت مشكلة في السيرفر' });
  }
}

module.exports = { handle };
