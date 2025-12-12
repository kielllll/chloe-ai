<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Chloe AI

Chloe AI is an LLM chatbot that uses RAG to provide self-help resources to users. The vector database contains a lot of self-help books.

## Features

- **Google GenAI Integration**: Powered by `@google/genai` for advanced AI interactions.
- **Vector Search**: Utilizes `@pinecone-database/pinecone` for efficient vector storage and retrieval.
- **Throttling**: Built-in rate limiting using `@nestjs/throttler` to ensure stability.
- **Robust Architecture**: Built on the scalable and modular NestJS framework.

## Installation

```bash
$ pnpm install
```

## Configuration

Ensure you have a `.env.local` file in the root directory with the necessary values 
- `GEMINI_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX`

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## License

This project is [UNLICENSED](LICENSE). This is only intended for learning purposes.
