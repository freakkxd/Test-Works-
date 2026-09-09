import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { v4 as uuidv4 } from 'uuid';

interface YooKassaPaymentResponse {
  id: string;
  status: string;
  confirmation?: { confirmation_url?: string };
}

@Injectable()
export class PaymentsService {
  private shopId: string;
  private secretKey: string;
  private returnUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.shopId = this.config.get<string>('YOOKASSA_SHOP_ID') || 'test-shop';
    this.secretKey = this.config.get<string>('YOOKASSA_SECRET_KEY') || 'test-key';
    this.returnUrl = this.config.get<string>('YOOKASSA_RETURN_URL') || 'http://localhost:5173/orders';
  }

  /** Создание платежа через ЮKassa API (тестовый режим) */
  async createPayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { payments: true },
    });

    if (!order) throw new NotFoundException('Заказ не найден');
    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Заказ уже оплачен');
    }

    const existingPayment = order.payments.find((p) => p.status === PaymentStatus.PENDING);
    if (existingPayment?.confirmationUrl) {
      return existingPayment;
    }

    const idempotenceKey = uuidv4();
    const amount = Number(order.totalAmount);

    // В тестовом режиме эмулируем ответ ЮKassa, если ключи не настроены
    let yookassaResponse: YooKassaPaymentResponse;

    if (this.shopId === 'test-shop' || this.secretKey === 'test-key') {
      yookassaResponse = {
        id: `test_${uuidv4()}`,
        status: 'pending',
        confirmation: {
          confirmation_url: `${this.returnUrl}?payment=test&orderId=${orderId}`,
        },
      };
    } else {
      yookassaResponse = await this.callYooKassaApi(amount, order.orderNumber, idempotenceKey);
    }

    const payment = await this.prisma.payment.create({
      data: {
        yookassaId: yookassaResponse.id,
        amount: order.totalAmount,
        status: PaymentStatus.PENDING,
        confirmationUrl: yookassaResponse.confirmation?.confirmation_url,
        orderId,
      },
    });

    return payment;
  }

  /** Webhook от ЮKassa — обработка статусов платежа */
  async handleWebhook(payload: {
    event: string;
    object: { id: string; status: string };
  }) {
    const { object } = payload;
    const payment = await this.prisma.payment.findUnique({
      where: { yookassaId: object.id },
      include: { order: true },
    });

    if (!payment) {
      return { message: 'Payment not found' };
    }

    let paymentStatus: PaymentStatus;
    let orderStatus: OrderStatus | undefined;

    switch (object.status) {
      case 'succeeded':
        paymentStatus = PaymentStatus.SUCCEEDED;
        orderStatus = OrderStatus.PAID;
        break;
      case 'canceled':
        paymentStatus = PaymentStatus.CANCELED;
        orderStatus = OrderStatus.CANCELLED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: paymentStatus },
      }),
      ...(orderStatus
        ? [
            this.prisma.order.update({
              where: { id: payment.orderId },
              data: { status: orderStatus },
            }),
          ]
        : []),
    ]);

    return { message: 'Webhook processed', status: paymentStatus };
  }

  /** Тестовое подтверждение оплаты (для демо без реального webhook) */
  async simulatePayment(orderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, status: PaymentStatus.PENDING },
    });

    if (!payment) throw new NotFoundException('Платёж не найден');

    return this.handleWebhook({
      event: 'payment.succeeded',
      object: { id: payment.yookassaId!, status: 'succeeded' },
    });
  }

  private async callYooKassaApi(
    amount: number,
    orderNumber: string,
    idempotenceKey: string,
  ): Promise<YooKassaPaymentResponse> {
    const auth = Buffer.from(`${this.shopId}:${this.secretKey}`).toString('base64');

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify({
        amount: { value: amount.toFixed(2), currency: 'RUB' },
        confirmation: { type: 'redirect', return_url: this.returnUrl },
        capture: true,
        description: `Заказ ${orderNumber}`,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('Ошибка создания платежа в ЮKassa');
    }

    return response.json() as Promise<YooKassaPaymentResponse>;
  }
}
