const { MongoClient } = require('mongodb');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

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

// Batch size for processing chunks
const BATCH_SIZE = 10;

/**
 * Generate embeddings for a batch of chunks
 * @param {Array} chunks - Array of chunk documents
 * @returns {Promise<Array>} - Array of chunks with embeddings
 */
async function generateEmbeddingsForChunks(chunks) {
  try {
    // Prepare the texts for embedding
    const texts = chunks.map(chunk => chunk.text || chunk.content || '').filter(text => text.length > 0);
    
    if (texts.length === 0) {
      console.log('No valid texts found in chunks');
      return chunks;
    }
    
    // Generate embeddings using OpenAI API
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: texts
    });
    
    // Verify we got valid response data
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Invalid response from OpenAI API: missing data array');
    }
    
    // Map embeddings back to chunks
    return chunks.map((chunk, index) => {
      const embeddingData = response.data[index];
      
      if (!embeddingData || !embeddingData.embedding) {
        console.error(`Missing embedding for chunk at index ${index}`);
        return chunk; // Return original chunk without embedding
      }
      
      return {
        ...chunk,
        embedding: embeddingData.embedding,
      };
    });
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Process chunks in batches to generate embeddings
 * @param {Object} db - MongoDB database instance
 */
async function processChunks(db) {
  try {
    // Ensure collections exist - catch errors if they already exist
    try {
      await db.createCollection(CHATBOT_COLLECTIONS.chunks);
    } catch (err) {
      // Collection might already exist, that's fine
      if (err.code !== 48) throw err; // 48 is "NamespaceExists"
    }
    
    try {
      await db.createCollection(CHATBOT_COLLECTIONS.embeddings);
    } catch (err) {
      // Collection might already exist, that's fine
      if (err.code !== 48) throw err; // 48 is "NamespaceExists"
    }
    
    // Get chunks without embeddings from our chatbot chunks collection
    const chunksCollection = db.collection(CHATBOT_COLLECTIONS.chunks);
    const embeddingsCollection = db.collection(CHATBOT_COLLECTIONS.embeddings);
    
    const chunksWithoutEmbeddings = await chunksCollection
      .find({ processed: { $ne: true } })
      .toArray();
    
    console.log(`Found ${chunksWithoutEmbeddings.length} chunks without embeddings`);
    
    if (chunksWithoutEmbeddings.length === 0) {
      console.log('No chunks to process');
      return;
    }
    
    // Process chunks in batches
    for (let i = 0; i < chunksWithoutEmbeddings.length; i += BATCH_SIZE) {
      const batch = chunksWithoutEmbeddings.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(chunksWithoutEmbeddings.length / BATCH_SIZE)}`);
      
      const chunksWithEmbeddings = await generateEmbeddingsForChunks(batch);
      
      // Store embeddings in separate collection and mark chunks as processed
      for (const chunk of chunksWithEmbeddings) {
        if (chunk.embedding) {
          // Store embedding
          await embeddingsCollection.insertOne({
            chunkId: chunk._id,
            embedding: chunk.embedding,
            text: chunk.text, // Include text for easier debugging and verification
            metadata: chunk.metadata || {},
            createdAt: new Date()
          });
          
          // Mark chunk as processed
          await chunksCollection.updateOne(
            { _id: chunk._id },
            { $set: { processed: true } }
          );
          
          console.log(`Processed chunk ${chunk._id}`);
        } else {
          console.warn(`Skipping chunk ${chunk._id} - no embedding generated`);
        }
      }
      
      console.log(`Processed ${chunksWithEmbeddings.length} chunks in this batch`);
    }
    
    console.log('Embedding generation completed for floating chatbot');
  } catch (error) {
    console.error('Error processing chunks:', error);
    throw error;
  }
}

/**
 * Create vector search index for embeddings collection
 * @param {Object} db - MongoDB database instance
 */
async function createVectorSearchIndex(db) {
  try {
    // Ensure embeddings collection exists
    try {
      await db.createCollection(CHATBOT_COLLECTIONS.embeddings);
    } catch (err) {
      // Collection might already exist, that's fine
      if (err.code !== 48) console.log(`Note: ${err.message}`); // 48 is "NamespaceExists"
    }
    
    const embeddingsCollection = db.collection(CHATBOT_COLLECTIONS.embeddings);
    
    // Check if the index already exists
    const indexes = await embeddingsCollection.listIndexes().toArray();
    const vectorIndexExists = indexes.some(index => index.name === 'chatbot_vector_index');
    
    if (!vectorIndexExists) {
      try {
        // Try creating a standard index first - for older MongoDB versions
        console.log('Creating standard index for embeddings collection...');
        await embeddingsCollection.createIndex(
          { embedding: 1 },
          { name: 'chatbot_vector_index' }
        );
        console.log('Standard index created for floating chatbot');
      } catch (error) {
        console.warn('Could not create standard index:', error.message);
        console.log('Your MongoDB version might not support vector search indexes through the driver.');
        console.log('Please create the vector search index manually in Atlas UI.');
      }
    } else {
      console.log('Vector search index already exists for floating chatbot');
    }
  } catch (error) {
    if (error.code === 26) { // NamespaceNotFound
      console.log('No embeddings to index yet - skipping index creation');
      return;
    }
    console.error('Error creating vector search index:', error);
    // Don't throw this error so the script can continue
    console.log('Vector index creation failed, but embeddings were saved successfully.');
    console.log('You may need to create the vector search index manually in Atlas UI.');
  }
}

/**
 * Main function to generate embeddings for all chunks
 */
async function main() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'ragdemo');
    
    // Process chunks to generate embeddings
    await processChunks(db);
    
    // Create vector search index if we have embeddings
    const embeddingCount = await db.collection(CHATBOT_COLLECTIONS.embeddings).countDocuments();
    if (embeddingCount > 0) {
      try {
        await createVectorSearchIndex(db);
      } catch (error) {
        console.log('Vector index creation had an error, but we will continue.');
        console.log('You may need to create the vector search index manually in Atlas UI.');
      }
    } else {
      console.log('No embeddings to index');
    }
    
    console.log('Embedding generation and index creation completed for floating chatbot');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
main().catch(console.error);