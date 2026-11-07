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
const state = { me: null, tab: null, kidWeek: null, openKid: null };
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
      h('div', { class: 'mark' }, icon('cross')),
      h('div', { style: 'min-width:0' }, h('b', null, 'متابعة مدارس الأحد'), h('span', null, sub))),
    h('div', { class: 'row' }, themeButton()));
}

// ---------- الدخول والتسجيل ----------
function showAuth(mode = 'login') {
  document.body.className = '';
  let current = mode;
  const box = h('div', { class: 'stack' });
  const draw = () => {
    const err = h('div', { class: 'err', hidden: true, role: 'alert' });
    const name = h('input', { id: 'name', autocomplete: 'name', required: true });
    const phone = h('input', { id: 'phone', class: 'ltr', type: 'tel', inputmode: 'tel', autocomplete: 'username', required: true, placeholder: '01xxxxxxxxx' });
    const pw = h('input', { id: 'pw', type: 'password', autocomplete: current === 'login' ? 'current-password' : 'new-password', required: true, minlength: 6 });
    const form = h('form', { class: 'stack', novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); err.hidden = true;
      try {
        if (current === 'login') await api('POST', '/api/login', { phone: phone.value, password: pw.value });
        else await api('POST', '/api/register', { name: name.value, phone: phone.value, password: pw.value });
        state.tab = current === 'register' ? 'profile' : null;
        await boot();
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
      form,
      current === 'register' && h('p', { class: 'muted small' }, 'بعد التسجيل هتكمّل بياناتك (رقم ماما وبابا والعنوان وأب الاعتراف وغيرها).'));
  };
  draw();
  fill(app, h('main', { class: 'auth' },
    h('div', { class: 'hero' }, h('div', { class: 'mark' }, icon('cross')),
      h('h1', null, 'متابعة مدارس الأحد'), h('p', { class: 'muted' }, 'سنة خامسة ابتدائي - أولاد')),
    h('div', { class: 'card' }, box),
    h('div', { class: 'row', style: 'justify-content:center' }, themeButton())));
}

// ---------- التشغيل ----------
async function boot() {
  const r = await api('GET', '/api/me');
  if (!r.user) { state.me = null; return showAuth(); }
  state.me = r;
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
  const tabs = [['week', 'أسبوعي', 'week'], ['quiz', 'المسابقة', 'trophy'], ['library', 'المكتبة', 'book'], ['stars', 'نجومي', 'star'], ['profile', 'بياناتي', 'user']];
  const bar = h('nav', { class: 'tabbar', 'aria-label': 'التنقل' }, tabs.map(([id, label, ic]) =>
    h('button', { type: 'button', 'aria-current': state.tab === id ? 'page' : null, onclick: () => { state.tab = id; state.openContest = null; renderKid(); } }, icon(ic), label)));
  const bd = me.birthday;
  const greet = bd && bd.is_today ? h('div', { class: 'bday-card' }, (() => { const c = icon('cake'); c.setAttribute('class', 'bday-ic'); return c; })(),
    h('div', null, h('b', null, `كل سنة وإنت طيب يا ${firstName(me.user.name)}`), h('p', null, `النهارده عيد ميلادك، ودلوقتي عندك ${arYears(bd.turning)}. ربنا يفرّح قلبك ويبارك حياتك.`))) : null;
  fill(app, h('div', { class: 'wrap' }, header(me.user.name), greet), main, bar);
  if (state.tab === 'week') kidWeek(main);
  else if (state.tab === 'quiz') kidQuiz(main);
  else if (state.tab === 'library') libraryView(main, false);
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
  const prevOk = addDays(week.start, -1) >= addDays(min_day, -6);
  const draw = () => {
    const days = [];
    for (let i = 0; i < 7; i++) days.push(addDays(week.start, i));
    const mkChip = (label, on, disabled, onclick) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(on), disabled, onclick }, icon('check'), label);
    const dayRows = days.map((d) => {
      const rec = week.days[d] || { prayed: false, gospel: false };
      const locked = d > today || d < min_day;
      const toggle = (field) => async () => {
        const nextVal = !rec[field];
        const res = await act(() => api('PUT', '/api/day', { day: d, [field]: nextVal }));
        if (!res) return;
        week.days[d] = { ...rec, [field]: nextVal };
        stars.v = res.stars; starNum.textContent = String(res.stars.total); draw();
      };
      const att = week.attendance.includes(d);
      return h('div', { class: 'day' + (d === today ? ' today' : '') },
        h('div', { class: 'dn' }, h('b', null, d === today ? 'النهارده' : dayName(d)), h('span', null, shortDate(d)), att && h('span', { class: 'pill good', style: 'margin-top:2px' }, 'حضرت')),
        mkChip('صليت', rec.prayed, locked, toggle('prayed')),
        mkChip('قريت الإنجيل', rec.gospel, locked, toggle('gospel')));
    });
    const massLocked = week.start > today || week.end < min_day;
    const massBtn = mkChip(week.mass ? 'رحت القداس' : 'رحت القداس الأسبوع ده', week.mass, massLocked, async () => {
      const res = await act(() => api('PUT', '/api/mass', { week_start: week.start, attended: !week.mass }));
      if (!res) return;
      week.mass = !week.mass; stars.v = res.stars; starNum.textContent = String(res.stars.total); draw();
    });
    massBtn.classList.add('wide');
    const confLocked = false;
    const confBtn = mkChip(week.confession ? 'اعترفت الشهر ده' : 'اعترفت الشهر ده', week.confession, confLocked, async () => {
      const res = await act(() => api('PUT', '/api/confession', { month: week.confession_month, confession: !week.confession }));
      if (!res) return;
      week.confession = !week.confession; stars.v = res.stars; starNum.textContent = String(res.stars.total); draw();
    });
    confBtn.classList.add('wide');
    fill(box, 
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
  fill(main, 
    h('div', { class: 'stars-hero' }, (() => { const s = icon('star'); s.setAttribute('class', 'big'); return s; })(),
      h('div', null, starNum, h('span', { class: 'muted' }, 'مجموع نجومك'))),
    (() => { const b = state.me.birthday; if (!b || b.is_today) return null;
      return h('div', { class: 'card row bday-row' }, (() => { const c = icon('cake'); c.setAttribute('class', 'bday-ic sm'); return c; })(),
        h('div', { class: 'grow' }, h('b', null, 'عمرك ' + ageText(b)), h('div', { class: 'muted small' }, `فاضل ${arDays(b.days_until)} على عيد ميلادك`))); })(),
    h('div', { class: 'weeknav' },
      h('button', { class: 'btn ghost sm', type: 'button', disabled: !prevOk, onclick: () => { state.kidWeek = addDays(week.start, -7); renderKid(); } }, 'الأسبوع اللي فات'),
      h('b', { class: 'num', style: 'text-align:center' }, isCurrent ? 'الأسبوع ده' : weekLabel(week.start, week.end)),
      h('button', { class: 'btn ghost sm', type: 'button', disabled: isCurrent, onclick: () => { state.kidWeek = addDays(week.start, 7); renderKid(); } }, 'الأسبوع الجاي')),
    box,
    h('p', { class: 'muted small' }, 'علّم على اللي عملته. تقدر تعدّل آخر أسبوعين بس.'));
  draw();
}

async function kidStars(main) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const r = await act(() => api('GET', '/api/my-stars'));
  if (!r) return;
  const s = r.stars;
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
      row('زيادة أو خصم من الخدام', s.adjust)),
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
    photoBox, form, passwordCard(),
    h('button', { class: 'btn ghost', type: 'button', onclick: logout }, 'تسجيل الخروج'));
}

// ====================== شاشة الخدام والمتابعين ======================
const ROLE_LABEL = { admin: 'مسؤول', servant: 'خادم', viewer: 'متابع' };
const canMark = () => ['admin', 'servant'].includes(state.me.user.role);

function renderStaff() {
  document.body.className = 'staff';
  const me = state.me.user;
  if (!state.tab) state.tab = 'overview';
  const tabs = [['overview', 'متابعة الأسبوع'], ['attendance', 'حضور الاجتماع'], ['quiz', 'المسابقة'], ['library', 'المكتبة']];
  if (me.role === 'admin') tabs.push(['team', 'الخدام والإعدادات']);
  tabs.push(['me', 'حسابي']);
  const main = h('main', { class: 'stack' });
  const bdayBox = h('div', { class: 'stack' });
  fill(app, h('div', { class: 'wrap wide' },
    header(`${me.name} (${ROLE_LABEL[me.role]})`), bdayBox,
    state.openKid ? '' : h('nav', { class: 'tabs', 'aria-label': 'التنقل' }, tabs.map(([id, label]) =>
      h('button', { type: 'button', 'aria-current': state.tab === id ? 'page' : null, onclick: () => { state.tab = id; state.staffContest = null; state.builder = null; renderStaff(); } }, label))),
    main));
  staffBirthdays(bdayBox);
  if (state.openKid) staffKid(main, state.openKid);
  else if (state.tab === 'library') libraryView(main, me.role === 'admin');
  else if (state.tab === 'overview') staffOverview(main);
  else if (state.tab === 'attendance') staffAttendance(main);
  else if (state.tab === 'quiz') staffQuiz(main);
  else if (state.tab === 'team') staffTeam(main);
  else staffMe(main);
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
    const rows = r.kids.filter((k) => !q || k.name.includes(q) || k.phone.includes(q));
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
  const complete = r.kids.filter((k) => k.complete).length;
  const attendedWeek = r.kids.filter((k) => k.attendance.length).length;
  fill(main, 
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', { class: 'num' }, String(r.kids.length)), h('span', null, 'ولد مسجل')),
      h('div', { class: 'stat' }, h('b', { class: 'num' }, String(r.kids.length - complete)), h('span', null, 'بياناتهم ناقصة')),
      h('div', { class: 'stat' }, h('b', { class: 'num' }, String(attendedWeek)), h('span', null, 'حضروا الأسبوع ده'))),
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
        [['الصلاة', s.prayer], ['الإنجيل', s.gospel], ['القداس', s.mass], ['الاعتراف', s.confession], ['الاجتماع', s.attendance], ['المسابقة', s.quiz], ['زيادة/خصم', s.adjust]].map(([l, n]) =>
          h('div', { class: 'stat' }, h('b', { class: 'num' }, String(n)), h('span', null, l))))),
    h('div', { class: 'card stack' }, h('h3', null, 'آخر 4 أسابيع'),
      r.days.length ? h('div', { class: 'tablebox' }, h('table', null,
        h('thead', null, h('tr', null, h('th', null, 'اليوم'), h('th', null, 'صلاة'), h('th', null, 'إنجيل'))),
        h('tbody', null, r.days.map((d) => h('tr', null, h('td', null, `${dayName(d.day)} ${shortDate(d.day)}`), h('td', null, d.prayed ? h('span', { class: 'pill good' }, 'نعم') : '-'), h('td', null, d.gospel ? h('span', { class: 'pill good' }, 'نعم') : '-')))))) : h('p', { class: 'muted' }, 'لسه ما سجلش حاجة'),
      h('p', { class: 'muted small' }, 'القداس: ' + (r.masses.length ? r.masses.map(shortDate).join('، ') : 'لا يوجد'), h('br'), 'الاعتراف: ' + (r.confessions.length ? r.confessions.map(monthLabel).join('، ') : 'لا يوجد'), h('br'), 'حضور الاجتماع: ' + (r.attendance.length ? r.attendance.map(shortDate).join('، ') : 'لا يوجد'))),
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
  fill(main, 
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
    h('p', { class: 'muted small' }, 'لتغيير كلمة سر ولد: افتح الولد من "متابعة الأسبوع" واستخدم خانة تغيير كلمة السر.'));
}

function staffMe(main) {
  fill(main, h('div', { class: 'wrap stack' }, passwordCard(), h('button', { class: 'btn ghost', type: 'button', onclick: logout }, 'تسجيل الخروج')));
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
    h('div', { class: 'row' }, h('a', { class: 'btn ghost sm', href: safeHref(r.url), target: '_blank', rel: 'noopener noreferrer', style: 'text-decoration:none' }, r.kind === 'video' ? 'فتح في يوتيوب' : 'فتح الرابط'),
      admin && sureButton('حذف', 'تأكيد الحذف', async () => { const x = await act(() => api('DELETE', `/api/admin/resource/${r.id}`), 'تم الحذف'); if (x) reload(); })));
}
async function libraryView(main, admin) {
  fill(main, h('p', { class: 'muted' }, 'جاري التحميل...'));
  const load = async () => {
    const r = await act(() => api('GET', '/api/resources'));
    if (!r) return;
    const title = h('input', { id: 'rtitle', placeholder: 'مثلاً: ترنيمة الأسبوع' });
    const url = h('input', { id: 'rurl', class: 'ltr', placeholder: 'https://www.youtube.com/watch?v=...', inputmode: 'url' });
    const desc = h('textarea', { id: 'rdesc', placeholder: 'وصف قصير (اختياري)', maxlength: 400 });
    const err = h('div', { class: 'err', hidden: true, role: 'alert' });
    const form = admin ? h('form', { class: 'card stack', novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); err.hidden = true;
      try { await api('POST', '/api/admin/resource', { title: title.value, url: url.value, description: desc.value }); toast('تمت الإضافة'); load(); }
      catch (ex) { err.textContent = ex.message; err.hidden = false; }
    } },
      h('h3', null, 'إضافة رابط أو فيديو'),
      h('label', { class: 'f', for: 'rtitle' }, h('span', null, 'العنوان'), title),
      h('label', { class: 'f', for: 'rurl' }, h('span', null, 'الرابط ', h('small', null, '(روابط يوتيوب بتتشغّل جوه الموقع)')), url),
      h('label', { class: 'f', for: 'rdesc' }, h('span', null, 'الوصف'), desc), err,
      h('button', { class: 'btn', type: 'submit' }, 'إضافة')) : null;
    fill(main, h('h2', null, 'المكتبة'), form,
      r.resources.length ? r.resources.map((x) => resourceCard(x, admin, load)) : h('div', { class: 'card' }, h('p', { class: 'muted' }, admin ? 'لسه ما ضفتش حاجة. أضف أول رابط أو فيديو من فوق.' : 'مفيش حاجة هنا لسه. هتظهر هنا الروابط والفيديوهات اللي بيضيفها الخادم.')));
  };
  load();
}

boot().catch(() => showAuth());
