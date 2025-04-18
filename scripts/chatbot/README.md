# Floating Chatbot RAG Pipeline Scripts

This directory contains scripts for setting up and running a Retrieval-Augmented Generation (RAG) pipeline for the floating chatbot component using MongoDB and OpenAI.

## Overview

The floating chatbot is a separate component from the main application's RAG system. It uses its own set of MongoDB collections:

- `chatbot_documents`: Stores the original document content
- `chatbot_chunks`: Stores document segments
- `chatbot_embeddings`: Stores vector embeddings for chunks

This separation ensures that the floating chatbot functionality doesn't interfere with the main application's RAG functionality.

## Prerequisites

Before running these scripts, make sure you have:

1. MongoDB Atlas cluster with Vector Search enabled
2. OpenAI API key
3. Node.js installed (v18.17.0 or higher)
4. Required npm packages installed

## Environment Variables

Make sure your `.env.local` file in the root directory has the following variables:

```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=ragdemo
OPENAI_API_KEY=your_openai_api_key
```

## Available Scripts

### 1. `extractPdfText.js`

Extracts text from PDF files in the `docs` directory and stores them in the `chatbot_documents` collection.

```bash
npm run extract-chatbot-pdf
```

### 2. `chunkDocuments.js`

Chunks the extracted documents using various strategies (fixed-size, sentence-based, paragraph-based) and stores the chunks in the `chatbot_chunks` collection.

```bash
npm run chunk-chatbot-docs
```

### 3. `generateEmbeddings.js`

Generates embeddings for the chunks using OpenAI's text-embedding-ada-002 model and creates a vector search index in MongoDB.

```bash
npm run generate-chatbot-embeddings
```

### 4. `vectorSearch.js`

Tests the vector search functionality by performing a sample query against the chatbot collections.

```bash
node scripts/chatbot/vectorSearch.js
```

### 5. `runRagPipeline.js`

Tests the entire RAG pipeline for the floating chatbot by processing sample queries.

```bash
npm run test-chatbot-rag
```

### 6. `setupRagPipeline.js`

Runs the entire pipeline in sequence: extract PDF text, chunk documents, generate embeddings, and test the RAG pipeline for the floating chatbot.

```bash
npm run setup-chatbot
```

## Vector Search Index

The `generateEmbeddings.js` script creates a vector search index on the `chatbot_embeddings` collection with the following configuration:

- Index name: `chatbot_vector_index`
- Field: `embedding`
- Dimensions: 1536 (OpenAI ada-002)
- Similarity metric: Cosine

## Customization

You can customize the following parameters in the scripts:

- Chunk size and overlap in `chunkDocuments.js`
- Number of chunks to retrieve in `vectorSearch.js` and `runRagPipeline.js`
- OpenAI model in `generateEmbeddings.js` and `runRagPipeline.js`

## API Endpoint

The floating chatbot component communicates with the backend through a dedicated API endpoint:

- `/api/chatbot` - Processes queries from the floating chatbot component

This endpoint is separate from the main application's `/api/chat` endpoint to maintain separation of concerns.

## Troubleshooting

If you encounter issues:

1. Check your MongoDB connection string and OpenAI API key
2. Ensure your MongoDB cluster has Vector Search enabled
3. Check the console output for error messages
4. Verify that the PDF files in the `docs` directory are accessible
5. Check if the vector index has been created properly