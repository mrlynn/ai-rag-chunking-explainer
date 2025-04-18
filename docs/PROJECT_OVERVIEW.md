# RAG-Powered Chatbot Project Overview

## Project Description
This is a Retrieval-Augmented Generation (RAG) chatbot application built with Next.js and MongoDB. The application allows users to interact with a chatbot that can answer questions based on a collection of PDF documents by retrieving relevant information and generating contextual responses.

## Architecture

### Frontend
- Built with Next.js
- Features a Chatbot component that provides a user interface for interacting with the RAG system
- Uses Material UI for styling and components

### Backend
- MongoDB database for storing:
  - Documents (PDF text content)
  - Chunks (segments of documents)
  - Embeddings (vector representations of chunks)
- API endpoints for:
  - Chat interactions
  - Document retrieval
  - Vector search

### Processing Pipeline
The application includes scripts for processing documents through the RAG pipeline:

1. **PDF Text Extraction** (`extractPdfText.js`)
   - Extracts text content from PDF files
   - Stores the extracted text in the `rag_documents` collection

2. **Document Chunking** (`chunkDocuments.js`)
   - Splits documents into smaller, manageable chunks
   - Stores chunks in the `rag_chunks` collection
   - Uses various chunking strategies (paragraph, sentence, fixed-size)

3. **Embedding Generation** (`generateEmbeddings.js`)
   - Generates vector embeddings for each chunk using OpenAI's API
   - Stores embeddings in the `rag_embeddings` collection
   - Creates vector search indexes for efficient retrieval

4. **RAG Pipeline Setup** (`setupRagPipeline.js`)
   - Orchestrates the entire process
   - Runs each step in sequence
   - Tests the pipeline functionality

## Current Issue
The application is encountering an error during the embedding generation step:

```
Error generating embeddings: TypeError: Cannot read properties of undefined (reading 'embedding')
```

This error occurs in `generateEmbeddings.js` at line 48, suggesting that the response from the OpenAI API is not being processed correctly. The error indicates that the code is trying to access the `embedding` property of an undefined object.

## Collection Structure
The application uses the following MongoDB collections:
- `rag_documents`: Stores the original document content
- `rag_chunks`: Stores document segments
- `rag_embeddings`: Stores vector embeddings for chunks

## Environment Setup
The application requires:
- MongoDB connection string (stored in `.env.local` as `MONGODB_URI`)
- OpenAI API key (stored in `.env.local` as `OPENAI_API_KEY`)
- Node.js environment

## Running the Application
1. Set up environment variables in `.env.local`
2. Run `npm install` to install dependencies
3. Run `node scripts/setupRagPipeline.js` to process documents
4. Start the Next.js application with `npm run dev`

## Next Steps for Troubleshooting
1. Examine the OpenAI API response format in `generateEmbeddings.js`
2. Check if the API key is valid and has sufficient permissions
3. Verify the chunk data structure before sending to the embedding API
4. Add more detailed error logging to identify the exact point of failure 