import { Injectable } from '@nestjs/common';
import { Readable, PassThrough } from 'node:stream';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { PineconeService } from './pinecone.service';

@Injectable()
export class MessagesService {
  private genAI: GoogleGenAI;

  constructor(
    private configService: ConfigService,
    private pineconeService: PineconeService,
  ) {
    const googleGeminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenAI({
      apiKey: googleGeminiApiKey || '',
    });
  }

  async create({
    content,
    conversationId,
  }: {
    content: string;
    conversationId?: string;
  }): Promise<Readable> {
    // 1. Query Pinecone for context
    let contextString = '';
    try {
      const matches = await this.pineconeService.queryDatabase(content);
      if (matches && matches.matches && matches.matches.length > 0) {
        contextString = matches.matches
          .filter((m) => m?.score && m.score > 0.5)
          .map((m) => m.metadata?.text || '')
          .join(' ');
      }
    } catch (error) {
      console.error('Failed to retrieve context from Pinecone:', error);
      // Fallback: Proceed without context or handle gracefully?
      // For now, we proceed without context but we might want to inform the user.
    }

    // 2. Construct Prompt
    const strictSystemPrompt = `
You are a helpful assistant specialized in self-help books.

Based on the book excerpts below, respond to the user's question appropriately:
- If they ask for a summary or overview, provide a comprehensive summary
- If they ask a specific question, answer it directly
- Always mention which book(s) the information comes from
- Extract and mention the author's name if it appears in the excerpts
- Use ONLY the information provided in the excerpts

Book Excerpts:
${contextString}

User Question: ${content}

IMPORTANT: If the Book Excerpts section don't contain enough information to answer the question or basically empty, politely respond: "I don't have enough information about that in my current book collection. Could you ask about something else?"

Provide a clear, helpful response.
`;

    const result = await this.genAI.models.generateContentStream({
      contents: strictSystemPrompt,
      model: 'gemini-2.5-flash-lite-preview-09-2025',
    });

    const stream = new PassThrough({
      highWaterMark: 1024,
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
