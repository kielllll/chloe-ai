import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';

@Injectable()
export class PineconeService implements OnModuleInit {
  private pineconeClient: Pinecone;
  private embedder: any;
  private pineconeIndex: string;
  private isEmbedderReady = false;

  constructor(private configService: ConfigService) {
    const pineconeApiKey = this.configService.get<string>('PINECONE_API_KEY');
    const pineconeIndex = this.configService.get<string>('PINECONE_INDEX');

    this.pineconeClient = new Pinecone({
      apiKey: pineconeApiKey || '',
    });

    this.pineconeIndex = pineconeIndex || '';
  }

  async onModuleInit() {
    try {
      console.log('🤖 Loading embedding model (all-MiniLM-L6-v2)...');

      // Load the same model as Python ingestion
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
      );

      this.isEmbedderReady = true;
      console.log('✅ Embedding model loaded and ready!');
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error);
      throw error;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isEmbedderReady) {
      throw new Error('Embedding model is not ready yet. Please wait...');
    }

    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data);
  }

  async queryDatabase(query: string) {
    const index = this.pineconeClient.index(this.pineconeIndex);

    // Generate embedding using local model (matches Python ingestion)
    const vector = await this.generateEmbedding(query);

    console.log(`🔍 Query: "${query}"`);
    console.log(`📊 Embedding dimension: ${vector.length}`);

    const queryResponse = await index.query({
      vector,
      topK: 5,
      includeMetadata: true,
      includeValues: true,
    });

    // Log top score for debugging
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      console.log(
        `✓ Top score: ${queryResponse.matches[0].score?.toFixed(4)} (${(queryResponse.matches[0].score! * 100).toFixed(1)}%)`,
      );
    }

    return queryResponse;
  }

  // Helper method to get embedding dimension
  getEmbeddingDimension(): number {
    return 384; // all-MiniLM-L6-v2
  }

  // Helper method to check if embedder is ready
  isReady(): boolean {
    return this.isEmbedderReady;
  }
}
