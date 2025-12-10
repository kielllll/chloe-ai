import { Module } from '@nestjs/common';
import { MessagesModule } from './messages/messages.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MessagesModule, ConfigModule.forRoot({
    envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env.local',
    isGlobal: true,
    ignoreEnvFile: process.env.NODE_ENV === 'production'
  })],
})
export class AppModule {}
