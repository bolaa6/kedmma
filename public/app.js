'use strict';
/* واجهة الموقع: بدون مكتبات. كل النصوص بتتكتب بـ textContent عشان الأمان. */

// ---------- أدوات ----------
const app = document.getElementById('app');
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'hidden') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  put(el, kids);
  return el;
}
// يضيف أبناء (نصوص أو عناصر أو مصفوفات) ويتجاهل false/null
function put(el, kids) {
  for (const c of kids) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) put(el, c);
    else el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
}
function fill(el, ...kids) { el.replaceChildren(); put(el, kids); }
function icon(name) {
  const paths = {
    star: 'M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z',
    check: 'M9.2 16.6L4.9 12.3l-1.9 1.9 6.2 6.2L21 8.6l-1.9-1.9z',
    cross: 'M10 2h4v6h6v4h-6v10h-4V12H4V8h6z',
    week: 'M7 2h2v2h6V2h2v2h3v18H4V4h3zm-1 7v11h12V9z M8 11h3v3H8z',
    user: 'M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z',
    people: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm7 1a3 3 0 100-6 3 3 0 000 6zM9 13c-3.3 0-6 1.8-6 4v2h12v-2c0-2.2-2.7-4-6-4zm7 0c-.6 0-1.2.1-1.7.2 1.1.9 1.7 2.1 1.7 3.8v2h5v-2c0-2-2.2-4-5-4z',
    cake: 'M12 1.5c.9 1.1.9 2.2 0 3.3-.9-1.1-.9-2.2 0-3.3zM11 6h2v2.5h5A2 2 0 0120 10.5V13c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-2.5a2 2 0 012-2h5zM4 16.5h16V21H4z',
    book: 'M4 4.5C4 4.2 4.2 4 4.5 4H10a3 3 0 013 3v13a2 2 0 00-2-2H4.5a.5.5 0 01-.5-.5zm16 0c0-.3-.2-.5-.5-.5H14a3 3 0 00-3 3v13a2 2 0 012-2h6.5c.3 0 .5-.2.5-.5z',
    trophy: 'M6 2h12v2h3v4c0 2.2-1.8 4-4 4h-.3A5 5 0 0113 15.9V18h3v2H8v-2h3v-2.1A5 5 0 017.3 12H7C4.8 12 3 10.2 3 8V4h3zm0 4H5v2c0 1.1.9 2 2 2zm12 0v4c1.1 0 2-.9 2-2V6z',
    chart: 'M4 20V4h2v14h14v2zm4-4v-5h3v5zm5 0V8h3v8zm5 0v-3h3v3z',
    podium: 'M9 9h6v11H9zM2 13h6v7H2zm14 4h6v3h-6zM12 2l1.2 2.5 2.8.4-2 2 .5 2.8L12 8.3 9.5 9.7 10 6.9l-2-2 2.8-.4z',
    tune: 'M3 6h9v2H3zm13 0h5v2h-5zM12 4h2v6h-2zM3 11h5v2H3zm9 0h9v2h-9zM8 9h2v6H8zM3 16h11v2H3zm15 0h3v2h-3zM14 14h2v6h-2z',
    more: 'M5 10.2a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6zm7 0a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6zm7 0a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6z',
    lesson: 'M6 2h9l5 5v15H6zm8 1.5V8h4.5zM8.5 12h8v1.6h-8zm0 3.4h8V17h-8zM8.5 8.6h4V10h-4z',
    moon: 'M20.5 14.5A8.5 8.5 0 019.5 3.5 8.5 8.5 0 1020.5 14.5z',
    sun: 'M12 7a5 5 0 100 10 5 5 0 000-10zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zm12.1 12.1l1.4-1.4 2.1 2.1-1.4 1.4zM5.6 19.8l-1.4-1.4 2.1-2.1 1.4 1.4zM17.7 7.7l-1.4-1.4 2.1-2.1 1.4 1.4z',
  };
  const wrap = document.createElement('span');
  wrap.style.display = 'contents';
  wrap.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
  return wrap.firstChild;
}
function avatar(id, photo, size) {
  const sz = size || 44;
  const st = `width:${sz}px;height:${sz}px;font-size:${Math.round(sz * 0.42)}px`;
  if (photo) return h('img', { class: 'avatar', src: `/api/photo/${id}?v=${encodeURIComponent(photo)}`, alt: '', width: sz, height: sz, style: st, loading: 'lazy' });
  return h('span', { class: 'avatar', style: st, 'aria-hidden': 'true' }, icon('user'));
}
// يقص الصورة مربعة ويصغرها لـ 256px ويحولها JPEG صغيرة
async function resizePhoto(file) {
  let bmp;
  try { bmp = await createImageBitmap(file); } catch { throw new Error('الصورة دي مش مدعومة. جرّب صورة JPG أو PNG'); }
  const S = 256, c = document.createElement('canvas'); c.width = S; c.height = S;
  const side = Math.min(bmp.width, bmp.height);
  c.getContext('2d').drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, S, S);
  return c.toDataURL('image/jpeg', 0.82);
}
// زر بخطوتين: الضغطة الأولى تطلب التأكيد، الثانية تنفذ
function sureButton(label, sureLabel, onConfirm) {
  const b = h('button', { class: 'btn bad', type: 'button' }, label);
  b.addEventListener('click', async () => {
    if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = sureLabel; setTimeout(() => { delete b.dataset.sure; b.textContent = label; }, 5000); return; }
    await onConfirm();
  });
  return b;
}
function arCount(n, one, two, few, many) { return n === 1 ? `${one}` : n === 2 ? `${two}` : n >= 3 && n <= 10 ? `${n} ${few}` : `${n} ${many}`; }
const arYears = (n) => arCount(n, 'سنة', 'سنتين', 'سنين', 'سنة');
const arMonths = (n) => arCount(n, 'شهر', 'شهرين', 'شهور', 'شهر');
const arDays = (n) => arCount(n, 'يوم', 'يومين', 'أيام', 'يوم');
const ageText = (b) => arYears(b.age_years) + (b.age_months ? ' و' + arMonths(b.age_months) : '');
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || '';
const starIc = () => { const s = icon('star'); s.setAttribute('class', 'star-ic'); return s; };

let toastTimer;
function toast(msg, bad) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = bad ? 'bad' : ''; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}
async function api(method, url, body) {
  const res = await fetch(url, {
    method, credentials: 'same-origin',
    headers: body !== undefined || method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : method !== 'GET' ? '{}' : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch { /* تجاهل */ }
  if (res.status === 401 && state.me) { state.me = null; showAuth(); throw new Error('انتهت الجلسة. سجّل الدخول تاني'); }
  if (!res.ok) throw new Error(data.error || 'حصلت مشكلة');
  if (Array.isArray(data.new_badges) && data.new_badges.length) toast('إشارة جديدة: ' + data.new_badges.map((b) => b.icon + ' ' + b.title).join('، '));
  return data;
}
async function act(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
  catch (e) { toast(e.message, true); return null; }
}

// تواريخ (نفس منطق السيرفر: الأسبوع يبدأ السبت)
const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const toDate = (s) => new Date(s + 'T00:00:00Z');
const fmt = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = toDate(s); d.setUTCDate(d.getUTCDate() + n); return fmt(d); };
const dayName = (s) => DAY_NAMES[toDate(s).getUTCDay()];
const shortDate = (s) => { const d = toDate(s); return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`; };
const monthLabel = (m) => { const [y, mo] = m.split('-'); return `${MONTH_NAMES[Number(mo) - 1]} ${y}`; };
const weekLabel = (a, b) => `${shortDate(a)} إلى ${shortDate(b)}`;

// ---------- الحالة والثيم ----------
const state = { me: null, tab: null, kidWeek: null, openKid: null, news: { photos: 0, videos: 0, links: 0 } };
// نقطة "جديد" على المكتبة
function paintNews() {
  const n = state.news, total = (n.photos || 0) + (n.videos || 0) + (n.links || 0);
  document.querySelectorAll('[data-tab="library"]').forEach((b) => { if (total) b.setAttribute('data-new', '1'); else b.removeAttribute('data-new'); });
  document.querySelectorAll('[data-sec]').forEach((b) => { const c = n[b.dataset.sec] || 0; if (c) b.setAttribute('data-new', String(c)); else b.removeAttribute('data-new'); });
}
async function refreshNews() { try { state.news = await api('GET', '/api/new'); } catch { return; } paintNews(); }
async function markSeen(sec) { if (!state.news[sec]) return; state.news[sec] = 0; paintNews(); try { await api('POST', '/api/new/seen', { sec }); } catch {} }
function applyTheme(t) {
  if (t) document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
}
function currentTheme() {
  const saved = document.documentElement.getAttribute('data-theme');
  if (saved) return saved;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
try { const t = localStorage.getItem('theme'); if (t) applyTheme(t); } catch { /* تجاهل */ }
function themeButton() {
  const b = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'تبديل الوضع الليلي' });
  const paint = () => { fill(b, icon(currentTheme() === 'dark' ? 'sun' : 'moon')); };
  b.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch { /* تجاهل */ }
    paint();
  });
  paint();
  return b;
}
function header(sub) {
  return h('header', { class: 'top' },
    h('div', { class: 'brand' },
      h('img', { class: 'mark', src: '/icons/logo.svg', alt: '', width: 38, height: 38 }),
      h('div', { style: 'min-width:0' }, h('b', null, 'متابعة مدارس الأحد'), h('span', null, sub))),
    h('div', { class: 'row' }, themeButton()));
}

// ---------- الدخول والتسجيل ----------
function showAuth(mode = 'login') {
  document.body.className = '';
  let current = mode, registered = false;
  const box = h('div', { class: 'stack' });
  const draw = () => {
    const err = h('div', { class: 'err', hidden: true, role: 'alert' });
    const name = h('input', { id: 'name', autocomplete: 'name', required: true });
    const phone = h('input', { id: 'phone', class: 'ltr', type: 'tel', inputmode: 'tel', autocomplete: 'username', required: true, placeholder: '01xxxxxxxxx' });
    const pw = h('input', { id: 'pw', type: 'password', autocomplete: current === 'login' ? 'current-password' : 'new-password', required: true, minlength: 6 });
    const form = h('form', { class: 'stack', novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); err.hidden = true;
      try {
        if (current === 'login') { await api('POST', '/api/login', { phone: phone.value, password: pw.value }); state.tab = null; await boot(); }
        else {
          await api('POST', '/api/register', { name: name.value, phone: phone.value, password: pw.value });
          registered = true; current = 'login'; draw(); // الحساب مستني الموافقة
        }
      } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    } },
      current === 'register' && h('label', { class: 'f', for: 'name' }, h('span', null, 'اسمك بالكامل'), name),
      h('label', { class: 'f', for: 'phone' }, h('span', null, 'رقم موبايلك ', h('small', null, current === 'register' ? '(هو اللي هتدخل بيه كل مرة)' : '')), phone),
      h('label', { class: 'f', for: 'pw' }, h('span', null, 'كلمة السر ', h('small', null, current === 'register' ? '(6 حروف أو أرقام على الأقل)' : '')), pw),
      err,
      h('button', { class: 'btn block', type: 'submit' }, current === 'login' ? 'دخول' : 'إنشاء الحساب'));
    fill(box, 
      h('div', { class: 'seg', role: 'group', 'aria-label': 'نوع الدخول' },
        h('button', { type: 'button', 'aria-pressed': String(current === 'login'), onclick: () => { current = 'login'; draw(); } }, 'تسجيل الدخول'),
        h('button', { type: 'button', 'aria-pressed': String(current === 'register'), onclick: () => { current = 'register'; draw(); } }, 'حساب جديد')),
      registered && current === 'login' && h('div', { class: 'notice' }, 'تم إنشاء حسابك. لازم المسؤول أو الخادم يوافق عليه الأول، وبعدها تقدر تدخل برقمك وكلمة السر.'),
      form,
      current === 'login' && h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:center', onclick: showForgot }, 'نسيت كلمة السر؟'),
      current === 'register' && h('p', { class: 'muted small' }, 'بعد التسجيل لازم المسؤول أو الخادم يوافق على حسابك، وبعدها تكمّل بياناتك (رقم ماما وبابا والعنوان وأب الاعتراف وغيرها).'));
  };
  draw();
  fill(app, h('main', { class: 'auth' },
    h('div', { class: 'hero' }, h('img', { class: 'mark', src: '/icons/logo.svg', alt: '', width: 72, height: 72 }),
      h('h1', null, 'متابعة مدارس الأحد'), h('p', { class: 'muted' }, 'سنة خامسة ابتدائي - أولاد')),
    h('div', { class: 'card' }, box),
    h('div', { class: 'row', style: 'justify-content:center' }, themeButton())));
}

// ---------- التشغيل ----------
async function boot() {
  const r = await api('GET', '/api/me');
  if (!r.user) { state.me = null; return showAuth(); }
  state.me = r;
  if (r.must_change) return showForcedChange();
  if (r.user.role === 'kid') renderKid(); else renderStaff();
}

async function logout() {
  await act(() => api('POST', '/api/logout'));
  state.me = null; state.tab = null; showAuth();
}

function passwordCard() {
  const old = h('input', { id: 'oldpw', type: 'password', autocomplete: 'current-password' });
  const nw = h('input', { id: 'newpw', type: 'password', autocomplete: 'new-password', minlength: 6 });
  return h('form', { class: 'card stack', onsubmit: async (e) => {
    e.preventDefault();
    const r = await act(() => api('POST', '/api/password', { old: old.value, password: nw.value }), 'تم تغيير كلمة السر');
    if (r) { old.value = ''; nw.value = ''; }
  } },
    h('h3', null, 'تغيير كلمة السر'),
    h('label', { class: 'f', for: 'oldpw' }, h('span', null, 'كلمة السر الحالية'), old),
    h('label', { class: 'f', for: 'newpw' }, h('span', null, 'كلمة السر الجديدة'), nw),
    h('button', { class: 'btn', type: 'submit' }, 'حفظ'));
}

// ====================== شاشة الولد ======================
function renderKid() {
  document.body.className = 'kid';
  const me = state.me;
  if (!state.tab) state.tab = me.profile.complete ? 'week' : 'profile';
  const main = h('main', { class: 'wrap stack' });
  const tabs = [['week', 'أسبوعي', 'week'], ['lessons', 'الدروس', 'lesson'], ['quiz', 'المسابقة', 'trophy'], ['library', 'المكتبة', 'book'], ['stars', 'نجومي', 'star'], ['profile', 'بياناتي', 'user']];
  if (me.game_enabled) tabs.splice(3, 0, ['game', 'اللعبة', 'trophy']);
  const bar = h('nav', { class: 'tabbar' + (tabs.length > 6 ? ' many' : ''), 'aria-label': 'التنقل' }, tabs.map(([id, label, ic]) =>
    h('button', { type: 'button', 'data-tab': id, 'aria-current': state.tab === id ? 'page' : null, onclick: () => { state.tab = id; state.openContest = null; state.lessonView = null; renderKid(); } }, icon(ic), label)));
  const bd = me.birthday;
  const greet = bd && bd.is_today ? h('div', { class: 'bday-card' }, (() => { const c = icon('cake'); c.setAttribute('class', 'bday-ic'); return c; })(),
    h('div', null, h('b', null, `كل سنة وإنت طيب يا ${firstName(me.user.name)}`), h('p', null, `النهارده عيد ميلادك، ودلوقتي عندك ${arYears(bd.turning)}. ربنا يفرّح قلبك ويبارك حياتك.`))) : null;
  fill(app, h('div', { class: 'wrap' }, header(me.user.name), greet), main, bar);
  refreshNews();
  if (state.lessonView) { if (state.lessonView.list) kidLessons(main); else kidLesson(main, state.lessonView.id); }
  else if (state.tab === 'week') kidWeek(main);
  else if (state.tab === 'lessons') kidLessons(main);
  else if (state.tab === 'quiz') kidQuiz(main);
  else if (state.tab === 'game') kidGame(main);
  else if (state.tab === 'library') mediaView(main, false);
  else if (state.tab === 'stars') kidStars(main);
  else kidProfile(main);
  window.scrollTo(0, 0);
}

async function kidWeek(main) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', '/api/week' + (state.kidWeek ? `?start=${state.kidWeek}` : '')));
  if (!r) return;
  const { week, today, min_day } = r;
  state.kidWeek = week.start;
  const stars = { v: r.stars };
  const starNum = h('b', { class: 'num' }, String(stars.v.total));
  const isCurrent = week.start <= today && today <= week.end;
  const prevOk = week.start > addDays(today, -90);
  // عدّاد المواظبة + رسائل الخادم + الاحتفال
  const loadStreak = async () => {
    const r = await api('GET', '/api/streak').catch(() => null);
    if (r) streakSlot.replaceChildren(streakCard(r));
    return r;
  };
  const loadCheers = async () => {
    const r = await api('GET', '/api/cheers').catch(() => null);
    if (!r) return;
    const card = cheerCard(r.cheers, async () => { await api('POST', '/api/cheers/seen', {}).catch(() => {}); cheerSlot.replaceChildren(); toast('ربنا يباركك'); });
    cheerSlot.replaceChildren(...(card ? [card] : []));
  };
  // الشخصية واللقب: بتظهر للولد نفسه بس
  const loadCharacter = async () => {
    const c = await api('GET', '/api/my-character').catch(() => null);
    if (!c) return null;
    charSlot.replaceChildren(characterCard(c));
    return c;
  };
  const afterAction = async (kind) => {
    const fn = firstName(state.me.user.name);
    const [s, ch] = await Promise.all([loadStreak(), loadCharacter()]);
    if (ch && ch.promoted) { celebrate(`لقب جديد يا ${fn}!`, `بقيت «${ch.stage_name}»`); return; }
    const rec = week.days[today] || {};
    const both = !!(rec.prayed && rec.gospel);
    let sub = kind === 'prayer' ? 'ربنا يسمع صلاتك' : 'كلمة ربنا في قلبك';
    if (both) sub = 'خلّصت صلاتك وقراءتك النهارده!';
    if (s && [3, 5, 7, 10, 14, 21, 30].includes(s.current)) sub = `🔥 ${arDays(s.current)} ورا بعض. كمّل يا بطل!`;
    celebrate(both ? `يوم كامل يا ${fn}!` : `برافو يا ${fn}!`, sub);
  };
  // قراءة الإنجيل: مفيش تسجيل من غير ما الولد يكتب اللي قراه
  let readingOpen = false, readingEl = null;
  const buildReading = (cur) => {
    const ref = h('input', { id: 'rref', placeholder: 'مثال: يوحنا 3', maxlength: 80, value: cur.reading ? cur.reading.ref : '' });
    const note = h('textarea', { id: 'rnote', maxlength: 800, placeholder: 'اكتب بكلامك إيه اللي فهمته من القراءة...' });
    note.value = cur.reading ? cur.reading.note : '';
    const hint = h('span', { class: 'muted small' });
    const save = h('button', { class: 'btn', type: 'button', disabled: true }, cur.reading ? 'حفظ التعديل' : 'سجّل القراءة');
    const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;
    const check = () => {
      const n = note.value.trim(), left = cur.min_chars - n.length;
      const okRef = ref.value.trim().length >= 3, okNote = n.length >= cur.min_chars && words(n) >= cur.min_words;
      save.disabled = !(okRef && okNote);
      hint.textContent = !okRef ? 'اكتب اسم الإصحاح الأول' : okNote ? 'تمام، تقدر تسجّل' : left > 0 ? `باقي ${left} حرف على الأقل` : `اكتب ${cur.min_words} كلمات على الأقل`;
    };
    ref.addEventListener('input', check); note.addEventListener('input', check); check();
    save.addEventListener('click', async () => {
      const res = await act(() => api('PUT', '/api/reading', { ref: ref.value, note: note.value }));
      if (!res) return;
      if (!(res.new_badges && res.new_badges.length)) toast('تم تسجيل القراءة');
      week.days[today] = { ...(week.days[today] || { prayed: false }), gospel: true };
      stars.v = res.stars; starNum.textContent = String(res.stars.total); readingOpen = false; draw();
      afterAction('reading');
    });
    return h('div', { class: 'card stack reading-card' },
      h('h3', null, 'قريت إيه النهارده؟'),
      h('label', { class: 'f', for: 'rref' }, h('span', null, 'الإصحاح أو الجزء اللي قريته'), ref),
      h('label', { class: 'f', for: 'rnote' }, h('span', null, 'اكتب اللي فهمته'), note),
      hint,
      h('div', { class: 'row' }, save, h('button', { class: 'btn ghost', type: 'button', onclick: () => { readingOpen = false; draw(); } }, 'إلغاء')));
  };
  const openReading = async () => {
    if (readingOpen) { readingOpen = false; return draw(); }
    const cur = await act(() => api('GET', '/api/reading'));
    if (!cur) return;
    readingEl = buildReading(cur); readingOpen = true; draw();
  };
  const draw = () => {
    const days = [];
    for (let i = 0; i < 7; i++) days.push(addDays(week.start, i));
    const mkChip = (label, on, disabled, onclick) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(on), disabled, onclick }, icon('check'), label);
    const dayRows = days.map((d) => {
      const rec = week.days[d] || { prayed: false, gospel: false };
      const locked = d !== today;
      const toggle = (field) => async () => {
        const nextVal = !rec[field];
        const res = await act(() => api('PUT', '/api/day', { day: d, [field]: nextVal }));
        if (!res) return;
        week.days[d] = { ...rec, [field]: nextVal };
        stars.v = res.stars; starNum.textContent = String(res.stars.total); draw();
        if (nextVal) afterAction('prayer');
      };
      const att = week.attendance.includes(d);
      return h('div', { class: 'day' + (d === today ? ' today' : '') },
        h('div', { class: 'dn' }, h('b', null, d === today ? 'النهارده' : dayName(d)), h('span', null, shortDate(d)), att && h('span', { class: 'pill good', style: 'margin-top:2px' }, 'حضرت')),
        mkChip('صليت', rec.prayed, locked, toggle('prayed')),
        mkChip('قريت الإنجيل', rec.gospel, locked, openReading));
    });
    const massLocked = !(week.start <= today && today <= week.end);
    const massBtn = mkChip(week.mass ? 'رحت القداس' : 'رحت القداس الأسبوع ده', week.mass, massLocked, async () => {
      const res = await act(() => api('PUT', '/api/mass', { week_start: week.start, attended: !week.mass }));
      if (!res) return;
      week.mass = !week.mass; stars.v = res.stars; starNum.textContent = String(res.stars.total); draw();
      if (week.mass) celebrate(`برافو يا ${firstName(state.me.user.name)}!`, 'ربنا يبارك القداس في حياتك');
    });
    massBtn.classList.add('wide');
    const confLocked = week.confession_month !== today.slice(0, 7);
    const confBtn = mkChip(week.confession ? 'اعترفت الشهر ده' : 'اعترفت الشهر ده', week.confession, confLocked, async () => {
      const res = await act(() => api('PUT', '/api/confession', { month: week.confession_month, confession: !week.confession }));
      if (!res) return;
      week.confession = !week.confession; stars.v = res.stars; starNum.textContent = String(res.stars.total); draw();
      if (week.confession) celebrate(`برافو يا ${firstName(state.me.user.name)}!`, 'ربنا يفرّح قلبك');
    });
    confBtn.classList.add('wide');
    fill(box, 
      readingOpen && readingEl,
      h('div', { class: 'card' }, h('div', { class: 'list' }, dayRows)),
      h('div', { class: 'card stack' },
        h('div', { class: 'row between' }, h('h3', null, 'القداس'), h('span', { class: 'pill' }, 'مرة في الأسبوع')),
        massBtn),
      h('div', { class: 'card stack' },
        h('div', { class: 'row between' }, h('h3', null, 'الاعتراف'), h('span', { class: 'pill' }, 'مرة في الشهر: ' + monthLabel(week.confession_month))),
        confBtn),
      week.attendance.length > 0 && h('p', { class: 'muted small' }, `حضرت الاجتماع ${week.attendance.length} ${week.attendance.length > 2 ? 'مرات' : 'مرة'} الأسبوع ده، وخدت نجمة على كل مرة.`));
  };
  const box = h('div', { class: 'stack' });
  const contentSlot = h('div'), streakSlot = h('div'), cheerSlot = h('div'), charSlot = h('div'), lessonSlot = h('div');
  fill(main, 
    h('div', { class: 'stars-hero' }, (() => { const s = icon('star'); s.setAttribute('class', 'big'); return s; })(),
      h('div', null, starNum, h('span', { class: 'muted' }, 'مجموع نجومك'))),
    charSlot, lessonSlot, streakSlot, cheerSlot, contentSlot,
    (() => { const b = state.me.birthday; if (!b || b.is_today) return null;
      return h('div', { class: 'card row bday-row' }, (() => { const c = icon('cake'); c.setAttribute('class', 'bday-ic sm'); return c; })(),
        h('div', { class: 'grow' }, h('b', null, 'عمرك ' + ageText(b)), h('div', { class: 'muted small' }, `فاضل ${arDays(b.days_until)} على عيد ميلادك`))); })(),
    h('div', { class: 'weeknav' },
      h('button', { class: 'btn ghost sm', type: 'button', disabled: !prevOk, onclick: () => { state.kidWeek = addDays(week.start, -7); renderKid(); } }, 'الأسبوع اللي فات'),
      h('b', { class: 'num', style: 'text-align:center' }, isCurrent ? 'الأسبوع ده' : weekLabel(week.start, week.end)),
      h('button', { class: 'btn ghost sm', type: 'button', disabled: isCurrent, onclick: () => { state.kidWeek = addDays(week.start, 7); renderKid(); } }, 'الأسبوع الجاي')),
    box,
    h('p', { class: 'muted small' }, 'علّم على صلاتك. وقراءة الإنجيل بتتسجل بعد ما تكتب اللي فهمته منها. تقدر تعدّل آخر أسبوعين بس.'));
  draw();
  loadStreak(); loadCheers();
  api('GET', '/api/lessons').then((r) => { if (r.lessons.length) lessonSlot.replaceChildren(lessonTeaser(r.lessons)); }).catch(() => {});
  loadCharacter().then((c) => { if (c && c.promoted) celebrate(`لقب جديد يا ${firstName(state.me.user.name)}!`, `بقيت «${c.stage_name}»`); });
  api('GET', '/api/daily-content').then((c) => { if (c.item) contentSlot.replaceChildren(contentCard(c.item)); }).catch(() => {});
}

// ====================== الدروس (الولد) ======================
const paragraphs = (t) => String(t || '').split(/\n+/).filter(Boolean).map((p) => h('p', { class: 'lesson-p' }, p));
function lessonTeaser(list) {
  const l = list[0];
  return h('div', { class: 'card stack lesson-teaser' },
    h('div', { class: 'row between' }, h('h3', null, 'درس الأسبوع'), l.read ? h('span', { class: 'pill good' }, 'قريته') : h('span', { class: 'pill star' }, 'نجمة')),
    h('b', null, l.title),
    h('div', { class: 'takeaway' }, h('span', { class: 'muted small' }, 'إيه الدرس؟'), h('p', null, l.takeaway)),
    h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', onclick: () => { state.lessonView = { id: l.id }; renderKid(); } }, l.read ? 'اقرا الدرس تاني' : 'اقرا الدرس'),
      list.length > 1 && h('button', { class: 'btn ghost', type: 'button', onclick: () => { state.lessonView = { list: true }; renderKid(); } }, 'كل الدروس')));
}
async function kidLessons(main) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', '/api/lessons'));
  if (!r) return;
  fill(main,
    state.lessonView && state.lessonView.list && h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: () => { state.lessonView = null; renderKid(); } }, 'رجوع'),
    h('h2', null, 'الدروس'),
    r.lessons.length ? h('div', { class: 'stack' }, r.lessons.map((l) => h('button', { class: 'card lesson-row', type: 'button', onclick: () => { state.lessonView = { id: l.id }; renderKid(); } },
      h('div', { class: 'grow' }, h('b', null, l.title), h('div', { class: 'muted small' }, shortDate(l.created_at.slice(0, 10)))),
      l.read ? h('span', { class: 'pill good' }, 'قريته') : h('span', { class: 'pill' }, 'جديد')))) : h('p', { class: 'muted' }, 'لسه مفيش دروس'));
}
async function kidLesson(main, id) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const l = await act(() => api('GET', '/api/lessons/' + id));
  if (!l) { state.lessonView = null; return; }
  const back = h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: () => { state.lessonView = null; renderKid(); } }, 'رجوع');
  let readBox;
  if (l.read) {
    readBox = h('div', { class: 'card stack' }, h('b', null, 'قريت الدرس ✓'), h('p', { class: 'muted small', style: 'margin:0' }, 'اللي كتبته:'), h('div', { class: 'read-note' }, l.note));
  } else {
    const note = h('textarea', { id: 'lnote', maxlength: 400, placeholder: 'اكتب بكلامك إيه اللي فهمته من الدرس...' });
    const hint = h('span', { class: 'muted small' });
    const save = h('button', { class: 'btn', type: 'button', disabled: true }, 'قريت الدرس (نجمة)');
    const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;
    const check = () => { const n = note.value.trim(), left = 15 - n.length; const okN = n.length >= 15 && words(n) >= 3; save.disabled = !okN; hint.textContent = okN ? 'تمام، تقدر تسجّل' : left > 0 ? `باقي ${left} حرف على الأقل` : 'اكتب 3 كلمات على الأقل'; };
    note.addEventListener('input', check); check();
    save.addEventListener('click', async () => {
      const res = await act(() => api('POST', `/api/lessons/${id}/read`, { note: note.value }));
      if (!res) return;
      celebrate(`برافو يا ${firstName(state.me.user.name)}!`, 'خدت نجمة على قراءة الدرس');
      kidLesson(main, id);
    });
    readBox = h('div', { class: 'card stack' }, h('h3', null, 'إيه اللي فهمته؟'), note, hint, save);
  }
  fill(main, back,
    h('div', { class: 'card stack lesson-card' },
      h('h2', { style: 'margin:0' }, l.title),
      h('div', { class: 'takeaway big' }, h('b', null, 'إيه الدرس؟'), h('p', null, l.takeaway)),
      l.verse && h('blockquote', { class: 'lesson-verse' }, l.verse),
      h('div', { class: 'lesson-body' }, paragraphs(l.body))),
    readBox);
}

// رسم الشخصية: بتكبر وبيزيد عليها حاجات مع كل لقب (0 مبتدئ، 1 مجتهد، 2 بطل، 3 قدوة)
function characterSvg(stage) {
  const shirt = '#378ADD', hair = '#3B2A20', skin = '#E8B88A';
  const scale = [0.9, 1, 1.08, 1.15][stage] || 1;
  const hand = (x, y) => `<circle cx="${x}" cy="${y + 2}" r="4.5" fill="${skin}"/>`;
  const arm = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${shirt}" stroke-width="8" stroke-linecap="round"/>` + hand(x2, y2);
  let back = '', arms = '', extra = '', top = '';
  if (stage === 3) {
    const rays = [[50, -62, 60, -62], [43, -37, 52, -32], [-43, -37, -52, -32], [-50, -62, -60, -62], [-43, -87, -52, -92], [-25, -105, -30, -114], [0, -112, 0, -122], [25, -105, 30, -114], [43, -87, 52, -92]]
      .map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`).join('');
    back += `<g stroke="#EF9F27" stroke-width="3" stroke-linecap="round">${rays}</g><circle cx="0" cy="-62" r="46" fill="#FAEEDA"/>` +
      '<path d="M-18 -54 L18 -54 L38 -4 Q0 8 -38 -4 Z" fill="#EF9F27" stroke="#854F0B" stroke-width="1.5"/>';
    top = '<path d="M-14 -92 L-14 -106 L-7 -99 L0 -109 L7 -99 L14 -106 L14 -92 Z" fill="#EF9F27" stroke="#854F0B" stroke-width="1"/><circle cx="-14" cy="-107" r="2.2" fill="#FAEEDA"/><circle cx="0" cy="-110" r="2.2" fill="#FAEEDA"/><circle cx="14" cy="-107" r="2.2" fill="#FAEEDA"/>';
  } else if (stage === 2) back += '<path d="M-18 -54 L18 -54 L38 -4 Q0 8 -38 -4 Z" fill="#E24B4A"/>';
  else if (stage === 1) back += '<rect x="-27" y="-54" width="54" height="38" rx="9" fill="#BA7517"/>';
  if (stage === 0) arms = arm(-20, -48, -28, -28) + arm(20, -48, 28, -28);
  else if (stage === 1) {
    arms = '<line x1="-10" y1="-54" x2="-10" y2="-28" stroke="#854F0B" stroke-width="3"/><line x1="10" y1="-54" x2="10" y2="-28" stroke="#854F0B" stroke-width="3"/>' + arm(-20, -48, -28, -28) +
      `<line x1="20" y1="-48" x2="28" y2="-34" stroke="${shirt}" stroke-width="8" stroke-linecap="round"/>` +
      '<rect x="22" y="-52" width="17" height="21" rx="2" fill="#D85A30"/><line x1="25" y1="-47" x2="36" y2="-47" stroke="#FAECE7" stroke-width="1.5"/><line x1="25" y1="-42" x2="36" y2="-42" stroke="#FAECE7" stroke-width="1.5"/>' + hand(28, -34);
  } else if (stage === 2) arms = arm(-20, -48, -30, -32) + arm(20, -48, 30, -32);
  else arms = arm(-20, -48, -30, -60) + arm(20, -48, 30, -60);
  if (stage >= 2) extra = '<path d="M-4 -55 L-1 -44 M4 -55 L1 -44" fill="none" stroke="#E24B4A" stroke-width="3"/><circle cx="0" cy="-38" r="6.5" fill="#EF9F27" stroke="#854F0B" stroke-width="1"/>';
  const mouth = stage >= 2 ? 'M-6 -66 Q0 -59 6 -66' : 'M-6 -67 Q0 -62 6 -67';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 170" role="img" aria-label="شخصيتك"><g transform="translate(80 152) scale(${scale})">${back}` +
    '<rect x="-14" y="-18" width="11" height="18" rx="3" fill="#5F5E5A"/><rect x="3" y="-18" width="11" height="18" rx="3" fill="#5F5E5A"/><ellipse cx="-9" cy="1" rx="8" ry="4" fill="#2C2C2A"/><ellipse cx="9" cy="1" rx="8" ry="4" fill="#2C2C2A"/>' +
    `<rect x="-20" y="-56" width="40" height="42" rx="9" fill="${shirt}"/>${arms}${extra}<circle cx="0" cy="-76" r="19" fill="${skin}"/>` +
    `<path d="M-19 -78 Q-19 -98 0 -98 Q19 -98 19 -78 Q8 -88 -19 -78 Z" fill="${hair}"/>${top}` +
    `<circle cx="-7" cy="-75" r="2" fill="#2C2C2A"/><circle cx="7" cy="-75" r="2" fill="#2C2C2A"/><path d="${mouth}" fill="none" stroke="#7A3E1D" stroke-width="1.8" stroke-linecap="round"/></g></svg>`;
}
// كارت الشخصية واللقب: بيظهر للولد نفسه بس
function characterCard(c) {
  const art = h('div', { class: 'char-art' });
  art.append(document.importNode(new DOMParser().parseFromString(characterSvg(c.stage), 'image/svg+xml').documentElement, true));
  return h('div', { class: 'card char-card' }, art,
    h('div', { class: 'grow stack' },
      h('div', { class: 'row between' }, h('h2', { style: 'margin:0' }, c.stage_name), h('span', { class: 'pill star num' }, `المستوى ${c.level}`)),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': String(c.pct), 'aria-valuemin': '0', 'aria-valuemax': '100' }, h('i', { style: `width:${c.pct}%` })),
      h('p', { class: 'muted small', style: 'margin:0' }, c.next_name ? `باقي ${c.to_next} نجمة وتبقى «${c.next_name}»` : 'وصلت لأعلى لقب. كمّل يا بطل!')));
}
// احتفال لما الولد يخلّص حاجة: نجمة بتلمع + ورق ملوّن (بيتقفل لوحده)
function celebrate(title, sub) {
  const old = document.getElementById('celebrate'); if (old) old.remove();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = ['var(--star)', 'var(--good)', 'var(--primary)', 'var(--bad)'];
  const bits = reduce ? [] : Array.from({ length: 28 }, (_, i) => {
    const el = h('i', { class: 'confetti' });
    el.style.setProperty('--x', Math.round(Math.random() * 100) + '%');
    el.style.setProperty('--d', (Math.random() * 0.5).toFixed(2) + 's');
    el.style.setProperty('--t', (1.6 + Math.random() * 1.2).toFixed(2) + 's');
    el.style.setProperty('--c', colors[i % colors.length]);
    return el;
  });
  const star = icon('star'); star.setAttribute('class', 'cel-star');
  const box = h('div', { id: 'celebrate', role: 'status', 'aria-live': 'polite', onclick: () => box.remove() },
    bits, h('div', { class: 'cel' }, star, h('h2', null, title), sub && h('p', null, sub)));
  document.body.append(box);
  setTimeout(() => box.remove(), 3000);
}
// عدّاد المواظبة: اليوم بيتحسب لو صلّى أو قرأ
function streakCard(r) {
  const n = r.current;
  const days = n === 1 ? 'يوم واحد' : arDays(n);
  const sub = r.today_done ? 'كمّلت النهارده، ممتاز!' : n > 0 ? 'صلّي أو اقرا النهارده عشان السلسلة ماتقطعش' : 'صلّي أو اقرا النهارده وابدأ سلسلتك';
  return h('div', { class: 'card streak-card' },
    h('div', { class: 'streak-n' }, h('span', { class: 'flame', 'aria-hidden': 'true' }, '🔥'), h('b', { class: 'num' }, String(n))),
    h('div', { class: 'grow' },
      h('b', null, n > 0 ? `${days} ورا بعض` : 'سلسلة المواظبة'),
      h('div', { class: 'muted small' }, sub),
      h('div', { class: 'sdots', 'aria-label': 'آخر 7 أيام' }, r.last7.map((d) => h('span', { class: 'sdot' + (d.done ? ' on' : ''), title: dayName(d.day) }))),
      r.best > n && h('div', { class: 'muted small' }, 'أحسن سلسلة ليك: ' + arDays(r.best))));
}
// رسالة تشجيع من الخادم
function cheerCard(list, onDone) {
  const fresh = list.filter((c) => !c.seen);
  if (!fresh.length) return null;
  return h('div', { class: 'card stack cheer-card' },
    h('h3', null, fresh.length > 1 ? 'رسايل تشجيع ليك' : 'رسالة تشجيع ليك'),
    fresh.map((c) => h('div', { class: 'cheer' }, h('p', { style: 'margin:0' }, '“' + c.text + '”'), h('span', { class: 'muted small' }, '- ' + c.by_name))),
    h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: onDone }, 'شكراً'));
}
// الخادم يشجّع ولد
function staffCheerCard(id, name) {
  const text = h('input', { id: 'cheer', maxlength: 140, placeholder: 'اكتب كلمة تشجيع...', 'aria-label': 'رسالة التشجيع' });
  const presets = ['برافو عليك!', 'فخور بيك', 'ربنا يباركك', 'كمّل يا بطل', 'افتقدناك، ننتظرك في الاجتماع'];
  return h('div', { class: 'card stack' }, h('h3', null, 'شجّع ' + firstName(name)),
    h('div', { class: 'row' }, presets.map((t) => h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { text.value = t; text.focus(); } }, t))),
    text,
    h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: async () => {
      const x = await act(() => api('POST', '/api/staff/cheer', { user_id: id, text: text.value }), 'اتبعت رسالة التشجيع'); if (x) text.value = '';
    } }, 'ابعت التشجيع'));
}

// آية أو قصة اليوم
function contentCard(it) {
  const story = it.kind === 'story';
  return h('div', { class: 'card stack daily-card' },
    h('div', { class: 'row between' }, h('h3', null, story ? it.title : 'آية النهارده'), h('span', { class: 'pill' }, story ? 'قصة النهارده' : 'آية')),
    h('p', { class: 'daily-text' }, story ? it.text : '“' + it.text + '”'),
    !story && it.ref && h('span', { class: 'muted small' }, it.ref));
}
// إشارات الولد
async function badgesCard() {
  const r = await act(() => api('GET', '/api/badges'));
  if (!r) return null;
  const got = r.badges.filter((b) => b.earned).length;
  return h('div', { class: 'card stack' },
    h('div', { class: 'row between' }, h('h3', null, 'إشاراتي'), h('span', { class: 'pill' }, `${got} من ${r.badges.length}`)),
    h('div', { class: 'badges' }, r.badges.map((b) => h('div', { class: 'badge' + (b.earned ? ' on' : ''), title: b.desc },
      h('span', { class: 'bi', 'aria-hidden': 'true' }, b.icon), h('b', null, b.title), h('span', { class: 'muted small' }, b.earned ? b.desc : b.kind === 'manual' ? 'الخادم بيمنحها' : `${b.have} من ${b.need}`)))));
}

async function kidStars(main) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', '/api/my-stars'));
  if (!r) return;
  const s = r.stars;
  const rankCard = await kidRanking();
  const badgeBox = await badgesCard();
  const ch = await api('GET', '/api/cheers').catch(() => null);
  const cheerList = ch && ch.cheers.length ? h('div', { class: 'card stack' }, h('h3', null, 'رسايل التشجيع'),
    h('div', { class: 'list' }, ch.cheers.map((c) => h('div', { class: 'cheer' }, h('p', { style: 'margin:0' }, '“' + c.text + '”'), h('span', { class: 'muted small' }, `- ${c.by_name} (${c.created_at.slice(0, 10)})`))))) : null;
  const row = (label, n, hint) => h('div', { class: 'row between' }, h('span', null, label, hint && h('span', { class: 'muted small' }, ' ' + hint)), h('b', { class: 'num' }, (n > 0 && label.includes('الخدام') ? '+' : '') + n));
  fill(main, 
    h('div', { class: 'stars-hero' }, (() => { const x = icon('star'); x.setAttribute('class', 'big'); return x; })(),
      h('div', null, h('b', { class: 'num' }, String(s.total)), h('span', { class: 'muted' }, 'مجموع نجومك'))),
    h('div', { class: 'card list' },
      row('الصلاة', s.prayer, 'نجمة لكل يوم'),
      row('قراءة الإنجيل', s.gospel, 'نجمة لكل يوم'),
      row('القداس', s.mass, 'نجمة لكل أسبوع'),
      row('الاعتراف', s.confession, 'نجمة لكل شهر'),
      row('حضور الاجتماع', s.attendance, 'نجمة لكل مرة'),
      row('المسابقة', s.quiz, 'نجمة لكل درجة'),
      row('الدروس', s.lesson || 0, 'نجمة لكل درس'),
      s.game > 0 && row('لعبة السلم والتعبان', s.game, 'نجمة لكل سؤال صح'),
      row('زيادة أو خصم من الخدام', s.adjust)),
    rankCard,
    badgeBox,
    cheerList,
    r.notes.length > 0 && h('div', { class: 'card stack' }, h('h3', null, 'ملاحظات من الخدام'),
      h('div', { class: 'list' }, r.notes.map((n) => h('div', { class: 'row between', style: 'align-items:flex-start' },
        h('div', { class: 'grow' }, h('div', null, n.text), h('span', { class: 'muted small num' }, n.created_at.slice(0, 10))),
        h('span', { class: 'pill ' + (n.delta > 0 ? 'good' : 'bad') }, (n.delta > 0 ? '+' : '') + n.delta, starIc()))))));
}

function kidProfile(main) {
  const p = JSON.parse(JSON.stringify(state.me.profile));
  const fields = {};
  const mk = (id, label, extra = {}, hint) => {
    const input = h(extra.tag || 'input', { id, value: p[id] ?? '', required: true, ...extra.attrs });
    if (extra.tag === 'textarea') input.value = p[id] ?? '';
    fields[id] = input;
    return h('label', { class: 'f', for: id }, h('span', null, label, hint && h('small', null, ' ' + hint)), input);
  };
  const savedCount = p.siblings.length;
  const by0 = p.birth ? p.birth.split('-').map(Number) : null;
  const bsel = (id, label, opts, cur) => h('label', { class: 'f', for: id }, h('span', null, label),
    h('select', { id }, h('option', { value: '' }, 'اختار'), opts.map(([v, t]) => h('option', { value: String(v), selected: cur === v }, t))));
  const sibBox = h('div', { class: 'stack' });
  const drawSibs = () => {
    fill(sibBox, 
      p.siblings.length === 0 && h('p', { class: 'muted' }, 'لو عندك إخوات اضغط "إضافة أخ أو أخت".'),
      p.siblings.map((s, i) => h('div', { class: 'sib' },
        h('label', { class: 'f nm', for: 'sn' + i }, h('span', null, 'الاسم'), h('input', { id: 'sn' + i, value: s.name, oninput: (e) => { s.name = e.target.value; } })),
        h('label', { class: 'f', for: 'sa' + i }, h('span', null, 'السن'), h('input', { id: 'sa' + i, type: 'number', inputmode: 'numeric', min: 0, max: 60, value: s.age, oninput: (e) => { s.age = e.target.value; } })),
        h('label', { class: 'f', for: 'sg' + i }, h('span', null, 'في سنة كام'), h('input', { id: 'sg' + i, value: s.grade, placeholder: 'مثلاً: تالتة ابتدائي', oninput: (e) => { s.grade = e.target.value; } })),
        i >= savedCount && h('button', { class: 'btn bad sm', type: 'button', onclick: () => { p.siblings.splice(i, 1); drawSibs(); } }, 'إلغاء'))),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => { p.siblings.push({ name: '', age: '', grade: '' }); drawSibs(); } }, 'إضافة أخ أو أخت'));
  };
  drawSibs();
  const photoBox = h('div', { class: 'card row' });
  const drawPhoto = () => {
    const pick = h('input', { id: 'photo', type: 'file', accept: 'image/*', hidden: true, onchange: async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const data = await resizePhoto(f);
        const r = await api('PUT', '/api/photo', { data });
        state.me.profile.photo = r.photo; p.photo = r.photo; toast('تم تغيير صورتك'); drawPhoto();
      } catch (ex) { toast(ex.message, true); }
    } });
    fill(photoBox, avatar(p.id, p.photo, 80),
      h('div', { class: 'grow stack', style: 'gap:6px' }, h('b', null, 'صورتك'),
        h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: () => pick.click() }, p.photo ? 'تغيير الصورة' : 'اختار صورة'), pick));
  };
  drawPhoto();
  const err = h('div', { class: 'err', hidden: true, role: 'alert' });
  const form = h('form', { class: 'card stack', novalidate: true, onsubmit: async (e) => {
    e.preventDefault(); err.hidden = true;
    const body = { name: fields.name.value, mother_phone: fields.mother_phone.value, father_phone: fields.father_phone.value, address: fields.address.value, confessor: fields.confessor.value, school: fields.school.value, siblings: p.siblings,
      birth: { day: form.querySelector('#bday').value, month: form.querySelector('#bmonth').value, year: form.querySelector('#byear').value } };
    try {
      const r = await api('PUT', '/api/profile', body);
      state.me.profile = r.profile; state.me.user.name = r.profile.name; state.me.birthday = r.birthday;
      toast('تم حفظ بياناتك');
      state.tab = 'week'; renderKid();
    } catch (ex) { err.textContent = ex.message; err.hidden = false; err.scrollIntoView({ block: 'center' }); }
  } },
    h('h2', null, 'بياناتي'),
    mk('name', 'اسمك بالكامل'),
    h('label', { class: 'f' }, h('span', null, 'رقم موبايلك ', h('small', null, '(هو اللي بتدخل بيه)')), h('input', { class: 'ltr', value: p.phone, disabled: true })),
    h('div', { class: 'grid2' },
      mk('mother_phone', 'رقم موبايل ماما', { attrs: { class: 'ltr', type: 'tel', inputmode: 'tel' } }),
      mk('father_phone', 'رقم موبايل بابا', { attrs: { class: 'ltr', type: 'tel', inputmode: 'tel' } })),
    mk('address', 'العنوان بالتفصيل', { tag: 'textarea', attrs: { placeholder: 'المحافظة، المنطقة، الشارع، رقم العمارة، الدور، علامة مميزة' } }),
    mk('confessor', 'أب الاعتراف'),
    mk('school', 'المدرسة'),
    h('h3', null, 'تاريخ ميلادك'),
    h('div', { class: 'grid3' }, bsel('bday', 'اليوم', Array.from({ length: 31 }, (_, i) => [i + 1, String(i + 1)]), by0 && by0[2]),
      bsel('bmonth', 'الشهر', MONTH_NAMES.map((m, i) => [i + 1, m]), by0 && by0[1]),
      bsel('byear', 'السنة', Array.from({ length: 17 }, (_, i) => { const y = new Date().getFullYear() - 4 - i; return [y, String(y)]; }), by0 && by0[0])),
    h('h3', null, 'الإخوات'),
    sibBox,
    err,
    h('button', { class: 'btn block', type: 'submit' }, 'حفظ البيانات'),
    h('p', { class: 'muted small' }, 'تقدر تعدّل بياناتك في أي وقت. مينفعش تتمسح بعد ما تتسجل.'));
  fill(main, 
    !p.complete && h('div', { class: 'notice' }, 'كمّل بياناتك الأول عشان الخدام يقدروا يتواصلوا مع أهلك.'),
    photoBox, form, pushCard(), installCard(), passwordCard(),
    h('button', { class: 'btn ghost', type: 'button', onclick: logout }, 'تسجيل الخروج'));
}

// ====================== شاشة الخدام والمتابعين ======================
const ROLE_LABEL = { admin: 'مسؤول', servant: 'خادم', viewer: 'متابع' };
const canMark = () => ['admin', 'servant'].includes(state.me.user.role);

function renderStaff() {
  document.body.className = 'staff';
  const me = state.me.user;
  if (!state.tab) state.tab = 'overview';
  const tabs = [['overview', 'المتابعة', 'week', 1], ['attendance', 'الحضور', 'check', 1], ['quiz', 'المسابقة', 'trophy', 1], ['library', 'المكتبة', 'book', 1],
    ['reports', 'التقارير', 'chart', 0], ['ranking', 'الترتيب', 'podium', 0], ['badges', 'الإشارات', 'star', 0], ['lessons', 'الدروس', 'book', 0]];
  if (me.role === 'admin') tabs.push(['team', 'الخدام والإعدادات', 'tune', 0]);
  tabs.push(['me', 'حسابي', 'user', 0]);
  const go = (id) => { state.tab = id; state.openKid = null; state.staffContest = null; state.builder = null; state.openReport = null; renderStaff(); };
  const secActive = tabs.some(([id, , , p]) => !p && id === state.tab);
  const sheet = h('div', { class: 'snav-sheet', hidden: true },
    tabs.filter((t) => !t[3]).map(([id, label, ic]) => h('button', { type: 'button', 'aria-current': !state.openKid && state.tab === id ? 'page' : null, onclick: () => go(id) }, icon(ic), label)));
  const moreBtn = h('button', { type: 'button', class: 'more', 'aria-expanded': 'false', 'aria-current': !state.openKid && secActive ? 'page' : null,
    onclick: (e) => { e.stopPropagation(); const open = sheet.hidden; sheet.hidden = !open; moreBtn.setAttribute('aria-expanded', String(open)); } }, icon('more'), 'المزيد');
  const nav = h('nav', { class: 'snav', 'aria-label': 'التنقل' },
    tabs.map(([id, label, ic, p]) => h('button', { type: 'button', 'data-tab': id, class: p ? '' : 'sec', 'aria-current': !state.openKid && state.tab === id ? 'page' : null, onclick: () => go(id) }, icon(ic), label)), moreBtn);
  document.addEventListener('click', () => { sheet.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); }, { once: true });
  const main = h('main', { class: 'stack' });
  const bdayBox = h('div', { class: 'stack' });
  fill(app, h('div', { class: 'wrap wide' }, header(`${me.name} (${ROLE_LABEL[me.role]})`), bdayBox, main), sheet, nav);
  staffBirthdays(bdayBox);
  refreshNews();
  if (canMark() && !state.openKid) api('GET', '/api/staff/pending').then((q) => { if (q.pending.length) bdayBox.prepend(pendingCard(q.pending, () => renderStaff())); }).catch(() => {});
  if (me.role === 'admin' && !state.openKid) api('GET', '/api/admin/reset-requests').then((q) => { if (q.requests.length) bdayBox.prepend(h('button', { class: 'notice', type: 'button', style: 'text-align:start;cursor:pointer', onclick: () => { state.tab = 'team'; renderStaff(); } }, `فيه ${q.requests.length} طلب نسيان كلمة سر. اضغط هنا لتشوفه.`)); }).catch(() => {});
  if (state.openKid) staffKid(main, state.openKid);
  else if (state.tab === 'library') mediaView(main, canMark());
  else if (state.tab === 'overview') staffOverview(main);
  else if (state.tab === 'attendance') staffAttendance(main);
  else if (state.tab === 'quiz') staffQuiz(main);
  else if (state.tab === 'reports') staffReports(main);
  else if (state.tab === 'ranking') staffRanking(main);
  else if (state.tab === 'badges') staffBadges(main);
  else if (state.tab === 'lessons') staffLessons(main);
  else if (state.tab === 'team') staffTeam(main);
  else staffMe(main);
}

// الأولاد اللي غابوا آخر اجتماعات
function absentCard(r) {
  if (!r.kids.length) return null;
  return h('div', { class: 'card stack' },
    h('div', { class: 'row between' }, h('h3', null, 'محتاجين افتقاد'), h('span', { class: 'pill bad' }, String(r.kids.length))),
    h('p', { class: 'muted small' }, `غابوا آخر ${r.n === 2 ? 'اجتماعين' : r.n + ' اجتماعات'} (${r.sessions.map(shortDate).join('، ')})`),
    h('div', { class: 'list' }, r.kids.map((k) => h('div', { class: 'row between' },
      h('div', null, h('b', null, k.name), h('div', { class: 'muted small' }, k.last ? 'آخر حضور: ' + shortDate(k.last) : 'لسه ما حضرش قبل كده')),
      h('div', { class: 'row' },
        canMark() && k.phone && h('a', { class: 'btn ghost sm', href: waLink(k.phone, `سلام عليكم، افتقدنا ${firstName(k.name)} في الاجتماع. ربنا يطمّنا عليه.`), target: '_blank', rel: 'noopener', style: 'text-decoration:none' }, 'واتساب'),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { state.openKid = k.id; renderStaff(); } }, 'فتح'))))));
}

let overviewWeek = null;
async function staffOverview(main) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', '/api/staff/overview' + (overviewWeek ? `?start=${overviewWeek}` : '')));
  if (!r) return;
  overviewWeek = r.start;
  const isCurrent = r.start <= r.today && r.today <= r.end;
  const days = Array.from({ length: 7 }, (_, i) => addDays(r.start, i));
  const search = h('input', { id: 'q', type: 'search', placeholder: 'ابحث باسم الولد', 'aria-label': 'بحث' });
  const tbody = h('tbody');
  const draw = () => {
    const q = search.value.trim();
    const rows = r.kids.filter((k) => !q || k.name.includes(q) || (k.phone || '').includes(q));
    fill(tbody, ...rows.map((k) => h('tr', { class: 'click', tabindex: 0, onclick: () => { state.openKid = k.id; renderStaff(); }, onkeydown: (e) => { if (e.key === 'Enter') { state.openKid = k.id; renderStaff(); } } },
      h('td', null, h('div', { class: 'row', style: 'flex-wrap:nowrap' }, avatar(k.id, k.photo, 36),
        h('div', null, h('b', null, k.name), !k.complete && h('div', null, h('span', { class: 'pill bad' }, 'بياناته ناقصة'))))),
      days.map((d) => {
        const rec = k.days[d]; const off = d > r.today;
        return h('td', null, h('span', { class: 'dots' + (off ? ' off' : '') }, h('span', { class: 'dot' + (rec && rec.prayed ? ' on' : ''), title: 'صلاة' }), h('span', { class: 'dot g' + (rec && rec.gospel ? ' on' : ''), title: 'إنجيل' })));
      }),
      h('td', null, k.attendance.length ? h('span', { class: 'pill good' }, k.attendance.length) : h('span', { class: 'muted' }, '-')),
      h('td', null, k.mass ? h('span', { class: 'pill good' }, 'نعم') : h('span', { class: 'muted' }, '-')),
      h('td', null, k.confession ? h('span', { class: 'pill good' }, 'نعم') : h('span', { class: 'muted' }, '-')),
      h('td', null, h('span', { class: 'pill star num' }, String(k.stars.total), starIc())))));
    if (!rows.length) fill(tbody, h('tr', null, h('td', { colspan: 12, style: 'text-align:center;padding:24px' }, r.kids.length ? 'مفيش نتيجة' : 'لسه مفيش أولاد سجلوا في الموقع')));
  };
  search.addEventListener('input', draw);
  const absentSlot = h('div');
  api('GET', '/api/staff/absent').then((a) => { const c = absentCard(a); if (c) absentSlot.replaceChildren(c); }).catch(() => {});
  const complete = r.kids.filter((k) => k.complete).length;
  const attendedWeek = r.kids.filter((k) => k.attendance.length).length;
  fill(main, 
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', { class: 'num' }, String(r.kids.length)), h('span', null, 'ولد مسجل')),
      h('div', { class: 'stat' }, h('b', { class: 'num' }, String(r.kids.length - complete)), h('span', null, 'بياناتهم ناقصة')),
      h('div', { class: 'stat' }, h('b', { class: 'num' }, String(attendedWeek)), h('span', null, 'حضروا الأسبوع ده'))),
    absentSlot,
    h('div', { class: 'row between' },
      h('div', { class: 'weeknav grow' },
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { overviewWeek = addDays(r.start, -7); renderStaff(); } }, 'الأسبوع اللي فات'),
        h('b', { class: 'num' }, isCurrent ? 'الأسبوع ده: ' + weekLabel(r.start, r.end) : weekLabel(r.start, r.end)),
        h('button', { class: 'btn ghost sm', type: 'button', disabled: isCurrent, onclick: () => { overviewWeek = addDays(r.start, 7); renderStaff(); } }, 'الأسبوع الجاي'))),
    h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:var(--good)' }), 'صلى'), h('span', null, h('i', { style: 'background:var(--primary)' }), 'قرأ الإنجيل'), h('span', null, 'الاجتماع = عدد مرات الحضور'), h('span', null, 'الاعتراف = ' + monthLabel(r.confession_month))),
    search,
    h('div', { class: 'tablebox' }, h('table', null,
      h('thead', null, h('tr', null, h('th', null, 'الاسم'), days.map((d) => h('th', null, dayName(d), h('div', { class: 'num' }, shortDate(d)))), h('th', null, 'الاجتماع'), h('th', null, 'القداس'), h('th', null, 'الاعتراف'), h('th', null, 'النجوم'))),
      tbody)));
  draw();
}

async function staffKid(main, id) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', `/api/staff/kid/${id}`));
  if (!r) { state.openKid = null; return renderStaff(); }
  const p = r.profile, s = r.stars;
  const tel = (n) => h('a', { class: 'ltr', href: 'tel:' + n, style: 'color:var(--primary);font-weight:700;display:inline-block' }, n);
  const noteText = h('textarea', { id: 'ntext', placeholder: 'مثلاً: اتكلم أثناء القداس / ساعد زميله' });
  const noteDelta = h('input', { id: 'ndelta', type: 'number', inputmode: 'numeric', min: -20, max: 20, value: '0', class: 'ltr' });
  const addNote = (sign) => async () => {
    let d = Number(noteDelta.value || 0);
    if (sign) d = sign * Math.abs(d || 1);
    const res = await act(() => api('POST', '/api/staff/note', { user_id: id, text: noteText.value, delta: d }), 'تم التسجيل');
    if (res) renderStaff();
  };
  let pw = null;
  const extrasSlot = h('div', { class: 'stack' });
  const loadExtras = () => api('GET', `/api/staff/kid-extras/${id}`).then((x) => {
    const pick = h('select', { 'aria-label': 'إشارة يدوية' }, x.manual.map((m) => h('option', { value: m.code }, `${m.icon} ${m.title}`)));
    const earnedCodes = new Set(x.badges.map((b) => b.code));
    const giveable = x.manual.filter((m) => !earnedCodes.has(m.code));
    return fill(extrasSlot,
      h('div', { class: 'card stack' }, h('h3', null, `الإشارات (${x.badges.length})`),
        x.badges.length ? h('div', { class: 'badges' }, x.badges.map((b) => h('div', { class: 'badge on', title: b.desc },
          h('span', { class: 'bi', 'aria-hidden': 'true' }, b.icon), h('b', null, b.title),
          canMark() && b.kind === 'manual' && h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { if (await act(() => api('POST', '/api/staff/badge-revoke', { user_id: id, code: b.code }), 'اتسحبت الإشارة')) loadExtras(); } }, 'سحب')))) : h('p', { class: 'muted' }, 'لسه مخدش إشارات'),
        canMark() && giveable.length > 0 && h('div', { class: 'row' }, (() => { pick.replaceChildren(...giveable.map((m) => h('option', { value: m.code }, `${m.icon} ${m.title}`))); return pick; })(),
          h('button', { class: 'btn', type: 'button', onclick: async () => { if (await act(() => api('POST', '/api/staff/badge-give', { user_id: id, code: pick.value }), 'اتمنحت الإشارة')) loadExtras(); } }, 'امنح الإشارة'))),
      h('div', { class: 'card stack' }, h('h3', null, 'اللي كتبه عن قراءته'),
        x.readings.length ? h('div', { class: 'list' }, x.readings.map((rd) => h('div', { class: 'read-note' }, h('div', { class: 'row between' }, h('b', null, rd.ref), h('span', { class: 'muted small num' }, `${dayName(rd.day)} ${shortDate(rd.day)}`)), h('p', { style: 'margin:.3rem 0 0' }, rd.note)))) : h('p', { class: 'muted' }, 'لسه ما كتبش حاجة')));
  }).catch(() => {});
  loadExtras();

  fill(main, 
    h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: () => { state.openKid = null; renderStaff(); } }, 'رجوع للقائمة'),
    h('div', { class: 'card stack' },
      h('div', { class: 'row between' }, h('div', { class: 'row', style: 'flex-wrap:nowrap' }, avatar(p.id, p.photo, 64), h('h2', null, p.name)), h('span', { class: 'pill star num', style: 'font-size:1rem' }, String(s.total), starIc())),
      h('dl', { class: 'kv' },
        h('dt', null, 'موبايل الولد'), h('dd', null, tel(p.phone)),
        h('dt', null, 'موبايل ماما'), h('dd', null, p.mother_phone ? tel(p.mother_phone) : h('span', { class: 'muted' }, 'لسه ما اتكتبش')),
        h('dt', null, 'موبايل بابا'), h('dd', null, p.father_phone ? tel(p.father_phone) : h('span', { class: 'muted' }, 'لسه ما اتكتبش')),
        h('dt', null, 'العنوان'), h('dd', null, p.address || '-'),
        h('dt', null, 'أب الاعتراف'), h('dd', null, p.confessor || '-'),
        h('dt', null, 'المدرسة'), h('dd', null, p.school || '-'),
        h('dt', null, 'تاريخ الميلاد'), h('dd', null, r.birthday ? `${shortDate(r.birthday.birth)} ${r.birthday.birth.slice(0, 4)} (${ageText(r.birthday)})` : h('span', { class: 'muted' }, 'لسه ما اتكتبش')),
        h('dt', null, 'الإخوات'), h('dd', null, p.siblings.length ? p.siblings.map((x) => h('div', null, `${x.name}${x.age ? ' - ' + x.age + ' سنة' : ''}${x.grade ? ' - ' + x.grade : ''}`)) : 'مفيش'))),
    h('div', { class: 'card stack' }, h('h3', null, 'النجوم'),
      h('div', { class: 'stats' },
        [['الصلاة', s.prayer], ['الإنجيل', s.gospel], ['القداس', s.mass], ['الاعتراف', s.confession], ['الاجتماع', s.attendance], ['المسابقة', s.quiz], ['الدروس', s.lesson || 0], ['اللعبة', s.game || 0], ['زيادة/خصم', s.adjust]].map(([l, n]) =>
          h('div', { class: 'stat' }, h('b', { class: 'num' }, String(n)), h('span', null, l))))),
    extrasSlot,
    h('div', { class: 'card stack' }, h('h3', null, 'آخر 4 أسابيع'),
      r.days.length ? h('div', { class: 'tablebox' }, h('table', null,
        h('thead', null, h('tr', null, h('th', null, 'اليوم'), h('th', null, 'صلاة'), h('th', null, 'إنجيل'))),
        h('tbody', null, r.days.map((d) => h('tr', null, h('td', null, `${dayName(d.day)} ${shortDate(d.day)}`), h('td', null, d.prayed ? h('span', { class: 'pill good' }, 'نعم') : '-'), h('td', null, d.gospel ? h('span', { class: 'pill good' }, 'نعم') : '-')))))) : h('p', { class: 'muted' }, 'لسه ما سجلش حاجة'),
      h('p', { class: 'muted small' }, 'القداس: ' + (r.masses.length ? r.masses.map(shortDate).join('، ') : 'لا يوجد'), h('br'), 'الاعتراف: ' + (r.confessions.length ? r.confessions.map(monthLabel).join('، ') : 'لا يوجد'), h('br'), 'حضور الاجتماع: ' + (r.attendance.length ? r.attendance.map(shortDate).join('، ') : 'لا يوجد'))),
    canMark() && staffCheerCard(id, p.name),
    h('div', { class: 'card stack' }, h('h3', null, 'ملاحظات وتعديل النجوم'),
      canMark() ? h('div', { class: 'stack' },
        h('label', { class: 'f', for: 'ntext' }, h('span', null, 'الملاحظة'), noteText),
        h('label', { class: 'f', for: 'ndelta' }, h('span', null, 'عدد النجوم ', h('small', null, '(اكتب الرقم ثم اختار زيادة أو خصم. 0 معناها ملاحظة بس)')), noteDelta),
        h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', onclick: addNote(1) }, 'زيادة نجوم'),
          h('button', { class: 'btn bad', type: 'button', onclick: addNote(-1) }, 'خصم نجوم'),
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { noteDelta.value = '0'; await addNote(0)(); } }, 'ملاحظة بدون نجوم'))) : h('p', { class: 'muted' }, 'صلاحيتك متابعة فقط. تقدر تشوف الملاحظات بس.'),
      r.notes.length ? h('div', { class: 'list' }, r.notes.map((n) => h('div', { class: 'row between', style: 'align-items:flex-start' },
        h('div', { class: 'grow' }, h('div', null, n.text), h('span', { class: 'muted small num' }, `${n.created_at.slice(0, 10)}${n.by_name ? ' - ' + n.by_name : ''}`)),
        h('div', { class: 'row' },
          n.delta !== 0 && h('span', { class: 'pill ' + (n.delta > 0 ? 'good' : 'bad') }, (n.delta > 0 ? '+' : '') + n.delta, starIc()),
          state.me.user.role === 'admin' && h('button', { class: 'btn bad sm', type: 'button', onclick: async (e) => {
            if (!e.currentTarget.dataset.sure) { e.currentTarget.dataset.sure = '1'; e.currentTarget.textContent = 'تأكيد الحذف'; return; }
            const x = await act(() => api('DELETE', `/api/admin/note/${n.id}`), 'تم الحذف'); if (x) renderStaff();
          } }, 'حذف'))))) : h('p', { class: 'muted' }, 'مفيش ملاحظات')),
    state.me.user.role === 'admin' && editKidCard(id, p, () => renderStaff()),
    state.me.user.role === 'admin' && (() => { const mount = h('div'); return h('div', { class: 'card stack' }, h('h3', null, 'نسيت كلمة السر؟'), h('p', { class: 'muted' }, 'ولّد كلمة سر مؤقتة وابعتها له، وهو هيختار كلمة جديدة أول ما يدخل.'), h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: () => makeTempPassword(id, mount) }, 'كلمة سر مؤقتة'), mount); })(),
    state.me.user.role === 'admin' && h('div', { class: 'card stack' }, h('h3', null, 'تغيير كلمة سر الولد'),
      h('div', { class: 'row' }, (pw = h('input', { id: 'kidpw', class: 'ltr grow', placeholder: 'كلمة سر جديدة (6 على الأقل)', 'aria-label': 'كلمة سر جديدة' })),
        h('button', { class: 'btn', type: 'button', onclick: async () => { const x = await act(() => api('POST', '/api/admin/reset-password', { user_id: id, password: pw.value }), 'تم تغيير كلمة السر'); if (x) pw.value = ''; } }, 'تغيير'))),
    state.me.user.role === 'admin' && h('div', { class: 'card stack' }, h('h3', null, 'حذف الحساب'),
      h('p', { class: 'muted' }, 'بيمسح الحساب وكل بياناته ونجومه وصورته نهائياً، ومينفعش يتراجع عنه.'),
      sureButton('حذف حساب ' + p.name, 'اضغط تاني للتأكيد النهائي', async () => {
        const x = await act(() => api('DELETE', `/api/admin/user/${id}`), 'تم حذف الحساب');
        if (x) { state.openKid = null; renderStaff(); }
      })));
  window.scrollTo(0, 0);
}

let attDay = null;
async function staffAttendance(main) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const ov = await act(() => api('GET', '/api/staff/overview'));
  if (!ov) return;
  const today = ov.today;
  if (!attDay) attDay = today;
  const at = await act(() => api('GET', `/api/staff/attendance?day=${attDay}`));
  if (!at) return;
  const present = new Set(at.present);
  const editable = canMark();
  const dateIn = h('input', { id: 'attday', type: 'date', max: today, value: attDay, class: 'ltr', onchange: (e) => { if (e.target.value) { attDay = e.target.value; renderStaff(); } } });
  const counter = h('b', { class: 'num' }, String(present.size));
  const list = h('div', { class: 'card list' });
  const draw = () => {
    fill(list, ...ov.kids.map((k) => {
      const cb = h('input', { type: 'checkbox', id: 'att' + k.id, checked: present.has(k.id), disabled: !editable, onchange: (e) => { if (e.target.checked) present.add(k.id); else present.delete(k.id); counter.textContent = String(present.size); } });
      return h('label', { class: 'attrow', for: 'att' + k.id }, cb, h('span', { class: 'grow' }, k.name));
    }));
    if (!ov.kids.length) fill(list, h('p', { class: 'muted' }, 'لسه مفيش أولاد سجلوا'));
  };
  fill(main, 
    h('div', { class: 'card stack' },
      h('h2', null, 'حضور الاجتماع'),
      h('label', { class: 'f', for: 'attday' }, h('span', null, 'تاريخ الاجتماع'), dateIn),
      h('p', { class: 'muted' }, 'الحاضرين: ', counter, ' من ' + ov.kids.length + '. كل ولد حاضر بياخد نجمة.'),
      editable && h('div', { class: 'row' },
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { ov.kids.forEach((k) => present.add(k.id)); counter.textContent = String(present.size); draw(); } }, 'تحديد الكل'),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { present.clear(); counter.textContent = '0'; draw(); } }, 'إلغاء التحديد')),
      !editable && h('p', { class: 'notice' }, 'صلاحيتك متابعة فقط. التسجيل للخدام والمسؤول.')),
    list,
    editable && h('button', { class: 'btn block', type: 'button', onclick: () => act(() => api('POST', '/api/staff/attendance', { day: attDay, present: [...present] }), 'تم حفظ الحضور') }, 'حفظ الحضور'));
  draw();
}

async function staffTeam(main) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', '/api/admin/staff'));
  if (!r) return;
  const f = { name: h('input', { id: 'sname' }), phone: h('input', { id: 'sphone', class: 'ltr', type: 'tel' }), pw: h('input', { id: 'spw', class: 'ltr', placeholder: '6 على الأقل' }),
    role: h('select', { id: 'srole' }, h('option', { value: 'viewer' }, 'متابع (يشوف بس)'), h('option', { value: 'servant' }, 'خادم (يسجل الحضور والنجوم والملاحظات)')) };
  const reqCard = await resetRequestsCard(() => renderStaff());
  const gameCard = await gameAdminCard();
  const lvCard = await levelCard();
  const contentCardAdmin = await contentAdminCard();
  const stagesCardEl = await stagesCard();
  fill(main, reqCard, gameCard, lvCard, stagesCardEl, contentCardAdmin,
    h('div', { class: 'card stack' }, h('h3', null, 'الخدام والمتابعين'),
      h('div', { class: 'list' }, r.staff.map((u) => h('div', { class: 'row between' },
        h('div', null, h('b', null, u.name), h('div', { class: 'muted small ltr', style: 'text-align:start' }, u.phone)),
        u.role === 'admin' ? h('span', { class: 'pill' }, 'مسؤول') : h('div', { class: 'row' },
          sureButton('حذف', 'تأكيد الحذف', async () => { const x = await act(() => api('DELETE', `/api/admin/user/${u.id}`), 'تم حذف الحساب'); if (x) renderStaff(); }),
          h('select', { 'aria-label': 'صلاحية ' + u.name, style: 'width:auto', onchange: (e) => act(() => api('PATCH', `/api/admin/staff/${u.id}`, { role: e.target.value }), 'تم تغيير الصلاحية') },
            h('option', { value: 'viewer', selected: u.role === 'viewer' }, 'متابع'), h('option', { value: 'servant', selected: u.role === 'servant' }, 'خادم'))))))),
    h('form', { class: 'card stack', onsubmit: async (e) => {
      e.preventDefault();
      const x = await act(() => api('POST', '/api/admin/staff', { name: f.name.value, phone: f.phone.value, password: f.pw.value, role: f.role.value }), 'تمت الإضافة');
      if (x) renderStaff();
    } },
      h('h3', null, 'إضافة خادم أو متابع'),
      h('label', { class: 'f', for: 'sname' }, h('span', null, 'الاسم'), f.name),
      h('div', { class: 'grid2' },
        h('label', { class: 'f', for: 'sphone' }, h('span', null, 'رقم الموبايل (للدخول)'), f.phone),
        h('label', { class: 'f', for: 'spw' }, h('span', null, 'كلمة السر'), f.pw)),
      h('label', { class: 'f', for: 'srole' }, h('span', null, 'الصلاحية'), f.role),
      h('button', { class: 'btn', type: 'submit' }, 'إضافة')),
    h('div', { class: 'card stack' }, h('h3', null, 'بيانات الأولاد'),
      h('p', { class: 'muted' }, 'تنزيل ملف Excel فيه بيانات كل الأولاد وأرقام أهاليهم ومجموع نجومهم.'),
      h('a', { class: 'btn', href: '/api/admin/export.csv', style: 'text-decoration:none;justify-self:start' }, 'تنزيل الملف')),
    await backupCard(),
    auditCard(),
    h('p', { class: 'muted small' }, 'لتغيير كلمة سر ولد: افتح الولد من "متابعة الأسبوع" واستخدم خانة تغيير كلمة السر.'));
}

function staffMe(main) {
  fill(main, h('div', { class: 'wrap stack' }, canMark() && pushCard(), installCard(), passwordCard(), h('button', { class: 'btn ghost', type: 'button', onclick: logout }, 'تسجيل الخروج')));
}


// ====================== المسابقة ======================
function statusPill(st) {
  const m = { open: ['مفتوحة', 'good'], closed: ['مقفولة', ''], draft: ['مسودة', 'bad'] }[st] || ['', ''];
  return h('span', { class: 'pill ' + m[1] }, m[0]);
}

// ---- الولد ----
async function kidQuiz(main) {
  if (state.openContest) return kidQuizOne(main, state.openContest);
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', '/api/contests'));
  if (!r) return;
  fill(main, h('h2', null, 'مسابقة الإنجيل'),
    r.contests.length ? h('div', { class: 'stack' }, r.contests.map((c) => h('button', { class: 'card row between quiz-item', type: 'button', onclick: () => { state.openContest = c.id; renderKid(); } },
      h('div', { class: 'grow' }, h('b', null, c.title), h('div', { class: 'muted small' }, `${c.count} سؤال - أعلى درجة ${c.max}`)),
      c.submitted ? h('span', { class: 'pill star' }, c.pending ? 'سلّمت - قيد التصحيح' : `${c.score} من ${c.max}`) : statusPill(c.status))))
      : h('div', { class: 'card' }, h('p', { class: 'muted' }, 'مفيش مسابقة دلوقتي. استنى المسابقة الجاية.')));
}

async function kidQuizOne(main, id) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', `/api/contest/${id}`));
  if (!r) { state.openContest = null; return kidQuiz(main); }
  const { contest: c, mine } = r;
  const back = h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: () => { state.openContest = null; renderKid(); } }, 'رجوع للمسابقات');
  // نتيجة (سلّم قبل كده أو المسابقة اتقفلت)
  if (mine || c.status !== 'open') {
    const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
    fill(main, back,
      h('div', { class: 'card stack' }, h('h2', null, c.title),
        mine ? h('div', { class: 'row' }, h('span', { class: 'pill star', style: 'font-size:1rem' }, `${mine.score} من ${c.max}`, starIc()), mine.pending > 0 && h('span', { class: 'pill' }, `${mine.pending} سؤال كتابي قيد التصحيح`))
             : h('p', { class: 'notice' }, 'المسابقة دي اتقفلت وانت ما سلّمتش إجاباتك.'),
        mine && c.status === 'open' && h('p', { class: 'muted small' }, 'الإجابات الصحيحة هتظهر لما المسابقة تقفل.')),
      c.questions.map((q, i) => {
        const my = mine ? mine.answers[q.id] : null; const pts = mine ? mine.scores[q.id] : null;
        return h('div', { class: 'card stack' },
          h('div', { class: 'row between', style: 'align-items:flex-start' }, h('b', { class: 'grow' }, `${i + 1}. ${q.text}`),
            mine && h('span', { class: 'pill ' + (pts === null ? '' : pts > 0 ? 'good' : 'bad') }, pts === null ? 'قيد التصحيح' : `${pts} من ${q.points}`)),
          q.type === 'mcq'
            ? h('div', { class: 'stack', style: 'gap:6px' }, q.options.map((o, k) => h('div', { class: 'opt' + (q.correct === k ? ' right' : '') + (my === k && q.correct !== undefined && q.correct !== k ? ' wrong' : '') + (my === k ? ' mine' : '') },
                h('span', { class: 'ltr-letter' }, letters[k]), h('span', { class: 'grow' }, o), my === k && h('span', { class: 'pill' }, 'إجابتك'), q.correct === k && h('span', { class: 'pill good' }, 'الصحيحة'))))
            : h('div', { class: 'opt mine' }, my ? my : h('span', { class: 'muted' }, 'ما كتبتش إجابة')));
      }));
    return;
  }
  // نموذج الحل
  const err = h('div', { class: 'err', hidden: true, role: 'alert' });
  const btn = h('button', { class: 'btn block', type: 'button' }, 'سلّم الإجابات');
  const form = h('form', { class: 'stack', novalidate: true });
  const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
  c.questions.forEach((q, i) => {
    form.append(h('div', { class: 'card stack' },
      h('div', { class: 'row between', style: 'align-items:flex-start' }, h('b', { class: 'grow' }, `${i + 1}. ${q.text}`), h('span', { class: 'pill' }, `${q.points} ${q.points > 2 ? 'درجات' : q.points === 2 ? 'درجتين' : 'درجة'}`)),
      q.type === 'mcq'
        ? h('div', { class: 'stack', style: 'gap:6px' }, q.options.map((o, k) => h('label', { class: 'opt pick', for: `${q.id}_${k}` },
            h('input', { type: 'radio', name: q.id, id: `${q.id}_${k}`, value: String(k) }), h('span', { class: 'ltr-letter' }, letters[k]), h('span', { class: 'grow' }, o))))
        : h('textarea', { id: 'a_' + q.id, placeholder: 'اكتب إجابتك هنا', maxlength: 500, 'aria-label': 'إجابة السؤال ' + (i + 1) })));
  });
  btn.addEventListener('click', async () => {
    if (!btn.dataset.sure) { btn.dataset.sure = '1'; btn.textContent = 'اضغط تاني للتسليم النهائي (مش هتقدر تعدّل)'; setTimeout(() => { delete btn.dataset.sure; btn.textContent = 'سلّم الإجابات'; }, 6000); return; }
    const answers = {};
    for (const q of c.questions) {
      if (q.type === 'mcq') { const ch = form.querySelector(`input[name="${q.id}"]:checked`); if (ch) answers[q.id] = Number(ch.value); }
      else answers[q.id] = form.querySelector('#a_' + q.id).value;
    }
    err.hidden = true;
    try { await api('POST', `/api/contest/${id}/submit`, { answers }); toast('تم تسليم إجاباتك'); renderKid(); }
    catch (ex) { err.textContent = ex.message; err.hidden = false; delete btn.dataset.sure; btn.textContent = 'سلّم الإجابات'; }
  });
  fill(main, back, h('div', { class: 'card stack' }, h('h2', null, c.title), h('p', { class: 'muted' }, `أعلى درجة ${c.max}. كل درجة بنجمة. تسلّم مرة واحدة بس، فراجع إجاباتك قبل التسليم.`)), form, err, btn);
}

// ---- الخدام والمسؤول ----
async function staffQuiz(main) {
  if (state.builder) return quizBuilder(main, state.builder);
  if (state.staffContest) return staffQuizOne(main, state.staffContest);
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', '/api/staff/contests'));
  if (!r) return;
  const admin = state.me.user.role === 'admin';
  fill(main,
    h('div', { class: 'row between' }, h('h2', null, 'مسابقة الإنجيل'),
      admin && h('button', { class: 'btn', type: 'button', onclick: () => { state.builder = { id: null, title: '', questions: [newQuestion()] }; renderStaff(); } }, 'مسابقة جديدة')),
    r.contests.length ? h('div', { class: 'stack' }, r.contests.map((c) => h('button', { class: 'card row between quiz-item', type: 'button', onclick: () => { state.staffContest = c.id; renderStaff(); } },
      h('div', { class: 'grow' }, h('b', null, c.title), h('div', { class: 'muted small' }, `${c.count} سؤال - أعلى درجة ${c.max} - سلّم ${c.submissions} ولد`)), statusPill(c.status))))
      : h('div', { class: 'card' }, h('p', { class: 'muted' }, admin ? 'لسه ما عملتش مسابقة. اضغط "مسابقة جديدة".' : 'مفيش مسابقات لسه.')));
}

const newQuestion = () => ({ type: 'mcq', text: '', points: 1, options: ['', ''], correct: 0 });

function quizBuilder(main, b) {
  const err = h('div', { class: 'err', hidden: true, role: 'alert' });
  const box = h('div', { class: 'stack' });
  const title = h('input', { id: 'ctitle', value: b.title, placeholder: 'مثلاً: مسابقة إنجيل متى - الأصحاح 5', oninput: (e) => { b.title = e.target.value; } });
  const draw = () => {
    fill(box, b.questions.map((q, i) => {
      const optsBox = h('div', { class: 'stack', style: 'gap:6px' });
      if (q.type === 'mcq') {
        q.options.forEach((o, k) => optsBox.append(h('div', { class: 'row', style: 'flex-wrap:nowrap' },
          h('input', { type: 'radio', name: 'correct' + i, checked: q.correct === k, 'aria-label': 'الإجابة الصحيحة', style: 'width:22px;flex:none', onchange: () => { q.correct = k; } }),
          h('input', { value: o, placeholder: 'اختيار ' + (k + 1), 'aria-label': `اختيار ${k + 1} للسؤال ${i + 1}`, oninput: (e) => { q.options[k] = e.target.value; } }),
          q.options.length > 2 && h('button', { class: 'btn bad sm', type: 'button', onclick: () => { q.options.splice(k, 1); if (q.correct >= q.options.length) q.correct = 0; else if (q.correct > k) q.correct--; draw(); } }, 'مسح'))));
        if (q.options.length < 6) optsBox.append(h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: () => { q.options.push(''); draw(); } }, 'إضافة اختيار'));
        optsBox.append(h('p', { class: 'muted small' }, 'الدايرة جنب الاختيار الصحيح.'));
      }
      return h('div', { class: 'card stack' },
        h('div', { class: 'row between' }, h('b', null, `سؤال ${i + 1}`), b.questions.length > 1 && h('button', { class: 'btn bad sm', type: 'button', onclick: () => { b.questions.splice(i, 1); draw(); } }, 'مسح السؤال')),
        h('div', { class: 'grid2' },
          h('label', { class: 'f', for: 'qt' + i }, h('span', null, 'نوع السؤال'), h('select', { id: 'qt' + i, onchange: (e) => { q.type = e.target.value; if (q.type === 'mcq' && !q.options) { q.options = ['', '']; q.correct = 0; } draw(); } },
            h('option', { value: 'mcq', selected: q.type === 'mcq' }, 'اختيار من متعدد'), h('option', { value: 'text', selected: q.type === 'text' }, 'كتابي (بتصححه إنت)'))),
          h('label', { class: 'f', for: 'qp' + i }, h('span', null, 'الدرجة'), h('input', { id: 'qp' + i, type: 'number', min: 1, max: 10, value: q.points, class: 'ltr', oninput: (e) => { q.points = Number(e.target.value); } }))),
        h('label', { class: 'f', for: 'qx' + i }, h('span', null, 'نص السؤال'), h('textarea', { id: 'qx' + i, oninput: (e) => { q.text = e.target.value; }, value: q.text })),
        q.type === 'mcq' && optsBox);
    }), b.questions.length < 30 && h('button', { class: 'btn ghost', type: 'button', onclick: () => { b.questions.push(newQuestion()); draw(); } }, 'إضافة سؤال'));
    box.querySelectorAll('textarea').forEach((t, i) => { t.value = b.questions[i] ? b.questions[i].text : ''; });
  };
  draw();
  const save = (status) => async () => {
    err.hidden = true;
    const body = { title: b.title, questions: b.questions.map((q) => (q.type === 'mcq' ? { type: 'mcq', text: q.text, points: q.points, options: q.options, correct: q.correct } : { type: 'text', text: q.text, points: q.points })), status };
    try {
      if (b.id) await api('PUT', `/api/admin/contest/${b.id}`, body); else await api('POST', '/api/admin/contest', body);
      toast('تم الحفظ'); state.builder = null; renderStaff();
    } catch (ex) { err.textContent = ex.message; err.hidden = false; err.scrollIntoView({ block: 'center' }); }
  };
  fill(main,
    h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: () => { state.builder = null; renderStaff(); } }, 'رجوع'),
    h('div', { class: 'card stack' }, h('h2', null, b.id ? 'تعديل المسابقة' : 'مسابقة جديدة'), h('label', { class: 'f', for: 'ctitle' }, h('span', null, 'عنوان المسابقة'), title)),
    box, err,
    h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', onclick: save('open') }, b.id ? 'حفظ' : 'حفظ وفتح للأولاد'),
      !b.id && h('button', { class: 'btn ghost', type: 'button', onclick: save('draft') }, 'حفظ كمسودة')));
}

async function staffQuizOne(main, id) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', `/api/staff/contest/${id}`));
  if (!r) { state.staffContest = null; return staffQuiz(main); }
  const { contest: c, submissions, missing } = r;
  const admin = state.me.user.role === 'admin', canGrade = canMark();
  const setStatus = (st, msg) => async () => { const x = await act(() => api('PATCH', `/api/admin/contest/${id}`, { status: st }), msg); if (x) renderStaff(); };
  const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
  fill(main,
    h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: () => { state.staffContest = null; renderStaff(); } }, 'رجوع للمسابقات'),
    h('div', { class: 'card stack' },
      h('div', { class: 'row between' }, h('h2', null, c.title), statusPill(c.status)),
      h('p', { class: 'muted' }, `${c.questions.length} سؤال - أعلى درجة ${c.max} - سلّم ${submissions.length} ولد`),
      admin && h('div', { class: 'row' },
        c.status !== 'open' && h('button', { class: 'btn sm', type: 'button', onclick: setStatus('open', 'المسابقة اتفتحت') }, c.status === 'closed' ? 'إعادة فتح' : 'فتح للأولاد'),
        c.status === 'open' && h('button', { class: 'btn sm', type: 'button', onclick: setStatus('closed', 'المسابقة اتقفلت') }, 'قفل وإظهار الإجابات الصحيحة'),
        c.status !== 'draft' && submissions.length === 0 && h('button', { class: 'btn ghost sm', type: 'button', onclick: setStatus('draft', 'رجعت مسودة') }, 'رجوع لمسودة'),
        submissions.length === 0 && h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { state.builder = { id: c.id, title: c.title, questions: c.questions.map((q) => ({ type: q.type, text: q.text, points: q.points, options: q.options ? [...q.options] : ['', ''], correct: q.correct || 0 })) }; renderStaff(); } }, 'تعديل الأسئلة'),
        sureButton('حذف المسابقة', 'تأكيد الحذف النهائي', async () => { const x = await act(() => api('DELETE', `/api/admin/contest/${id}`), 'تم حذف المسابقة'); if (x) { state.staffContest = null; renderStaff(); } }))),
    h('div', { class: 'card stack' }, h('h3', null, 'الأسئلة والإجابات الصحيحة'),
      h('div', { class: 'list' }, c.questions.map((q, i) => h('div', null, h('b', null, `${i + 1}. ${q.text}`, ' '), h('span', { class: 'pill' }, q.type === 'mcq' ? `اختيار - ${q.points}` : `كتابي - ${q.points}`),
        q.type === 'mcq' && h('div', { class: 'muted small' }, q.options.map((o, k) => `${letters[k]}) ${o}${k === q.correct ? ' ✓' : ''}`).join('   ')))))),
    h('h3', null, 'إجابات الأولاد'),
    submissions.length ? submissions.map((s) => {
      const totalEl = h('span', { class: 'pill star num' }, `${s.score} من ${c.max}`, starIc());
      const pendEl = h('span', { class: 'pill', hidden: !s.pending }, `${s.pending} قيد التصحيح`);
      return h('div', { class: 'card stack' },
        h('div', { class: 'row between' }, h('b', null, s.name), h('div', { class: 'row' }, pendEl, totalEl)),
        h('div', { class: 'list' }, c.questions.map((q, i) => {
          const a = s.answers[q.id]; const pts = s.scores[q.id];
          if (q.type === 'mcq') return h('div', { class: 'row between', style: 'align-items:flex-start' },
            h('div', { class: 'grow' }, h('span', { class: 'muted small' }, `سؤال ${i + 1}`), h('div', null, a === null || a === undefined ? 'ما جاوبش' : q.options[a])),
            h('span', { class: 'pill ' + (pts > 0 ? 'good' : 'bad') }, `${pts} من ${q.points}`));
          const inp = h('input', { type: 'number', min: 0, max: q.points, class: 'ltr', style: 'width:76px', value: pts === null || pts === undefined ? '' : pts, placeholder: '0-' + q.points, 'aria-label': `درجة ${s.name} في سؤال ${i + 1}`, disabled: !canGrade || !a });
          return h('div', { class: 'stack', style: 'gap:6px' },
            h('span', { class: 'muted small' }, `سؤال ${i + 1} (كتابي)`), h('div', { class: 'opt mine' }, a ? a : h('span', { class: 'muted' }, 'ما كتبش إجابة')),
            a && h('div', { class: 'row' }, inp, h('span', { class: 'muted small' }, `من ${q.points}`),
              canGrade && h('button', { class: 'btn sm', type: 'button', onclick: async () => {
                const res = await act(() => api('POST', `/api/staff/contest/${id}/grade`, { user_id: s.user_id, question_id: q.id, points: Number(inp.value) }), 'تم حفظ الدرجة');
                if (res) { totalEl.firstChild.textContent = `${res.score} من ${c.max}`; pendEl.hidden = !res.pending; pendEl.textContent = `${res.pending} قيد التصحيح`; }
              } }, 'حفظ الدرجة')));
        })));
    }) : h('div', { class: 'card' }, h('p', { class: 'muted' }, 'لسه ما حدش سلّم.')),
    missing.length > 0 && h('div', { class: 'card stack' }, h('h3', null, `لسه ما سلّموش (${missing.length})`), h('p', { class: 'muted' }, missing.join('، '))));
}


// ====================== أعياد الميلاد (شريط الخدام) ======================
async function staffBirthdays(box) {
  let r; try { r = await api('GET', '/api/staff/birthdays'); } catch { return; }
  const names = r.today.map((k) => k.name);
  const listJoin = (a) => a.length < 3 ? a.join(' و') : a.slice(0, -1).join('، ') + ' و' + a[a.length - 1];
  const parts = [];
  if (names.length) {
    parts.push(h('div', { class: 'bday-card staff' }, (() => { const c = icon('cake'); c.setAttribute('class', 'bday-ic'); return c; })(),
      h('div', null, h('b', null, names.length === 1 ? `النهارده عيد ميلاد ${names[0]}` : `النهارده عيد ميلاد المجموعة دي (${names.length} أولاد)`),
        h('p', null, names.length === 1 ? `يكمّل ${arYears(r.today[0].turning)}. فاكّروه بتهنئة.` : listJoin(names)))));
  }
  if (r.upcoming.length || r.missing) {
    parts.push(h('details', { class: 'card bday-more' }, h('summary', null, r.upcoming.length ? `أعياد الميلاد القادمة (${r.upcoming.length})` : 'أعياد الميلاد'),
      r.upcoming.length ? h('div', { class: 'list' }, r.upcoming.map((k) => h('div', { class: 'row between' },
        h('span', null, h('b', null, k.name), h('span', { class: 'muted small' }, ` - هيكمّل ${arYears(k.turning)}`)),
        h('span', { class: 'pill' }, k.days_until === 1 ? 'بكره' : `بعد ${arDays(k.days_until)}`)))) : h('p', { class: 'muted' }, 'مفيش أعياد ميلاد في الـ 30 يوم الجايين.'),
      r.missing > 0 && h('p', { class: 'muted small', style: 'margin-top:8px' }, `${r.missing} ${r.missing > 10 ? 'ولد' : 'أولاد'} لسه ما كتبوش تاريخ ميلادهم.`)));
  }
  fill(box, parts);
}

// ====================== المكتبة: روابط وفيديوهات ======================
function safeHref(u) { return /^https?:\/\//i.test(u) ? u : '#'; }
function resourceCard(r, admin, reload) {
  const media = h('div');
  if (r.kind === 'video' && r.video_id) {
    const box = h('div', { class: 'video-box' });
    const play = h('button', { class: 'play', type: 'button', 'aria-label': 'تشغيل الفيديو: ' + r.title }, (() => { const st = icon('star'); return st; })(), h('span', null, 'تشغيل الفيديو'));
    play.addEventListener('click', () => {
      box.replaceChildren(h('iframe', { src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(r.video_id)}?rel=0`, title: r.title, allow: 'accelerometer; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin', sandbox: 'allow-scripts allow-same-origin allow-presentation allow-popups', loading: 'lazy' }));
    });
    box.append(play); media.append(box);
  }
  return h('div', { class: 'card stack' },
    h('div', { class: 'row between', style: 'align-items:flex-start' }, h('div', { class: 'grow' }, h('b', null, r.title), r.description && h('p', { class: 'muted' }, r.description)),
      h('span', { class: 'pill' }, r.kind === 'video' ? 'فيديو' : 'رابط')),
    media,
    h('div', { class: 'row' }, h('a', { class: 'btn ghost sm', href: safeHref(r.url), target: '_blank', rel: 'noopener noreferrer', style: 'text-decoration:none' }, r.kind === 'video' ? (r.video_id ? 'فتح في يوتيوب' : 'فتح الفيديو') : 'فتح الرابط'),
      admin && sureButton('حذف', 'تأكيد الحذف', async () => { const x = await act(() => api('DELETE', `/api/admin/resource/${r.id}`), 'تم الحذف'); if (x) reload(); })));
}
async function libraryView(main, admin, kind) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const load = async () => {
    const r = await act(() => api('GET', '/api/resources'));
    if (!r) return;
    const items = r.resources.filter((x) => !kind || x.kind === kind);
    const title = h('input', { id: 'rtitle', placeholder: 'مثلاً: ترنيمة الأسبوع' });
    const url = h('input', { id: 'rurl', class: 'ltr', placeholder: 'https://www.youtube.com/watch?v=...', inputmode: 'url' });
    const desc = h('textarea', { id: 'rdesc', placeholder: 'وصف قصير (اختياري)', maxlength: 400 });
    const err = h('div', { class: 'err', hidden: true, role: 'alert' });
    const form = admin ? h('form', { class: 'card stack', novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); err.hidden = true;
      try { await api('POST', '/api/admin/resource', { title: title.value, url: url.value, description: desc.value, kind }); toast('تمت الإضافة'); load(); }
      catch (ex) { err.textContent = ex.message; err.hidden = false; }
    } },
      h('h3', null, kind === 'video' ? 'إضافة فيديو' : 'إضافة رابط'),
      h('label', { class: 'f', for: 'rtitle' }, h('span', null, 'العنوان'), title),
      h('label', { class: 'f', for: 'rurl' }, h('span', null, 'الرابط ', h('small', null, '(روابط يوتيوب بتتشغّل جوه الموقع، وأي رابط تاني زي جوجل درايف بيتفتح في صفحته)')), url),
      h('label', { class: 'f', for: 'rdesc' }, h('span', null, 'الوصف'), desc), err,
      h('button', { class: 'btn', type: 'submit' }, 'إضافة')) : null;
    fill(main, form,
      items.length ? items.map((x) => resourceCard(x, admin, load)) : h('div', { class: 'card' }, h('p', { class: 'muted' }, admin ? 'لسه مفيش حاجة هنا. أضف أول واحد من فوق.' : 'مفيش حاجة هنا لسه. هتظهر لما الخدام يضيفوها.')));
  };
  load();
}

function pendingCard(list, onChange) {
  return h('div', { class: 'card stack', style: 'border-color:var(--star)' }, h('h3', null, `حسابات جديدة مستنية موافقتك (${list.length})`),
    h('p', { class: 'muted small' }, 'اتأكد إنه ولد من الفصل قبل ما توافق. اللي مش معروف ارفضه وهيتمسح.'),
    list.map((p) => h('div', { class: 'row between' },
      h('div', null, h('b', null, p.name), h('div', { class: 'muted small num' }, `${p.phone ? p.phone + ' - ' : ''}${p.created_at.slice(0, 16)}`)),
      h('div', { class: 'row' },
        h('button', { class: 'btn sm', type: 'button', onclick: async () => { const x = await act(() => api('POST', `/api/staff/pending/${p.id}/approve`), 'تم قبول الحساب'); if (x) onChange(); } }, 'قبول'),
        sureButton('رفض', 'تأكيد الرفض', async () => { const x = await act(() => api('POST', `/api/staff/pending/${p.id}/reject`), 'تم رفض الحساب'); if (x) onChange(); })))));
}

// ====================== تثبيت التطبيق والتنبيهات ======================
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
let deferredInstall = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

function installCard() {
  if (isStandalone()) return null;
  const steps = h('p', { class: 'muted', hidden: true });
  return h('div', { class: 'card stack' },
    h('h3', null, 'أيقونة على شاشة الموبايل'),
    h('p', { class: 'muted' }, 'ضيف الموقع على الشاشة الرئيسية وافتحه زي أي تطبيق.'),
    h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: async () => {
      if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => {}); deferredInstall = null; return; }
      steps.textContent = isIOS()
        ? 'على الآيفون: افتح الموقع من Safari، اضغط زر المشاركة (المربع اللي فيه سهم لفوق)، ثم "إضافة إلى الشاشة الرئيسية".'
        : 'على الأندرويد: من قايمة المتصفح (النقط التلاتة فوق) اختار "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".';
      steps.hidden = false;
    } }, 'ضيفه للشاشة الرئيسية'), steps);
}

const urlB64 = (s) => { const b = (s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(b), (c) => c.charCodeAt(0)); };
function pushCard() {
  const box = h('div', { class: 'card stack' });
  const isKid = state.me.user.role === 'kid';
  const draw = async () => {
    const title = h('h3', null, isKid ? 'تذكير يومي على الموبايل' : 'تنبيهات الموبايل (أعياد الميلاد والغايبين)');
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (!ok) {
      return fill(box, title, h('p', { class: 'muted' }, isIOS()
        ? 'على الآيفون لازم تضيف الموقع للشاشة الرئيسية الأول (من زر المشاركة)، وتفتحه من الأيقونة، وبعدين ترجع هنا وتفعّل التنبيهات.'
        : 'المتصفح ده مش بيدعم التنبيهات. جرّب Chrome على الأندرويد.'));
    }
    let sub = null;
    try { sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription(); } catch { /* تجاهل */ }
    if (Notification.permission === 'denied') return fill(box, title, h('p', { class: 'notice' }, 'التنبيهات مقفولة من إعدادات المتصفح للموقع ده. افتحها من هناك وارجع جرّب.'));
    if (sub) {
      return fill(box, title, h('p', null, isKid ? 'التذكير شغال على الجهاز ده. هيجيلك إشعار بالمغرب لو لسه ما خلّصتش صلاتك وقراءة الإنجيل.' : 'التنبيهات شغالة على الجهاز ده. هيجيلك إشعار الصبح في يوم عيد ميلاد أي ولد، ولما يكون فيه أولاد غابوا عن الاجتماعات.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => act(() => api('POST', '/api/push/test'), 'اتبعت إشعار تجريبي') }, 'جرّب إشعار تجريبي'),
          h('button', { class: 'btn bad sm', type: 'button', onclick: async () => {
            await act(() => api('POST', '/api/push/unsubscribe', { endpoint: sub.endpoint })); await sub.unsubscribe().catch(() => {}); draw();
          } }, 'إيقاف التنبيهات')));
    }
    fill(box, title, h('p', { class: 'muted' }, isKid ? 'فعّل التذكير عشان يفكّرك بصلاتك وقراءتك كل يوم حتى لو الموقع مقفول.' : 'فعّل التنبيهات عشان يوصلك إشعار على الموبايل حتى لو الموقع مقفول.'),
      h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: async () => {
        try {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') throw new Error('لازم توافق على التنبيهات');
          const { key } = await api('GET', '/api/push/key');
          const s = await (await navigator.serviceWorker.ready).pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(key) });
          await api('POST', '/api/push/subscribe', { endpoint: s.endpoint });
          toast('تم تفعيل التنبيهات');
        } catch (ex) { toast(ex.message || 'معرفناش نفعّل التنبيهات', true); }
        draw();
      } }, 'تفعيل التنبيهات'));
  };
  draw();
  return box;
}

// ====================== تعديل بيانات الولد (للمسؤول) ======================
function editKidCard(id, p, onSaved) {
  const box = h('div', { class: 'card stack' });
  const open = () => {
    const d = JSON.parse(JSON.stringify(p));
    const b0 = d.birth ? d.birth.split('-').map(Number) : null;
    const inp = (idn, label, attrs) => h('label', { class: 'f', for: 'ek' + idn }, h('span', null, label), h('input', { id: 'ek' + idn, value: d[idn] || '', ...attrs }));
    const f = { name: inp('name', 'الاسم'), phone: inp('phone', 'موبايل الولد (للدخول)', { class: 'ltr', type: 'tel' }),
      mother_phone: inp('mother_phone', 'موبايل ماما', { class: 'ltr', type: 'tel' }), father_phone: inp('father_phone', 'موبايل بابا', { class: 'ltr', type: 'tel' }) };
    const val = (k) => f[k].querySelector('input').value;
    const addr = h('textarea', { id: 'ekaddress' }); addr.value = d.address || '';
    const conf = inp('confessor', 'أب الاعتراف'), school = inp('school', 'المدرسة');
    const sel = (idn, label, opts, cur) => h('label', { class: 'f', for: idn }, h('span', null, label),
      h('select', { id: idn }, h('option', { value: '' }, '—'), opts.map(([v, t]) => h('option', { value: String(v), selected: cur === v }, t))));
    const bd = sel('ekbd', 'اليوم', Array.from({ length: 31 }, (_, i) => [i + 1, String(i + 1)]), b0 && b0[2]);
    const bm = sel('ekbm', 'الشهر', MONTH_NAMES.map((m, i) => [i + 1, m]), b0 && b0[1]);
    const by = sel('ekby', 'السنة', Array.from({ length: 28 }, (_, i) => { const y = new Date().getFullYear() - 3 - i; return [y, String(y)]; }), b0 && b0[0]);
    const sibBox = h('div', { class: 'stack' });
    const drawSibs = () => fill(sibBox,
      d.siblings.map((s, i) => h('div', { class: 'sib' },
        h('label', { class: 'f nm', for: 'eksn' + i }, h('span', null, 'الاسم'), h('input', { id: 'eksn' + i, value: s.name, oninput: (e) => { s.name = e.target.value; } })),
        h('label', { class: 'f', for: 'eksa' + i }, h('span', null, 'السن'), h('input', { id: 'eksa' + i, type: 'number', value: s.age, oninput: (e) => { s.age = e.target.value; } })),
        h('label', { class: 'f', for: 'eksg' + i }, h('span', null, 'السنة الدراسية'), h('input', { id: 'eksg' + i, value: s.grade, oninput: (e) => { s.grade = e.target.value; } })),
        h('button', { class: 'btn bad sm', type: 'button', onclick: () => { d.siblings.splice(i, 1); drawSibs(); } }, 'حذف'))),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => { d.siblings.push({ name: '', age: '', grade: '' }); drawSibs(); } }, 'إضافة أخ أو أخت'));
    drawSibs();
    const err = h('div', { class: 'err', hidden: true, role: 'alert' });
    fill(box, h('h3', null, 'تعديل بيانات الولد'), f.name, f.phone,
      h('div', { class: 'grid2' }, f.mother_phone, f.father_phone),
      h('label', { class: 'f', for: 'ekaddress' }, h('span', null, 'العنوان'), addr), conf, school,
      h('h3', null, 'تاريخ الميلاد'), h('div', { class: 'grid3' }, bd, bm, by),
      h('h3', null, 'الإخوات'), sibBox, err,
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: async () => {
          err.hidden = true;
          try {
            await api('PUT', `/api/admin/kid/${id}`, { name: val('name'), phone: val('phone'), mother_phone: val('mother_phone'), father_phone: val('father_phone'),
              address: addr.value, confessor: conf.querySelector('input').value, school: school.querySelector('input').value, siblings: d.siblings,
              birth: { day: bd.querySelector('select').value, month: bm.querySelector('select').value, year: by.querySelector('select').value } });
            toast('تم حفظ التعديلات'); onSaved();
          } catch (ex) { err.textContent = ex.message; err.hidden = false; }
        } }, 'حفظ التعديلات'),
        h('button', { class: 'btn ghost', type: 'button', onclick: close }, 'إلغاء')));
  };
  const close = () => fill(box, h('div', { class: 'row between' }, h('div', null, h('h3', null, 'تعديل بيانات الولد'), h('p', { class: 'muted small' }, 'لو الولد كتب رقم أو تاريخ غلط تقدر تصلحه من هنا.')),
    h('button', { class: 'btn', type: 'button', onclick: open }, 'تعديل')));
  close();
  return box;
}

// ====================== التقرير الشهري ======================
let reportMonth = null;
const shiftMonth = (m, n) => { const [y, mo] = m.split('-').map(Number); const d = new Date(Date.UTC(y, mo - 1 + n, 1)); return d.toISOString().slice(0, 7); };
const waLink = (phone, text) => {
  let n = String(phone || '').replace(/\D/g, '');
  if (/^0\d{10}$/.test(n)) n = '20' + n.slice(1);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
};
function reportText(r, showNotes) {
  const of = (n, t) => `${n} من ${t}`;
  const lines = [`مساء الخير، تقرير شهر ${monthLabel(r.month)} للولد ${r.kid ? r.kid.name : r.name}:`, '',
    `- الصلاة: ${of(r.prayer, r.elapsed)} يوم`, `- قراءة الإنجيل: ${of(r.gospel, r.elapsed)} يوم`,
    `- القداس: ${r.mass} مرة`, `- الاعتراف: ${r.confession ? 'تم' : 'لم يتم بعد'}`,
    `- حضور الاجتماع: ${r.meetings ? of(r.attendance.length, r.meetings) + ' اجتماع' : 'لا توجد اجتماعات مسجلة'}`];
  if (r.quizzes.length) lines.push('- المسابقات: ' + r.quizzes.map((q) => q.submitted ? `${q.title} (${q.score} من ${q.max})` : `${q.title} (لم يشارك)`).join('، '));
  if (showNotes && r.notes.length) { lines.push('', 'ملاحظات:'); r.notes.forEach((n) => lines.push(`- ${n.text}${n.delta ? ` (${n.delta > 0 ? '+' : ''}${n.delta} نجمة)` : ''}`)); }
  lines.push('', `إجمالي نجوم الشهر: ${r.stars}`, '', 'ربنا يبارك حياته ويحفظه لكم.');
  return lines.join('\n');
}
async function staffReports(main) {
  if (!reportMonth) reportMonth = state.me.today.slice(0, 7);
  if (state.openReport) return reportView(main, state.openReport);
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', `/api/staff/report?month=${reportMonth}`));
  if (!r) return;
  const isCur = reportMonth >= state.me.today.slice(0, 7);
  const cell = (n, t) => h('td', { class: 'num' }, t === undefined ? String(n) : `${n}/${t}`);
  fill(main, h('h2', null, 'التقارير الشهرية'),
    h('div', { class: 'weeknav' },
      h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { reportMonth = shiftMonth(reportMonth, -1); renderStaff(); } }, 'الشهر اللي فات'),
      h('b', null, monthLabel(reportMonth) + (r.running ? ' (لسه شغال)' : '')),
      h('button', { class: 'btn ghost sm', type: 'button', disabled: isCur, onclick: () => { reportMonth = shiftMonth(reportMonth, 1); renderStaff(); } }, 'الشهر الجاي')),
    h('p', { class: 'muted small' }, 'اضغط على اسم الولد لفتح تقريره وإرساله لأهله أو طباعته.'),
    h('div', { class: 'tablebox' }, h('table', null,
      h('thead', null, h('tr', null, ['الاسم', 'الصلاة', 'الإنجيل', 'القداس', 'الاعتراف', 'الاجتماع', 'المسابقات', 'نجوم الشهر'].map((t) => h('th', null, t)))),
      h('tbody', null, r.kids.length ? r.kids.map((k) => {
        const qs = k.quizzes.filter((q) => q.submitted);
        return h('tr', { class: 'click', tabindex: 0, onclick: () => { state.openReport = k.id; renderStaff(); }, onkeydown: (e) => { if (e.key === 'Enter') { state.openReport = k.id; renderStaff(); } } },
          h('td', null, h('b', null, k.name)), cell(k.prayer, r.elapsed), cell(k.gospel, r.elapsed), cell(k.mass),
          h('td', null, k.confession ? h('span', { class: 'pill good' }, 'تم') : '-'), cell(k.attendance.length, k.meetings),
          h('td', { class: 'num' }, k.quizzes.length ? `${qs.length}/${k.quizzes.length}` : '-'), h('td', null, h('span', { class: 'pill star num' }, String(k.stars), starIc())));
      }) : h('tr', null, h('td', { colspan: 8, style: 'text-align:center;padding:24px' }, 'لسه مفيش أولاد'))))));
}
async function reportView(main, id) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', `/api/staff/report/${id}?month=${reportMonth}`));
  if (!r) { state.openReport = null; return renderStaff(); }
  const isAdmin = state.me.user.role === 'admin';
  let showNotes = false;
  const area = h('div', { class: 'card stack report' });
  const actions = h('div', { class: 'card stack noprint' });
  const row = (l, v) => h('tr', null, h('th', null, l), h('td', null, v));
  const draw = () => {
    fill(area, h('h2', null, `تقرير ${monthLabel(r.month)}`), h('h3', null, r.kid.name),
      h('div', { class: 'tablebox' }, h('table', null, h('tbody', null,
        row('الصلاة', `${r.prayer} يوم من ${r.elapsed}`), row('قراءة الإنجيل', `${r.gospel} يوم من ${r.elapsed}`),
        row('القداس', `${r.mass} مرة`), row('الاعتراف', r.confession ? 'تم' : 'لم يتم بعد'),
        row('حضور الاجتماع', r.meetings ? `${r.attendance.length} من ${r.meetings}` : 'لا توجد اجتماعات مسجلة'),
        r.game > 0 ? row('نجوم اللعبة', String(r.game)) : null, row('نجوم الشهر', String(r.stars))))),
      r.quizzes.length ? h('div', null, h('h3', null, 'المسابقات'), r.quizzes.map((q) => h('div', { class: 'row between' }, h('span', null, q.title),
        q.submitted ? h('span', { class: 'pill good num' }, `${q.score} من ${q.max}${q.pending ? ' (في انتظار التصحيح)' : ''}`) : h('span', { class: 'pill bad' }, 'لم يشارك')))) : null,
      showNotes && r.notes.length ? h('div', null, h('h3', null, 'ملاحظات'), r.notes.map((n) => h('div', null, `${n.day}: ${n.text}${n.delta ? ` (${n.delta > 0 ? '+' : ''}${n.delta} نجمة)` : ''}`))) : null);
    const text = reportText(r, showNotes);
    const wa = (label, phone) => phone ? h('a', { class: 'btn', href: waLink(phone, text), target: '_blank', rel: 'noopener', style: 'text-decoration:none' }, label) : h('button', { class: 'btn ghost', type: 'button', disabled: true }, label + ' (مفيش رقم)');
    fill(actions, h('label', { class: 'attrow' }, h('input', { type: 'checkbox', checked: showNotes, onchange: (e) => { showNotes = e.target.checked; draw(); } }), h('span', null, 'إظهار الملاحظات في التقرير')),
      h('div', { class: 'row' }, wa('واتساب لماما', r.kid.mother_phone), wa('واتساب لبابا', r.kid.father_phone)),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(text); toast('تم نسخ التقرير'); } catch { toast('معرفناش ننسخ', true); } } }, 'نسخ النص'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => window.print() }, 'طباعة / حفظ PDF')));
  };
  draw();
  fill(main, h('button', { class: 'btn ghost sm noprint', type: 'button', style: 'justify-self:start', onclick: () => { state.openReport = null; renderStaff(); } }, 'رجوع للتقارير'), area, actions);
  window.scrollTo(0, 0);
}

// ====================== نسيت كلمة السر ======================
function showForgot() {
  const phone = h('input', { id: 'fphone', class: 'ltr', type: 'tel', inputmode: 'tel', required: true, placeholder: '01xxxxxxxxx' });
  const msg = h('div', { class: 'notice', hidden: true });
  const err = h('div', { class: 'err', hidden: true, role: 'alert' });
  fill(app, h('main', { class: 'auth' },
    h('div', { class: 'hero' }, h('img', { class: 'mark', src: '/icons/logo.svg', alt: '', width: 72, height: 72 }), h('h1', null, 'نسيت كلمة السر')),
    h('form', { class: 'card stack', novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); err.hidden = true;
      try { await api('POST', '/api/forgot', { phone: phone.value }); msg.textContent = 'وصل طلبك للمسؤول. هيبعتلك كلمة سر مؤقتة، وبعد ما تدخل بيها هتختار كلمة جديدة.'; msg.hidden = false; }
      catch (ex) { err.textContent = ex.message; err.hidden = false; }
    } },
      h('p', { class: 'muted' }, 'اكتب رقم موبايلك اللي سجّلت بيه، وهنبلّغ المسؤول.'),
      h('label', { class: 'f', for: 'fphone' }, h('span', null, 'رقم موبايلك'), phone), err, msg,
      h('button', { class: 'btn block', type: 'submit' }, 'ابعت الطلب'),
      h('button', { class: 'btn ghost block', type: 'button', onclick: () => showAuth('login') }, 'رجوع لتسجيل الدخول'))));
}
function showForcedChange() {
  const old = h('input', { id: 'fcold', type: 'text', class: 'ltr', autocomplete: 'current-password', required: true });
  const nw = h('input', { id: 'fcnew', type: 'password', autocomplete: 'new-password', minlength: 6, required: true });
  const err = h('div', { class: 'err', hidden: true, role: 'alert' });
  fill(app, h('main', { class: 'auth' },
    h('div', { class: 'hero' }, h('img', { class: 'mark', src: '/icons/logo.svg', alt: '', width: 72, height: 72 }), h('h1', null, 'اختار كلمة سر جديدة')),
    h('form', { class: 'card stack', novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); err.hidden = true;
      try { await api('POST', '/api/password', { old: old.value, password: nw.value }); toast('تم تغيير كلمة السر'); await boot(); }
      catch (ex) { err.textContent = ex.message; err.hidden = false; }
    } },
      h('p', { class: 'muted' }, 'دخلت بكلمة سر مؤقتة. اكتب الكلمة المؤقتة وبعدها كلمة سر جديدة تفتكرها.'),
      h('label', { class: 'f', for: 'fcold' }, h('span', null, 'كلمة السر المؤقتة'), old),
      h('label', { class: 'f', for: 'fcnew' }, h('span', null, 'كلمة السر الجديدة ', h('small', null, '(6 على الأقل)')), nw), err,
      h('button', { class: 'btn block', type: 'submit' }, 'حفظ ودخول'),
      h('button', { class: 'btn ghost block', type: 'button', onclick: logout }, 'تسجيل الخروج'))));
}

// كلمة سر مؤقتة: بتتولّد وتتعرض للمسؤول عشان يبعتها واتساب
async function makeTempPassword(userId, mount, after) {
  const r = await act(() => api('POST', '/api/admin/temp-password', { user_id: userId }));
  if (!r) return;
  const text = `كلمة السر المؤقتة لـ ${r.name}: ${r.password}\nادخل بيها على الموقع (${location.origin}) وهتختار كلمة سر جديدة.`;
  const wa = (label, n) => n ? h('a', { class: 'btn sm', href: waLink(n, text), target: '_blank', rel: 'noopener', style: 'text-decoration:none' }, label) : null;
  fill(mount, h('div', { class: 'card stack', style: 'border-color:var(--good)' },
    h('b', null, `كلمة السر المؤقتة لـ ${r.name}`),
    h('div', { class: 'ltr num', style: 'font-size:1.6rem;font-weight:800;letter-spacing:2px;text-align:center;user-select:all' }, r.password),
    h('p', { class: 'muted small' }, 'اتبعتها للولد أو لماما. الكلمة دي مش هتظهر تاني، والولد هيختار كلمة جديدة أول ما يدخل.'),
    h('div', { class: 'row' }, wa('واتساب للولد', r.phone), wa('واتساب لماما', r.mother_phone), wa('واتساب لبابا', r.father_phone),
      h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(text); toast('تم النسخ'); } catch { toast('معرفناش ننسخ', true); } } }, 'نسخ'),
      after && h('button', { class: 'btn ghost sm', type: 'button', onclick: after }, 'تمام'))));
}
async function resetRequestsCard(onChange) {
  const r = await act(() => api('GET', '/api/admin/reset-requests'));
  if (!r || !r.requests.length) return null;
  return h('div', { class: 'card stack', style: 'border-color:var(--star)' }, h('h3', null, `طلبات نسيان كلمة السر (${r.requests.length})`),
    r.requests.map((q) => { const mount = h('div'); return h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('div', null, h('b', null, q.name), h('div', { class: 'muted small num' }, `${q.phone} - ${q.requested_at.slice(0, 16)}`)),
        h('div', { class: 'row' },
          h('button', { class: 'btn sm', type: 'button', onclick: () => makeTempPassword(q.user_id, mount, onChange) }, 'كلمة سر مؤقتة'),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await act(() => api('DELETE', `/api/admin/reset-request/${q.user_id}`)); onChange(); } }, 'تجاهل'))), mount); }));
}
function auditCard() {
  const box = h('div', { class: 'card stack' });
  const show = async () => {
    const r = await act(() => api('GET', '/api/admin/audit')); if (!r) return;
    fill(box, h('h3', null, 'سجل التعديلات (آخر 200)'),
      r.items.length ? h('div', { class: 'list' }, r.items.map((i) => h('div', null,
        h('div', null, h('b', null, i.action), i.target_name && ` - ${i.target_name}`),
        i.detail && h('div', { class: 'muted small' }, i.detail),
        h('div', { class: 'muted small num' }, `${i.at.slice(0, 16)} - ${i.by_name}`)))) : h('p', { class: 'muted' }, 'السجل فاضي لحد دلوقتي.'),
      h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: () => fill(box, ...closed()) }, 'إخفاء'));
  };
  const closed = () => [h('h3', null, 'سجل التعديلات'), h('p', { class: 'muted' }, 'مين عدّل بيانات ولد، وزوّد أو خصم نجوم، وغيّر كلمة سر، وحذف إيه.'), h('button', { class: 'btn ghost', type: 'button', style: 'justify-self:start', onclick: show }, 'عرض السجل')];
  fill(box, ...closed());
  return box;
}

// ====================== ترتيب الأولاد (للخدام) ======================
let rankMode = 'total';
async function staffRanking(main) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const today = state.me.today.slice(0, 7);
  const month = rankMode === 'month' ? today : rankMode === 'prev' ? shiftMonth(today, -1) : null;
  const r = await act(() => api('GET', '/api/staff/leaderboard' + (month ? `?month=${month}` : '')));
  if (!r) return;
  const list = (month ? r.monthly : r.total).slice().sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name, 'ar'));
  let rank = 0, prev = null;
  const rows = list.map((k, i) => { if (k.stars !== prev) { rank = i + 1; prev = k.stars; } return { ...k, rank }; });
  const seg = (id, label) => h('button', { type: 'button', 'aria-pressed': String(rankMode === id), onclick: () => { rankMode = id; staffRanking(main); } }, label);
  fill(main, h('h2', null, 'ترتيب الأولاد'),
    h('p', { class: 'muted small' }, 'الصفحة دي للمسؤول والخدام والمتابعين بس، والأولاد مش بيشوفوها.'),
    h('div', { class: 'seg', style: 'grid-template-columns:repeat(3,1fr)', role: 'group', 'aria-label': 'الفترة' }, seg('total', 'الإجمالي'), seg('month', 'الشهر ده'), seg('prev', 'الشهر اللي فات')),
    month && h('p', { class: 'muted small' }, 'نجوم ' + monthLabel(month)),
    h('div', { class: 'card list' }, rows.length ? rows.map((k) => h('div', { class: 'row between' },
      h('div', { class: 'row', style: 'flex-wrap:nowrap' },
        h('span', { class: 'pill num' + (k.rank <= 3 && k.stars > 0 ? ' star' : ''), style: 'min-width:2rem;justify-content:center' }, String(k.rank)),
        avatar(k.id, k.photo, 36), h('b', null, k.name)),
      h('span', { class: 'pill star num' }, String(k.stars), starIc()))) : h('p', { class: 'muted' }, 'لسه مفيش أولاد.')));
}

// ====================== لعبة السلم والتعبان ======================
const PAWN = ['#e74c3c', '#2f74b5', '#27ae60', '#f39c12', '#8e44ad', '#16a085'];
const SVGNS = 'http://www.w3.org/2000/svg';
function sv(tag, attrs, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  for (const c of kids) { if (c === null || c === undefined || c === false) continue; el.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return el;
}
const cellXY = (n) => { const i = n - 1, row = Math.floor(i / 10), col = row % 2 === 0 ? i % 10 : 9 - (i % 10); return [col * 10 + 5, (9 - row) * 10 + 5]; };
const PAWN_OFF = [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4], [0, -3.4], [0, 3.4]];

function boardSvg(board, players, turn) {
  const svg = sv('svg', { viewBox: '0 0 100 100', class: 'gb', role: 'img', 'aria-label': 'لوحة اللعبة' });
  const qset = new Set(board.q);
  for (let n = 1; n <= 100; n++) {
    const [cx, cy] = cellXY(n);
    svg.append(sv('rect', { x: cx - 5, y: cy - 5, width: 10, height: 10, class: qset.has(n) ? 'gb-q' : ((Math.floor((n - 1) / 10) + (n - 1)) % 2 ? 'gb-c1' : 'gb-c2') }));
    svg.append(sv('text', { x: cx - 4.3, y: cy - 2.6, class: 'gb-num' }, String(n)));
    if (qset.has(n)) svg.append(sv('text', { x: cx, y: cy + 3, class: 'gb-qm', 'text-anchor': 'middle' }, '؟'));
  }
  const line = (a, b, off, cls) => {
    const [x1, y1] = cellXY(a), [x2, y2] = cellXY(b); const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1; const nx = -dy / len * off, ny = dx / len * off;
    return sv('line', { x1: x1 + nx, y1: y1 + ny, x2: x2 + nx, y2: y2 + ny, class: cls });
  };
  for (const [a, b] of Object.entries(board.ladders)) {
    const A = Number(a), [x1, y1] = cellXY(A), [x2, y2] = cellXY(b); const len = Math.hypot(x2 - x1, y2 - y1);
    svg.append(line(A, b, 1.3, 'gb-rail'), line(A, b, -1.3, 'gb-rail'));
    const rungs = Math.max(2, Math.floor(len / 5));
    for (let i = 1; i < rungs; i++) { const f = i / rungs, x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f; const nx = -(y2 - y1) / len * 1.3, ny = (x2 - x1) / len * 1.3; svg.append(sv('line', { x1: x + nx, y1: y + ny, x2: x - nx, y2: y - ny, class: 'gb-rung' })); }
  }
  for (const [a, b] of Object.entries(board.snakes)) {
    const [x1, y1] = cellXY(Number(a)), [x2, y2] = cellXY(b); const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1; const amp = len * 0.16, nx = -dy / len * amp, ny = dx / len * amp;
    svg.append(sv('path', { d: `M${x1} ${y1} C${x1 + dx * 0.33 + nx} ${y1 + dy * 0.33 + ny} ${x1 + dx * 0.66 - nx} ${y1 + dy * 0.66 - ny} ${x2} ${y2}`, class: 'gb-snake' }));
    svg.append(sv('circle', { cx: x1, cy: y1, r: 1.8, class: 'gb-head' }), sv('circle', { cx: x1 - 0.6, cy: y1 - 0.5, r: 0.35, fill: '#fff' }), sv('circle', { cx: x1 + 0.6, cy: y1 - 0.5, r: 0.35, fill: '#fff' }));
  }
  players.forEach((p, i) => {
    if (!p.pos || p.status !== 'in') return;
    const [cx, cy] = cellXY(p.pos), o = PAWN_OFF[i % 6];
    svg.append(sv('circle', { cx: cx + o[0], cy: cy + o[1], r: 2.1, fill: PAWN[p.color % 6], class: 'gb-pawn' + (i === turn ? ' turn' : '') }));
  });
  return svg;
}

const gameShell = (main, ...kids) => fill(main, h('h2', null, 'السلم والتعبان'), ...kids);

async function kidGame(main) {
  let key = '', selected = new Set(), stopped = false;
  const alive = () => document.body.contains(main) && state.tab === 'game' && !stopped;
  const go = (id) => { stopped = true; gameScreen(main, id); };
  const draw = (r) => {
    if (!r.enabled) return gameShell(main, h('div', { class: 'card' }, h('p', { class: 'muted' }, 'اللعبة مقفولة دلوقتي. هتفتح لما الخادم يشغّلها.')));
    const friends = r.online;
    selected = new Set([...selected].filter((id) => friends.some((f) => f.id === id && !f.busy)));
    const act2 = async (fn) => { const x = await act(fn); if (x && x.id) go(x.id); };
    gameShell(main,
      h('p', { class: 'muted small' }, `نجوم اللعبة النهارده: ${r.stars_today} من ${r.cap}. السؤال الصح على الخانة (؟) بنجمة.`),
      r.invites.map((i) => h('div', { class: 'card stack', style: 'border-color:var(--star)' }, h('b', null, `${i.from} بيدعوك تلعب سلم وتعبان`),
        h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', onclick: () => act2(async () => { await api('POST', `/api/game/${i.id}/accept`); return { id: i.id }; }) }, 'قبول'),
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { await act(() => api('POST', `/api/game/${i.id}/decline`)); load(); } }, 'رفض')))),
      h('div', { class: 'card stack' }, h('h3', null, 'العب ضد الكمبيوتر'), h('p', { class: 'muted' }, 'تلعب لوحدك في أي وقت.'),
        h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: () => act2(() => api('POST', '/api/game/solo')) }, 'ابدأ')),
      h('div', { class: 'card stack' }, h('h3', null, 'ادعو أصحابك'),
        friends.length ? h('div', { class: 'list' }, friends.map((f) => h('label', { class: 'attrow', for: 'fr' + f.id },
          h('input', { type: 'checkbox', id: 'fr' + f.id, checked: selected.has(f.id), disabled: f.busy, onchange: (e) => { if (e.target.checked) { if (selected.size >= 3) { e.target.checked = false; return toast('3 أصحاب بالكتير', true); } selected.add(f.id); } else selected.delete(f.id); } }),
          avatar(f.id, f.photo, 30), h('span', { class: 'grow' }, f.name), f.busy && h('span', { class: 'pill' }, 'بيلعب')))) : h('p', { class: 'muted' }, 'مفيش حد من أصحابك فاتح اللعبة دلوقتي.'),
        h('button', { class: 'btn', type: 'button', style: 'justify-self:start', disabled: !friends.length, onclick: () => act2(() => api('POST', '/api/game/invite', { friend_ids: [...selected] })) }, 'ابعت الدعوة')),
      h('div', { class: 'card stack' }, h('h3', null, 'الكمبيوتر يختارلك صاحب'), h('p', { class: 'muted' }, 'بيختار واحد من الفاتحين اللعبة دلوقتي.'),
        h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: () => act2(() => api('POST', '/api/game/random')) }, 'اختار لي')),
      h('div', { class: 'card stack' }, h('h3', null, 'غرفة الكل'),
        h('p', { class: 'muted' }, r.room ? `فيه غرفة مفتوحة: ${r.room.players.join('، ')}` : 'مفيش غرفة مفتوحة. ابدأ واحدة وغيرك ينضم.'),
        h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: () => act2(() => api('POST', '/api/game/room')) }, r.room ? 'ادخل الغرفة' : 'ابدأ غرفة جديدة')));
  };
  const load = async () => {
    if (!alive()) return;
    let r; try { r = await api('GET', '/api/game/lobby'); } catch (e) { if (!alive()) return; r = null; }
    if (!alive()) return;
    if (r && r.mine) return go(r.mine);
    if (r) { const k = JSON.stringify(r) + [...selected].join(); if (k !== key) { key = k; draw(r); } }
    setTimeout(load, 3000);
  };
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  load();
  window.__lobbyReload = load;
}

function gameScreen(main, id) {
  let last = '', stopped = false;
  const alive = () => document.body.contains(main) && state.tab === 'game' && !stopped;
  const box = h('div', { class: 'stack' });
  gameShell(main, box);
  const back = () => { stopped = true; kidGame(main); };
  const leave = async () => { await act(() => api('POST', `/api/game/${id}/leave`)); back(); };
  const draw = (v) => {
    const names = (v.players || []);
    const legend = h('div', { class: 'gb-legend' }, names.map((p, i) => h('div', { class: 'gb-pl' + (v.status === 'playing' && i === v.turn ? ' on' : '') + (p.status !== 'in' ? ' off' : '') },
      h('i', { style: `background:${PAWN[p.color % 6]}` }), h('span', null, p.name + (i === v.me ? ' (إنت)' : '')), h('small', { class: 'num' }, p.status === 'invited' ? 'مستني الرد' : p.status === 'declined' ? 'رفض' : p.status === 'left' ? 'خرج' : p.pos ? String(p.pos) : 'البداية'))));
    if (v.status === 'lobby') {
      const isRoom = v.mode === 'room', host = v.host === (names[v.me] || {}).id;
      return fill(box, h('div', { class: 'card stack' }, h('h3', null, isRoom ? 'غرفة الكل' : 'مستني أصحابك يردّوا'), legend,
        h('p', { class: 'muted small' }, isRoom ? 'اللعبة هتبدأ لما اللي فتح الغرفة يضغط "ابدأ" (لاعبين اتنين على الأقل).' : 'الدعوة بتنتهي بعد دقيقة ونص.'),
        h('div', { class: 'row' }, isRoom && host && h('button', { class: 'btn', type: 'button', disabled: names.filter((p) => p.status === 'in').length < 2, onclick: () => act(() => api('POST', `/api/game/${id}/start`)) }, 'ابدأ اللعبة'),
          h('button', { class: 'btn ghost', type: 'button', onclick: leave }, 'خروج'))));
    }
    if (v.status !== 'playing') {
      const w = names.find((p) => p.id === v.winner && (p.bot || p.id === v.winner));
      const mine = v.me >= 0 && names[v.me] && names[v.me].id === v.winner;
      return fill(box, h('div', { class: 'card stack', style: 'text-align:center' },
        h('h3', null, v.status === 'finished' ? (mine ? 'مبروك! كسبت' : `${w ? w.name : 'لاعب'} كسب اللعبة`) : 'اللعبة اتلغت'),
        v.status === 'finished' && boardSvg(v.board, names, -1), legend, h('div', { class: 'list' }, v.log.slice().reverse().slice(0, 5).map((l) => h('div', { class: 'muted small' }, l))),
        h('button', { class: 'btn', type: 'button', style: 'justify-self:center', onclick: back }, 'رجوع للعبة')));
    }
    const cur = names[v.turn];
    const roll = async () => { const x = await act(() => api('POST', `/api/game/${id}/roll`)); if (x) { last = JSON.stringify(x); draw(x); } };
    const answer = async (c) => {
      const x = await act(() => api('POST', `/api/game/${id}/answer`, { choice: c })); if (!x) return;
      toast(x.result && x.result.correct ? (x.result.star ? 'إجابة صح! خدت نجمة' : 'إجابة صح! (وصلت للحد اليومي للنجوم)') : 'إجابة غلط، حظ أوفر المرة الجاية', !(x.result && x.result.correct));
      last = JSON.stringify(x); draw(x);
    };
    const qCard = v.phase === 'question' && v.q ? h('div', { class: 'card stack gq', style: 'border-color:var(--star)' },
      h('b', null, v.my_turn ? 'سؤال إنجيل. جاوب صح وخد نجمة:' : `${cur.name} بيجاوب على سؤال...`), h('p', { style: 'font-size:1.05rem;font-weight:700' }, v.q.text),
      v.my_turn && h('div', { class: 'stack' }, v.q.options.map((o, i) => h('button', { class: 'btn ghost block', type: 'button', onclick: () => answer(i) }, o)))) : null;
    fill(box, h('div', { class: 'card stack' },
      boardSvg(v.board, names, v.turn), legend,
      h('div', { class: 'row between' },
        h('div', null, h('b', null, v.my_turn ? 'دورك!' : `الدور على ${cur.name}`), h('div', { class: 'muted small num' }, v.my_turn ? `باقي ${v.secs_left} ثانية` : '')),
        v.dice ? h('div', { class: 'dice num', 'aria-label': 'آخر رمية' }, String(v.dice)) : null),
      v.my_turn && v.phase === 'roll' && h('button', { class: 'btn block', type: 'button', onclick: roll }, 'ارمي النرد'),
      h('p', { class: 'muted small' }, `نجوم اللعبة النهارده: ${v.stars_today} من ${v.cap}`)),
      qCard,
      h('div', { class: 'card list' }, v.log.slice().reverse().slice(0, 6).map((l) => h('div', { class: 'small' }, l))),
      h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: leave }, 'اخرج من اللعبة'));
  };
  const poll = async () => {
    if (!alive()) return;
    try {
      const v = await api('GET', `/api/game/${id}`);
      if (!alive()) return;
      const k = JSON.stringify(v); if (k !== last) { last = k; draw(v); }
    } catch (e) {
      if (!alive()) return;
      if (/مقفولة|مش مسموح|مش موجودة/.test(e.message)) { stopped = true; toast(e.message, true); return kidGame(main); }
    }
    setTimeout(poll, 1500);
  };
  fill(box, h('p', { class: 'muted' }, 'جاري التحميل...'));
  poll();
}

// ----- تحكم المسؤول في اللعبة -----
// ====================== الدروس (الخدام والمسؤول) ======================
async function staffLessons(main) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', '/api/lessons'));
  if (!r) return;
  const edit = canMark(), isAdmin = state.me.user.role === 'admin';
  const reload = () => staffLessons(main);
  const field = (label, el) => h('label', { class: 'f' }, h('span', null, label), el);
  const form = (l, done) => {
    const title = h('input', { maxlength: 80, placeholder: 'مثال: زكا والشجرة' }); title.value = l ? l.title : '';
    const takeaway = h('textarea', { maxlength: 300, class: 'short', placeholder: 'اكتبها في سطر أو اتنين، دي أهم حاجة الولد هيشوفها' }); takeaway.value = l ? l.takeaway : '';
    const verse = h('textarea', { maxlength: 400, class: 'short', placeholder: 'الآية نفسها من غير المرجع (اختياري)' }); verse.value = l ? l.verse : '';
    const body = h('textarea', { maxlength: 6000, class: 'tall', placeholder: 'اكتب الدرس أو القصة. سيب سطر فاضي بين كل فقرة والتانية.' }); body.value = l ? l.body : '';
    const go = async () => {
      const payload = { title: title.value, takeaway: takeaway.value, verse: verse.value, body: body.value };
      const res = await act(() => l ? api('PATCH', `/api/staff/lessons/${l.id}`, payload) : api('POST', '/api/staff/lessons', payload), l ? 'اتحفظ التعديل' : 'اتنشر الدرس للأولاد');
      if (res) done();
    };
    return h('div', { class: 'stack' }, field('عنوان الدرس', title), field('إيه الدرس؟ (الفكرة الأساسية)', takeaway), field('آية الدرس (اختياري)', verse), field('نص الدرس', body),
      h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: go }, l ? 'حفظ التعديل' : 'نشر الدرس'));
  };
  const item = (l) => {
    const slot = h('div');
    const open = async () => {
      if (slot.firstChild) return slot.replaceChildren();
      const full = await act(() => api('GET', '/api/lessons/' + l.id));
      if (full) slot.replaceChildren(form(full, reload));
    };
    const readersSlot = h('div');
    const showReaders = async () => {
      if (readersSlot.firstChild) return readersSlot.replaceChildren();
      const x = await act(() => api('GET', `/api/staff/lessons/${l.id}/readers`));
      if (!x) return;
      readersSlot.replaceChildren(h('div', { class: 'list' }, x.kids.map((k) => h('div', { class: 'row between' },
        h('span', null, k.name), k.read ? h('span', { class: 'pill good' }, 'قرا') : h('span', { class: 'pill' }, 'لسه')))));
    };
    return h('div', { class: 'card stack' + (l.hidden ? ' off' : '') },
      h('div', { class: 'row between' }, h('div', null, h('b', null, l.title), h('div', { class: 'muted small' }, shortDate(l.created_at.slice(0, 10)) + (l.hidden ? ' · مخفي عن الأولاد' : ''))),
        h('span', { class: 'pill' }, `${l.reads} قرا`)),
      h('p', { class: 'muted small', style: 'margin:0' }, l.takeaway),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost sm', type: 'button', onclick: showReaders }, 'مين قرا؟'),
        edit && h('button', { class: 'btn ghost sm', type: 'button', onclick: open }, 'تعديل'),
        edit && h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { if (await act(() => api('PATCH', `/api/staff/lessons/${l.id}`, { hidden: !l.hidden }), l.hidden ? 'الدرس ظهر للأولاد' : 'الدرس اتخفى')) reload(); } }, l.hidden ? 'إظهار' : 'إخفاء'),
        isAdmin && sureButton('حذف', 'تأكيد الحذف', async () => { if (await act(() => api('DELETE', `/api/staff/lessons/${l.id}`), 'اتحذف الدرس')) reload(); })),
      readersSlot, slot);
  };
  fill(main, h('h2', null, 'الدروس'),
    h('p', { class: 'muted small' }, 'أي درس بتنشره بيظهر للأولاد على طول، وبيوصلهم إشعار لو مفعّلين التنبيهات. الولد بياخد نجمة لما يقرا الدرس ويكتب اللي فهمه.'),
    edit && h('div', { class: 'card stack' }, h('h3', null, 'درس جديد'), form(null, reload)),
    h('div', { class: 'stack' }, r.lessons.length ? r.lessons.map(item) : h('p', { class: 'muted' }, 'لسه ما فيش دروس')));
}

// إدارة الإشارات: المسؤول والخدام يضيفوا ويعدّلوا ويوقفوا، والمسؤول بس يحذف
async function staffBadges(main) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', '/api/admin/badges'));
  if (!r) return;
  const edit = canMark(), isAdmin = state.me.user.role === 'admin';
  const reload = () => staffBadges(main);
  const ruleLabel = (k) => (r.rules.find((x) => x.rule === k) || {}).label || '';
  const ruleSel = (cur) => { const sel = h('select', { 'aria-label': 'الشرط' }, r.rules.map((x) => h('option', { value: x.rule }, x.label))); sel.value = cur; return sel; };
  const iconIn = (v) => { const i = h('input', { maxlength: 8, placeholder: '🎯', 'aria-label': 'الأيقونة', style: 'width:4.5rem;text-align:center;font-size:1.4rem' }); i.value = v; return i; };
  const txtIn = (v, ph, max) => { const i = h('input', { maxlength: max, placeholder: ph, 'aria-label': ph }); i.value = v; return i; };
  const numIn = (v) => { const i = h('input', { type: 'number', min: 1, max: 10000, 'aria-label': 'الرقم' }); i.value = String(v); return i; };

  const addCard = () => {
    const ic = iconIn(''), title = txtIn('', 'اسم الإشارة', 40), desc = txtIn('', 'وصف قصير (اختياري)', 100);
    const kind = h('select', { 'aria-label': 'النوع' }, h('option', { value: 'auto' }, 'تلقائية: الموقع يمنحها لوحده'), h('option', { value: 'manual' }, 'يدوية: الخادم يمنحها لولد معيّن'));
    const rule = ruleSel(r.rules[0].rule), need = numIn(1);
    const autoRow = h('div', { class: 'row' }, rule, need, h('span', { class: 'muted small' }, 'أو أكتر'));
    kind.addEventListener('change', () => { autoRow.hidden = kind.value === 'manual'; });
    return h('div', { class: 'card stack' }, h('h3', null, 'إضافة إشارة جديدة'),
      h('div', { class: 'row' }, ic, h('div', { class: 'grow' }, title)), desc, kind, autoRow,
      h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: async () => {
        const x = await act(() => api('POST', '/api/admin/badges', { icon: ic.value, title: title.value, description: desc.value, kind: kind.value, rule: rule.value, need: Number(need.value) }), 'اتضافت الإشارة');
        if (x) reload();
      } }, 'إضافة'));
  };

  const item = (b) => {
    const ic = iconIn(b.icon), title = txtIn(b.title, 'اسم الإشارة', 40), desc = txtIn(b.description, 'الوصف', 100);
    const rule = ruleSel(b.rule), need = numIn(b.need);
    return h('div', { class: 'card stack' + (b.active ? '' : ' off') },
      h('div', { class: 'row between' },
        h('div', { class: 'row' }, h('span', { class: 'bi-lg', 'aria-hidden': 'true' }, b.icon), h('div', null, h('b', null, b.title), h('div', { class: 'muted small' }, b.description))),
        h('span', { class: 'pill' }, `${b.earned_count} ولد`)),
      h('div', { class: 'muted small' }, (b.kind === 'auto' ? `تلقائية: ${ruleLabel(b.rule)} ${b.need} أو أكتر` : 'يدوية: الخادم يمنحها من صفحة الولد') + (b.active ? '' : ' (موقوفة)')),
      edit && h('details', { class: 'stack' }, h('summary', null, 'تعديل'),
        h('div', { class: 'row' }, ic, h('div', { class: 'grow' }, title)), desc,
        b.kind === 'auto' && h('div', { class: 'row' }, rule, need),
        h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', onclick: async () => {
            const x = await act(() => api('PATCH', `/api/admin/badges/${b.id}`, { icon: ic.value, title: title.value, description: desc.value, rule: rule.value, need: Number(need.value) }), 'اتحفظ التعديل');
            if (x) reload();
          } }, 'حفظ'),
          h('button', { class: 'btn ghost', type: 'button', onclick: async () => { if (await act(() => api('PATCH', `/api/admin/badges/${b.id}`, { active: !b.active }), b.active ? 'اتوقفت الإشارة' : 'اتفعّلت الإشارة')) reload(); } }, b.active ? 'إيقاف' : 'تفعيل'),
          isAdmin && sureButton('حذف', 'تأكيد الحذف', async () => { if (await act(() => api('DELETE', `/api/admin/badges/${b.id}`), 'اتحذفت الإشارة')) reload(); }))));
  };

  fill(main, h('h2', null, 'الإشارات'),
    h('p', { class: 'muted small' }, 'التلقائية بتتمنح للولد لوحدها أول ما يحقق الشرط. اليدوية بيمنحها الخادم من صفحة الولد. لو أوقفت إشارة، الأولاد اللي خدوها بيحتفظوا بيها.'),
    edit && addCard(),
    h('div', { class: 'stack' }, r.badges.map(item)));
}

// ألقاب الشخصية: اللقب بيظهر للولد نفسه بس
async function stagesCard() {
  const r = await act(() => api('GET', '/api/admin/stages'));
  if (!r) return null;
  const rows = r.stages.map((st, i) => {
    const name = h('input', { maxlength: 20, 'aria-label': `اسم اللقب ${i + 1}` }); name.value = st.name;
    const from = h('input', { type: 'number', min: 1, max: 99, class: 'ltr', style: 'width:5rem', 'aria-label': `يبدأ من المستوى (${i + 1})` }); from.value = String(st.from);
    if (i === 0) from.disabled = true;
    return { name, from, row: h('div', { class: 'row' }, h('span', { class: 'muted small', style: 'min-width:4.5rem' }, `اللقب ${i + 1}`), h('div', { class: 'grow' }, name), h('span', { class: 'muted small' }, 'من مستوى'), from) };
  });
  return h('div', { class: 'card stack' }, h('h3', null, 'ألقاب الشخصية'),
    h('p', { class: 'muted small' }, 'كل ولد بيشوف شخصيته ولقبه هو بس، ومحدش بيشوف لقب التاني. الشخصية بتكبر لما يوصل لمستوى اللقب اللي بعده (المستوى بيزيد كل كام نجمة من الإعداد اللي فوق).'),
    rows.map((x) => x.row),
    h('button', { class: 'btn ghost sm', type: 'button', style: 'justify-self:start', onclick: () => act(() => api('POST', '/api/admin/stages', { stages: rows.map((x) => ({ name: x.name.value, from: Number(x.from.value) })) }), 'تم الحفظ') }, 'حفظ'));
}

async function contentAdminCard() {
  const first = await act(() => api('GET', '/api/admin/content'));
  if (!first) return null;
  const box = h('div', { class: 'card stack' });
  const reload = async () => { const x = await act(() => api('GET', '/api/admin/content')); if (x) paint(x); };
  const paint = (r) => {
    const kind = h('select', { id: 'ckind', 'aria-label': 'النوع' }, h('option', { value: 'verse' }, 'آية'), h('option', { value: 'story' }, 'قصة قصيرة'));
    const title = h('input', { id: 'ctitle', placeholder: 'عنوان القصة (للقصص بس)' });
    const text = h('textarea', { id: 'ctext', placeholder: 'نص الآية أو القصة' });
    const ref = h('input', { id: 'cref', placeholder: 'المرجع للآيات، مثال: يوحنا 3: 16' });
    fill(box, h('h3', null, 'آية وقصة اليوم'),
      h('p', { class: 'muted small' }, `الموقع بيعرض واحدة كل يوم بالترتيب من ${r.items.length} عنصر. زوّد عليهم أو امسح اللي مش عايزه.`),
      h('details', { class: 'stack' }, h('summary', null, `المحتوى (${r.items.length})`),
        h('div', { class: 'list' }, r.items.map((it) => h('div', { class: 'row between', style: 'align-items:flex-start' },
          h('div', { class: 'grow' }, h('div', null, it.kind === 'story' ? 'قصة: ' + it.title : it.text), h('div', { class: 'muted small' }, it.kind === 'story' ? it.text.slice(0, 80) + '...' : it.ref)),
          sureButton('حذف', 'تأكيد', async () => { await act(() => api('DELETE', `/api/admin/content/${it.id}`)); reload(); })))),
        h('div', { class: 'stack' }, h('b', null, 'إضافة'), kind, title, text, ref,
          h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: async () => {
            const x = await act(() => api('POST', '/api/admin/content', { kind: kind.value, title: title.value, text: text.value, ref: ref.value }), 'تمت الإضافة'); if (x) reload();
          } }, 'إضافة'))));
  };
  paint(first);
  return box;
}

async function gameAdminCard() {
  const r = await act(() => api('GET', '/api/admin/game'));
  if (!r) return null;
  const box = h('div', { class: 'card stack' });
  const reload = async () => { const x = await act(() => api('GET', '/api/admin/game')); if (x) paint(x); };
  const paint = (r) => {
    const cap = h('input', { id: 'gcap', type: 'number', min: 0, max: 50, value: String(r.cap), class: 'ltr', style: 'width:6rem' });
    const qt = h('input', { id: 'gqt', placeholder: 'نص السؤال' });
    const opts = [0, 1, 2, 3].map((i) => h('input', { 'aria-label': 'اختيار ' + (i + 1), placeholder: 'اختيار ' + (i + 1) + (i > 1 ? ' (اختياري)' : '') }));
    const cor = h('select', { id: 'gqc', 'aria-label': 'الإجابة الصح' }, [0, 1, 2, 3].map((i) => h('option', { value: String(i) }, 'الإجابة الصح: اختيار ' + (i + 1))));
    fill(box, h('h3', null, 'لعبة السلم والتعبان'),
      h('div', { class: 'row between' },
        h('div', null, h('b', null, r.enabled ? 'اللعبة شغالة' : 'اللعبة مقفولة'), h('div', { class: 'muted small' }, `فاتحين اللعبة دلوقتي: ${r.online} - ألعاب شغالة: ${r.playing}`)),
        h('button', { class: r.enabled ? 'btn bad' : 'btn', type: 'button', onclick: async () => { await act(() => api('POST', '/api/admin/game', { enabled: !r.enabled }), r.enabled ? 'اتقفلت اللعبة' : 'اتفتحت اللعبة'); reload(); } }, r.enabled ? 'إيقاف اللعبة' : 'تشغيل اللعبة')),
      h('div', { class: 'row' }, h('label', { for: 'gcap' }, 'أقصى نجوم من اللعبة لكل ولد في اليوم: '), cap,
        h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => { await act(() => api('POST', '/api/admin/game', { cap: Number(cap.value) }), 'تم الحفظ'); reload(); } }, 'حفظ')),
      h('details', { class: 'stack' }, h('summary', null, `أسئلة الإنجيل (${r.questions.length})`),
        h('div', { class: 'list' }, r.questions.map((q) => h('div', { class: 'row between', style: 'align-items:flex-start' },
          h('div', { class: 'grow' }, h('div', null, q.text), h('div', { class: 'muted small' }, q.options.map((o, i) => (i === q.correct ? '✔ ' : '') + o).join(' | '))),
          sureButton('حذف', 'تأكيد', async () => { await act(() => api('DELETE', `/api/admin/game-question/${q.id}`)); reload(); })))),
        h('div', { class: 'stack' }, h('b', null, 'إضافة سؤال'), qt, opts, cor,
          h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: async () => {
            const o = opts.map((i) => i.value.trim()).filter(Boolean); const idx = Number(cor.value);
            const x = await act(() => api('POST', '/api/admin/game-question', { text: qt.value, options: opts.map((i) => i.value), correct: idx }), 'تمت الإضافة'); if (x) reload();
          } }, 'إضافة'))));
  };
  paint(r);
  return box;
}

// ====================== المكتبة: صور / فيديوهات / روابط ======================
let mediaTab = 'photos';
function mediaView(main, canAdd) {
  const body = h('div', { class: 'stack' });
  const seg = (id, label) => h('button', { type: 'button', 'data-sec': id, 'aria-pressed': String(mediaTab === id), onclick: () => { mediaTab = id; mediaView(main, canAdd); } }, label);
  fill(main, h('h2', null, 'المكتبة'),
    h('div', { class: 'seg', style: 'grid-template-columns:repeat(3,1fr)', role: 'group', 'aria-label': 'القسم' }, seg('photos', 'الصور'), seg('videos', 'الفيديوهات'), seg('links', 'الروابط')), body);
  markSeen(mediaTab); paintNews();
  if (mediaTab === 'photos') galleryView(body, canAdd);
  else libraryView(body, canAdd, mediaTab === 'videos' ? 'video' : 'link');
}

async function resizeTo(file, maxSide, quality) {
  let bmp;
  try { bmp = await createImageBitmap(file); } catch { throw new Error('الصورة دي مش مدعومة. جرّب JPG أو PNG'); }
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', quality);
}

function lightbox(list, start, canDel, reload) {
  let i = start;
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
  // الاتجاه عربي: الصورة اللي بعدها على الشمال، واللي قبلها على اليمين
  const go = (d) => { const n = i + d; if (n < 0 || n >= list.length) return; i = n; draw(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') go(1); else if (e.key === 'ArrowRight') go(-1); };
  const box = h('div', { class: 'lb-box' });
  const prev = h('button', { class: 'lb-nav lb-prev', type: 'button', 'aria-label': 'الصورة السابقة', onclick: (e) => { e.stopPropagation(); go(-1); } }, '›');
  const next = h('button', { class: 'lb-nav lb-next', type: 'button', 'aria-label': 'الصورة التالية', onclick: (e) => { e.stopPropagation(); go(1); } }, '‹');
  const ov = h('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'عرض الصور', onclick: (e) => { if (e.target === ov || e.target === box) close(); } }, box, prev, next);
  let x0 = null;
  ov.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  ov.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }, { passive: true });
  function draw() {
    const p = list[i];
    prev.hidden = i === 0; next.hidden = i === list.length - 1;
    ov.setAttribute('aria-label', p.title || 'صورة');
    fill(box,
      h('img', { src: `/api/gallery/${p.id}/full`, alt: p.title || 'صورة من المعرض' }),
      p.title && h('b', null, p.title),
      h('span', { class: 'muted small', style: 'color:#ddd' }, `${i + 1} من ${list.length}`),
      h('div', { class: 'row', style: 'justify-content:center' },
        h('a', { class: 'btn', href: `/api/gallery/${p.id}/full?dl=1`, download: `photo-${p.id}.jpg`, style: 'text-decoration:none' }, 'تحميل الصورة'),
        canDel && sureButton('حذف', 'تأكيد الحذف', async () => { const x = await act(() => api('DELETE', `/api/gallery/${p.id}`), 'تم الحذف'); if (x) { close(); reload(); } }),
        h('button', { class: 'btn ghost', type: 'button', onclick: close }, 'إغلاق')));
  }
  draw();
  document.addEventListener('keydown', onKey);
  document.body.append(ov);
}

async function galleryView(box, canAdd) {
  fill(box, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const load = async () => {
    const r = await act(() => api('GET', '/api/gallery'));
    if (!r) return;
    const status = h('p', { class: 'muted small', hidden: true });
    const title = h('input', { id: 'gtitle', placeholder: 'عنوان للصور (اختياري)', maxlength: 80 });
    const pick = h('input', { id: 'gfiles', type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: async (e) => {
      const files = [...e.target.files]; e.target.value = ''; if (!files.length) return;
      let done = 0, failed = 0; status.hidden = false;
      for (const f of files) {
        status.textContent = `جاري رفع الصورة ${done + failed + 1} من ${files.length}...`;
        try { await api('POST', '/api/gallery', { title: title.value, thumb: await resizeTo(f, 360, 0.7), data: await resizeTo(f, 1600, 0.82) }); done++; }
        catch (ex) { failed++; toast(ex.message, true); }
      }
      toast(`تم رفع ${done} صورة${failed ? ` وفشل ${failed}` : ''}`, !done); load();
    } });
    const form = canAdd ? h('div', { class: 'card stack' }, h('h3', null, 'إضافة صور'),
      h('label', { class: 'f', for: 'gtitle' }, h('span', null, 'العنوان'), title),
      h('button', { class: 'btn', type: 'button', style: 'justify-self:start', onclick: () => pick.click() }, 'اختار صور من الموبايل'), pick, status,
      h('p', { class: 'muted small' }, 'تقدر تختار أكتر من صورة مرة واحدة. الصور بتتصغّر تلقائيًا عشان الموقع يفضل سريع.')) : null;
    fill(box, form, r.photos.length ? h('div', { class: 'gallery' }, r.photos.map((p) =>
      h('button', { class: 'g-item', type: 'button', 'aria-label': p.title || 'فتح الصورة', onclick: () => lightbox(r.photos, r.photos.indexOf(p), canAdd, load) },
        h('img', { src: `/api/gallery/${p.id}/thumb`, alt: p.title || '', loading: 'lazy' }), p.title && h('span', null, p.title))))
      : h('div', { class: 'card' }, h('p', { class: 'muted' }, canAdd ? 'لسه ما رفعتش صور. اضغط "اختار صور" من فوق.' : 'مفيش صور لسه. هتظهر هنا لما الخدام يرفعوها.')));
  };
  load();
}

// ====================== ترتيب الأولاد بالأرقام (بدون أسماء) ======================
async function kidRanking() {
  const r = await act(() => api('GET', '/api/my-ranking'));
  if (!r) return null;
  const m = r.mine, pct = Math.max(4, Math.min(100, Math.round(((m.stars - (m.level - 1) * r.step) / r.step) * 100)));
  return h('div', { class: 'card stack' },
    h('div', { class: 'row between' }, h('h3', null, 'مستواك'), h('span', { class: 'pill star num' }, `المستوى ${m.level}`)),
    h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100' }, h('i', { style: `width:${pct}%` })),
    h('p', { class: 'muted small' }, `باقي ${r.to_next} نجمة للمستوى ${m.level + 1}. ترتيبك ${m.rank} من ${r.total}.`),
    h('h3', null, 'الترتيب'),
    h('div', { class: 'list' }, r.rows.map((x) => h('div', { class: 'row between' + (x.me ? ' me-row' : '') },
      h('span', { class: 'row', style: 'flex-wrap:nowrap' }, h('span', { class: 'pill num', style: 'min-width:2rem;justify-content:center' }, String(x.rank)), h('span', null, x.me ? 'إنت' : `المستوى ${x.level}`), x.me && h('span', { class: 'muted small' }, `(المستوى ${x.level})`)),
      h('span', { class: 'pill star num' }, String(x.stars), starIc())))),
    h('p', { class: 'muted small' }, 'الترتيب بالأرقام بس، من غير أسماء.'));
}

async function levelCard() {
  const r = await act(() => api('GET', '/api/admin/settings'));
  if (!r) return null;
  const inp = h('input', { id: 'lvstep', type: 'number', min: 5, max: 200, value: String(r.level_step), class: 'ltr', style: 'width:6rem' });
  return h('div', { class: 'card stack' }, h('h3', null, 'مستويات الأولاد'),
    h('p', { class: 'muted' }, 'الأولاد بيشوفوا مستواهم وترتيبهم بالأرقام بس. المستوى بيزيد كل كام نجمة:'),
    h('div', { class: 'row' }, inp, h('button', { class: 'btn ghost sm', type: 'button', onclick: () => act(() => api('POST', '/api/admin/settings', { level_step: Number(inp.value) }), 'تم الحفظ') }, 'حفظ')));
}

boot().catch(() => showAuth());

// ====================== النسخة الاحتياطية والمساحة ======================
async function backupCard() {
  const r = await act(() => api('GET', '/api/admin/storage'));
  if (!r) return h('div');
  const mb = (b) => (b / 1048576).toFixed(b < 1048576 * 10 ? 1 : 0) + ' MB';
  const days = r.last_backup ? Math.floor((Date.now() - new Date(r.last_backup).getTime()) / 864e5) : null;
  const old = days === null || days > 30;
  return h('div', { class: 'card stack' }, h('h3', null, 'النسخة الاحتياطية والمساحة'),
    h('div', { class: 'row between' }, h('span', null, 'المساحة المستخدمة' + (r.estimated ? ' (تقدير للصور فقط)' : '')), h('b', { class: 'num', dir: 'ltr' }, `${mb(r.used)} / ${mb(r.limit)}`)),
    h('div', { class: 'progress' + (r.percent >= 80 ? ' warn' : ''), role: 'progressbar', 'aria-valuenow': String(r.percent), 'aria-valuemin': '0', 'aria-valuemax': '100' }, h('i', { style: `width:${Math.max(2, r.percent)}%` })),
    h('p', { class: 'muted small' }, `معرض الصور: ${r.gallery.count} صورة (${mb(r.gallery.bytes)}) - صور الأولاد الشخصية: ${r.profile_photos.count} (${mb(r.profile_photos.bytes)})`),
    r.percent >= 80 && h('p', { class: 'notice' }, 'المساحة قربت تخلص. امسح صور قديمة من المعرض.'),
    h('p', null, 'آخر نسخة احتياطية: ', h('b', null, r.last_backup ? `${days === 0 ? 'النهارده' : 'من ' + days + ' يوم'}` : 'لسه مفيش')),
    old && h('p', { class: 'notice' }, 'يفضل تاخد نسخة احتياطية مرة في الشهر على الأقل.'),
    h('a', { class: 'btn', href: '/api/admin/backup', style: 'text-decoration:none;justify-self:start' }, 'تنزيل نسخة احتياطية كاملة'),
    h('p', { class: 'muted small' }, 'الملف فيه بيانات الأولاد وأرقام أهاليهم. احفظه في مكان آمن ومتشاركوش مع حد. صور المعرض بتتنزّل منه بشكل منفصل.'));
}
