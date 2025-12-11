import { Injectable } from '@nestjs/common';
import { Readable, PassThrough } from 'node:stream';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class MessagesService {
  private genAI: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const googleGeminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenAI({
      apiKey: googleGeminiApiKey || ''
    });
  }

  async generateStream(content: string): Promise<Readable> {
    const result = await this.genAI.models.generateContentStream({
      contents: content,
      model: 'gemini-2.5-flash-lite-preview-09-2025'
    });

    const stream = new PassThrough({
      highWaterMark: 1024
    });

    (async () => {
      try {
        for await (const chunk of result) {
          stream.write(chunk.text);
        }
        console.log(`Stream complete.`);
        stream.end();
      } catch (error) {
        console.error('Stream error:', error);
        stream.destroy(error);
      }
    })();

    console.log('Returning stream...');
    return stream;
  }
}
