import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class PineconeService {
  private pineconeClient: Pinecone;
  private genAI: GoogleGenAI;
  private pineconeIndex: string;

  constructor(private configService: ConfigService) {
    const pineconeApiKey = this.configService.get<string>('PINECONE_API_KEY');
    const googleGeminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    const pineconeIndex = this.configService.get<string>('PINECONE_INDEX');

    this.pineconeClient = new Pinecone({
      apiKey: pineconeApiKey || '',
    });

    this.genAI = new GoogleGenAI({
      apiKey: googleGeminiApiKey || '',
    });

    this.pineconeIndex = pineconeIndex || '';
  }

  async queryDatabase(query: string) {
    const index = this.pineconeClient.index(this.pineconeIndex);

    // Generate embedding for the query
    const embeddingResult = await this.genAI.models.embedContent({
      model: 'text-embedding-004',
      contents: query,
      config: {
        outputDimensionality: 384,
      },
    });

    if (
      !embeddingResult.embeddings ||
      !embeddingResult.embeddings[0] ||
      !embeddingResult.embeddings[0].values
    ) {
      throw new Error('Failed to generate embedding for query');
    }

    const vector = embeddingResult.embeddings[0].values;

    const queryResponse = await index.query({
      vector,
      topK: 5,
      includeMetadata: true,
      includeValues: true,
    });

    return queryResponse;
  }
}
