'use client';

import { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Container, Paper, CircularProgress } from '@mui/material';
import ChunkingTab from '../components/ChunkingTab';
import EmbeddingTab from '../components/EmbeddingTab';
import RetrievalTab from '../components/RetrievalTab';
import GenerationTab from '../components/GenerationTab';
import OnboardingWizard from '../components/OnboardingWizard';

// New color palette based on the image
const imageColors = {
  background: {
    main: '#E6D5A7', // Warm golden background
    paper: '#F5E6C3', // Lighter warm paper color
    dark: '#8B7355'   // Darker brown for contrast
  },
  primary: {
    main: '#4A6741',  // Sage green from the AI character
    light: '#6B8E60', // Lighter green
    dark: '#2C4A1E'   // Darker green
  },
  text: {
    primary: '#2C4A1E',   // Dark green for primary text
    secondary: '#66594C', // Warm brown for secondary text
    light: '#F5E6C3'     // Light text for dark backgrounds
  },
  accent: {
    yellow: '#FFD700', // Bright yellow for the lightbulb
    brown: '#8B7355'   // Warm brown for borders
  }
};

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
  const [showWizard, setShowWizard] = useState(false);

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  useEffect(() => {
    // Check if it's the user's first visit
    const hasCompletedWizard = localStorage.getItem('ragWizardCompleted');
    if (!hasCompletedWizard) {
      setShowWizard(true);
    }

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

  const handleWizardClose = () => {
    setShowWizard(false);
    localStorage.setItem('ragWizardCompleted', 'true');
  };

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
      
      // Then, generate the chat response with streaming
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: userQuery, 
          context: searchData.results ? searchData.results.map(chunk => chunk.text).join('\n\n') : '',
          conversationHistory: conversationHistory,
          stream: true
        }),
      });
      
      // Check if the response is a stream
      if (chatResponse.headers.get('Content-Type')?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = chatResponse.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Decode the chunk and process it
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Stream is complete
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedResponse += parsed.content;
                  // Update the response in real-time
                  setGeneratedResponse(accumulatedResponse);
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
        
        // Update conversation history with the complete response
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: userQuery },
          { role: 'assistant', content: accumulatedResponse }
        ]);
      } else {
        // Handle non-streaming response (fallback)
        const chatData = await chatResponse.json();
        setGeneratedResponse(chatData.response);
        
        // Update conversation history
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: userQuery },
          { role: 'assistant', content: chatData.response }
        ]);
      }
    } catch (error) {
      console.error('Error in chat generation:', error);
      setGeneratedResponse('I apologize, but I encountered an error while processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ 
      bgcolor: imageColors.background.main,
      minHeight: '100vh',
      py: 4
    }}>
      <Container maxWidth="lg">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 6,
            bgcolor: imageColors.background.paper,
            borderRadius: 2,
            border: `1px solid ${imageColors.accent.brown}`
          }}
        >
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 0
          }}>
            <Box 
              component="img"
              src="/header-2.png"
              alt="MongoDB Logo"
              sx={{ 
                height: 300,
                mb: 3,
                objectFit: 'contain'
              }}
            />
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                color: imageColors.text.primary,
                textAlign: 'center',
                fontWeight: 'bold'
              }}
            >
              MongoDB RAG Lifecycle Demo
            </Typography>
          </Box>
          
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: imageColors.accent.brown,
            mb: 4 
          }}>
            <Tabs 
              value={tabIndex} 
              onChange={handleTabChange} 
              variant="fullWidth"
              aria-label="RAG process tabs"
              sx={{
                '& .MuiTab-root': {
                  color: imageColors.text.secondary,
                  '&.Mui-selected': {
                    color: imageColors.primary.main,
                    fontWeight: 'bold'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: imageColors.primary.main
                }
              }}
            >
              <Tab label="1. Chunking" id="tab-0" />
              <Tab label="2. Embedding" id="tab-1" />
              <Tab label="3. Retrieval" id="tab-2" />
              <Tab label="4. Generation" id="tab-3" />
            </Tabs>
          </Box>

          <Box 
            role="tabpanel" 
            hidden={tabIndex !== 0}
            sx={{ 
              bgcolor: imageColors.background.paper,
              borderRadius: 1
            }}
          >
            {tabIndex === 0 && (
              <ChunkingTab 
                text={text} 
                setText={setText}
                chunkMethod={chunkMethod}
                setChunkMethod={setChunkMethod}
                chunks={chunks}
                isLoading={isLoading}
                colors={imageColors}
              />
            )}
          </Box>

          <Box 
            role="tabpanel" 
            hidden={tabIndex !== 1}
            sx={{ 
              bgcolor: imageColors.background.paper,
              borderRadius: 1
            }}
          >
            {tabIndex === 1 && (
              <EmbeddingTab 
                chunks={chunks}
                embeddings={embeddings}
                isLoading={isLoading}
                colors={imageColors}
              />
            )}
          </Box>

          <Box 
            role="tabpanel" 
            hidden={tabIndex !== 2}
            sx={{ 
              bgcolor: imageColors.background.paper,
              borderRadius: 1
            }}
          >
            {tabIndex === 2 && (
              <RetrievalTab 
                chunks={chunks}
                onSearch={handleSearch}
                searchResults={retrievedChunks}
                query={query}
                isLoading={isLoading}
                colors={imageColors}
              />
            )}
          </Box>

          <Box 
            role="tabpanel" 
            hidden={tabIndex !== 3}
            sx={{ 
              bgcolor: imageColors.background.paper,
              borderRadius: 1
            }}
          >
            {tabIndex === 3 && (
              <GenerationTab 
                retrievedChunks={retrievedChunks}
                query={query}
                onGenerate={handleGenerate}
                generatedResponse={generatedResponse}
                isLoading={isLoading}
                conversationHistory={conversationHistory}
                colors={imageColors}
              />
            )}
          </Box>
        </Paper>
      </Container>

      <OnboardingWizard 
        open={showWizard}
        onClose={handleWizardClose}
        colors={imageColors}
      />
    </Box>
  );
}