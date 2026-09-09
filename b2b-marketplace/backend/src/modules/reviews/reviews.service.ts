import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateReviewDto } from './reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Товар не найден');

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId: dto.productId, userId } },
    });
    if (existing) throw new ConflictException('Вы уже оставили отзыв на этот товар');

    const review = await this.prisma.review.create({
      data: { ...dto, userId },
      include: { user: { select: { id: true, name: true } } },
    });

    // Пересчёт среднего рейтинга
    const stats = await this.prisma.review.aggregate({
      where: { productId: dto.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.product.update({
      where: { id: dto.productId },
      data: {
        rating: stats._avg.rating ?? 0,
        ratingCount: stats._count.rating,
      },
    });

    return review;
  }

  async findByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
