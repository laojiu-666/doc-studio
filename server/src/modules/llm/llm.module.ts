import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [LLMService, PrismaService],
  exports: [LLMService],
})
export class LLMModule {}
