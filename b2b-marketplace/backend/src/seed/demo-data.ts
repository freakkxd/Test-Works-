import { PrismaClient, UserRole, OrderStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { buildFallbackImageUrls } from '../modules/demo/image-search.service';

const DEMO_BRANDS = [
  'Altair Devices',
  'Nordline Systems',
  'Vertex Supply',
  'Orbit Works',
  'Sigma Office',
  'Modulix',
];

const CATEGORIES = [
  { name: 'Офисная техника', slug: 'office-tech', description: 'Принтеры, МФУ, сканеры для офиса' },
  { name: 'Сетевое оборудование', slug: 'network', description: 'Коммутаторы, роутеры, точки доступа' },
  { name: 'Периферия', slug: 'peripherals', description: 'Клавиатуры, мыши, мониторы, web-камеры' },
  { name: 'Расходные материалы', slug: 'consumables', description: 'Бумага, картриджи, канцтовары' },
  { name: 'Оборудование для переговорных', slug: 'meeting-rooms', description: 'Проекторы, доски, аудиосистемы' },
  { name: 'Аксессуары для рабочих мест', slug: 'workspace', description: 'Подставки, кабели, органайзеры' },
  { name: 'Серверное оборудование', slug: 'servers', description: 'Серверы, СХД, ИБП' },
  { name: 'Мебель для офиса', slug: 'office-furniture', description: 'Столы, кресла, шкафы' },
];

const PRODUCT_TEMPLATES = [
  { name: 'Монитор 27" IPS Demo', cat: 'peripherals', brand: 'Altair Devices', price: 28990, stock: 45 },
  { name: 'Коммутатор 24-port Gigabit', cat: 'network', brand: 'Nordline Systems', price: 34500, stock: 18 },
  { name: 'Лазерный принтер A4 Demo', cat: 'office-tech', brand: 'Vertex Supply', price: 22490, stock: 32 },
  { name: 'Эргономичное кресло Demo Pro', cat: 'office-furniture', brand: 'Sigma Office', price: 31990, stock: 12 },
  { name: 'Webcam 4K для конференций', cat: 'peripherals', brand: 'Altair Devices', price: 8990, stock: 67 },
  { name: 'Wi-Fi 6 точка доступа', cat: 'network', brand: 'Nordline Systems', price: 12990, stock: 24 },
  { name: 'Проектор для переговорной', cat: 'meeting-rooms', brand: 'Orbit Works', price: 78900, stock: 8 },
  { name: 'Комплект картриджей Demo (4 шт)', cat: 'consumables', brand: 'Modulix', price: 4990, stock: 120 },
  { name: 'Бумага A4 5000 листов', cat: 'consumables', brand: 'Modulix', price: 2790, stock: 200 },
  { name: 'Подставка для ноутбука', cat: 'workspace', brand: 'Sigma Office', price: 3490, stock: 85 },
  { name: 'Сервер стоечный 1U Demo', cat: 'servers', brand: 'Vertex Supply', price: 189000, stock: 5 },
  { name: 'ИБП 1500VA', cat: 'servers', brand: 'Nordline Systems', price: 24990, stock: 15 },
  { name: 'Беспроводная клавиатура', cat: 'peripherals', brand: 'Altair Devices', price: 4590, stock: 90 },
  { name: 'Мышь эргономичная Demo', cat: 'peripherals', brand: 'Altair Devices', price: 2990, stock: 110 },
  { name: 'Стол для переговоров 2.4м', cat: 'office-furniture', brand: 'Sigma Office', price: 42990, stock: 6 },
  { name: 'Акустическая система для зала', cat: 'meeting-rooms', brand: 'Orbit Works', price: 54900, stock: 4 },
  { name: 'Интерактивная доска 75"', cat: 'meeting-rooms', brand: 'Orbit Works', price: 124900, stock: 3 },
  { name: 'Сканер документов A3', cat: 'office-tech', brand: 'Vertex Supply', price: 38990, stock: 11 },
  { name: 'МФУ цветное A4', cat: 'office-tech', brand: 'Vertex Supply', price: 45990, stock: 9 },
  { name: 'Маршрутизатор enterprise', cat: 'network', brand: 'Nordline Systems', price: 67800, stock: 7 },
  { name: 'Кабель-канал набор 50м', cat: 'workspace', brand: 'Modulix', price: 8900, stock: 40 },
  { name: 'Органайзер кабельный 10 шт', cat: 'workspace', brand: 'Modulix', price: 1290, stock: 150 },
  { name: 'SSD накопитель 1TB Demo', cat: 'peripherals', brand: 'Altair Devices', price: 7990, stock: 55 },
  { name: 'USB-hub 7-port', cat: 'workspace', brand: 'Modulix', price: 2490, stock: 75 },
  { name: 'Шкаф для документов 4 секции', cat: 'office-furniture', brand: 'Sigma Office', price: 16990, stock: 14 },
  { name: 'Стеллаж металлический 5 полок', cat: 'office-furniture', brand: 'Sigma Office', price: 11990, stock: 20 },
  { name: 'Коммутатор PoE 16-port', cat: 'network', brand: 'Nordline Systems', price: 28900, stock: 10 },
  { name: 'Маркеры для досок 24 шт', cat: 'consumables', brand: 'Modulix', price: 890, stock: 300 },
  { name: 'Папки-регистраторы 10 шт', cat: 'consumables', brand: 'Modulix', price: 990, stock: 250 },
  { name: 'Система видеоконференций', cat: 'meeting-rooms', brand: 'Orbit Works', price: 98900, stock: 5 },
  { name: 'Монитор 32" 4K Demo', cat: 'peripherals', brand: 'Altair Devices', price: 42990, stock: 22 },
  { name: 'Сервер tower Demo', cat: 'servers', brand: 'Vertex Supply', price: 145000, stock: 4 },
  { name: 'Кресло руководителя Demo', cat: 'office-furniture', brand: 'Sigma Office', price: 38990, stock: 8 },
  { name: 'Комплект периферии Starter', cat: 'peripherals', brand: 'Altair Devices', price: 9990, stock: 35 },
  { name: 'Точка доступа outdoor', cat: 'network', brand: 'Nordline Systems', price: 18990, stock: 12 },
  { name: 'Картриджи для принтера (8 шт)', cat: 'consumables', brand: 'Modulix', price: 8990, stock: 60 },
  { name: 'Кабель HDMI 5м (5 шт)', cat: 'workspace', brand: 'Modulix', price: 1990, stock: 100 },
  { name: 'Стойка для серверов 42U', cat: 'servers', brand: 'Vertex Supply', price: 56900, stock: 3 },
  { name: 'Док-станция USB-C Demo', cat: 'workspace', brand: 'Altair Devices', price: 12990, stock: 28 },
  { name: 'Планшет для презентаций', cat: 'meeting-rooms', brand: 'Orbit Works', price: 34990, stock: 7 },
];

function slugify(text: string, idx: number): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + `-demo-${idx}`;
}

/** Назначить каждому demo-товару внешний URL изображения */
function pickImageUrl(imageUrls: string[], index: number): string[] {
  const url = imageUrls[index % imageUrls.length];
  return [url];
}

export async function seedDemoData(
  prisma: PrismaClient,
  reset = false,
  imageUrls?: string[],
) {
  if (reset) {
    await prisma.payment.deleteMany({ where: { order: { isDemo: true } } });
    await prisma.orderItem.deleteMany({ where: { order: { isDemo: true } } });
    await prisma.order.deleteMany({ where: { isDemo: true } });
    await prisma.review.deleteMany({ where: { isDemo: true } });
    await prisma.cartItem.deleteMany({});
    await prisma.product.deleteMany({ where: { isDemo: true } });
    await prisma.category.deleteMany({ where: { isDemo: true } });
    await prisma.user.deleteMany({ where: { isDemo: true } });
  }

  const password = await bcrypt.hash('admin123', 10);
  const buyerPassword = await bcrypt.hash('buyer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo-marketplace.local' },
    update: { isDemo: true },
    create: { email: 'admin@demo-marketplace.local', password, name: 'Demo Admin', role: UserRole.ADMIN, isDemo: true },
  });

  const buyers = [];
  for (let i = 1; i <= 8; i++) {
    const buyer = await prisma.user.upsert({
      where: { email: `buyer${i}@demo-marketplace.local` },
      update: { isDemo: true },
      create: {
        email: `buyer${i}@demo-marketplace.local`,
        password: buyerPassword,
        name: `Demo Buyer ${i}`,
        role: UserRole.USER,
        isDemo: true,
      },
    });
    buyers.push(buyer);
  }

  const mainBuyer = await prisma.user.upsert({
    where: { email: 'buyer@demo-marketplace.local' },
    update: { isDemo: true },
    create: { email: 'buyer@demo-marketplace.local', password: buyerPassword, name: 'Demo Buyer', role: UserRole.USER, isDemo: true },
  });
  buyers.unshift(mainBuyer);

  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { isDemo: true },
      create: { ...cat, isDemo: true },
    });
    categoryMap[cat.slug] = created.id;
  }

  const urls = imageUrls?.length
    ? imageUrls
    : buildFallbackImageUrls(PRODUCT_TEMPLATES.length, 'Demo Cat');

  const products = [];
  for (let i = 0; i < PRODUCT_TEMPLATES.length; i++) {
    const tpl = PRODUCT_TEMPLATES[i];
    const slug = slugify(tpl.name, i);
    const sku = `DEMO-SKU-${String(1000 + i).padStart(4, '0')}`;
    const hasDiscount = i % 10 === 0 || i === 2 || i === 7 || i === 15;
    const oldPrice = hasDiscount ? tpl.price * 1.15 : null;
    const stock = i === 5 ? 0 : i === 12 ? 3 : tpl.stock;
    const externalImages = pickImageUrl(urls, i);

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        price: tpl.price,
        oldPrice,
        stock,
        isDemo: true,
        images: externalImages,
      },
      create: {
        name: tpl.name,
        slug,
        sku,
        description: `${tpl.name} — синтетический B2B-товар демо-каталога Northstar Demo. Предназначен для корпоративных закупок в демонстрационных целях.`,
        price: tpl.price,
        oldPrice,
        brand: tpl.brand,
        stock,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        ratingCount: Math.floor(Math.random() * 30) + 2,
        images: externalImages,
        specs: { 'Артикул': sku, 'Гарантия': '12 мес. (demo)', 'Поставщик': 'Northstar Demo' },
        categoryId: categoryMap[tpl.cat],
        isDemo: true,
      },
    });
    products.push(product);
  }

  const reviewComments = [
    'Отличный demo-товар для презентации каталога.',
    'Качество соответствует описанию в демо-версии.',
    'Быстрая обработка demo-заказа, рекомендую для демо.',
    'Удобно для демонстрации B2B-сценария на интервью.',
    'Хороший выбор для корпоративных закупок (demo).',
  ];

  for (let i = 0; i < 12; i++) {
    const product = products[i * 3 % products.length];
    const user = buyers[i % buyers.length];
    await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId: user.id } },
      update: {},
      create: {
        productId: product.id,
        userId: user.id,
        rating: Math.floor(Math.random() * 2) + 4,
        comment: reviewComments[i % reviewComments.length],
        isDemo: true,
      },
    });
  }

  const orderStatuses: OrderStatus[] = [
    OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED,
    OrderStatus.DELIVERED, OrderStatus.PENDING, OrderStatus.CANCELLED,
    OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED,
  ];

  for (let i = 0; i < 10; i++) {
    const buyer = buyers[i % buyers.length];
    const product = products[i];
    const qty = Math.floor(Math.random() * 3) + 1;
    const total = Number(product.price) * qty;
    const orderNumber = `DEMO-ORD-${String(1001 + i).padStart(4, '0')}`;

    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (existing) continue;

    await prisma.order.create({
      data: {
        orderNumber,
        status: orderStatuses[i],
        totalAmount: total,
        customerName: buyer.name || 'Demo Buyer',
        customerPhone: '+7 (900) 000-00-00',
        address: 'Demo Address, 123, example.local',
        comment: 'Синтетический demo-заказ',
        userId: buyer.id,
        isDemo: true,
        items: {
          create: [{ productId: product.id, quantity: qty, price: product.price }],
        },
        payments: orderStatuses[i] === OrderStatus.PAID || orderStatuses[i] === OrderStatus.DELIVERED
          ? { create: { amount: total, status: PaymentStatus.SUCCEEDED, yookassaId: `demo_pay_${i}` } }
          : orderStatuses[i] === OrderStatus.CANCELLED
          ? { create: { amount: total, status: PaymentStatus.CANCELED, yookassaId: `demo_pay_cancel_${i}` } }
          : { create: { amount: total, status: PaymentStatus.PENDING, yookassaId: `demo_pay_pending_${i}` } },
      },
    });
  }

  return {
    categories: CATEGORIES.length,
    products: products.length,
    users: buyers.length + 1,
    reviews: 12,
    orders: 10,
    brands: DEMO_BRANDS.length,
  };
}
