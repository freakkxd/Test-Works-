import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResetDemoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  imageQuery?: string;
}
