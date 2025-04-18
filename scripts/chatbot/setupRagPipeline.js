const { execSync } = require('child_process');
const path = require('path');

/**
 * Run a script and log its output
 * @param {string} scriptPath - Path to the script
 * @param {string} description - Description of what the script does
 */
function runScript(scriptPath, description) {
  console.log(`\n\n=== ${description} ===\n`);
  try {
    const output = execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    console.log(`\n${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`\nError running ${description}:`, error);
    return false;
  }
}

/**
 * Main function to run the entire RAG pipeline for floating chatbot
 */
async function main() {
  console.log('Starting floating chatbot RAG pipeline setup...');
  
  const scriptsDir = path.join(process.cwd(), 'scripts/chatbot');
  
  // Step 1: Extract text from PDF files
  const extractPdfSuccess = runScript(
    path.join(scriptsDir, 'extractPdfText.js'),
    'Extracting text from PDF files for floating chatbot'
  );
  
  if (!extractPdfSuccess) {
    console.error('Failed to extract text from PDF files for floating chatbot. Aborting.');
    return;
  }
  
  // Step 2: Chunk documents
  const chunkSuccess = runScript(
    path.join(scriptsDir, 'chunkDocuments.js'),
    'Chunking documents for floating chatbot'
  );
  
  if (!chunkSuccess) {
    console.error('Failed to chunk documents for floating chatbot. Aborting.');
    return;
  }
  
  // Step 3: Generate embeddings
  const embeddingSuccess = runScript(
    path.join(scriptsDir, 'generateEmbeddings.js'),
    'Generating embeddings for floating chatbot'
  );
  
  if (!embeddingSuccess) {
    console.error('Failed to generate embeddings for floating chatbot. Aborting.');
    return;
  }
  
  // Step 4: Test the RAG pipeline
  const testSuccess = runScript(
    path.join(scriptsDir, 'runRagPipeline.js'),
    'Testing RAG pipeline for floating chatbot'
  );
  
  if (!testSuccess) {
    console.error('Failed to test RAG pipeline for floating chatbot.');
    return;
  }
  
  console.log('\n\nFloating chatbot RAG pipeline setup completed successfully!');
  console.log('You can now use the floating chatbot component in your application.');
}

// Run the script
main().catch(console.error);