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
    private pineconeService: PineconeService
  ) {
    const googleGeminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenAI({
      apiKey: googleGeminiApiKey || ''
    });
  }

  async generateStream(content: string): Promise<Readable> {
    // 1. Query Pinecone for context
    let contextString = "";
    try {
        const matches = await this.pineconeService.queryDatabase(content);
        if (matches && matches.matches && matches.matches.length > 0) {
            contextString = matches.matches // TODO: consider filtering for accurate relevance
                .map(m => JSON.stringify(m.metadata))
                .join("\n\n");
        }
    } catch (error) {
        console.error("Failed to retrieve context from Pinecone:", error);
        // Fallback: Proceed without context or handle gracefully?
        // For now, we proceed without context but we might want to inform the user.
    }

    // 2. Construct Prompt
    const strictSystemPrompt = `
You are an intelligent knowledge assistant specializing in self-help literature. 
Your task is to answer the user's question using ONLY the provided context snippets below.
Guidelines:
1. **Strict Grounding**: Do not use outside knowledge. If the answer cannot be found in the Context, respectfully state that you do not have enough information found in the available books.
2. **Citations**: Always explicitly cite the book title and page number when available in the context.
3. **Synthesis**: Combine information from multiple chunks if they are relevant.
4. **Tone**: Polite, professional, and encouraging.
Context:
"${contextString}"
Question:
"${content}"
Answer:
`

    const result = await this.genAI.models.generateContentStream({
      contents: strictSystemPrompt,
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
