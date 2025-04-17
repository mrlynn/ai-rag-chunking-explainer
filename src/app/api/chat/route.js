import { NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(request) {
  try {
    const data = await request.json();
    const { query, context, conversationHistory = [], stream = false } = data;
    
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
    
    // If streaming is requested, return a streaming response
    if (stream) {
      // Create a new ReadableStream
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Generate a streaming response using OpenAI
            const completion = await openai.chat.completions.create({
              model: "gpt-4-turbo",
              messages: messages,
              temperature: 0.5,
              max_tokens: 500,
              stream: true
            });
            
            // Process each chunk from the stream
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                // Send the chunk as a server-sent event
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }
            
            // Send the end of the stream
            controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
            controller.close();
          } catch (error) {
            console.error('Error in streaming response:', error);
            controller.error(error);
          }
        }
      });
      
      // Return the stream with the appropriate headers
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response (original implementation)
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: messages,
        temperature: 0.5,
        max_tokens: 500
      });
      
      const response = completion.choices[0].message.content;
      
      return NextResponse.json({ response });
    }
  } catch (error) {
    console.error('Error generating chat response:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' }, 
      { status: 500 }
    );
  }
}