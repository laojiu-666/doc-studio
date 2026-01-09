import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsIn(['openai', 'claude', 'gemini', 'custom'])
  provider: string;

  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;
}
