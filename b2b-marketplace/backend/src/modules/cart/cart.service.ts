import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: { include: { category: true } } },
    });

    const total = items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    return { items, total };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Товар не найден');
    if (product.stock < dto.quantity) {
      throw new BadRequestException('Недостаточно товара на складе');
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { productId_userId: { productId: dto.productId, userId } },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
        include: { product: true },
      });
    }

    return this.prisma.cartItem.create({
      data: { userId, productId: dto.productId, quantity: dto.quantity },
      include: { product: true },
    });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, userId } });
    if (!item) throw new NotFoundException('Позиция не найдена');

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
      return { message: 'Товар удалён из корзины' };
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, userId } });
    if (!item) throw new NotFoundException('Позиция не найдена');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return { message: 'Товар удалён из корзины' };
  }

  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return { message: 'Корзина очищена' };
  }
}
