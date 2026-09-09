import db from './db.js';

const DEMO_PREFIX = 'DEMO-';
const BRANDS = ['Altair Devices', 'Nordline Systems', 'Vertex Supply'];
const COURSES = ['Fullstack Basics', 'Python Analytics', 'DevOps Intro', 'UI Engineering'];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randomBetween(9, 18), randomBetween(0, 59), 0, 0);
  return d.toISOString();
}

/** Удалить только синтетические demo-события */
export function resetDemoData() {
  db.prepare("DELETE FROM events WHERE json_extract(payload, '$.isDemo') = 1 OR payload LIKE '%\"isDemo\":true%'").run();
  // Fallback: удаляем все события с DEMO- префиксом в payload
  db.prepare("DELETE FROM events WHERE payload LIKE '%DEMO-%'").run();
  return { message: 'Demo data cleared' };
}

/** Idempotent seed: пропускает если уже есть demo-события */
export function seedDemoData(force = false) {
  const existing = db.prepare("SELECT COUNT(*) as c FROM events WHERE payload LIKE '%\"isDemo\":true%'").get();

  if (existing.c > 0 && !force) {
    return { message: 'Demo data already exists', seeded: false, count: existing.c };
  }

  if (force) resetDemoData();

  const insert = db.prepare('INSERT INTO events (type, payload, amount, created_at) VALUES (?, ?, ?, ?)');

  const seedBatch = db.transaction(() => {
    let totalRevenue = 0;

    // 18 заказов за 14 дней
    for (let i = 0; i < 18; i++) {
      const amount = randomBetween(8900, 45900);
      totalRevenue += amount;
      const day = randomBetween(0, 13);
      insert.run('order', JSON.stringify({
        isDemo: true,
        orderId: `${DEMO_PREFIX}ORD-${1001 + i}`,
        orderNumber: `${DEMO_PREFIX}ORD-${1001 + i}`,
        amount,
        customerName: `Покупатель Demo ${i + 1}`,
        description: `Заказ ${DEMO_PREFIX}ORD-${1001 + i} на ${amount.toLocaleString('ru-RU')} ₽`,
        status: ['paid', 'pending', 'processing'][i % 3],
      }), amount, daysAgo(day));
    }

    // 11 студентов
    for (let i = 0; i < 11; i++) {
      const day = randomBetween(0, 13);
      insert.run('student', JSON.stringify({
        isDemo: true,
        studentId: `${DEMO_PREFIX}STU-${String(i + 1).padStart(2, '0')}`,
        name: `Студент Demo ${i + 1}`,
        email: `student${i + 1}@example.local`,
        course: COURSES[i % COURSES.length],
        description: `Новый студент: Студент Demo ${i + 1} (${COURSES[i % COURSES.length]})`,
      }), 0, daysAgo(day));
    }

    // 14 платежей
    for (let i = 0; i < 14; i++) {
      const amount = randomBetween(12000, 89000);
      totalRevenue += amount;
      const day = randomBetween(0, 13);
      insert.run('payment', JSON.stringify({
        isDemo: true,
        paymentId: `${DEMO_PREFIX}PAY-${1001 + i}`,
        amount,
        studentName: `Студент Demo ${(i % 11) + 1}`,
        status: 'succeeded',
        description: `Платёж ${amount.toLocaleString('ru-RU')} ₽ от Студент Demo ${(i % 11) + 1}`,
      }), amount, daysAgo(day));
    }

    // 4 webhook-события
    const webhookEvents = [
      { type: 'webhook', payload: { isDemo: true, event: 'webhook_processed', description: 'Webhook заказа обработан успешно' } },
      { type: 'webhook', payload: { isDemo: true, event: 'webhook_processed', description: 'Webhook студента обработан успешно' } },
      { type: 'webhook_error', payload: { isDemo: true, event: 'webhook_error', description: 'Ошибка webhook: timeout (demo)' } },
      { type: 'webhook', payload: { isDemo: true, event: 'webhook_processed', description: 'Webhook платежа обработан успешно' } },
    ];

    for (let i = 0; i < webhookEvents.length; i++) {
      insert.run(webhookEvents[i].type, JSON.stringify(webhookEvents[i].payload), 0, daysAgo(i));
    }

    return totalRevenue;
  });

  const revenue = seedBatch();
  const count = db.prepare('SELECT COUNT(*) as c FROM events').get().c;

  return {
    message: 'Demo data seeded successfully',
    seeded: true,
    count,
    revenue,
    disclaimer: 'Метрики сформированы из синтетических демонстрационных событий.',
  };
}

export function getDemoMeta() {
  const count = db.prepare('SELECT COUNT(*) as c FROM events').get().c;
  const last = db.prepare('SELECT MAX(created_at) as last FROM events').get();
  return {
    totalEvents: count,
    lastUpdated: last.last || null,
    isEmpty: count === 0,
  };
}
