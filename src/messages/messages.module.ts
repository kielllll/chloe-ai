import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { PineconeService } from './pinecone.service';
import { DynamodbModule } from 'src/dynamodb/dynamodb.module';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, PineconeService],
  exports: [MessagesService],
  imports: [DynamodbModule],
})
export class MessagesModule {}
