import { Module } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { ImageSearchService } from './image-search.service';

@Module({
  controllers: [DemoController],
  providers: [DemoService, ImageSearchService],
  exports: [ImageSearchService],
})
export class DemoModule {}
