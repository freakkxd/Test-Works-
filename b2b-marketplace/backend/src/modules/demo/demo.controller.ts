import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { DemoService } from './demo.service';
import { ResetDemoDto } from './demo.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../../common/guards';

@Controller()
export class DemoController {
  constructor(private demoService: DemoService) {}

  @Get('health')
  health() {
    return this.demoService.getHealth();
  }

  @Get('admin/demo/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getConfig() {
    return this.demoService.getDemoConfig();
  }

  @Post('admin/demo/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  resetDemo(@Body() dto: ResetDemoDto) {
    return this.demoService.resetDemoCatalog(dto);
  }
}
