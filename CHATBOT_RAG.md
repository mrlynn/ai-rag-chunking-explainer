# Chatbot RAG Implementation Overview

This document explains how the `Chatbot.js` React component works together with the API route in `src/app/api/chatbot/route.js` to implement a Retrieval-Augmented Generation (RAG) chatbot using MongoDB and OpenAI.

---

## 1. High-Level Architecture

- **Frontend:** `Chatbot.js` provides a floating chat UI in the app, allowing users to interact with the RAG-powered assistant.
- **Backend:** `src/app/api/chatbot/route.js` is the API endpoint that processes user queries using the RAG pipeline: embedding generation, vector search, and LLM response generation.
- **Database:** MongoDB Atlas stores documents, chunks, and embeddings collections for efficient retrieval and context management.

---

## 2. User Interaction Flow (`Chatbot.js`)

1. **User opens the chat window** and types a message.
2. **On send:**
   - The message is added to the chat UI as a user message.
   - A POST request is sent to `/api/chatbot` with `{ query: <user input> }`.
3. **While waiting:**
   - A loading spinner is shown.
4. **On response:**
   - The assistant's reply is displayed in the chat.
   - If available, sources (document names/links) are shown for transparency.

---

## 3. Backend RAG Pipeline (`src/app/api/chatbot/route.js`)

### **Step 1: Embedding Generation**
- The API receives the user query.
- It uses OpenAI's embedding model (`text-embedding-ada-002`) to convert the query into a high-dimensional vector.

### **Step 2: Vector Search in MongoDB**
- The query embedding is used to perform a vector search against the `chatbot_embeddings` collection in MongoDB Atlas.
- The `$vectorSearch` aggregation operator retrieves the most relevant chunks (text passages) based on vector similarity.
- If vector search fails, a fallback to a regular search is used.

### **Step 3: Document Context Gathering**
- For each retrieved chunk, the API fetches the associated document metadata (name, URL) from the `chatbot_documents` collection.
- This allows the chatbot to cite sources in its response.

### **Step 4: LLM Response Generation**
- The retrieved chunks are concatenated to form the context.
- The API sends a prompt to OpenAI's GPT-4 model, including both the context and the user's question.
- The LLM generates a response, which is returned to the frontend along with the relevant sources.

---

## 4. Data Flow Diagram

```
User
  │
  ▼
Chatbot.js (frontend)
  │  POST /api/chatbot { query }
  ▼
route.js (API backend)
  │
  ├─► Generate embedding (OpenAI)
  │
  ├─► Vector search (MongoDB Atlas, chatbot_embeddings)
  │
  ├─► Fetch document info (chatbot_documents)
  │
  ├─► Generate response (OpenAI GPT-4, with context)
  ▼
Chatbot.js (show reply + sources)
```

---

## 5. Key Code References

### **Frontend: `src/components/Chatbot.js`**
- Handles chat UI, user input, and displaying messages/sources.
- Sends user queries to `/api/chatbot` and displays responses.

### **Backend: `src/app/api/chatbot/route.js`**
- `generateEmbedding(query)`: Calls OpenAI to embed the query.
- `vectorSearch(embedding, db)`: Performs vector search in MongoDB.
- `getDocumentInfo(chunkId, db)`: Fetches document metadata for each chunk.
- `generateResponse(query, chunks)`: Calls OpenAI GPT-4 with context to generate a reply.
- `processQuery(query, db)`: Orchestrates the full RAG pipeline.

---

## 6. How RAG Enhances the Chatbot

- **Retrieval:** Finds the most relevant information from your document corpus using semantic search (vector similarity).
- **Augmentation:** Supplies the LLM with real, up-to-date context, improving factual accuracy and grounding.
- **Generation:** Produces a natural language answer, citing sources when possible.

---

## 7. Customization & Extensibility

- **Chunking strategy:** You can adjust how documents are chunked for better retrieval granularity.
- **Embedding model:** Swap out the embedding model for different use cases.
- **LLM model:** Use different OpenAI models or providers.
- **UI:** Customize the chat interface for your brand or workflow.

---

## 8. Example API Request/Response

**Request:**
```json
POST /api/chatbot
{
  "query": "How does vector search work in MongoDB?"
}
```

**Response:**
```json
{
  "query": "How does vector search work in MongoDB?",
  "response": "Vector search in MongoDB uses...",
  "chunks": [
    {
      "text": "...",
      "documentName": "MongoDB Vector Search.pdf",
      "documentUrl": "https://www.mongodb.com/docs/vector-search"
    }
  ]
}
```

---

## 9. References
- [MongoDB Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/embeddings)
- [RAG (Retrieval-Augmented Generation) Overview](https://www.mongodb.com/developer/products/atlas/rag/) 