# RAG Pipeline Scripts

This directory contains scripts for setting up and running a Retrieval-Augmented Generation (RAG) pipeline using MongoDB and OpenAI.

## Prerequisites

Before running these scripts, make sure you have:

1. MongoDB Atlas cluster with Vector Search enabled
2. OpenAI API key
3. Node.js installed (v18.17.0 or higher)
4. Required npm packages installed

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=rag_chatbot
OPENAI_API_KEY=your_openai_api_key
```

## Available Scripts

### 1. `extractPdfText.js`

Extracts text from PDF files in the `docs` directory and stores them in MongoDB.

```bash
npm run extract-pdf
```

### 2. `chunkDocuments.js`

Chunks the extracted documents using various strategies (fixed-size, sentence-based, paragraph-based) and stores the chunks in MongoDB.

```bash
npm run chunk-docs
```

### 3. `generateEmbeddings.js`

Generates embeddings for the chunks using OpenAI's text-embedding-ada-002 model and creates a vector search index in MongoDB.

```bash
npm run generate-embeddings
```

### 4. `vectorSearch.js`

Tests the vector search functionality by performing a sample query.

```bash
node scripts/vectorSearch.js
```

### 5. `runRagPipeline.js`

Tests the entire RAG pipeline by processing sample queries.

```bash
npm run test-rag
```

### 6. `setupRagPipeline.js`

Runs the entire pipeline in sequence: extract PDF text, chunk documents, generate embeddings, and test the RAG pipeline.

```bash
npm run setup-rag
```

## MongoDB Collections

The scripts create and use the following collections:

1. `documents` - Stores the original documents
2. `chunks` - Stores the document chunks with embeddings

## Vector Search Index

The `generateEmbeddings.js` script creates a vector search index on the `chunks` collection with the following configuration:

- Index name: `embedding_index`
- Field: `embedding`
- Dimensions: 1536 (OpenAI ada-002)
- Similarity metric: Cosine

## Customization

You can customize the following parameters in the scripts:

- Chunk size and overlap in `chunkDocuments.js`
- Number of chunks to retrieve in `vectorSearch.js` and `runRagPipeline.js`
- OpenAI model in `generateEmbeddings.js` and `runRagPipeline.js`

## Troubleshooting

If you encounter issues:

1. Check your MongoDB connection string and OpenAI API key
2. Ensure your MongoDB cluster has Vector Search enabled
3. Check the console output for error messages
4. Verify that the PDF files in the `docs` directory are accessible 