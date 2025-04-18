import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';

// MongoDB connection string
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Collection names for our floating chatbot
const CHATBOT_COLLECTIONS = {
  documents: 'chatbot_documents',
  chunks: 'chatbot_chunks',
  embeddings: 'chatbot_embeddings'
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Number of chunks to retrieve
const NUM_CHUNKS = 5;

/**
 * Generate embedding for a query
 * @param {string} query - The query text
 * @returns {Promise<Array>} - The embedding vector
 */
async function generateEmbedding(query) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Perform vector search to find relevant chunks
 * @param {Array} embedding - The query embedding
 * @param {Object} db - MongoDB database instance
 * @param {number} limit - Maximum number of chunks to retrieve
 * @returns {Promise<Array>} - Array of relevant chunks
 */
async function vectorSearch(embedding, db, limit = NUM_CHUNKS) {
  try {
    const embeddingsCollection = db.collection(CHATBOT_COLLECTIONS.embeddings);
    
    try {
      // Attempt to perform vector search
      const results = await embeddingsCollection.aggregate([
        {
          $vectorSearch: {
            index: "chatbot_vector_index",
            path: "embedding",
            queryVector: embedding,
            numCandidates: 100,
            limit: limit
          }
        },
        {
          $project: {
            _id: 1,
            text: 1,
            chunkId: 1,
            metadata: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ]).toArray();
      
      return results;
    } catch (vectorError) {
      console.warn('Vector search failed:', vectorError.message);
      console.log('Falling back to regular text search...');
      
      // Fallback to regular search
      const results = await embeddingsCollection
        .find({})
        .limit(limit)
        .toArray();
      
      console.log(`Found ${results.length} documents using fallback search`);
      return results;
    }
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }
}

/**
 * Get document information for a chunk
 * @param {string} chunkId - The chunk ID
 * @param {Object} db - MongoDB database instance
 * @returns {Promise<Object>} - Document information
 */
async function getDocumentInfo(chunkId, db) {
  try {
    // First get the chunk to find the document ID
    const chunksCollection = db.collection(CHATBOT_COLLECTIONS.chunks);
    const chunk = await chunksCollection.findOne({ _id: chunkId });
    
    if (!chunk || !chunk.documentId) {
      console.warn(`No chunk found with id ${chunkId} or missing documentId`);
      return null;
    }
    
    // Then get the document
    const documentsCollection = db.collection(CHATBOT_COLLECTIONS.documents);
    const document = await documentsCollection.findOne({ _id: chunk.documentId });
    
    return document;
  } catch (error) {
    console.error('Error getting document info:', error);
    throw error;
  }
}

/**
 * Generate a response using OpenAI
 * @param {string} query - The user query
 * @param {Array} chunks - Relevant chunks
 * @returns {Promise<string>} - The generated response
 */
async function generateResponse(query, chunks) {
  try {
    // Prepare context from chunks
    const context = chunks.map(chunk => chunk.text).join('\n\n');
    
    // Generate response using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions about MongoDB and RAG applications based on the provided context. If the answer cannot be found in the context, say so politely and suggest where the user might find more information. You are operating within a floating chatbot component on a MongoDB RAG application demonstration.`
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${query}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}

/**
 * Process a query through the RAG pipeline
 * @param {string} query - The user query
 * @param {Object} db - MongoDB database instance
 * @returns {Promise<Object>} - The response and metadata
 */
async function processQuery(query, db) {
  try {
    // Generate embedding for the query
    const embedding = await generateEmbedding(query);
    
    // Perform vector search
    const relevantChunks = await vectorSearch(embedding, db);
    
    // Get document information for each chunk
    const chunksWithDocs = await Promise.all(
      relevantChunks.map(async (chunk) => {
        const document = await getDocumentInfo(chunk.chunkId, db);
        return {
          ...chunk,
          documentName: document ? document.name : 'Unknown'
        };
      })
    );
    
    // Generate response
    const response = await generateResponse(query, relevantChunks);
    
    return {
      query,
      response,
      chunks: chunksWithDocs
    };
  } catch (error) {
    console.error('Error processing query:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    // Parse request body
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'ragdemo');
    
    // Process the query
    const result = await processQuery(query, db);
    
    // Close MongoDB connection
    await client.close();
    
    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Close MongoDB connection if it's open
    try {
      await client.close();
    } catch (closeError) {
      console.error('Error closing MongoDB connection:', closeError);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}