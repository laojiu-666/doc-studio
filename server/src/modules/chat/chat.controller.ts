import { Controller, Post, Get, Param, Body, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(':documentId')
  getChat(@Param('documentId') documentId: string, @CurrentUser() user: any) {
    return this.chatService.getOrCreateChat(documentId, user.id);
  }

  @Get(':documentId/messages')
  getMessages(@Param('documentId') documentId: string, @CurrentUser() user: any) {
    return this.chatService.getMessages(documentId, user.id);
  }

  @Post(':documentId/message')
  async sendMessage(
    @Param('documentId') documentId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = this.chatService.sendMessage(documentId, user.id, dto);

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }

    res.end();
  }
}
