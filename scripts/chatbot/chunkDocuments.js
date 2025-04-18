const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
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

// Chunking strategies
const CHUNKING_STRATEGIES = {
  FIXED_SIZE: 'fixed_size',
  SENTENCE: 'sentence',
  PARAGRAPH: 'paragraph',
  SEMANTIC: 'semantic'
};

// Default chunk size (in characters)
const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;

/**
 * Parse command line arguments
 * @returns {Object} - Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    inputDir: './docs',
    strategy: CHUNKING_STRATEGIES.PARAGRAPH,
    chunkSize: DEFAULT_CHUNK_SIZE,
    overlap: DEFAULT_CHUNK_OVERLAP
  };

  for (let i = 0; i < args.length; i += 2) {
    switch (args[i]) {
      case '--input':
        options.inputDir = args[i + 1];
        break;
      case '--strategy':
        options.strategy = args[i + 1];
        break;
      case '--chunkSize':
        options.chunkSize = parseInt(args[i + 1]);
        break;
      case '--overlap':
        options.overlap = parseInt(args[i + 1]);
        break;
    }
  }

  return options;
}

/**
 * Chunks text using fixed size strategy
 * @param {string} text - The text to chunk
 * @param {number} chunkSize - Size of each chunk
 * @param {number} overlap - Overlap between chunks
 * @returns {Array} - Array of text chunks
 */
function chunkByFixedSize(text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP) {
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push(text.substring(startIndex, endIndex));
    startIndex = endIndex - overlap;
  }
  
  return chunks;
}

/**
 * Chunks text by sentences
 * @param {string} text - The text to chunk
 * @returns {Array} - Array of text chunks
 */
function chunkBySentence(text) {
  // Simple sentence splitting - can be improved with NLP libraries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > DEFAULT_CHUNK_SIZE) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

/**
 * Chunks text by paragraphs
 * @param {string} text - The text to chunk
 * @returns {Array} - Array of text chunks
 */
function chunkByParagraph(text) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > DEFAULT_CHUNK_SIZE) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += paragraph + '\n\n';
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

/**
 * Process a document and store chunks in MongoDB
 * @param {Object} document - Document to process
 * @param {string} strategy - Chunking strategy to use
 * @param {Object} db - MongoDB database instance
 * @param {Object} options - Chunking options
 */
async function processDocument(document, strategy, db, options) {
  try {
    const { chunkSize, overlap } = options;
    const content = document.content || document.text;
    
    if (!content) {
      console.log(`No content found in document ${document.name || document._id}`);
      return;
    }
    
    // Chunk the document based on strategy
    let chunks = [];
    switch (strategy) {
      case CHUNKING_STRATEGIES.FIXED_SIZE:
        chunks = chunkByFixedSize(content, chunkSize, overlap);
        break;
      case CHUNKING_STRATEGIES.SENTENCE:
        chunks = chunkBySentence(content);
        break;
      case CHUNKING_STRATEGIES.PARAGRAPH:
        chunks = chunkByParagraph(content);
        break;
      case CHUNKING_STRATEGIES.SEMANTIC:
        // For semantic chunking, we'll use paragraph-based for now
        chunks = chunkByParagraph(content);
        break;
      default:
        chunks = chunkByFixedSize(content, chunkSize, overlap);
    }
    
    // Store chunks in our chatbot chunks collection
    const chunkDocuments = chunks.map((text, index) => ({
      documentId: document._id,
      text,
      metadata: {
        fileName: document.name,
        strategy,
        chunkIndex: index,
        totalChunks: chunks.length,
        chunkSize,
        overlap,
        source: document.source || 'unknown',
        type: document.type || path.extname(document.name || '').substring(1)
      },
      processed: false,
      createdAt: new Date()
    }));
    
    if (chunkDocuments.length > 0) {
      await db.collection(CHATBOT_COLLECTIONS.chunks).insertMany(chunkDocuments);
      console.log(`Created ${chunks.length} chunks for document ${document.name || document._id}`);
    }
    
    return { documentId: document._id, chunkCount: chunks.length };
  } catch (error) {
    console.error(`Error processing document ${document.name || document._id}:`, error);
    throw error;
  }
}

/**
 * Main function to process all documents
 */
async function main() {
  const options = parseArgs();
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'ragdemo');
    
    // Create indexes for our floating chatbot collections
    await db.collection(CHATBOT_COLLECTIONS.chunks).createIndex({ documentId: 1 });
    await db.collection(CHATBOT_COLLECTIONS.chunks).createIndex({ processed: 1 });
    
    // Check if the unique index on name already exists
    const documentIndexes = await db.collection(CHATBOT_COLLECTIONS.documents).listIndexes().toArray();
    const nameIndexExists = documentIndexes.some(index => 
      index.name === 'name_1' && index.key && index.key.name === 1
    );
    
    if (!nameIndexExists) {
      await db.collection(CHATBOT_COLLECTIONS.documents).createIndex({ name: 1 }, { unique: true });
    }
    
    // Get documents from MongoDB that haven't been chunked
    const documents = await db.collection(CHATBOT_COLLECTIONS.documents)
      .find({ chunked: { $ne: true } })
      .toArray();
    
    console.log(`Found ${documents.length} documents to process for floating chatbot`);
    
    // Process each document
    for (const doc of documents) {
      await processDocument(doc, options.strategy, db, options);
      
      // Mark document as chunked
      await db.collection(CHATBOT_COLLECTIONS.documents).updateOne(
        { _id: doc._id },
        { $set: { chunked: true } }
      );
    }
    
    // Also process any text files in the input directory
    if (fs.existsSync(options.inputDir)) {
      const files = fs.readdirSync(options.inputDir)
        .filter(file => file.endsWith('.txt') || file.endsWith('.md'))
        .map(file => path.join(options.inputDir, file));
      
      console.log(`Found ${files.length} text files to process for floating chatbot`);
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const doc = {
          name: path.basename(file),
          content,
          source: 'file',
          type: path.extname(file).substring(1)
        };
        
        // Store the document
        const result = await db.collection(CHATBOT_COLLECTIONS.documents).insertOne({
          ...doc,
          createdAt: new Date()
        });
        
        // Process the document
        await processDocument({ ...doc, _id: result.insertedId }, options.strategy, db, options);
        
        // Mark as chunked
        await db.collection(CHATBOT_COLLECTIONS.documents).updateOne(
          { _id: result.insertedId },
          { $set: { chunked: true } }
        );
      }
    }
    
    console.log('Document processing completed for floating chatbot');
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