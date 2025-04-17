import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { 
  noChunking, 
  fixedSizeChunking, 
  delimiterChunking,
  recursiveChunking,
  semanticChunking
} from '@/lib/chunkers';

export async function POST(request) {
  try {
    const data = await request.json();
    const { text, method, chunkSize = 200, overlap = 50 } = data;
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' }, 
        { status: 400 }
      );
    }
    
    let chunks = [];
    
    // Apply the appropriate chunking method
    switch (method) {
      case 'none':
        chunks = noChunking(text);
        break;
      case 'fixed':
        chunks = fixedSizeChunking(text, chunkSize, overlap);
        break;
      case 'delimiter':
        chunks = delimiterChunking(text, '\n\n', chunkSize, overlap);
        break;
      case 'recursive':
        chunks = recursiveChunking(text, chunkSize, overlap);
        break;
      case 'semantic':
        chunks = semanticChunking(text, chunkSize);
        break;
      default:
        chunks = fixedSizeChunking(text, chunkSize, overlap);
    }
    
    // Generate IDs for each chunk
    const chunksWithIds = chunks.map((text, index) => ({
      id: `chunk_${index}`,
      text,
      method,
      metadata: {
        chunkSize,
        overlap,
        index
      }
    }));
    
    // Store in MongoDB if connected
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    // Clear existing chunks for this method
    await db.collection('chunks').deleteMany({ method });
    
    // Insert new chunks
    if (chunksWithIds.length > 0) {
      await db.collection('chunks').insertMany(chunksWithIds);
    }
    
    return NextResponse.json({ chunks: chunksWithIds });
  } catch (error) {
    console.error('Error processing chunks:', error);
    return NextResponse.json(
      { error: 'Failed to process chunks' }, 
      { status: 500 }
    );
  }
}