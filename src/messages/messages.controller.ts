import { Body, Controller, Post, Res } from '@nestjs/common';
import { type Response } from 'express';
import { CreateMessageDto } from './dto/create-message-dto';
import { MessagesService } from './messages.service';

@Controller('api/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(@Body() body: CreateMessageDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = await this.messagesService.generateStream(body.content);
    stream.pipe(res);
  }
}
