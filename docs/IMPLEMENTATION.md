# Implementation Guide: MongoDB & OpenAI Integration with Next.js

This document outlines the implementation steps to transform the current simulation-based RAG Chunking demo into a fully functional Next.js application with MongoDB Atlas Vector Search and OpenAI integration.

## Migration to Next.js

First, we'll need to migrate the existing React application to Next.js:

```bash
# Create a new Next.js project
npx create-next-app@latest mongodb-rag-chunking-demo
cd mongodb-rag-chunking-demo

# Install required dependencies
npm install mongodb openai umap-js d3
```

## Project Structure

```
mongodb-rag-chunking-demo/
├── .env.local           # Environment variables
├── app/                 # Next.js App Router
│   ├── api/             # API Routes
│   │   ├── chunks/route.js
│   │   ├── search/route.js
│   │   ├── chat/route.js
│   │   └── setup/route.js
│   ├── layout.js
│   └── page.js          # Main application page
├── components/          # React components
│   ├── ChunkingStage.js
│   ├── EmbeddingStage.js
│   ├── RetrievalStage.js
│   └── GenerationStage.js
├── lib/                 # Utility functions
│   ├── mongodb.js       # MongoDB client
│   ├── openai.js        # OpenAI client
│   └── chunking.js      # Chunking algorithms
├── public/              # Static assets
└── package.json
```

## Environment Setup

Create a `.env.local` file in the root directory:

```
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/
OPENAI_API_KEY=your-openai-api-key
EMBEDDING_MODEL=text-embedding-3-small
COMPLETION_MODEL=gpt-4-turbo
```

## MongoDB Client Setup

Create a MongoDB client in `lib/mongodb.js`:

```javascript
// lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value
  // across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb() {
  const client = await clientPromise;
  return client.db('chunking_demo');
}

export default clientPromise;
```

## OpenAI Client Setup

Create an OpenAI client in `lib/openai.js`:

```javascript
// lib/openai.js
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API Key');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      input: text,
      encoding_format: "float"
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function generateChatCompletion(messages, temperature = 0.7, max_tokens = 500) {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.COMPLETION_MODEL || 'gpt-4-turbo',
      messages,
      temperature,
      max_tokens
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw error;
  }
}

export default openai;
```

## Chunking Utilities

Move the existing chunking algorithms to `lib/chunking.js`:

```javascript
// lib/chunking.js
export function chunkByDelimiter(text, delimiter) {
  if (!text) return [];
  return text.split(delimiter).filter(chunk => chunk.trim() !== '');
}

export function chunkByFixedSize(text, chunkSize, overlap) {
  if (!text) return [];
  const chunks = [];
  let i = 0;
  
  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
    i += (chunkSize - overlap);
  }
  
  return chunks;
}

export function recursiveChunk(text, maxSize, overlap) {
  if (!text) return [];
  
  if (text.length <= maxSize) return [text];
  
  const chunks = [];
  let startPos = 0;
  
  while (startPos < text.length) {
    const endPos = Math.min(startPos + maxSize, text.length);
    
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
    
    chunks.push(text.slice(startPos, breakPoint));
    
    startPos = Math.max(startPos, breakPoint - overlap);
  }
  
  return chunks;
}

export function semanticChunk(text) {
  if (!text) return [];
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  const chunks = [];
  let currentChunk = '';
  
  sentences.forEach(sentence => {
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
}

export function analyzeDocumentStructure(text) {
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
}
```

## API Routes

### Chunks API

Create an API route to store chunks in MongoDB:

```javascript
// app/api/chunks/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { generateEmbedding } from '@/lib/openai';

export async function POST(request) {
  try {
    const { chunks, metadata } = await request.json();
    
    const db = await getDb();
    
    const chunksWithEmbeddings = await Promise.all(chunks.map(async (chunk, index) => {
      const embedding = await generateEmbedding(chunk);
      return {
        text: chunk,
        embedding: embedding,
        metadata: {
          ...metadata,
          chunkIndex: index,
          chunkTotal: chunks.length,
          charCount: chunk.length,
          createdAt: new Date()
        }
      };
    }));
    
    const result = await db.collection('chunks').insertMany(chunksWithEmbeddings);
    
    return NextResponse.json({ 
      success: true, 
      insertedCount: result.insertedCount
    });
  } catch (error) {
    console.error('Error storing chunks:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const db = await getDb();
    const chunks = await db.collection('chunks').find({}).toArray();
    
    return NextResponse.json(chunks);
  } catch (error) {
    console.error('Error fetching chunks:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
```

### Visualization API

Create an API route for 2D embedding visualization:

```javascript
// app/api/visualization/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { UMAP } from 'umap-js';

export async function GET(request) {
  try {
    const db = await getDb();
    const chunks = await db.collection('chunks').find({}).toArray();
    
    // Extract embeddings for UMAP
    const embeddings = chunks.map(chunk => chunk.embedding);
    
    // Use UMAP to reduce dimensions to 2D
    const umap = new UMAP({ nComponents: 2 });
    const projection = umap.fit(embeddings);
    
    // Combine projection with document data
    const visualizationData = chunks.map((chunk, i) => ({
      id: chunk._id,
      text: chunk.text,
      metadata: chunk.metadata,
      position: {
        x: projection[i][0] * 90 + 5, // Scale for visualization
        y: projection[i][1] * 90 + 5
      }
    }));
    
    return NextResponse.json(visualizationData);
  } catch (error) {
    console.error('Error generating visualization:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
```

### Vector Search API

Create an API route for vector search:

```javascript
// app/api/search/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { generateEmbedding } from '@/lib/openai';

export async function POST(request) {
  try {
    const { query, filter, limit = 5, numCandidates = 100 } = await request.json();
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    const db = await getDb();
    
    // Perform vector search
    const results = await db.collection('chunks').aggregate([
      {
        $vectorSearch: {
          index: "embedding_index",
          queryVector: queryEmbedding,
          path: "embedding",
          numCandidates: numCandidates,
          limit: limit,
          filter: filter || {}
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
    ]).toArray();
    
    // Store search metrics
    await db.collection('metrics').insertOne({
      query,
      resultCount: results.length,
      filter: filter || {},
      timestamp: new Date()
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error performing vector search:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
```

### Chat API with RAG

Create an API route for chat completions with RAG:

```javascript
// app/api/chat/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { generateEmbedding, generateChatCompletion } from '@/lib/openai';

export async function POST(request) {
  try {
    const { query, history, systemPrompt } = await request.json();
    
    const db = await getDb();
    
    // Retrieve relevant chunks
    const queryEmbedding = await generateEmbedding(query);
    const relevantChunks = await db.collection('chunks').aggregate([
      {
        $vectorSearch: {
          index: "embedding_index",
          queryVector: queryEmbedding,
          path: "embedding",
          numCandidates: 100,
          limit: 5
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
    ]).toArray();
    
    // Build context from chunks
    const context = relevantChunks.map(chunk => chunk.text).join('\n\n');
    
    // Format prompt with context
    const finalPrompt = `
    Answer the question based on the following context. If you cannot answer the question based on the provided context, say so.
    
    Context:
    ${context}
    
    Question: ${query}
    `;
    
    // Prepare messages for chat completion
    const messages = [
      { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
      ...history,
      { role: 'user', content: finalPrompt }
    ];
    
    // Call OpenAI for completion
    const response = await generateChatCompletion(messages);
    
    // Store conversation for analysis
    await db.collection('conversations').insertOne({
      query,
      context,
      response,
      chunks: relevantChunks.map(c => c._id),
      timestamp: new Date()
    });
    
    return NextResponse.json({
      response,
      retrievedChunks: relevantChunks
    });
  } catch (error) {
    console.error('Error in chat completion:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
```

### Setup API for Vector Index

```javascript
// app/api/setup/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const db = await getDb();
    
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('chunks')) {
      await db.createCollection('chunks');
    }
    
    if (!collectionNames.includes('conversations')) {
      await db.createCollection('conversations');
    }
    
    if (!collectionNames.includes('metrics')) {
      await db.createCollection('metrics');
    }
    
    // Create indices
    await db.collection('chunks').createIndex({ "metadata.source": 1 });
    await db.collection('chunks').createIndex({ "metadata.chunkMethod": 1 });
    
    // Create vector search index
    const indexDefinition = {
      mappings: {
        dynamic: true,
        fields: {
          embedding: {
            dimensions: 1536,
            similarity: 'cosine',
            type: 'knnVector'
          }
        }
      }
    };
    
    try {
      await db.command({
        createSearchIndex: 'chunks',
        definition: indexDefinition
      });
    } catch (indexError) {
      // Index might already exist
      console.warn('Index creation warning:', indexError.message);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB setup completed successfully' 
    });
  } catch (error) {
    console.error('Error setting up MongoDB:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
```

## React Components

### Main Page Component

Create the main application page:

```jsx
// app/page.js
'use client';

import { useState, useEffect } from 'react';
import ChunkingStage from '@/components/ChunkingStage';
import EmbeddingStage from '@/components/EmbeddingStage';
import RetrievalStage from '@/components/RetrievalStage';
import GenerationStage from '@/components/GenerationStage';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chunking');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');
  
  useEffect(() => {
    async function setupMongoDB() {
      try {
        setSetupMessage('Setting up MongoDB...');
        const response = await fetch('/api/setup', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
          setIsSetupComplete(true);
          setSetupMessage('MongoDB setup complete!');
        } else {
          setSetupMessage(`Setup error: ${data.error}`);
        }
      } catch (error) {
        setSetupMessage(`Setup error: ${error.message}`);
      }
    }
    
    setupMongoDB();
  }, []);
  
  // MongoDB Brand Colors
  const mongoColors = {
    green: "#00ED64",
    darkGreen: "#001E2B",
    white: "#FFFFFF",
    mint: "#C3F4D7",
    lightGreen: "#E3FCF7",
    blueGreen: "#00684A",
    textDark: "#001E2B",
    textLight: "#FFFFFF",
    textMedium: "#889397"
  };
  
  const renderContent = () => {
    if (!isSetupComplete) {
      return (
        <div style={{ 
          padding: '2rem', 
          backgroundColor: mongoColors.white,
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <p>{setupMessage}</p>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'chunking':
        return <ChunkingStage mongoColors={mongoColors} />;
      case 'embedding':
        return <EmbeddingStage mongoColors={mongoColors} />;
      case 'retrieval':
        return <RetrievalStage mongoColors={mongoColors} />;
      case 'generation':
        return <GenerationStage mongoColors={mongoColors} />;
      default:
        return <ChunkingStage mongoColors={mongoColors} />;
    }
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
        {renderContent()}
      </div>
    </div>
  );
}
```

### Chunking Stage Component

```jsx
// components/ChunkingStage.js
'use client';

import { useState, useEffect } from 'react';
import { 
  chunkByDelimiter, 
  chunkByFixedSize, 
  recursiveChunk, 
  semanticChunk,
  analyzeDocumentStructure
} from '@/lib/chunking';

export default function ChunkingStage({ mongoColors }) {
  // Sample texts for different document types
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
   - Citation and source tracking`
  };
  
  // State variables
  const [docType, setDocType] = useState('documentation');
  const [inputText, setInputText] = useState(sampleTexts.documentation);
  const [method, setMethod] = useState(0); // 0: None, 1: Delimiter, 2: Fixed, 3: Recursive, 4: Semantic
  const [delimiter, setDelimiter] = useState('.');
  const [chunkSize, setChunkSize] = useState(150);
  const [overlap, setOverlap] = useState(20);
  const [chunkedText, setChunkedText] = useState([]);
  const [vectorDocuments, setVectorDocuments] = useState([]);
  const [docAnalysis, setDocAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  
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
  
  // Process the text into chunks and save to MongoDB
  const processText = async () => {
    setIsProcessing(true);
    setProcessingMessage('Processing text...');
    
    try {
      let chunks = [];
      
      switch (method) {
        case 0: // No chunking
          chunks = [inputText];
          break;
        case 1: // Simple delimiter
          chunks = chunkByDelimiter(inputText, delimiter);
          break;
        case 2: // Fixed token with overlap
          chunks = chunkByFixedSize(inputText, chunkSize, overlap);
          break;
        case 3: // Recursive with overlap
          chunks = recursiveChunk(inputText, chunkSize, overlap);
          break;
        case 4: // Semantic
          chunks = semanticChunk(inputText);
          break;
        default:
          chunks = [inputText];
      }
      
      setChunkedText(chunks);
      
      // Generate random colors for visualization
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
        "#AFEEEE" // Pale turquoise
      ];
      
      // Save chunks to MongoDB
      setProcessingMessage('Saving chunks to MongoDB...');
      
      const response = await fetch('/api/chunks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chunks,
          metadata: {
            source: docType,
            chunkMethod: ['none', 'delimiter', 'fixed', 'recursive', 'semantic'][method],
            totalChunks: chunks.length,
          }
        }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setProcessingMessage(`Successfully saved ${result.insertedCount} chunks to MongoDB!`);
      
      // Create vector documents for display
      const newVectorDocs = chunks.map((chunk, index) => ({
        id: `doc_${index + 1}`,
        text: chunk,
        color: chunkColors[index % chunkColors.length],
        metadata: {
          source: docType,
          chunkMethod: ['none', 'delimiter', 'fixed', 'recursive', 'semantic'][method],
          chunkIndex: index,
          chunkTotal: chunks.length,
          charCount: chunk.length
        }
      }));
      
      setVectorDocuments(newVectorDocs);
    } catch (error) {
      setProcessingMessage(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Effect to process chunks when method changes
  useEffect(() => {
    processText();
  }, [inputText, delimiter, chunkSize, overlap, method]);
  
  // Options for the chunking methods
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
  
  // Rest of the component code for rendering the UI
  // (This will be similar to your existing implementation)
  
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
        
        {isProcessing && (
          <div style={{ 
            backgroundColor: mongoColors.mint,
            padding: '0.75rem',
            borderRadius: '0.375rem',
            textAlign: 'center'
          }}>
            {processingMessage}
          </div>
        )}
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
                    {chunk.length} chars
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
                  {chunk}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

You would similarly implement the other component files:
- `components/EmbeddingStage.js`
- `components/RetrievalStage.js`
- `components/GenerationStage.js`

## Setup Script

Create a setup script to run outside Next.js for initial MongoDB configuration:

```javascript
// scripts/setup-mongodb.js
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function setupMongoDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('chunking_demo');
    
    // Create collections
    try {
      await db.createCollection('documents');
      console.log('Created documents collection');
    } catch (e) {
      console.log('documents collection already exists');
    }
    
    try {
      await db.createCollection('chunks');
      console.log('Created chunks collection');
    } catch (e) {
      console.log('chunks collection already exists');
    }
    
    try {
      await db.createCollection('conversations');
      console.log('Created conversations collection');
    } catch (e) {
      console.log('conversations collection already exists');
    }
    
    try {
      await db.createCollection('metrics');
      console.log('Created metrics collection');
    } catch (e) {
      console.log('metrics collection already exists');
    }
    
    // Create indexes
    await db.collection('chunks').createIndex({ "metadata.source": 1 });
    await db.collection('chunks').createIndex({ "metadata.chunkMethod": 1 });
    console.log('Created indexes');
    
    // Create vector search index
    try {
      await db.command({
        createSearchIndex: 'chunks',
        definition: {
          mappings: {
            dynamic: true,
            fields: {
              embedding: {
                dimensions: 1536,
                similarity: 'cosine',
                type: 'knnVector'
              }
            }
          }
        }
      });
      console.log('Created vector search index');
    } catch (e) {
      console.log('Vector search index already exists or error:', e.message);
    }
    
    console.log('MongoDB setup complete');
  } catch (error) {
    console.error('Error setting up MongoDB:', error);
  } finally {
    await client.close();
  }
}

setupMongoDB();
```

## Package.json Updates

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "setup-db": "node scripts/setup-mongodb.js"
  }
}
```

## Security Considerations

1. **Environment Variables**: Store all sensitive information in `.env.local` which is excluded from Git.

2. **API Rate Limiting**: Add API rate limiting using middleware in Next.js:

```javascript
// middleware.js
import { NextResponse } from 'next/server';

// In-memory store for rate limiting
const rateLimit = {};

export function middleware(request) {
  // Simple IP-based rate limiting
  const ip = request.ip || 'anonymous';
  
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const now = Date.now();
    
    if (!rateLimit[ip]) {
      rateLimit[ip] = {
        lastAccess: now,
        count: 1
      };
    } else {
      // Reset count after 1 minute
      if (now - rateLimit[ip].lastAccess > 60000) {
        rateLimit[ip] = {
          lastAccess: now,
          count: 1
        };
      } else {
        rateLimit[ip].count += 1;
        rateLimit[ip].lastAccess = now;
      }
    }
    
    // Allow maximum 30 requests per minute
    if (rateLimit[ip].count > 30) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

3. **Input Validation**: Add validation to API routes using a library like Zod:

```javascript
import { z } from 'zod';

// Example schema for chunks API
const chunksSchema = z.object({
  chunks: z.array(z.string().max(10000)), // Max 10K chars per chunk
  metadata: z.object({
    source: z.string(),
    chunkMethod: z.string(),
    totalChunks: z.number()
  })
});

// Validate in API route
const { chunks, metadata } = chunksSchema.parse(await request.json());
```

## Deployment Considerations

1. **Vercel Deployment**: Add a `vercel.json` file to configure your deployment:

```json
{
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "OPENAI_API_KEY": "@openai_api_key",
    "EMBEDDING_MODEL": "text-embedding-3-small",
    "COMPLETION_MODEL": "gpt-4-turbo"
  },
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

2. **Resource Limits**: Be aware of Vercel's serverless function limits:
   - 10-second execution timeout (on hobby plan)
   - 50MB function size limit
   - Memory usage limits

3. **Edge Functions**: Consider using Edge Functions for some operations to reduce latency.

## Future Enhancements

1. **Streaming Responses**: Implement streaming for LLM responses using the Response.json() streaming support in Next.js.

2. **Document Uploads**: Add a file upload component for processing various document types.

3. **Advanced Visualization**: Implement a 3D visualization using Three.js for better vector space representation.

4. **Metrics Dashboard**: Create a comprehensive comparison dashboard for chunking strategies.

5. **Authentication**: Add authentication for multi-user support.

## Cost Management

To manage API costs, implement:

1. **Usage Tracking**: Track OpenAI API usage to avoid unexpected bills.

2. **Caching**: Cache embeddings to reduce API calls.

3. **Token Optimizations**: Implement efficient text processing to minimize token usage.

4. **Batch Processing**: Use batch processing for embedding generation to reduce API calls.

This Next.js implementation creates a clean, serverless architecture that avoids the CORS issues of a separate Express server, while maintaining all the functionality of the original concept.