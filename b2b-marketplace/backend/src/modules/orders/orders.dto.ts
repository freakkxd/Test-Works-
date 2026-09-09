import { IsString, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  customerName!: string;

  @IsString()
  customerPhone!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status!: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}
