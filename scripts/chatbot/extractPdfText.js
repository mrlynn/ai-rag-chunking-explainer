const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const pdf = require('pdf-parse');
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

/**
 * Extract text from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPdf(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Process a PDF file and store/update its text in MongoDB
 * @param {string} filePath - Path to the PDF file
 * @param {Object} db - MongoDB database instance
 */
async function processPdfFile(filePath, db) {
  try {
    const fileName = path.basename(filePath);
    
    // Extract text from PDF
    console.log(`Extracting text from ${fileName}...`);
    const text = await extractTextFromPdf(filePath);
    
    // Extract URL info from PDF name (MongoDB docs structure is 'Title _ MongoDB.pdf')
    let url = null;
    if (fileName.includes(' _ MongoDB.pdf')) {
      // This is likely a MongoDB documentation PDF
      const title = fileName.split(' _ MongoDB.pdf')[0];
      // Create a URL-friendly slug from the title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      url = `https://www.mongodb.com/docs/${slug}`;
    }
    
    // Check if the document exists and update or insert accordingly
    const result = await db.collection(CHATBOT_COLLECTIONS.documents).updateOne(
      { name: fileName },
      { 
        $set: {
          path: filePath,
          content: text,
          type: 'pdf',
          url: url, // Add the URL
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    
    if (result.upsertedCount > 0) {
      console.log(`Created new document for ${fileName}`);
      return result.upsertedId;
    } else {
      console.log(`Updated existing document for ${fileName}`);
      return result.upsertedId;
    }
  } catch (error) {
    console.error(`Error processing PDF ${filePath}:`, error);
    throw error;
  }
}

/**
 * Main function to process all PDF files in the docs directory
 */
async function main() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'ragdemo');
    
    // Check if the unique index on name already exists
    const documentIndexes = await db.collection(CHATBOT_COLLECTIONS.documents).listIndexes().toArray();
    const nameIndexExists = documentIndexes.some(index => 
      index.name === 'name_1' && index.key && index.key.name === 1
    );
    
    if (!nameIndexExists) {
      await db.collection(CHATBOT_COLLECTIONS.documents).createIndex({ name: 1 }, { unique: true });
    }
    
    // Get all PDF files from the docs directory
    const docsDir = path.join(process.cwd(), 'docs');
    const files = fs.readdirSync(docsDir)
      .filter(file => file.endsWith('.pdf'))
      .map(file => path.join(docsDir, file));
    
    console.log(`Found ${files.length} PDF files to process for floating chatbot`);
    
    // Process each PDF file
    for (const file of files) {
      await processPdfFile(file, db);
    }
    
    console.log('PDF processing completed for floating chatbot');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
main().catch(console.error);