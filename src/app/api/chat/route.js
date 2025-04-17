import { NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(request) {
  try {
    const data = await request.json();
    const { query, context, conversationHistory = [] } = data;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' }, 
        { status: 400 }
      );
    }
    
    // Prepare the system prompt with context
    const systemPrompt = `You are a helpful AI assistant and an expert in MongoDB corporate policy. Answer the user's question based on the following context. Answer as though you were receiving a question from an employee. Address the employee as a colleague and answer the question directly with a complete response.
If the context doesn't contain relevant information, say you don't know but don't apologize.

CONTEXT:
${context || 'No context provided'}`;
    
    // Prepare messages array with system prompt, conversation history, and current query
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: query }
    ];
    
    // Generate a response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      temperature: 0.5,
      max_tokens: 500
    });
    
    const response = completion.choices[0].message.content;
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error generating chat response:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' }, 
      { status: 500 }
    );
  }
}