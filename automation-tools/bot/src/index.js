import { Telegraf } from 'telegraf';
import cron from 'node-cron';
import dotenv from 'dotenv';
import db, { subscribers, events } from './db.js';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN || 'dummy-token');
const adminIds = (process.env.ADMIN_IDS || '').split(',').map(Number).filter(Boolean);

/** Отправка сообщения всем подписчикам */
async function broadcast(message) {
  const subs = subscribers.getAll();
  let sent = 0;
  for (const sub of subs) {
    try {
      await bot.telegram.sendMessage(sub.chat_id, message, { parse_mode: 'HTML' });
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${sub.chat_id}:`, err.message);
    }
  }
  return sent;
}

// /start — регистрация пользователя
bot.start(async (ctx) => {
  subscribers.register(ctx.chat.id, ctx.from.username);
  await ctx.reply(
    '👋 Добро пожаловать в систему уведомлений!\n\n' +
    'Команды:\n' +
    '/subscribe — подписаться на уведомления\n' +
    '/unsubscribe — отписаться\n' +
    '/stats — статистика (админ)'
  );
});

// /subscribe — подписка на уведомления
bot.command('subscribe', async (ctx) => {
  subscribers.subscribe(ctx.chat.id);
  await ctx.reply('✅ Вы подписаны на уведомления!');
});

// /unsubscribe — отписка
bot.command('unsubscribe', async (ctx) => {
  subscribers.unsubscribe(ctx.chat.id);
  await ctx.reply('❌ Вы отписаны от уведомлений.');
});

// /broadcast — рассылка всем (только админ)
bot.command('broadcast', async (ctx) => {
  if (!adminIds.includes(ctx.from.id)) {
    return ctx.reply('⛔ Команда доступна только администраторам.');
  }

  const text = ctx.message.text.replace('/broadcast', '').trim();
  if (!text) return ctx.reply('Использование: /broadcast <текст сообщения>');

  const sent = await broadcast(text);
  await ctx.reply(`📨 Отправлено ${sent} подписчикам.`);
});

// /stats — статистика (админ)
bot.command('stats', async (ctx) => {
  if (!adminIds.includes(ctx.from.id)) {
    return ctx.reply('⛔ Команда доступна только администраторам.');
  }

  const today = new Date().toISOString().slice(0, 10);
  const stats = events.getStats(today);
  const subCount = subscribers.count();

  await ctx.reply(
    `📊 <b>Статистика за сегодня</b>\n\n` +
    `👥 Подписчиков: ${subCount}\n` +
    `🛒 Заказов: ${stats.orders}\n` +
    `🎓 Новых студентов: ${stats.students}\n` +
    `💰 Платежей: ${stats.payments}\n` +
    `📈 Всего событий: ${stats.total}`,
    { parse_mode: 'HTML' }
  );
});

/** Ежедневный дайджest в 9:00 */
cron.schedule('0 9 * * *', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const stats = events.getStats(today);

  if (stats.total === 0) return;

  const message =
    `📋 <b>Ежедневный дайджест</b>\n\n` +
    `🛒 Заказов: ${stats.orders}\n` +
    `🎓 Новых студентов: ${stats.students}\n` +
    `💰 Платежей: ${stats.payments}`;

  await broadcast(message);
  console.log('Daily digest sent');
});

/** Обработка webhook-событий от API */
export async function handleWebhookEvent(type, payload) {
  events.log(type, payload);

  const icons = { order: '🛒', student: '🎓', payment: '💰' };
  const labels = {
    order: 'Новый заказ',
    student: 'Новый студент',
    payment: 'Новый платёж',
  };

  const message =
    `${icons[type] || '📌'} <b>${labels[type] || type}</b>\n` +
    (payload.description || JSON.stringify(payload));

  await broadcast(message);
}

// Запуск бота
if (process.env.BOT_TOKEN && process.env.BOT_TOKEN !== 'your-telegram-bot-token') {
  bot.launch();
  console.log('🤖 Telegram bot started');
} else {
  console.log('⚠️  BOT_TOKEN not set — bot running in mock mode');
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;
