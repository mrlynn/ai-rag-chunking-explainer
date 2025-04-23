import React, { useState, useEffect, useRef, useCallback } from 'react';

// MongoDB Brand Colors
const mongoColors = {
  // Primary colors
  green: "#00ED64", // Bright green for CTAs and highlights
  darkGreen: "#001E2B", // Dark navy/teal for backgrounds
  white: "#FFFFFF",
  
  // Secondary colors
  mint: "#C3F4D7", // Light mint for subtle highlights
  lightGreen: "#E3FCF7", // Very light mint for hover states
  blueGreen: "#00684A", // Darker green for secondary elements
  
  // Text colors
  textDark: "#001E2B",
  textLight: "#FFFFFF",
  textMedium: "#889397" // Medium gray for secondary text
};

// Pre-defined sample texts for different document types
const sampleTexts = {
  documentation: `MongoDB is a source-available cross-platform document-oriented database program. Classified as a NoSQL database program, MongoDB uses JSON-like documents with optional schemas. MongoDB is developed by MongoDB Inc. and licensed under the Server Side Public License.

MongoDB stores data in flexible, JSON-like documents, meaning fields can vary from document to document and data structure can be changed over time.

The document model maps to the objects in your application code, making data easy to work with. Ad hoc queries, indexing, and real time aggregation provide powerful ways to access and analyze your data.

MongoDB is a distributed database at its core, so high availability, horizontal scaling, and geographic distribution are built in and easy to use. MongoDB Atlas is a fully-managed cloud database that handles all the complexity of deploying, managing, and healing your deployments on the cloud service provider of your choice (AWS, Azure, and GCP).`,

  article: `# Understanding Vector Search in MongoDB
  
Vector search is a technique used in information retrieval and machine learning that enables searching for documents based on their vector representations (embeddings) rather than exact keyword matches.

In the context of MongoDB, vector search allows for semantic searches where results are returned based on meaning rather than just matching text. This is particularly useful for applications like:

- Semantic search engines
- Recommendation systems
- Image similarity search
- Natural language processing applications
- Anomaly detection

MongoDB Atlas Vector Search uses a combination of advanced indexing techniques and approximate nearest neighbor algorithms to efficiently find similar vectors in large datasets.

To use vector search effectively, documents need to be properly chunked and embedded using techniques appropriate for your specific use case.`,

  technicalSpec: `Technical Requirements for RAG Application
  
1. Data Processing Pipeline
   - Extract text from various sources (PDF, HTML, Markdown)
   - Clean and normalize text
   - Implement chunking strategy based on document type
   - Generate and store embeddings

2. Vector Database Requirements
   - MongoDB Atlas with Vector Search capability
   - Minimum M10 cluster size
   - Storage capacity for at least 10 million vectors
   - Vector dimension: 1536 (OpenAI embeddings)

3. Embedding Model Requirements
   - OpenAI text-embedding-3-small or text-embedding-3-large
   - Alternative option: Sentence Transformers for self-hosting

4. Retrieval Component
   - kNN search with cosine similarity
   - Re-ranking capability for improving precision
   - Configurable result limits
   - Metadata filtering options

5. Response Generation
   - GPT-4o or equivalent LLM integration
   - Prompt engineering for consistent responses
   - Citation and source tracking`,

  conversation: `User: How do I create a vector search index in MongoDB Atlas?

AI: To create a vector search index in MongoDB Atlas, follow these steps:

1. Log in to your MongoDB Atlas account
2. Navigate to your cluster and select the "Search" tab
3. Click "Create Search Index"
4. Choose "JSON Editor" for the creation method
5. Configure your index with a definition like this:

\`\`\`json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "dimensions": 1536,
        "similarity": "cosine",
        "type": "knnVector"
      }
    }
  }
}
\`\`\`

6. Adjust the "dimensions" value to match your embedding model (e.g., 1536 for OpenAI embeddings)
7. Save and create the index

Note that you'll need to have documents with embedding vectors already stored in your collection. The vector search index will reference these embedding fields in your documents.

User: Can I filter my vector search results based on metadata fields?

AI: Yes, you can definitely filter vector search results based on metadata fields in MongoDB Atlas. This is one of the powerful features of MongoDB's vector search implementation.

When performing a vector search query, you can add filter conditions using the standard MongoDB query operators. Here's an example:

\`\`\`javascript
db.collection.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.23, -0.45, ...],
      numCandidates: 100,
      limit: 10,
      filter: { 
        "metadata.category": "electronics",
        "metadata.inStock": true
      }
    }
  }
])
\`\`\`

In this example, the vector search will only return results where:
1. The document's "metadata.category" field equals "electronics" AND
2. The document's "metadata.inStock" field is true

You can use any valid MongoDB query operators in your filter, including:
- Comparison operators ($gt, $lt, $in, etc.)
- Logical operators ($and, $or, $not, etc.)
- Array operators ($all, $elemMatch, etc.)

This filtering capability is particularly useful for RAG applications where you might want to constrain results to specific document types, date ranges, or other properties.

User: What's the best way to chunk technical documentation for a RAG chatbot?

AI: `
}

// Text chunking methods
const chunkByDelimiter = (text, delimiter) => {
  if (!text) return [];
  return text.split(delimiter).filter(chunk => chunk.trim() !== '');
};

const chunkByFixedSize = (text, chunkSize, overlap) => {
  if (!text) return [];
  const chunks = [];
  let i = 0;
  
  while (i < text.length) {
    // Get chunk of specified size
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
    // Move forward by chunkSize - overlap
    i += (chunkSize - overlap);
  }
  
  return chunks;
};

const recursiveChunk = (text, maxSize, overlap) => {
  if (!text) return [];
  
  // If text is already small enough, return it as a single chunk
  if (text.length <= maxSize) return [text];
  
  const chunks = [];
  let startPos = 0;
  
  while (startPos < text.length) {
    // Calculate end position
    const endPos = Math.min(startPos + maxSize, text.length);
    
    // Find a good breaking point (space, period, etc.)
    let breakPoint = endPos;
    if (endPos < text.length) {
      const possibleBreakPoints = [
        text.lastIndexOf(' ', endPos),
        text.lastIndexOf('.', endPos),
        text.lastIndexOf(',', endPos),
        text.lastIndexOf(';', endPos),
        text.lastIndexOf('\n', endPos)
      ].filter(point => point > startPos && point < endPos);
      
      if (possibleBreakPoints.length > 0) {
        breakPoint = Math.max(...possibleBreakPoints) + 1;
      }
    }
    
    // Add the chunk
    chunks.push(text.slice(startPos, breakPoint));
    
    // Move start position for next chunk (with overlap)
    // Ensure we're not stuck in an infinite loop by checking if we're making progress
    const newStartPos = Math.max(startPos, breakPoint - overlap);
    if (newStartPos <= startPos) {
      // If we're not making progress, force advancement to prevent infinite loop
      startPos = Math.min(startPos + 1, text.length);
    } else {
      startPos = newStartPos;
    }
  }
  
  return chunks;
};

// Simulated semantic chunking (in a real application, this would use embeddings or NLP)
const semanticChunk = (text) => {
  if (!text) return [];
  
  // First split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Then group sentences into semantic chunks
  const chunks = [];
  let currentChunk = '';
  
  sentences.forEach(sentence => {
    // In a real implementation, we would check semantic similarity here
    // For now, just use length as a heuristic
    if (currentChunk.length + sentence.length > 100) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  });
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

// Helper function for document structure analysis (for recommended chunking strategy)
const analyzeDocumentStructure = (text) => {
  // This is a simplified analysis - in reality, this would be more sophisticated
  const paragraphCount = (text.match(/\n\n/g) || []).length + 1;
  const sentenceCount = (text.match(/[.!?]+/g) || []).length;
  const headingCount = (text.match(/^#+\s+.+$/gm) || []).length;
  const listItemCount = (text.match(/^[-*]\s+.+$/gm) || []).length;
  
  const avgParagraphLength = text.length / paragraphCount;
  const avgSentenceLength = text.length / sentenceCount;
  
  let docType = "general";
  let recommendedStrategy = "recursive";
  
  if (headingCount > 0 && paragraphCount / headingCount < 3) {
    docType = "structured";
    recommendedStrategy = "semantic";
  } else if (listItemCount > paragraphCount * 0.5) {
    docType = "list-heavy";
    recommendedStrategy = "delimiter";
  } else if (avgSentenceLength > 200) {
    docType = "long-form";
    recommendedStrategy = "fixed";
  } else if (avgParagraphLength < 100) {
    docType = "concise";
    recommendedStrategy = "semantic";
  }
  
  return {
    docType,
    recommendedStrategy,
    stats: {
      paragraphCount,
      sentenceCount,
      headingCount,
      listItemCount,
      avgParagraphLength,
      avgSentenceLength
    }
  };
};

// Random colors for chunks, using MongoDB color palette
const chunkColors = [
  mongoColors.mint,
  mongoColors.lightGreen,
  "#ADD8E6", // Light blue
  "#FFD700", // Light yellow
  "#FFA07A", // Light salmon
  "#98FB98", // Pale green
  "#D8BFD8", // Thistle
  "#FFDAB9", // Peach puff
  "#D3D3D3", // Light gray
  "#AFEEEE", // Pale turquoise
  "#FFB6C1", // Light pink
  "#FFFACD"  // Lemon chiffon
];

// Helper function to generate "embeddings" (simplified for visualization)
const generateEmbedding = (text) => {
  // In a real system, this would call an embedding model
  // For demo purposes, we'll just create a simplified vector
  
  // Calculate a simple hash for visualization purposes
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Create a 2D point based on the hash
  // This is just for visualization - real embeddings would be high-dimensional
  const x = (Math.abs(hash) % 1000) / 1000; // Between 0 and 1
  const y = (Math.abs(hash / 1000) % 1000) / 1000; // Between 0 and 1
  
  return { x: x * 90 + 5, y: y * 90 + 5 }; // Scale to fit in our visualization
};

// Simulated question-document similarity (for retrieval simulation)
const calculateSimilarity = (question, chunk) => {
  // In a real system, this would compute cosine similarity between embeddings
  // For this demo, we'll use a simplified approach based on word overlap
  
  const questionWords = new Set(question.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const chunkWords = new Set(chunk.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  
  let commonWords = 0;
  for (const word of questionWords) {
    if (chunkWords.has(word)) {
      commonWords++;
    }
  }
  
  // Jaccard similarity + some randomness for demo purposes
  const similarity = commonWords / (questionWords.size + chunkWords.size - commonWords);
  return similarity + (Math.random() * 0.1); // Add small random factor for variation
};

const RAGLifecycleDemo = () => {
  // State variables
  const [activeTab, setActiveTab] = useState('chunking'); // 'chunking', 'embedding', 'retrieval', 'generation'
  const [docType, setDocType] = useState('documentation');
  const [inputText, setInputText] = useState(sampleTexts.documentation);
  const [method, setMethod] = useState(0); // 0: None, 1: Delimiter, 2: Fixed, 3: Recursive, 4: Semantic
  const [delimiter, setDelimiter] = useState('.');
  const [chunkSize, setChunkSize] = useState(150);
  const [overlap, setOverlap] = useState(20);
  const [chunkedText, setChunkedText] = useState([]);
  const [vectorDocuments, setVectorDocuments] = useState([]);
  const [recommendedStrategy, setRecommendedStrategy] = useState('');
  const [docAnalysis, setDocAnalysis] = useState(null);
  
  // Chat simulation states
  const [chatMessages, setChatMessages] = useState([
    { role: 'user', content: 'How do I create a vector search index in MongoDB Atlas?' }
  ]);
  const [userQuery, setUserQuery] = useState('');
  const [retrievedChunks, setRetrievedChunks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  
  // Text for method descriptions
  const methodDescriptions = [
    "No chunking: The entire text is stored as a single document in the vector database.",
    "Simple Delimiter: Text is split at specific characters. Simple but may lead to chunks with uneven sizes.",
    "Fixed Size with Overlap: Creates chunks of fixed size with overlapping sections to maintain context between chunks.",
    "Recursive with Overlap: Similar to fixed size but attempts to break at natural boundaries like sentences or paragraphs.",
    "Semantic: Groups text based on meaning and context, keeping related content together."
  ];
  
  // Effect to analyze document and recommend chunking strategy on document type change
  useEffect(() => {
    setInputText(sampleTexts[docType] || '');
    const analysis = analyzeDocumentStructure(sampleTexts[docType] || '');
    setDocAnalysis(analysis);
    setRecommendedStrategy(analysis.recommendedStrategy);
    
    // Set the recommended method based on the analysis
    switch (analysis.recommendedStrategy) {
      case 'delimiter':
        setMethod(1);
        break;
      case 'fixed':
        setMethod(2);
        break;
      case 'recursive':
        setMethod(3);
        break;
      case 'semantic':
        setMethod(4);
        break;
      default:
        setMethod(0);
    }
  }, [docType]);
  
  // Process text into chunks
  const processText = useCallback((text, chunkSize, overlap) => {
    if (!text) return [];
    
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const chunks = [];
    let currentChunk = '';
    let lastChunkText = '';
    
    sentences.forEach((sentence) => {
      const trimmedSentence = sentence.trim();
      
      // If adding this sentence would exceed chunk size, save current chunk
      if ((currentChunk + trimmedSentence).length > chunkSize && currentChunk) {
        chunks.push({
          text: currentChunk.trim(),
          metadata: {
            size: currentChunk.length,
            sentences: currentChunk.match(/[^.!?]+[.!?]+/g)?.length || 0
          }
        });
        // Keep last N characters based on overlap
        lastChunkText = currentChunk.slice(-overlap);
        currentChunk = lastChunkText + ' ' + trimmedSentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    });
    
    // Add the last chunk if there is one
    if (currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        metadata: {
          size: currentChunk.length,
          sentences: currentChunk.match(/[^.!?]+[.!?]+/g)?.length || 0
        }
      });
    }
    
    return chunks;
  }, []);

  // Effect to process text when parameters change
  useEffect(() => {
    const newChunks = processText(inputText, chunkSize, overlap);
    setChunkedText(newChunks);
    addDebugLog('Text processed into chunks', { 
      chunkCount: newChunks.length,
      settings: { chunkSize, overlap }
    });
  }, [inputText, chunkSize, overlap, processText]);
  
  // Generate "embeddings" for each chunk
  useEffect(() => {
    const newEmbeddings = chunkedText.map(chunk => generateEmbedding(chunk.text));
    const newVectorDocs = chunkedText.map((chunk, index) => ({
      id: `doc_${index + 1}`,
      text: chunk.text,
      embedding: newEmbeddings[index],
      color: chunkColors[index % chunkColors.length],
      metadata: chunk.metadata
    }));
    setVectorDocuments(newVectorDocs);
  }, [chunkedText]);
  
  // Options for the delimiter method
  const renderChunkingOptions = () => {
    if (method === 1) { // Simple delimiter
      return (
        <div className="mb-4">
          <label style={{ color: mongoColors.darkGreen, display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Delimiter
          </label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.25rem',
              border: `1px solid ${mongoColors.mint}`,
              backgroundColor: mongoColors.white,
              color: mongoColors.darkGreen
            }}
          >
            <option value=".">Period (.)</option>
            <option value=" ">Space ( )</option>
            <option value=",">Comma (,)</option>
            <option value="\n">New Line</option>
            <option value="\n\n">Paragraph Break</option>
          </select>
        </div>
      );
    } else if (method === 2 || method === 3) { // Fixed token or Recursive
      return (
        <div className="space-y-4">
          <div>
            <label style={{ color: mongoColors.darkGreen, display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Chunk Size: {chunkSize} characters
            </label>
            <input
              type="range"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value))}
              min={50}
              max={500}
              step={10}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ color: mongoColors.darkGreen, display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Overlap: {overlap} characters
            </label>
            <input
              type="range"
              value={overlap}
              onChange={(e) => setOverlap(parseInt(e.target.value))}
              min={0}
              max={Math.min(50, chunkSize / 2)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Simulate chunk retrieval based on query
  const simulateRetrieval = (query) => {
    if (!query || vectorDocuments.length === 0) {
      setRetrievedChunks([]);
      return;
    }
    
    // Calculate similarity between query and each chunk
    const chunksWithScores = vectorDocuments.map(doc => ({
      ...doc,
      similarity: calculateSimilarity(query, doc.text)
    }));
    
    // Sort by similarity score
    const sortedChunks = [...chunksWithScores].sort((a, b) => b.similarity - a.similarity);
    
    // Take top 3 chunks
    const topChunks = sortedChunks.slice(0, 3);
    setRetrievedChunks(topChunks);
    
    return topChunks;
  };
  
  // Simulate chat response generation
  const simulateResponseGeneration = () => {
    if (userQuery.trim() === '') return;
    
    // Add user message
    setChatMessages(prevMessages => [
      ...prevMessages,
      { role: 'user', content: userQuery }
    ]);
    
    // Simulate retrieval
    const retrievedDocs = simulateRetrieval(userQuery);
    setIsGenerating(true);
    setGenerationStage(1); // Retrieval stage
    
    // Simulate thinking time for retrieval
    setTimeout(() => {
      setGenerationStage(2); // Generation stage
      
      // Simulate thinking time for generation
      setTimeout(() => {
        // Generate a response based on retrieved chunks
        const response = generateDummyResponse(userQuery, retrievedDocs);
        
        // Add AI response
        setChatMessages(prevMessages => [
          ...prevMessages,
          { role: 'assistant', content: response }
        ]);
        
        setIsGenerating(false);
        setGenerationStage(0);
        setUserQuery('');
      }, 1500);
    }, 1000);
  };
  
  // Generate a dummy response based on retrieved chunks
  const generateDummyResponse = (query, chunks) => {
    if (!chunks || chunks.length === 0) {
      return "I don't have enough information to answer that question.";
    }
    
    // For the demo, we'll just return a predefined response if the query matches
    if (query.toLowerCase().includes('vector search index') || 
        query.toLowerCase().includes('create index')) {
      return sampleTexts.conversation.split("User: How do I create a vector search index in MongoDB Atlas?")[1]
        .split("User:")[0].trim();
    }
    
    if (query.toLowerCase().includes('filter') || 
        query.toLowerCase().includes('metadata')) {
      return sampleTexts.conversation.split("User: Can I filter my vector search results based on metadata fields?")[1]
        .split("User:")[0].trim();
    }
    
    // Fallback response
    return `To answer your question about "${query}", I'd consider these key points from the documentation:\n\n` +
      chunks.map((chunk, i) => `${i+1}. ${chunk.text.substring(0, 80)}...`).join('\n\n');
  };
  
  // Render the current tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chunking':
        return renderChunkingTab();
      case 'embedding':
        return renderEmbeddingTab();
      case 'retrieval':
        return renderRetrievalTab();
      case 'generation':
        return renderGenerationTab();
      default:
        return renderChunkingTab();
    }
  };
  
  // Chunking tab content
  const renderChunkingTab = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Document type selection */}
          <div style={{ 
            backgroundColor: mongoColors.white,
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem',
              color: mongoColors.darkGreen
            }}>
              Document Type
            </h2>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {Object.keys(sampleTexts).map((type) => (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    backgroundColor: docType === type ? mongoColors.green : mongoColors.mint,
                    color: docType === type ? mongoColors.darkGreen : mongoColors.blueGreen,
                    fontWeight: docType === type ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            
            {docAnalysis && (
              <div style={{ 
                padding: '0.75rem',
                backgroundColor: mongoColors.lightGreen,
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                color: mongoColors.darkGreen
              }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Document Analysis:</div>
                <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                  <li>Type: {docAnalysis.docType}</li>
                  <li>Paragraphs: {docAnalysis.stats.paragraphCount}</li>
                  <li>Sentences: {docAnalysis.stats.sentenceCount}</li>
                  <li>Headings: {docAnalysis.stats.headingCount}</li>
                </ul>
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontWeight: '600', 
                  color: mongoColors.blueGreen 
                }}>
                  Recommended strategy: {docAnalysis.recommendedStrategy}
                </div>
              </div>
            )}
          </div>
          
          {/* Input text */}
          <div style={{ 
            backgroundColor: mongoColors.white,
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem',
              color: mongoColors.darkGreen
            }}>
              Input Text
            </h2>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: `1px solid ${mongoColors.mint}`,
                marginBottom: '0.5rem',
                resize: 'vertical',
                color: mongoColors.darkGreen,
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
        
        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Chunking method selection */}
          <div style={{ 
            backgroundColor: mongoColors.white,
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem',
              color: mongoColors.darkGreen
            }}>
              Chunking Method
            </h2>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {['No Chunking', 'Delimiter', 'Fixed w/ Overlap', 'Recursive', 'Semantic'].map((name, index) => (
                <button
                  key={index}
                  onClick={() => setMethod(index)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    backgroundColor: method === index ? mongoColors.green : mongoColors.mint,
                    color: method === index ? mongoColors.darkGreen : mongoColors.blueGreen,
                    fontWeight: method === index ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            
            {/* Method description */}
            <div style={{ 
              padding: '0.75rem',
              backgroundColor: mongoColors.lightGreen,
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              color: mongoColors.darkGreen,
              marginBottom: '1rem'
            }}>
              {methodDescriptions[method]}
            </div>
            
            {/* Method-specific options */}
            {renderChunkingOptions()}
          </div>
          
          {/* Chunked output visualization */}
          <div style={{ 
            backgroundColor: mongoColors.white,
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflowY: 'auto',
            maxHeight: '350px',
            flexGrow: 1
          }}>
            <h2 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem',
              color: mongoColors.darkGreen
            }}>
              {method === 0 ? 'Document (No Chunking)' : `Chunked Text (${chunkedText.length} chunks)`}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chunkedText.map((chunk, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.25rem',
                    backgroundColor: vectorDocuments[index]?.color || mongoColors.mint,
                    fontSize: '0.875rem',
                    color: mongoColors.darkGreen,
                    border: `1px solid ${mongoColors.mint}`,
                    position: 'relative'
                  }}
                >
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ 
                      backgroundColor: mongoColors.green,
                      color: mongoColors.darkGreen,
                      padding: '0.125rem 0.375rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {method === 0 ? 'Entire Document' : `Chunk #${index + 1}`}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: mongoColors.blueGreen,
                      fontWeight: '500'
                    }}>
                      {chunk.text.length} chars
                    </span>
                  </div>
                  <div style={{ 
                    paddingTop: '0.25rem',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    maxHeight: method === 0 ? '250px' : 'auto',
                    overflowY: method === 0 ? 'auto' : 'visible'
                  }}>
                    {chunk.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Embedding tab content
  const renderEmbeddingTab = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Left column - Vector space visualization */}
        <div style={{ 
          backgroundColor: mongoColors.white,
          borderRadius: '0.375rem',
          padding: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '0.75rem',
            color: mongoColors.darkGreen,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Vector Space Visualization</span>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 'normal', 
              color: mongoColors.textMedium 
            }}>
              (Simplified 2D representation)
            </span>
          </h2>
          
          <div style={{
            position: 'relative',
            backgroundColor: mongoColors.lightGreen,
            border: `1px solid ${mongoColors.mint}`,
            height: '350px',
            borderRadius: '0.25rem',
            marginBottom: '1rem',
            flexGrow: 1
          }}>
            {/* Coordinate axes */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: '1px',
              backgroundColor: `${mongoColors.textMedium}40`
            }}></div>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: `${mongoColors.textMedium}40`
            }}></div>
            
            {/* Embedding points */}
            {vectorDocuments.map((doc, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  backgroundColor: doc.color,
                  border: `2px solid ${mongoColors.darkGreen}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: mongoColors.darkGreen,
                  left: `${doc.embedding.x}%`,
                  top: `${doc.embedding.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 5,
                  cursor: 'default',
                  transition: 'all 0.3s ease-in-out'
                }}
                title={`Chunk ${index + 1}: ${doc.text.length > 30 ? doc.text.substring(0, 27) + '...' : doc.text}`}
              >
                {index + 1}
              </div>
            ))}
          </div>
          
          <div style={{
            padding: '0.75rem',
            backgroundColor: mongoColors.mint,
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            color: mongoColors.darkGreen
          }}>
            <p><strong>Note:</strong> In a real vector database, embeddings are high-dimensional vectors (768-1536 dimensions).</p>
            <p style={{ marginTop: '0.5rem' }}>Each point represents a document chunk in the semantic space, where similar meanings cluster together.</p>
          </div>
        </div>
        
        {/* Right column - Vector documents */}
        <div style={{ 
          backgroundColor: mongoColors.white,
          borderRadius: '0.375rem',
          padding: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 235px)'
        }}>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '0.75rem',
            color: mongoColors.darkGreen
          }}>
            Vector Database Documents ({vectorDocuments.length})
          </h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {vectorDocuments.map((doc, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.25rem',
                  backgroundColor: mongoColors.lightGreen,
                  border: `1px solid ${doc.color}`,
                  borderLeft: `4px solid ${doc.color}`,
                  fontSize: '0.875rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: mongoColors.darkGreen,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      borderRadius: '50%',
                      backgroundColor: doc.color,
                      border: `1px solid ${mongoColors.darkGreen}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </span>
                    Document {doc.id}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: mongoColors.textMedium
                  }}>
                    {doc.text.length} chars
                  </div>
                </div>
                
                {/* Document text */}
                <div style={{
                  padding: '0.5rem',
                  backgroundColor: doc.color,
                  borderRadius: '0.25rem',
                  color: mongoColors.darkGreen,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  fontSize: '0.8rem',
                  maxHeight: '80px',
                  overflowY: 'auto',
                  marginBottom: '0.5rem'
                }}>
                  {doc.text.length > 100 ? `${doc.text.substring(0, 97)}...` : doc.text}
                </div>
                
                {/* Metadata */}
                <div style={{
                  marginBottom: '0.5rem',
                  fontSize: '0.75rem',
                  color: mongoColors.blueGreen
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Metadata:</div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.25rem'
                  }}>
                    <span>Source: {doc.metadata.source}</span>
                    <span>Method: {doc.metadata.chunkMethod}</span>
                    <span>Index: {doc.metadata.chunkIndex + 1}/{doc.metadata.chunkTotal}</span>
                    <span>Size: {doc.metadata.charCount} chars</span>
                  </div>
                </div>
                
                {/* Embedding vector */}
                <div style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: mongoColors.darkGreen,
                  borderRadius: '0.25rem',
                  color: mongoColors.textLight,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}>
                  embedding: [{doc.embedding.x.toFixed(2)}, {doc.embedding.y.toFixed(2)}, ... 1534 more dimensions]
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Retrieval tab content
  const renderRetrievalTab = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Left column - Search query and results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search query input */}
          <div style={{ 
            backgroundColor: mongoColors.white,
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem',
              color: mongoColors.darkGreen
            }}>
              Semantic Search
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ask a question about MongoDB..."
                onKeyDown={(e) => e.key === 'Enter' && simulateRetrieval(userQuery)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.25rem',
                  border: `1px solid ${mongoColors.mint}`,
                  fontSize: '0.875rem',
                  color: mongoColors.darkGreen
                }}
              />
            </div>
            
            <button
              onClick={() => simulateRetrieval(userQuery)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: mongoColors.green,
                color: mongoColors.darkGreen,
                border: 'none',
                borderRadius: '0.25rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Search Vector Database
            </button>
          </div>
          
          {/* MongoDB Query Visualization */}
          <div style={{ 
            backgroundColor: mongoColors.darkGreen, 
            padding: '0.75rem 1rem',
            color: mongoColors.white,
            fontSize: '0.875rem',
            borderRadius: '0.375rem',
            border: `1px solid ${mongoColors.green}`
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div style={{ fontWeight: '600', color: mongoColors.green }}>MongoDB Vector Search Query:</div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: mongoColors.textMedium 
              }}>
                Vector Similarity Search
              </div>
            </div>
            <div style={{
              backgroundColor: mongoColors.blueGreen,
              padding: '0.75rem',
              borderRadius: '0.25rem',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: mongoColors.white,
              overflowX: 'auto'
            }}>
{`db.documents.aggregate([
  {
    $vectorSearch: {
      index: "content_embedding",
      queryVector: [0.156, -0.342, 0.789, ...], // From user query
      path: "embedding",
      numCandidates: 100,
      limit: 3,
      filter: { "metadata.source": "${docType}" }
    }
  },
  {
    $project: {
      _id: 1,
      text: 1,
      metadata: 1,
      score: { $meta: "vectorSearchScore" }
    }
  }
])`}
            </div>
          </div>
          
          {/* Vector retrieval metrics */}
          <div style={{ 
            backgroundColor: mongoColors.white,
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem',
              color: mongoColors.darkGreen
            }}>
              Retrieval Metrics
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                padding: '0.75rem',
                backgroundColor: mongoColors.lightGreen,
                borderRadius: '0.25rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', color: mongoColors.textMedium, marginBottom: '0.25rem' }}>
                  Database Size
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: mongoColors.blueGreen }}>
                  {vectorDocuments.length} chunks
                </div>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: mongoColors.lightGreen,
                borderRadius: '0.25rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', color: mongoColors.textMedium, marginBottom: '0.25rem' }}>
                  Results Retrieved
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: mongoColors.blueGreen }}>
                  {retrievedChunks.length} chunks
                </div>
              </div>
            </div>
            
            <div style={{
              padding: '0.75rem',
              backgroundColor: mongoColors.mint,
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              color: mongoColors.darkGreen
            }}>
              <strong>Chunking Impact:</strong> Notice how the chunking strategy affects the quality and relevance 
              of retrieved results. Smaller chunks with semantic boundaries typically yield more precise results.
            </div>
          </div>
        </div>
        
        {/* Right column - Retrieved chunks */}
        <div style={{ 
          backgroundColor: mongoColors.white,
          borderRadius: '0.375rem',
          padding: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 235px)'
        }}>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '0.75rem',
            color: mongoColors.darkGreen
          }}>
            Retrieved Chunks
          </h2>
          
          {retrievedChunks.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {retrievedChunks.map((chunk, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.25rem',
                    backgroundColor: mongoColors.lightGreen,
                    border: `1px solid ${chunk.color}`,
                    borderLeft: `4px solid ${chunk.color}`,
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      color: mongoColors.darkGreen,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        backgroundColor: mongoColors.green,
                        color: mongoColors.darkGreen,
                        padding: '0.125rem 0.375rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        Result #{index + 1}
                      </span>
                      <span>(Chunk {chunk.metadata.chunkIndex + 1})</span>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: mongoColors.blueGreen,
                      fontWeight: '600'
                    }}>
                      Similarity: {(chunk.similarity * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  {/* Document text */}
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: chunk.color,
                    borderRadius: '0.25rem',
                    color: mongoColors.darkGreen,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    {chunk.text}
                  </div>
                  
                  {/* Metadata */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: mongoColors.textMedium,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>Source: {chunk.metadata.source}</span>
                    <span>Chunk Method: {chunk.metadata.chunkMethod}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: mongoColors.textMedium,
              backgroundColor: mongoColors.lightGreen,
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}>
              Enter a search query to retrieve relevant chunks
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Generation tab content
  const renderGenerationTab = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Left column - Chat interface */}
        <div style={{ 
          backgroundColor: mongoColors.white,
          borderRadius: '0.375rem',
          padding: '1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 235px)'
        }}>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '0.75rem',
            color: mongoColors.darkGreen
          }}>
            RAG Chatbot Demo
          </h2>
          
          {/* Chat messages */}
          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '0.5rem',
            backgroundColor: mongoColors.lightGreen,
            borderRadius: '0.25rem',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {chatMessages.map((message, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  maxWidth: '85%',
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: message.role === 'user' ? mongoColors.green : mongoColors.white,
                  color: message.role === 'user' ? mongoColors.darkGreen : mongoColors.textDark,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {message.content}
              </div>
            ))}
            
            {isGenerating && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '0.375rem',
                maxWidth: '85%',
                alignSelf: 'flex-start',
                backgroundColor: mongoColors.white,
                color: mongoColors.textDark,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                fontSize: '0.875rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: mongoColors.blueGreen
                }}>
                  <div style={{ 
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '50%',
                    backgroundColor: mongoColors.green,
                    animation: 'pulse 1s infinite'
                  }}></div>
                  {generationStage === 1 ? 'Retrieving relevant chunks...' : 'Generating response...'}
                </div>
              </div>
            )}
          </div>
          
          {/* Chat input */}
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Ask a question..."
              onKeyDown={(e) => e.key === 'Enter' && simulateResponseGeneration()}
              disabled={isGenerating}
              style={{
                flexGrow: 1,
                padding: '0.75rem',
                borderRadius: '0.25rem',
                border: `1px solid ${mongoColors.mint}`,
                fontSize: '0.875rem',
                color: mongoColors.darkGreen
              }}
            />
            <button
              onClick={simulateResponseGeneration}
              disabled={isGenerating || !userQuery.trim()}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: isGenerating ? mongoColors.mint : mongoColors.green,
                color: mongoColors.darkGreen,
                border: 'none',
                borderRadius: '0.25rem',
                fontWeight: '600',
                cursor: isGenerating ? 'not-allowed' : 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
        
        {/* Right column - RAG process visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* RAG process steps */}
          <div style={{ 
            backgroundColor: mongoColors.white,
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem',
              color: mongoColors.darkGreen
            }}>
              RAG Process Visualization
            </h2>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem' 
            }}>
              {/* Step 1: User Query */}
              <div style={{
                padding: '0.75rem',
                borderRadius: '0.25rem',
                backgroundColor: mongoColors.lightGreen,
                border: isGenerating ? `2px solid ${mongoColors.green}` : `1px solid ${mongoColors.mint}`,
                fontSize: '0.875rem',
                color: mongoColors.darkGreen,
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  backgroundColor: mongoColors.green,
                  color: mongoColors.darkGreen,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  1
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>User Query</div>
                  <div>User submits a natural language question that gets converted to a vector embedding using the same model as the document chunks.</div>
                </div>
              </div>
              
              {/* Step 2: Vector Search */}
              <div style={{
                padding: '0.75rem',
                borderRadius: '0.25rem',
                backgroundColor: mongoColors.lightGreen,
                border: isGenerating && generationStage === 1 ? `2px solid ${mongoColors.green}` : `1px solid ${mongoColors.mint}`,
                fontSize: '0.875rem',
                color: mongoColors.darkGreen,
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  backgroundColor: mongoColors.green,
                  color: mongoColors.darkGreen,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  2
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Vector Search Retrieval</div>
                  <div>MongoDB Atlas performs a vector similarity search to find the most relevant document chunks based on semantic meaning, not just keywords.</div>
                </div>
              </div>
              
              {/* Step 3: Context Assembly */}
              <div style={{
                padding: '0.75rem',
                borderRadius: '0.25rem',
                backgroundColor: mongoColors.lightGreen,
                border: isGenerating && generationStage === 2 ? `2px solid ${mongoColors.green}` : `1px solid ${mongoColors.mint}`,
                fontSize: '0.875rem',
                color: mongoColors.darkGreen,
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  backgroundColor: mongoColors.green,
                  color: mongoColors.darkGreen,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  3
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Context Assembly</div>
                  <div>Retrieved chunks are assembled into a prompt context that provides the LLM with the information needed to answer accurately.</div>
                </div>
              </div>
              
              {/* Step 4: Response Generation */}
              <div style={{
                padding: '0.75rem',
                borderRadius: '0.25rem',
                backgroundColor: mongoColors.lightGreen,
                border: `1px solid ${mongoColors.mint}`,
                fontSize: '0.875rem',
                color: mongoColors.darkGreen,
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  backgroundColor: mongoColors.green,
                  color: mongoColors.darkGreen,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  4
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Response Generation</div>
                  <div>The LLM (e.g., GPT-4&apos;o) generates a response based on the retrieved context, answering the user&apos;s question with accurate, up-to-date information.</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chunking impact on RAG */}
          <div style={{ 
            backgroundColor: mongoColors.white,
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '0.75rem',
              color: mongoColors.darkGreen
            }}>
              Chunking Impact on RAG Quality
            </h2>
            
            <div style={{
              padding: '0.75rem',
              backgroundColor: mongoColors.mint,
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              color: mongoColors.darkGreen,
              marginBottom: '1rem'
            }}>
              <p><strong>Chunking directly affects RAG quality through:</strong></p>
              <ul style={{ marginLeft: '1.25rem', marginTop: '0.5rem' }}>
                <li>Relevance - Proper chunking ensures retrieved content is focused on the query topic</li>
                <li>Context preservation - Too small chunks may lose important context</li>
                <li>Token efficiency - Right-sized chunks maximize the information in the LLM context window</li>
                <li>Hallucination reduction - Better chunks = more accurate information = fewer hallucinations</li>
              </ul>
            </div>
            
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: mongoColors.textMedium,
                padding: '0 0.5rem'
              }}>
                <span>Poor Chunking</span>
                <span>Optimal Chunking</span>
              </div>
              
              {/* Relevance slider */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: mongoColors.darkGreen,
                  marginBottom: '0.25rem'
                }}>
                  <span style={{ fontWeight: '600' }}>Retrieval Relevance</span>
                  <span style={{ color: mongoColors.blueGreen }}>+{Math.floor(75 + (method * 5))}%</span>
                </div>
                <div style={{
                  height: '0.5rem',
                  backgroundColor: mongoColors.lightGreen,
                  borderRadius: '0.25rem',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${40 + (method * 12)}%`,
                    backgroundColor: mongoColors.green,
                    borderRadius: '0.25rem'
                  }}></div>
                </div>
              </div>
              
              {/* Context preservation slider */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: mongoColors.darkGreen,
                  marginBottom: '0.25rem'
                }}>
                  <span style={{ fontWeight: '600' }}>Context Preservation</span>
                  <span style={{ color: mongoColors.blueGreen }}>+{Math.floor(65 + (overlap * 1.5))}%</span>
                </div>
                <div style={{
                  height: '0.5rem',
                  backgroundColor: mongoColors.lightGreen,
                  borderRadius: '0.25rem',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${30 + (overlap * 1.5)}%`,
                    backgroundColor: mongoColors.green,
                    borderRadius: '0.25rem'
                  }}></div>
                </div>
              </div>
              
              {/* Hallucination reduction slider */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: mongoColors.darkGreen,
                  marginBottom: '0.25rem'
                }}>
                  <span style={{ fontWeight: '600' }}>Hallucination Reduction</span>
                  <span style={{ color: mongoColors.blueGreen }}>+{Math.floor(60 + (method * 8))}%</span>
                </div>
                <div style={{
                  height: '0.5rem',
                  backgroundColor: mongoColors.lightGreen,
                  borderRadius: '0.25rem',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${25 + (method * 15)}%`,
                    backgroundColor: mongoColors.green,
                    borderRadius: '0.25rem'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Most recently retrieved chunks */}
          {retrievedChunks.length > 0 && (
            <div style={{ 
              backgroundColor: mongoColors.white,
              borderRadius: '0.375rem',
              padding: '1rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                marginBottom: '0.75rem',
                color: mongoColors.darkGreen
              }}>
                Most Recently Retrieved
              </h2>
              
              <div style={{
                padding: '0.75rem',
                backgroundColor: retrievedChunks[0].color,
                borderRadius: '0.25rem',
                color: mongoColors.darkGreen,
                fontSize: '0.875rem',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word'
              }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
                  Top Match (Similarity: {(retrievedChunks[0].similarity * 100).toFixed(1)}%)
                </div>
                {retrievedChunks[0].text.length > 150 
                  ? retrievedChunks[0].text.substring(0, 147) + '...' 
                  : retrievedChunks[0].text}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div style={{ 
      backgroundColor: mongoColors.darkGreen,
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: mongoColors.darkGreen, 
        padding: '1rem', 
        color: mongoColors.textLight,
        borderBottom: `1px solid ${mongoColors.blueGreen}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '0.25rem',
            color: mongoColors.green 
          }}>
            RAG Chunking Lifecycle
          </h1>
          <p style={{ 
            fontSize: '0.875rem',
            color: mongoColors.textLight
          }}>
            Visualize how different chunking strategies affect the full RAG pipeline
          </p>
        </div>
        
        {/* Stage tabs */}
        <div style={{ 
          display: 'flex',
          gap: '0.5rem'
        }}>
          {['Chunking', 'Embedding', 'Retrieval', 'Generation'].map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(tab.toLowerCase())}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: activeTab === tab.toLowerCase() ? mongoColors.green : 'transparent',
                color: activeTab === tab.toLowerCase() ? mongoColors.darkGreen : mongoColors.textLight,
                border: activeTab === tab.toLowerCase() ? 'none' : `1px solid ${mongoColors.blueGreen}`,
                borderRadius: '0.25rem',
                fontWeight: activeTab === tab.toLowerCase() ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              {index + 1}. {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div style={{ padding: '1rem' }}>
        {/* Tab navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: mongoColors.textLight,
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          <span>RAG Lifecycle:</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            {['Chunking', 'Embedding', 'Retrieval', 'Generation'].map((stage, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span style={{ color: mongoColors.textMedium, margin: '0 0.25rem' }}>
                    →
                  </span>
                )}
                <button
                  onClick={() => setActiveTab(stage.toLowerCase())}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: activeTab === stage.toLowerCase() ? mongoColors.blueGreen : 'transparent',
                    color: activeTab === stage.toLowerCase() ? mongoColors.white : mongoColors.textLight,
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  {stage}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Tab content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default RAGLifecycleDemo;