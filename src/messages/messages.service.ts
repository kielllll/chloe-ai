import { Injectable } from '@nestjs/common';
import { Readable, PassThrough } from 'node:stream';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { PineconeService } from './pinecone.service';
import { DynamodbService } from 'src/dynamodb/dynamodb.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class MessagesService {
  private genAI: GoogleGenAI;

  constructor(
    private configService: ConfigService,
    private pineconeService: PineconeService,
    private dynamodbService: DynamodbService,
  ) {
    const googleGeminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenAI({
      apiKey: googleGeminiApiKey || '',
    });
  }

  async create({
    content,
    context: conversationContext,
    conversationId,
  }: {
    content: string;
    context?: string[];
    conversationId?: string;
  }): Promise<Readable> {
    const dbconversationId = conversationId || randomUUID();
    // 1. Save User Message
    this.dynamodbService.put({
      conversationId: dbconversationId,
      timestamp: new Date().toISOString(),
      messageId: randomUUID(),
      type: 'user',
      content,
    });

    // 2. Query Pinecone for context
    let bookExcerptsString = '';
    try {
      const matches = await this.pineconeService.queryDatabase(content);
      if (matches && matches.matches && matches.matches.length > 0) {
        bookExcerptsString = matches.matches
          .filter((m) => m?.score && m.score > 0.5)
          .map((m) => m.metadata?.text || '')
          .join(' ');
      }
    } catch (error) {
      console.error('Failed to retrieve context from Pinecone:', error);
    }

    // 3. Process context if provided
    let contextString = '';
    if (conversationContext && conversationContext.length > 0) {
      // Limit to last 5 messages
      if (conversationContext.length > 5) {
        conversationContext = conversationContext.slice(
          conversationContext.length - 5,
        );
      }
      contextString = conversationContext.join(' ');
    }

    // 3.5 Construct Prompt
    const strictSystemPrompt = `
You are a helpful assistant specialized in self-help books.

Based on the book excerpts below, respond to the user's question appropriately:
- If they ask for a summary or overview, provide a comprehensive summary
- If they ask a specific question, answer it directly
- Always mention which book(s) the information comes from
- Extract and mention the author's name if it appears in the excerpts
- Use ONLY the information provided in the excerpts

Book Excerpts:
${bookExcerptsString}

Conversation Context (This will serve as your memory for this conversation):
${contextString}

User Question: ${content}

IMPORTANT: If the Book Excerpts section don't contain enough information to answer the question or if the user want to override the context, politely respond: "I don't have enough information about that in my current book collection. Could you ask about something else?"

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
        let response = '';
        for await (const chunk of result) {
          stream.write(chunk.text);
          response += chunk.text;
        }
        console.log(`Stream complete.`);
        stream.end();

        this.dynamodbService.put({
          conversationId: dbconversationId,
          timestamp: new Date().toISOString(),
          messageId: randomUUID(),
          type: 'agent',
          content: response,
        });
      } catch (error) {
        console.error('Stream error:', error);
        stream.destroy(error);
      }
    })();

    console.log('Returning stream...');
    return stream;
  }

  async get(conversationId: string) {
    return await this.dynamodbService.query(
      'conversationId = :conversationId',
      {
        ':conversationId': conversationId,
      },
    );
  }
}
