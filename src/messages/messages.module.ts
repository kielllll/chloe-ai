import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

import { PineconeService } from './pinecone.service';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, PineconeService],
  exports: [MessagesService],
})
export class MessagesModule {}
