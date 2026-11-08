'use strict';
// إشعارات الموبايل (Web Push) بدون أي مكتبات خارجية.
// الإشعار بيوصل فاضي (بدون نص)، والموبايل بيجيب النص من الموقع نفسه، فمش محتاجين تشفير الرسالة.
const crypto = require('node:crypto');
const { db } = require('./db');

const all = async (sql, p) => (await db.q(sql, p)).rows;
const one = async (sql, p) => (await db.q(sql, p)).rows[0];
const b64u = (buf) => Buffer.from(buf).toString('base64url');

// مفاتيح VAPID بتتعمل مرة واحدة وتتحفظ في القاعدة، فمفيش حاجة تضبطها يدوي
async function vapidKeys() {
  const row = await one("SELECT v FROM kv WHERE k='vapid'");
  if (row) return JSON.parse(row.v);
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = privateKey.export({ format: 'jwk' });
  const keys = { d: jwk.d, x: jwk.x, y: jwk.y };
  await db.q("INSERT INTO kv (k,v) VALUES ('vapid',$1) ON CONFLICT (k) DO NOTHING", [JSON.stringify(keys)]);
  return JSON.parse((await one("SELECT v FROM kv WHERE k='vapid'")).v);
}
const publicKey = (k) => b64u(Buffer.concat([Buffer.from([4]), Buffer.from(k.x, 'base64url'), Buffer.from(k.y, 'base64url')]));

function subject() {
  if (process.env.VAPID_SUBJECT) return process.env.VAPID_SUBJECT;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? 'https://' + host : 'mailto:admin@example.org';
}

// نقبل بس عناوين خدمات الإشعارات المعروفة (حماية من إرسال الطلبات لأي عنوان)
const ALLOWED = [/(^|\.)googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
function okEndpoint(u) {
  try { const x = new URL(u); return x.protocol === 'https:' && u.length < 600 && ALLOWED.some((re) => re.test(x.hostname)); } catch { return false; }
}

async function authHeader(endpoint, keys) {
  const aud = new URL(endpoint).origin;
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject() }));
  const key = crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', ...keys }, format: 'jwk' });
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${publicKey(keys)}`;
}

// يبعت إشعار فاضي لكل اشتراك. بيمسح الاشتراكات اللي انتهت.
async function sendTo(subs, send = fetch) {
  const keys = await vapidKeys();
  let sent = 0, failed = 0;
  for (const s of subs) {
    try {
      const r = await send(s.endpoint, { method: 'POST', headers: { Authorization: await authHeader(s.endpoint, keys), TTL: '43200', Urgency: 'high' } });
      if (r.status === 404 || r.status === 410) await db.q('DELETE FROM push_subs WHERE endpoint=$1', [s.endpoint]);
      if (r.status >= 200 && r.status < 300) sent++; else failed++;
    } catch { failed++; }
  }
  return { sent, failed };
}

module.exports = { vapidKeys, publicKey, okEndpoint, sendTo, authHeader };
