import { IsString, IsOptional } from 'class-validator';
import type { LLMProvider } from '../../llm/llm.interface';

export class SendMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  provider?: LLMProvider;
}
