import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create/:orderId')
  @UseGuards(JwtAuthGuard)
  createPayment(
    @Request() req: { user: { id: string } },
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.createPayment(orderId, req.user.id);
  }

  /** Webhook endpoint для ЮKassa */
  @Post('webhook')
  handleWebhook(@Body() payload: { event: string; object: { id: string; status: string } }) {
    return this.paymentsService.handleWebhook(payload);
  }

  /** Тестовое подтверждение оплаты (для демо) */
  @Post('simulate/:orderId')
  @UseGuards(JwtAuthGuard)
  simulatePayment(@Param('orderId') orderId: string) {
    return this.paymentsService.simulatePayment(orderId);
  }
}
