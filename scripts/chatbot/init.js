const fs = require('fs');
const path = require('path');

/**
 * Create directories if they don't exist
 */
function createDirectories() {
  // Main chatbot scripts directory (should already exist since we're running from it)
  const chatbotDir = path.join(process.cwd(), 'scripts', 'chatbot');
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(chatbotDir)) {
    console.log(`Creating directory: ${chatbotDir}`);
    fs.mkdirSync(chatbotDir, { recursive: true });
  } else {
    console.log(`Directory already exists: ${chatbotDir}`);
  }
  
  console.log('Initialization complete.');
}

/**
 * Main function
 */
function main() {
  try {
    console.log('Initializing floating chatbot directory structure...');
    createDirectories();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main();