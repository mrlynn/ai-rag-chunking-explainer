import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Sample text for the demo
const SAMPLE_TEXT = `# MongoDB Vector Search
MongoDB Atlas Vector Search allows developers to easily build vector search functionality into their applications. Vector search, also known as semantic search or similarity search, uses mathematical representations of content to find results that are conceptually similar rather than just matching keywords.

## How Vector Search Works
1. First, content is converted into numerical vectors (embeddings) using machine learning models.
2. These vectors are stored in MongoDB Atlas.
3. When a user searches, their query is also converted into a vector.
4. MongoDB finds documents with vectors most similar to the query vector.

## Vector Search in RAG Applications
Retrieval Augmented Generation (RAG) combines vector search with large language models to generate responses based on specific knowledge bases. The retrieval component uses vector search to find relevant content, while the generation component uses an LLM to create coherent responses.

### Benefits of RAG
- Provides up-to-date information beyond the LLM's training data
- Reduces hallucinations by grounding responses in actual content
- Enables domain-specific knowledge without fine-tuning the entire model
- Improves transparency by citing sources of information

## MongoDB Atlas Vector Search Features
- Supports multiple embedding types and dimensions
- Offers various distance metrics (cosine, euclidean, dot product)
- Provides pre-filtering capabilities to narrow search scope
- Scales automatically with your data
- Integrates seamlessly with the MongoDB Query API

## Creating a Vector Search Index
To create a vector search index in MongoDB Atlas:
1. Navigate to the "Search" tab in your Atlas cluster
2. Click "Create Search Index"
3. Select "Vector Search" as the index type
4. Configure your vector field and parameters
5. Create the index

## Example Vector Search Query
The following MongoDB aggregation pipeline performs a vector search:

db.collection.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.1, 0.2, 0.3],
      numCandidates: 100,
      limit: 10
    }
  }
])

## Chunking Strategies for Vector Search
The effectiveness of vector search often depends on how documents are chunked:

1. No Chunking: Store entire documents as single vectors.
   - Pros: Preserves complete context
   - Cons: May dilute relevance for specific queries

2. Fixed-Size Chunking: Split documents into chunks of consistent size.
   - Pros: Simple implementation, consistent processing
   - Cons: May split important concepts across chunks

3. Semantic Chunking: Split documents at natural semantic boundaries.
   - Pros: Preserves semantic coherence of concepts
   - Cons: More complex to implement

4. Hierarchical Chunking: Create multiple levels of chunks (paragraphs, sections, documents).
   - Pros: Enables multi-level retrieval strategies
   - Cons: Increases storage requirements and complexity

## Best Practices
- Choose chunk size based on the nature of your content and queries
- Include overlaps between chunks to avoid splitting concepts
- Store metadata with chunks to maintain document context
- Implement re-ranking strategies to improve retrieval quality
- Use hybrid approaches combining vector and keyword search for best results`;

export async function GET() {
  try {
    // Setup collections in MongoDB if needed
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    // Create indexes if they don't exist
    try {
      await db.collection('embeddings').createIndex({ chunkId: 1 }, { unique: true });
      
      // Check if vector search index exists and create it if not
      // Note: This is a simplified version - in production, you'd use the Atlas API 
      // or UI to create vector search indexes
      const indexes = await db.collection('embeddings').indexes();
      const hasVectorIndex = indexes.some(index => index.name === 'default');
      
      if (!hasVectorIndex) {
        console.log('Vector search index needs to be created via MongoDB Atlas UI');
      }
    } catch (error) {
      console.error('Error setting up indexes:', error);
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Setup completed successfully',
      sampleText: SAMPLE_TEXT
    });
  } catch (error) {
    console.error('Error in setup:', error);
    return NextResponse.json(
      { error: 'Failed to complete setup' }, 
      { status: 500 }
    );
  }
}