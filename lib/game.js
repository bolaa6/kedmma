'use strict';
// لعبة السلم والتعبان: كل الحركات بتتحسب في السيرفر (الولد مايقدرش يغش)،
// والموبايلات بتسأل السيرفر كل ثانية ونص عن الحالة (بدون WebSocket عشان Vercel).
const crypto = require('node:crypto');

const LADDERS = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 };
const SNAKES = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79 };
const QSQ = [6, 13, 25, 33, 45, 56, 68, 77, 89]; // خانات الأسئلة
const MAX_PLAYERS = 6;
const TURN_MS = 60000;
const INVITE_MS = 90000;
const ROOM_MS = 15 * 60000;
const BOT_NAME = 'الكمبيوتر';

// أسئلة إنجيل أساسية (المسؤول يقدر يعدّل عليها أو يضيف أو يمسح)
const SEED = [
  ['أين وُلد السيد المسيح؟', ['بيت لحم', 'الناصرة', 'أورشليم', 'القاهرة'], 0],
  ['كم عدد التلاميذ الاثني عشر؟', ['7', '12', '10', '3'], 1],
  ['من الذي عمّد السيد المسيح في نهر الأردن؟', ['يوحنا المعمدان', 'بطرس', 'يعقوب', 'بولس'], 0],
  ['ما هي أول معجزة صنعها السيد المسيح؟', ['تحويل الماء إلى خمر في عرس قانا الجليل', 'إقامة لعازر', 'إشباع الجموع', 'شفاء الأعمى'], 0],
  ['بماذا أشبع السيد المسيح الخمسة آلاف رجل؟', ['5 أرغفة وسمكتين', '7 أرغفة', '12 رغيفا', 'سلة تين'], 0],
  ['من هو العشار الذي صعد على شجرة جميز ليرى يسوع؟', ['زكا', 'بطرس', 'يوحنا', 'توما'], 0],
  ['من الذي أقامه السيد المسيح بعد أربعة أيام من موته؟', ['لعازر', 'زكا', 'بارتيماوس', 'نيقوديموس'], 0],
  ['بماذا تبدأ الصلاة الربانية؟', ['أبانا الذي في السماوات', 'السلام لك يا مريم', 'المجد لله في الأعالي', 'الله محبة'], 0],
  ['من التلميذ الذي أنكر المسيح ثلاث مرات؟', ['بطرس', 'يهوذا', 'توما', 'يوحنا'], 0],
  ['من الذي سلّم السيد المسيح؟', ['يهوذا الإسخريوطي', 'بطرس', 'متى', 'أندراوس'], 0],
  ['في أي يوم قام السيد المسيح من الأموات؟', ['اليوم الثالث', 'اليوم الأول', 'اليوم السابع', 'اليوم العاشر'], 0],
  ['من هي أم السيد المسيح؟', ['العذراء مريم', 'مرثا', 'أليصابات', 'حنة'], 0],
  ['من الملاك الذي بشّر العذراء مريم بميلاد المسيح؟', ['جبرائيل', 'ميخائيل', 'روفائيل', 'سوريال'], 0],
  ['ما اسم خطيب العذراء مريم؟', ['يوسف النجار', 'زكريا', 'سمعان', 'نيقوديموس'], 0],
  ['ما الهدايا التي قدمها المجوس للمسيح؟', ['ذهب ولبان ومرّ', 'خبز وسمك', 'فضة ونحاس', 'قمح وزيت'], 0],
  ['كم يوما صام السيد المسيح في البرية؟', ['40 يوما', '7 أيام', '3 أيام', '12 يوما'], 0],
  ['من التلميذ الذي كان عشّارا قبل أن يتبع المسيح؟', ['متى', 'بطرس', 'يعقوب', 'فيلبس'], 0],
  ['من الأعمى الذي صرخ: ارحمني يا ابن داود؟', ['بارتيماوس', 'زكا', 'لعازر', 'متى'], 0],
  ['أين صُلب السيد المسيح؟', ['الجلجثة', 'بيت عنيا', 'الناصرة', 'الجليل'], 0],
  ['من الذي ساعد السيد المسيح في حمل الصليب؟', ['سمعان القيرواني', 'بطرس', 'يوسف الرامي', 'نيقوديموس'], 0],
  ['من الذي طلب جسد يسوع ودفنه في قبر جديد؟', ['يوسف الرامي', 'بيلاطس', 'هيرودس', 'يهوذا'], 0],
  ['لمن ظهر السيد المسيح أولا بعد القيامة؟', ['مريم المجدلية', 'بطرس', 'توما', 'يوحنا'], 0],
  ['من التلميذ الذي شك في قيامة المسيح حتى رأى أثر المسامير؟', ['توما', 'بطرس', 'فيلبس', 'متى'], 0],
  ['ماذا حدث عندما قال السيد المسيح للريح والبحر: اسكت؟', ['صار هدوء عظيم', 'زادت العاصفة', 'غرقت السفينة', 'جاء المطر'], 0],
];

module.exports = function (d) {
  const { route, need, bad, HttpError, all, one, run, now, todayStr, db, clean, audit } = d;
  const rnd = (n) => crypto.randomInt(n);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const kvGet = async (k) => { const r = await one('SELECT v FROM kv WHERE k=$1', [k]); return r ? r.v : null; };
  const kvSet = (k, v) => run('INSERT INTO kv (k,v) VALUES ($1,$2) ON CONFLICT (k) DO UPDATE SET v=excluded.v', [k, String(v)]);
  const isOn = async () => (await kvGet('game_on')) === '1';
  const dailyCap = async () => { const n = Number(await kvGet('game_cap')); return Number.isInteger(n) && n >= 0 && n <= 50 ? n : 5; };

  async function seed() {
    const first = await one("INSERT INTO kv (k,v) VALUES ('game_seeded','1') ON CONFLICT (k) DO NOTHING RETURNING k");
    if (!first) return;
    for (const [text, options, correct] of SEED)
      await run('INSERT INTO game_questions (text,options,correct,created_at) VALUES ($1,$2,$3,$4)', [text, JSON.stringify(options), correct, now()]);
  }

  // ---------- حالة اللعبة ----------
  const logLine = (st, msg) => { st.log.push(msg); if (st.log.length > 14) st.log.shift(); };
  const inPlayers = (st) => st.players.filter((p) => p.status === 'in');
  const humansIn = (st) => st.players.filter((p) => p.status === 'in' && !p.bot);

  function startGame(g, t) {
    const st = g.st;
    st.players = inPlayers(st).map((p, i) => ({ ...p, pos: 0, color: i }));
    st.turn = 0; st.phase = 'roll'; st.act_at = t; g.status = 'playing';
    logLine(st, 'بدأت اللعبة. الدور على ' + st.players[0].name);
    if (st.players[0].bot) st.next_at = t + 1500;
  }
  function endTurn(g, t) {
    const st = g.st; const n = st.players.length;
    for (let i = 1; i <= n; i++) {
      const idx = (st.turn + i) % n;
      if (st.players[idx].status === 'in') { st.turn = idx; break; }
    }
    st.phase = 'roll'; st.act_at = t;
    if (st.players[st.turn].bot) st.next_at = t + 1400 + rnd(700);
  }
  function askQuestion(st) {
    if (!st.qs.length) return false;
    const q = st.qs[st.qi % st.qs.length]; st.qi++;
    st.q = { text: q.text, options: q.options }; st.qc = q.correct; st.phase = 'question';
    return true;
  }
  function doRoll(g, t) {
    const st = g.st, p = st.players[st.turn];
    const roll = 1 + rnd(6); st.dice = roll; st.act_at = t; p.misses = 0;
    let np = p.pos + roll;
    if (np > 100) { logLine(st, `${p.name} رمى ${roll} بس محتاج رقم أصغر عشان يوصل 100 بالظبط`); return endTurn(g, t); }
    let msg = `${p.name} رمى ${roll} ووصل ${np}`;
    if (LADDERS[np]) { msg += ` وطلع السلم لـ ${LADDERS[np]}`; np = LADDERS[np]; }
    else if (SNAKES[np]) { msg += ` والتعبان نزّله لـ ${SNAKES[np]}`; np = SNAKES[np]; }
    p.pos = np; logLine(st, msg);
    if (np === 100) { st.winner = p.id; st.phase = 'over'; g.status = 'finished'; logLine(st, `${p.name} وصل 100 وكسب اللعبة`); return; }
    if (!p.bot && QSQ.includes(np) && askQuestion(st)) { logLine(st, `${p.name} وقف على خانة سؤال`); return; }
    endTurn(g, t);
  }
  function doAnswer(g, choice, t, awardOk) {
    const st = g.st, p = st.players[st.turn];
    const ok = choice === st.qc;
    p.misses = 0;
    logLine(st, ok ? `${p.name} جاوب صح${awardOk ? ' وخد نجمة' : ' (وصلت للحد اليومي للنجوم)'}` : `${p.name} إجابته غلط`);
    st.q = null; st.qc = null;
    endTurn(g, t);
    return ok;
  }
  function checkEmpty(g) {
    const st = g.st;
    if (g.status !== 'playing') return;
    const humans = humansIn(st);
    if (!humans.length) { g.status = 'abandoned'; return; }
    if (inPlayers(st).length === 1) { st.winner = humans[0].id; st.phase = 'over'; g.status = 'finished'; logLine(st, `${humans[0].name} كسب لأن باقي اللاعبين خرجوا`); }
  }
  function settle(g, t) {
    const st = g.st;
    if (st.players.some((p) => p.status === 'invited')) return;
    if (inPlayers(st).length >= 2) startGame(g, t); else g.status = 'cancelled';
  }
  function tick(g, t) {
    const st = g.st;
    if (g.status === 'lobby') {
      if (st.mode === 'room') { if (t - st.created > ROOM_MS) g.status = 'cancelled'; return; }
      if (t - st.created > INVITE_MS) for (const p of st.players) if (p.status === 'invited') p.status = 'declined';
      settle(g, t);
    } else if (g.status === 'playing') {
      const p = st.players[st.turn];
      if (p.bot) { if (t >= st.next_at) doRoll(g, t); }
      else if (t - st.act_at > TURN_MS) {
        p.misses = (p.misses || 0) + 1;
        st.q = null; st.qc = null;
        logLine(st, `${p.name} اتأخر وفاته دوره`);
        if (p.misses >= 3) { p.status = 'left'; logLine(st, `${p.name} خرج من اللعبة`); }
        checkEmpty(g);
        if (g.status === 'playing') endTurn(g, t);
      }
    }
  }

  async function loadGame(id) {
    const r = await one('SELECT id,status,ver,state FROM games WHERE id=$1', [Number(id)]);
    if (!r) throw new HttpError(404, 'اللعبة مش موجودة');
    return { id: Number(r.id), ver: Number(r.ver), status: r.status, st: JSON.parse(r.state) };
  }
  // بيعدّل اللعبة بأمان حتى لو أكتر من لاعب بعتوا في نفس اللحظة (نسخة + إعادة محاولة)
  async function mutate(id, fn) {
    for (let i = 0; i < 5; i++) {
      const g = await loadGame(id);
      const before = JSON.stringify(g.st) + g.status;
      tick(g, Date.now());
      const out = await fn(g);
      const stNow = JSON.stringify(g.st);
      if (stNow + g.status === before) return { g, out }; // مفيش تغيير: مفيش كتابة
      const r = await one('UPDATE games SET state=$1,status=$2,ver=ver+1,updated_at=$3 WHERE id=$4 AND ver=$5 RETURNING id', [stNow, g.status, Date.now(), g.id, g.ver]);
      if (r) return { g, out };
    }
    throw new HttpError(409, 'حاول تاني');
  }
  const view = (g, uid) => {
    const st = g.st, t = Date.now();
    const me = st.players.findIndex((p) => p.id === uid && !p.bot);
    return {
      id: g.id, status: g.status, mode: st.mode, host: st.host,
      players: st.players.map((p) => ({ id: p.id, name: p.name, bot: !!p.bot, pos: p.pos || 0, color: p.color, status: p.status })),
      turn: st.turn, phase: st.phase, q: st.q, dice: st.dice || 0, log: st.log, winner: st.winner ?? null,
      me, my_turn: g.status === 'playing' && me === st.turn,
      secs_left: g.status === 'playing' ? Math.max(0, Math.ceil((TURN_MS - (t - st.act_at)) / 1000)) : 0,
      board: { ladders: LADDERS, snakes: SNAKES, q: QSQ },
    };
  };

  // ---------- مساعدات ----------
  const touch = (uid) => run('INSERT INTO presence (user_id,seen_at) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET seen_at=excluded.seen_at', [uid, Date.now()]);
  async function gate(ctx) {
    need(ctx.user, ['kid']);
    if (!(await isOn())) throw new HttpError(403, 'اللعبة مقفولة دلوقتي');
    const uid = Number(ctx.user.id);
    await touch(uid);
    return uid;
  }
  async function myGames(uid) { // ألعاب فيها الولد (شغالة أو في الانتظار) بعد تحديثها
    const rows = await all("SELECT g.id FROM game_members m JOIN games g ON g.id=m.game_id WHERE m.user_id=$1 AND g.status IN ('lobby','playing')", [uid]);
    const out = [];
    for (const r of rows) { const { g } = await mutate(Number(r.id), () => {}); if (g.status === 'lobby' || g.status === 'playing') out.push(g); }
    return out;
  }
  const myStatus = (g, uid) => { const p = g.st.players.find((x) => x.id === uid && !x.bot); return p ? p.status : null; };
  async function assertFree(uid) {
    for (const g of await myGames(uid)) if (myStatus(g, uid) === 'in') throw bad('إنت في لعبة شغالة. كمّلها أو اخرج منها الأول');
  }
  async function pickQuestions() {
    const rows = await all('SELECT text,options,correct FROM game_questions');
    return shuffle(rows).slice(0, 14).map((r) => {
      const opts = JSON.parse(r.options); const c = Number(r.correct);
      const order = shuffle(opts.map((_, i) => i));
      return { text: r.text, options: order.map((i) => opts[i]), correct: order.indexOf(c) };
    });
  }
  async function createGame(mode, host, players, startNow) {
    const t = Date.now();
    const st = { mode, host: host.id, players: players.map((p, i) => ({ id: p.id, name: p.name, bot: !!p.bot, pos: 0, color: i, status: p.status })),
      turn: 0, phase: 'wait', q: null, qc: null, qs: await pickQuestions(), qi: 0, dice: 0, log: [], winner: null, created: t, act_at: t, next_at: 0 };
    const g = { status: 'lobby', st };
    if (startNow) startGame(g, t);
    const r = await one('INSERT INTO games (status,mode,ver,state,created_at,updated_at) VALUES ($1,$2,0,$3,$4,$4) RETURNING id', [g.status, mode, JSON.stringify(st), t]);
    for (const p of players) if (!p.bot) await run('INSERT INTO game_members (game_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [r.id, p.id]);
    return Number(r.id);
  }
  const meInfo = (ctx) => ({ id: Number(ctx.user.id), name: ctx.user.name });
  async function onlineKids(uid) {
    const rows = await all(`SELECT u.id,u.name,ph.updated_at AS photo FROM presence p JOIN users u ON u.id=p.user_id LEFT JOIN photos ph ON ph.user_id=u.id
                            WHERE p.seen_at>$1 AND u.id<>$2 AND u.role='kid' ORDER BY u.name`, [Date.now() - 30000, uid]);
    const busyRows = await all("SELECT DISTINCT m.user_id FROM game_members m JOIN games g ON g.id=m.game_id WHERE g.status='playing'");
    const busy = new Set(busyRows.map((r) => Number(r.user_id)));
    return rows.map((r) => ({ id: Number(r.id), name: r.name, photo: r.photo || '', busy: busy.has(Number(r.id)) }));
  }

  // ---------- مسارات الولد ----------
  route('GET', '/api/game/lobby', async (ctx) => {
    need(ctx.user, ['kid']);
    if (!(await isOn())) return { enabled: false };
    const uid = await gate(ctx);
    if (Math.random() < 0.05) { // تنضيف الألعاب القديمة
      await run("DELETE FROM games WHERE status NOT IN ('lobby','playing') AND updated_at<$1", [Date.now() - 86400000]);
      await run('DELETE FROM game_members WHERE game_id NOT IN (SELECT id FROM games)');
    }
    const out = { enabled: true, mine: null, invites: [], online: await onlineKids(uid), room: null, cap: await dailyCap() };
    const today = await one('SELECT n FROM game_stars WHERE user_id=$1 AND day=$2', [uid, todayStr()]);
    out.stars_today = today ? Number(today.n) : 0;
    for (const g of await myGames(uid)) {
      const s = myStatus(g, uid);
      if (s === 'in') out.mine = g.id;
      else if (s === 'invited') out.invites.push({ id: g.id, from: (g.st.players.find((p) => p.id === g.st.host) || {}).name || '', mode: g.st.mode });
    }
    const room = await one("SELECT id FROM games WHERE mode='room' AND status='lobby' ORDER BY id DESC LIMIT 1");
    if (room) {
      const { g } = await mutate(Number(room.id), () => {});
      if (g.status === 'lobby') out.room = { id: g.id, players: inPlayers(g.st).map((p) => p.name), joined: myStatus(g, uid) === 'in' };
    }
    return out;
  });

  route('POST', '/api/game/solo', async (ctx) => {
    const uid = await gate(ctx); await assertFree(uid);
    const id = await createGame('solo', meInfo(ctx), [{ ...meInfo(ctx), status: 'in' }, { id: 0, name: BOT_NAME, bot: true, status: 'in' }], true);
    return { ok: true, id };
  });
  route('POST', '/api/game/invite', async (ctx) => {
    const uid = await gate(ctx); await assertFree(uid);
    const ids = [...new Set((Array.isArray(ctx.body.friend_ids) ? ctx.body.friend_ids : []).map(Number))].filter((x) => Number.isInteger(x) && x !== uid);
    if (!ids.length) throw bad('اختار صاحب واحد على الأقل');
    if (ids.length > 3) throw bad('تقدر تدعو 3 أصحاب بالكتير');
    const online = new Map((await onlineKids(uid)).map((k) => [k.id, k]));
    const friends = ids.map((i) => online.get(i));
    if (friends.some((f) => !f)) throw bad('واحد من أصحابك قفل اللعبة. حدّث القايمة');
    if (friends.some((f) => f.busy)) throw bad('واحد من أصحابك بيلعب دلوقتي');
    const id = await createGame('invite', meInfo(ctx), [{ ...meInfo(ctx), status: 'in' }, ...friends.map((f) => ({ id: f.id, name: f.name, status: 'invited' }))], false);
    return { ok: true, id };
  });
  route('POST', '/api/game/random', async (ctx) => {
    const uid = await gate(ctx); await assertFree(uid);
    const free = (await onlineKids(uid)).filter((k) => !k.busy);
    if (!free.length) throw bad('مفيش حد من أصحابك فاتح اللعبة دلوقتي. العب ضد الكمبيوتر أو ادعو صاحب.');
    const f = free[rnd(free.length)];
    const id = await createGame('random', meInfo(ctx), [{ ...meInfo(ctx), status: 'in' }, { id: f.id, name: f.name, status: 'invited' }], false);
    return { ok: true, id, with: f.name };
  });
  route('POST', '/api/game/room', async (ctx) => {
    const uid = await gate(ctx); await assertFree(uid);
    const room = await one("SELECT id FROM games WHERE mode='room' AND status='lobby' ORDER BY id DESC LIMIT 1");
    if (room) {
      const { g } = await mutate(Number(room.id), (x) => {
        if (x.status === 'lobby' && !x.st.players.some((p) => p.id === uid)) {
          if (x.st.players.length >= MAX_PLAYERS) throw bad('الغرفة اتملت');
          x.st.players.push({ id: uid, name: ctx.user.name, bot: false, pos: 0, color: x.st.players.length, status: 'in' });
        }
      });
      if (g.status === 'lobby') { await run('INSERT INTO game_members (game_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [g.id, uid]); return { ok: true, id: g.id }; }
    }
    const id = await createGame('room', meInfo(ctx), [{ ...meInfo(ctx), status: 'in' }], false);
    return { ok: true, id };
  });
  route('POST', '/api/game/:id/start', async (ctx) => {
    const uid = await gate(ctx);
    await mutate(ctx.params.id, (g) => {
      if (g.status !== 'lobby' || g.st.mode !== 'room' || g.st.host !== uid) throw bad('مش مسموح');
      if (inPlayers(g.st).length < 2) throw bad('لازم لاعبين اتنين على الأقل');
      startGame(g, Date.now());
    });
    return { ok: true };
  });
  route('POST', '/api/game/:id/accept', async (ctx) => {
    const uid = await gate(ctx); await assertFree(uid);
    await mutate(ctx.params.id, (g) => {
      const p = g.st.players.find((x) => x.id === uid && !x.bot);
      if (!p || g.status !== 'lobby' || p.status !== 'invited') throw bad('الدعوة انتهت');
      p.status = 'in'; settle(g, Date.now());
    });
    return { ok: true };
  });
  route('POST', '/api/game/:id/decline', async (ctx) => {
    const uid = await gate(ctx);
    await mutate(ctx.params.id, (g) => {
      const p = g.st.players.find((x) => x.id === uid && !x.bot);
      if (!p || g.status !== 'lobby' || p.status !== 'invited') return;
      p.status = 'declined'; settle(g, Date.now());
    });
    return { ok: true };
  });
  route('POST', '/api/game/:id/leave', async (ctx) => {
    const uid = await gate(ctx);
    await mutate(ctx.params.id, (g) => {
      const st = g.st, i = st.players.findIndex((x) => x.id === uid && !x.bot);
      if (i < 0) return;
      const t = Date.now();
      if (g.status === 'lobby') {
        if (st.mode === 'room') {
          st.players.splice(i, 1);
          if (!st.players.length) g.status = 'cancelled'; else if (st.host === uid) st.host = st.players[0].id;
        } else if (st.host === uid) g.status = 'cancelled';
        else { st.players[i].status = 'left'; settle(g, t); }
      } else if (g.status === 'playing' && st.players[i].status === 'in') {
        const wasTurn = st.turn === i;
        st.players[i].status = 'left'; logLine(st, `${st.players[i].name} خرج من اللعبة`);
        checkEmpty(g);
        if (g.status === 'playing' && wasTurn) { st.q = null; st.qc = null; endTurn(g, t); }
      }
    });
    return { ok: true };
  });
  async function withStars(v, uid) {
    const today = await one('SELECT n FROM game_stars WHERE user_id=$1 AND day=$2', [uid, todayStr()]);
    v.stars_today = today ? Number(today.n) : 0; v.cap = await dailyCap();
    return v;
  }
  route('GET', '/api/game/:id', async (ctx) => {
    const uid = await gate(ctx);
    const { g } = await mutate(ctx.params.id, (x) => { if (!x.st.players.some((p) => p.id === uid && !p.bot)) throw new HttpError(403, 'مش مسموح لك'); });
    return withStars(view(g, uid), uid);
  });
  route('POST', '/api/game/:id/roll', async (ctx) => {
    const uid = await gate(ctx);
    const { g } = await mutate(ctx.params.id, (x) => {
      if (x.status !== 'playing') throw bad('اللعبة خلصت');
      const p = x.st.players[x.st.turn];
      if (p.id !== uid || p.bot) throw bad('مش دورك');
      if (x.st.phase !== 'roll') throw bad('جاوب على السؤال الأول');
      doRoll(x, Date.now());
    });
    return withStars(view(g, uid), uid);
  });
  route('POST', '/api/game/:id/answer', async (ctx) => {
    const uid = await gate(ctx);
    const choice = Number(ctx.body.choice);
    const day = todayStr(), cap = await dailyCap();
    const row = await one('SELECT n FROM game_stars WHERE user_id=$1 AND day=$2', [uid, day]);
    const room = cap - (row ? Number(row.n) : 0) > 0;
    const { g, out } = await mutate(ctx.params.id, (x) => {
      if (x.status !== 'playing') throw bad('اللعبة خلصت');
      const p = x.st.players[x.st.turn];
      if (p.id !== uid || p.bot || x.st.phase !== 'question') throw bad('مفيش سؤال دلوقتي');
      if (!Number.isInteger(choice) || choice < 0 || choice >= x.st.q.options.length) throw bad('اختار إجابة');
      const correct = choice === x.st.qc;
      doAnswer(x, choice, Date.now(), room);
      return { correct, award: correct && room };
    });
    if (out && out.award) await run('INSERT INTO game_stars (user_id,day,n) VALUES ($1,$2,1) ON CONFLICT (user_id,day) DO UPDATE SET n=game_stars.n+1', [uid, day]);
    const v = await withStars(view(g, uid), uid); v.result = out ? { correct: out.correct, star: out.award } : null;
    return v;
  });

  // ---------- المسؤول ----------
  route('GET', '/api/admin/game', async (ctx) => {
    need(ctx.user, ['admin']);
    const qs = (await all('SELECT id,text,options,correct FROM game_questions ORDER BY id')).map((r) => ({ id: Number(r.id), text: r.text, options: JSON.parse(r.options), correct: Number(r.correct) }));
    const online = await one('SELECT CAST(COUNT(*) AS INTEGER) n FROM presence WHERE seen_at>$1', [Date.now() - 30000]);
    const playing = await one("SELECT CAST(COUNT(*) AS INTEGER) n FROM games WHERE status='playing'");
    return { enabled: await isOn(), cap: await dailyCap(), questions: qs, online: Number(online.n), playing: Number(playing.n) };
  });
  route('POST', '/api/admin/game', async (ctx) => {
    need(ctx.user, ['admin']);
    if (ctx.body.enabled !== undefined) { await kvSet('game_on', ctx.body.enabled ? '1' : '0'); await audit(ctx.user, ctx.body.enabled ? 'تشغيل اللعبة' : 'إيقاف اللعبة', null, '', ''); }
    if (ctx.body.cap !== undefined) {
      const c = Number(ctx.body.cap);
      if (!Number.isInteger(c) || c < 0 || c > 50) throw bad('الحد اليومي من 0 لـ 50');
      await kvSet('game_cap', c);
    }
    return { ok: true };
  });
  route('POST', '/api/admin/game-question', async (ctx) => {
    need(ctx.user, ['admin']);
    const text = clean(ctx.body.text, 200);
    const options = (Array.isArray(ctx.body.options) ? ctx.body.options : []).map((o) => clean(o, 80)).filter(Boolean);
    const correct = Number(ctx.body.correct);
    if (text.length < 5) throw bad('اكتب السؤال');
    if (options.length < 2 || options.length > 4) throw bad('اكتب من 2 لـ 4 اختيارات');
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) throw bad('اختار الإجابة الصح');
    await run('INSERT INTO game_questions (text,options,correct,created_at) VALUES ($1,$2,$3,$4)', [text, JSON.stringify(options), correct, now()]);
    return { ok: true };
  });
  route('DELETE', '/api/admin/game-question/:id', async (ctx) => {
    need(ctx.user, ['admin']);
    await run('DELETE FROM game_questions WHERE id=$1', [Number(ctx.params.id)]);
    return { ok: true };
  });

  return { seed, isOn };
};
