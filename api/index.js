'use strict';
// نقطة دخول Vercel: كل طلبات /api/* بتتحول هنا (انظر vercel.json) والمسار الأصلي بيفضل في req.url
const { handle } = require('../lib/core');
module.exports = (req, res) => handle(req, res);
