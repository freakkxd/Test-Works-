import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { events, meta } from './db.js';
import { seedDemoData, resetDemoData, getDemoMeta } from './demo-seed.js';

dotenv.config();

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(error.statusCode || 500).send({ error: error.message || 'Internal Server Error' });
});

// Health check
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  events: events.count(),
}));

// Demo meta
app.get('/demo/meta', async () => ({
  ...getDemoMeta(),
  lastSeed: meta.get('lastSeed'),
  disclaimer: 'Метрики сформированы из синтетических демонстрационных событий.',
}));

// POST /demo/seed
app.post('/demo/seed', async (request) => {
  const force = request.body?.force === true;
  const result = seedDemoData(force);
  if (result.seeded) meta.set('lastSeed', new Date().toISOString());
  return result;
});

// POST /demo/reset
app.post('/demo/reset', async () => {
  resetDemoData();
  const result = seedDemoData(true);
  meta.set('lastSeed', new Date().toISOString());
  return result;
});

// Webhooks
app.post('/webhook/order', async (request) => {
  const body = request.body || {};
  const orderNumber = body.orderNumber || body.orderId || 'UNKNOWN';
  const amount = Number(body.amount) || 0;
  events.log('order', {
    orderNumber,
    amount,
    customerName: body.customerName || 'Demo Customer',
    description: `Заказ ${orderNumber} на ${amount.toLocaleString('ru-RU')} ₽`,
    status: body.status || 'paid',
  }, amount);
  notifyBot('order', body);
  return { success: true, message: 'Order webhook processed' };
});

app.post('/webhook/student', async (request) => {
  const body = request.body || {};
  events.log('student', {
    name: body.name,
    email: body.email,
    course: body.course,
    description: `Новый студент: ${body.name} (${body.course || 'курс не указан'})`,
  });
  notifyBot('student', body);
  return { success: true, message: 'Student webhook processed' };
});

app.post('/webhook/payment', async (request) => {
  const body = request.body || {};
  const amount = Number(body.amount) || 0;
  events.log('payment', {
    amount,
    studentName: body.studentName || body.name || 'Demo Student',
    status: body.status || 'succeeded',
    description: `Платёж ${amount.toLocaleString('ru-RU')} ₽`,
  }, amount);
  notifyBot('payment', body);
  return { success: true, message: 'Payment webhook processed' };
});

app.get('/stats', async (request) => {
  const { period = '14days' } = request.query;
  return events.getStats(period);
});

app.get('/stats/daily', async (request) => {
  const { days = 14 } = request.query;
  return events.getDailyStats(Number(days));
});

app.get('/events', async (request) => {
  const { limit = 20 } = request.query;
  return events.getRecent(Number(limit));
});

async function notifyBot(type, payload) {
  const botUrl = process.env.BOT_NOTIFY_URL;
  if (!botUrl) return;
  try {
    await fetch(botUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
  } catch (err) {
    app.log.warn('Failed to notify bot:', err.message);
  }
}

// Auto-seed при первом запуске если база пуста
if (events.count() === 0) {
  console.log('📦 Database empty — seeding demo data...');
  const result = seedDemoData(false);
  meta.set('lastSeed', new Date().toISOString());
  console.log(`✅ ${result.message} (${result.count} events)`);
}

const port = Number(process.env.PORT) || 3002;
const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
  console.log(`🚀 Automation API running on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
