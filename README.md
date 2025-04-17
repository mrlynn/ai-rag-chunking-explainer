# MongoDB RAG Chunking Lifecycle Demo

An interactive application demonstrating how document chunking strategies affect the Retrieval Augmented Generation (RAG) pipeline with real MongoDB Atlas Vector Search and OpenAI integration.

![MongoDB RAG Chunking Lifecycle Demo Screenshot](screenshot.png)

## Overview

This application provides a complete end-to-end demonstration of how chunking decisions impact RAG application performance. It guides you through all four stages of the RAG lifecycle (chunking, embedding, retrieval, and generation) with real data processing using MongoDB Atlas and OpenAI.

## Core Features

- **Real MongoDB Atlas Integration**: Store and query vectors in a real MongoDB Atlas cluster
- **OpenAI Embeddings**: Generate real vector embeddings using OpenAI's embedding models
- **Multiple Chunking Strategies**: Compare five different chunking methods with real performance metrics
- **Vector Space Visualization**: See how chunks are represented and clustered in vector space
- **MongoDB Vector Search**: Execute real $vectorSearch queries with filters
- **Fully Functional RAG Chatbot**: Test different chunking approaches with a real LLM-powered chatbot
- **Document Analysis**: Automatic chunking strategy recommendations for different document types
- **Performance Metrics**: Real-world measurements of chunking impact on retrieval quality

## What This Demo Explains

This demo illustrates several important RAG concepts with real data:

1. **Document Chunking**: How different strategies affect context preservation and retrieval precision
2. **Vector Embeddings**: Real embeddings from OpenAI showing how chunks cluster in semantic space
3. **Semantic Retrieval**: Real vector similarity retrieval with MongoDB Atlas Vector Search
4. **RAG Response Generation**: How retrieved chunks inform AI responses with actual LLM integration
5. **MongoDB Vector Search**: Practical implementation with real queries and performance metrics

## Getting Started

### Prerequisites

- Node.js (v18.17.0+)
- MongoDB Atlas cluster (M10 or higher) with Vector Search enabled
- OpenAI API key
- npm or yarn
- A modern web browser

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/mongodb-rag-chunking-demo.git
   cd mongodb-rag-chunking-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   # or with yarn
   yarn
   ```

3. Copy the `.env.local.example` file to `.env.local` and add your API keys:
   ```
   MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/
   MONGODB_DB=rag_demo
   OPENAI_API_KEY=your-openai-api-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or with yarn
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Using the Demo

The application is divided into four tabs, each representing a stage in the RAG lifecycle:

### 1. Chunking Stage

- Load documents from various sources (local upload, URL, or sample documents)
- Process documents with five chunking strategies:
  - **No Chunking**: Stores the entire document as a single chunk
  - **Delimiter**: Splits text at specific characters (periods, paragraph breaks, etc.)
  - **Fixed Size with Overlap**: Creates chunks of consistent token length with configurable overlap
  - **Recursive**: Breaks at natural boundaries like sentence or paragraph endings
  - **Semantic**: Uses context-aware chunking to keep related content together
- Adjust settings like chunk size, overlap, and delimiters
- Save chunks to MongoDB Atlas with metadata

### 2. Embedding Stage

- Generate real embeddings using OpenAI's embedding models
- Visualize embeddings in a dimensionally-reduced 2D or 3D space
- Examine embedding clusters and see how similar content groups together
- Create and deploy a MongoDB Atlas Vector Search index

### 3. Retrieval Stage

- Enter search queries to test real vector similarity retrieval
- Experiment with MongoDB Vector Search parameters (numCandidates, limit, etc.)
- Apply metadata filters to narrow search results
- Compare retrieval performance across different chunking strategies using real metrics

### 4. Generation Stage

- Chat with a fully-functional RAG-powered assistant
- Observe which chunks are retrieved for each question
- View the complete prompt construction with retrieved context
- Analyze how chunking quality impacts answer accuracy and completeness

## Technical Implementation

This application integrates several key technologies:

- **Next.js App Router** for frontend UI and API routes
- **MongoDB Atlas** for document and vector storage
- **MongoDB Atlas Vector Search** for semantic retrieval
- **OpenAI API** for embeddings and completions
- **Dimension reduction techniques** (UMAP) for vector visualization

### MongoDB Integration

The application uses MongoDB Node.js SDK to:

```javascript
// Store chunks in MongoDB
await db.collection('chunks').insertMany(vectorDocuments);

// Create a vector search index
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

// Perform vector search
const results = await db.collection('chunks').aggregate([
  {
    $vectorSearch: {
      index: "embedding_index",
      queryVector: queryEmbedding,
      path: "embedding",
      numCandidates: 100,
      limit: 5,
      filter: { "metadata.source": documentType }
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
```

### OpenAI Integration

The application uses OpenAI API for embeddings and completions:

```javascript
// Generate embeddings
const response = await openai.embeddings.create({
  model: process.env.EMBEDDING_MODEL,
  input: textChunk,
  encoding_format: "float"
});
const embedding = response.data[0].embedding;

// Generate completion with retrieved context
const completion = await openai.chat.completions.create({
  model: process.env.COMPLETION_MODEL,
  messages: [
    { role: "system", content: systemPrompt },
    ...chatHistory,
    { role: "user", content: finalPrompt }
  ],
  temperature: 0.7,
  max_tokens: 500,
  stream: true
});
```

## Deployment and Collection Structure

The demo creates the following collections in your MongoDB Atlas database:

1. `documents` - Stores original documents
2. `chunks` - Stores chunked text with embeddings
3. `conversations` - Stores chat histories
4. `metrics` - Stores performance metrics from different chunking strategies

## Chunking Impact Analysis

The application provides real performance metrics including:

1. **Mean Reciprocal Rank (MRR)**: Measures the relevance of top retrieved chunks
2. **Context Coverage**: Percentage of necessary information captured in retrievals
3. **Retrieval Latency**: Time required to retrieve relevant chunks
4. **LLM Token Usage**: Token efficiency with different chunking methods
5. **Answer Accuracy**: Quality of responses with different chunking methods

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- MongoDB Documentation for Vector Search reference
- OpenAI API for embeddings and completions
- MongoDB Brand Guidelines for color palette and styling

---

Created for MongoDB Developer Days © 2025# ai-rag-chunking-explainer
