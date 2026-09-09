import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { seedDemoData } from '../../seed/demo-data';
import { ImageSearchService, sanitizeImageQuery } from './image-search.service';
import { ResetDemoDto } from './demo.dto';

@Injectable()
export class DemoService {
  constructor(
    private prisma: PrismaService,
    private imageSearch: ImageSearchService,
  ) {}

  getDemoConfig() {
    return {
      imageQuery: this.imageSearch.getDefaultQuery(),
      imageCount: this.imageSearch.getImageCount(),
      braveConfigured: this.imageSearch.isBraveConfigured(),
      disclaimer: 'Изображения загружаются напрямую из внешнего источника. Demo-данные синтетические.',
    };
  }

  async resetDemoCatalog(dto?: ResetDemoDto) {
    let query: string;
    try {
      query = sanitizeImageQuery(dto?.imageQuery, this.imageSearch.getDefaultQuery());
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'Invalid image query');
    }

    const images = await this.imageSearch.fetchForDemo(query);
    const result = await seedDemoData(this.prisma, true, images.urls);

    return {
      message: 'Demo catalog regenerated successfully',
      ...result,
      imageQuery: images.query,
      imageSource: images.source,
      disclaimer: 'Все данные синтетические и не относятся к реальным пользователям или организациям.',
    };
  }

  async getHealth() {
    const [products, orders, users] = await Promise.all([
      this.prisma.product.count({ where: { isDemo: true } }),
      this.prisma.order.count({ where: { isDemo: true } }),
      this.prisma.user.count({ where: { isDemo: true } }),
    ]);
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      demo: { products, orders, users },
    };
  }
}
