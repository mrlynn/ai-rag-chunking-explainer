'use client';

import { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Container, Paper, CircularProgress } from '@mui/material';
import ChunkingTab from '../components/ChunkingTab';
import EmbeddingTab from '../components/EmbeddingTab';
import RetrievalTab from '../components/RetrievalTab';
import GenerationTab from '../components/GenerationTab';

export default function Home() {
  const [tabIndex, setTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('');
  const [chunkMethod, setChunkMethod] = useState('fixed');
  const [chunks, setChunks] = useState([]);
  const [embeddings, setEmbeddings] = useState([]);
  const [retrievedChunks, setRetrievedChunks] = useState([]);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [query, setQuery] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  useEffect(() => {
    // Load sample text when the component mounts
    const fetchSampleText = async () => {
      try {
        const response = await fetch('/api/setup/sampleText');
        const data = await response.json();
        setText(data.text);
      } catch (error) {
        console.error('Error fetching sample text:', error);
      }
    };

    fetchSampleText();
  }, []);

  // Process text into chunks when text or chunk method changes
  useEffect(() => {
    if (!text) return;

    const processText = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/chunks/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, method: chunkMethod }),
        });
        
        const data = await response.json();
        setChunks(data.chunks);
      } catch (error) {
        console.error('Error processing text:', error);
      } finally {
        setIsLoading(false);
      }
    };

    processText();
  }, [text, chunkMethod]);

  // Generate embeddings when chunks change
  useEffect(() => {
    if (chunks.length === 0) return;
    
    const generateEmbeddings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/embeddings/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chunks }),
        });
        
        const data = await response.json();
        setEmbeddings(data.embeddings);
      } catch (error) {
        console.error('Error generating embeddings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateEmbeddings();
  }, [chunks]);

  // Handle search/retrieval
  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      const data = await response.json();
      setRetrievedChunks(data.results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat generation
  const handleGenerate = async (userQuery) => {
    setQuery(userQuery);
    setIsLoading(true);
    setGeneratedResponse(''); // Reset the response before generating new one
    
    try {
      // First, get relevant chunks
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userQuery }),
      });
      
      const searchData = await searchResponse.json();
      setRetrievedChunks(searchData.results || []);
      
      // Then, generate the chat response
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: userQuery, 
          context: searchData.results ? searchData.results.map(chunk => chunk.text).join('\n\n') : '',
          conversationHistory: conversationHistory
        }),
      });
      
      const chatData = await chatResponse.json();
      
      // Set the response after both search and chat are complete
      setGeneratedResponse(chatData.response);
      
      // Update conversation history with the new exchange
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: userQuery },
        { role: 'assistant', content: chatData.response }
      ]);
    } catch (error) {
      console.error('Error in chat generation:', error);
      setGeneratedResponse('I apologize, but I encountered an error while processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Paper elevation={3} className="p-6">
        <Typography variant="h4" component="h1" gutterBottom className="text-center mb-8">
          MongoDB RAG Lifecycle Demo
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            variant="fullWidth"
            aria-label="RAG process tabs"
          >
            <Tab label="1. Chunking" id="tab-0" />
            <Tab label="2. Embedding" id="tab-1" />
            <Tab label="3. Retrieval" id="tab-2" />
            <Tab label="4. Generation" id="tab-3" />
          </Tabs>
        </Box>

        <Box role="tabpanel" hidden={tabIndex !== 0}>
          {tabIndex === 0 && (
            <ChunkingTab 
              text={text} 
              setText={setText}
              chunkMethod={chunkMethod}
              setChunkMethod={setChunkMethod}
              chunks={chunks}
              isLoading={isLoading}
            />
          )}
        </Box>

        <Box role="tabpanel" hidden={tabIndex !== 1}>
          {tabIndex === 1 && (
            <EmbeddingTab 
              chunks={chunks}
              embeddings={embeddings}
              isLoading={isLoading}
            />
          )}
        </Box>

        <Box role="tabpanel" hidden={tabIndex !== 2}>
          {tabIndex === 2 && (
            <RetrievalTab 
              chunks={chunks}
              onSearch={handleSearch}
              searchResults={retrievedChunks}
              query={query}
              isLoading={isLoading}
            />
          )}
        </Box>

        <Box role="tabpanel" hidden={tabIndex !== 3}>
          {tabIndex === 3 && (
            <GenerationTab 
              retrievedChunks={retrievedChunks}
              query={query}
              onGenerate={handleGenerate}
              generatedResponse={generatedResponse}
              isLoading={isLoading}
              conversationHistory={conversationHistory}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
}