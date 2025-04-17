'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, IconButton, Avatar, Tabs, Tab, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BugReportIcon from '@mui/icons-material/BugReport';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

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

export default function GenerationTab({ 
  retrievedChunks, 
  query, 
  onGenerate, 
  generatedResponse, 
  isLoading,
  conversationHistory = []
}) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: `👋 Hello! I'm your MongoDB Corporate Policy Assistant.

I'm here to help you understand our company policies and procedures. Feel free to ask me about:
• Time off and leave policies
• Expense reimbursements
• Remote work guidelines
• Professional development
• Health and wellness benefits

How can I assist you today?`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingQuery, setPendingQuery] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [localConversationHistory, setLocalConversationHistory] = useState(conversationHistory);

  // Update local conversation history when prop changes
  useEffect(() => {
    setLocalConversationHistory(conversationHistory);
    addDebugLog('conversationHistory updated', { 
      historyLength: conversationHistory.length 
    });
  }, [conversationHistory]);

  // Debug logging function
  const addDebugLog = useCallback((action, data) => {
    const timestamp = new Date().toISOString();
    setDebugLogs(prev => [...prev, {
      timestamp,
      action,
      data
    }]);
  }, []);

  // Handle new user input
  const handleSend = () => {
    if (inputMessage.trim()) {
      const trimmedMessage = inputMessage.trim();
      
      // Add user message immediately
      setMessages(prev => [...prev, { role: 'user', content: trimmedMessage }]);
      
      // Set typing state and trigger generation
      setIsTyping(true);
      setPendingQuery(trimmedMessage);
      onGenerate(trimmedMessage);
      setInputMessage('');
    }
  };

  // Handle response from parent component
  useEffect(() => {
    addDebugLog('useEffect [generatedResponse, pendingQuery]', { 
      generatedResponse, 
      pendingQuery,
      isTyping 
    });

    if (generatedResponse && pendingQuery) {
      const formattedResponse = formatResponse(pendingQuery, generatedResponse);
      addDebugLog('formatting response', { 
        originalResponse: generatedResponse,
        formattedResponse 
      });

      setMessages(prev => {
        addDebugLog('setMessages (assistant)', { newMessage: formattedResponse });
        return [...prev, { role: 'assistant', content: formattedResponse }];
      });
      
      setIsTyping(false);
      setPendingQuery(null);
    }
  }, [generatedResponse, pendingQuery, addDebugLog]);

  // Format the response with greeting and closing
  const formatResponse = (query, response) => {
    const greeting = getGreeting();
    const closingLine = getClosingLine();

    return `${greeting}

${response}

${closingLine}`;
  };

  const getGreeting = () => {
    const greetings = [
      "Thank you for your question.",
      "I'd be happy to help you with that.",
      "Let me assist you with that inquiry.",
      "I appreciate you asking about this.",
      "Thank you for reaching out about this."
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const getClosingLine = () => {
    const closings = [
      "Is there anything else you'd like to know about this topic?",
      "Please let me know if you need any clarification.",
      "Don't hesitate to ask if you have any follow-up questions.",
      "I'm here if you need any additional information.",
      "Feel free to ask for more details about any part of this policy."
    ];
    return closings[Math.floor(Math.random() * closings.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const clearConversation = () => {
    setMessages([
      { 
        role: 'assistant', 
        content: `👋 Hello! I'm your MongoDB Corporate Policy Assistant.

I'm here to help you understand our company policies and procedures. Feel free to ask me about:
• Time off and leave policies
• Expense reimbursements
• Remote work guidelines
• Professional development
• Health and wellness benefits

How can I assist you today?`
      }
    ]);
    setLocalConversationHistory([]);
    addDebugLog('clearConversation', { message: 'Conversation history cleared' });
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 100px)',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: mongoColors.lightGreen
    }}>
      {/* Main content area */}
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1,
        gap: 2,
        p: 2,
        height: '100%',
        overflow: 'hidden',
        position: 'relative'  // Added for loading overlay positioning
      }}>
        {/* Chat Interface */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: '60%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '1rem',
            overflow: 'hidden',
            bgcolor: mongoColors.white,
            position: 'relative'  // Added for loading overlay positioning
          }}
        >
          {isLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 10,
                borderRadius: '1rem'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <CircularProgress size={40} sx={{ color: mongoColors.green }} />
                <Typography variant="body2" sx={{ color: mongoColors.blueGreen }}>
                  Processing your request...
                </Typography>
              </Box>
            </Box>
          )}

          {/* Chat header */}
          <Box sx={{ 
            p: 2.5,
            borderBottom: `1px solid ${mongoColors.mint}`,
            backgroundColor: mongoColors.darkGreen,
            color: mongoColors.white,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>MongoDB Policy Assistant</Typography>
              <Typography variant="body2" sx={{ color: mongoColors.textMedium }}>
                Your Corporate Policy Guide
              </Typography>
            </Box>
            <IconButton 
              onClick={clearConversation}
              sx={{ 
                color: mongoColors.white,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
              title="Clear conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </IconButton>
          </Box>

          {/* Messages container */}
          <Box sx={{ 
            flexGrow: 1, 
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}>
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  gap: 2
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: msg.role === 'user' ? mongoColors.green : mongoColors.darkGreen,
                    width: 38,
                    height: 38
                  }}
                >
                  {msg.role === 'user' ? (
                    <PersonOutlineIcon sx={{ color: mongoColors.darkGreen }} />
                  ) : (
                    <SmartToyOutlinedIcon sx={{ color: mongoColors.white }} />
                  )}
                </Avatar>
                <Box
                  sx={{
                    maxWidth: '75%',
                    backgroundColor: msg.role === 'user' ? mongoColors.green : mongoColors.white,
                    color: msg.role === 'user' ? mongoColors.darkGreen : mongoColors.textDark,
                    p: 2.5,
                    borderRadius: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.7
                    }}
                  >
                    {msg.content}
                  </Typography>
                </Box>
              </Box>
            ))}
            {isTyping && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: mongoColors.darkGreen,
                    width: 38,
                    height: 38
                  }}
                >
                  <SmartToyOutlinedIcon sx={{ color: mongoColors.white }} />
                </Avatar>
                <Box
                  sx={{
                    maxWidth: '75%',
                    backgroundColor: mongoColors.white,
                    p: 2.5,
                    borderRadius: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="body2" sx={{ 
                    color: mongoColors.textMedium,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <span style={{ 
                      width: 8,
                      height: 8,
                      backgroundColor: mongoColors.green,
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'pulse 1s infinite'
                    }}/>
                    Composing response...
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Input area */}
          <Box sx={{ 
            p: 2.5, 
            borderTop: `1px solid ${mongoColors.mint}`,
            backgroundColor: mongoColors.white
          }}>
            <Box sx={{
              display: 'flex',
              gap: 2,
              backgroundColor: mongoColors.lightGreen,
              p: 0.5,
              borderRadius: 2
            }}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about company policies..."
                style={{
                  flexGrow: 1,
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
                rows={2}
              />
              <IconButton 
                onClick={handleSend}
                disabled={!inputMessage.trim() || isTyping}
                sx={{ 
                  alignSelf: 'flex-end',
                  backgroundColor: mongoColors.green,
                  color: mongoColors.darkGreen,
                  width: 45,
                  height: 45,
                  '&:hover': {
                    backgroundColor: mongoColors.mint
                  },
                  '&.Mui-disabled': {
                    backgroundColor: mongoColors.mint,
                    opacity: 0.5
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Right side panels */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: '40%',
            borderRadius: '1rem',
            overflow: 'hidden',
            bgcolor: mongoColors.white,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${mongoColors.mint}`,
              bgcolor: mongoColors.darkGreen,
              '& .MuiTab-root': {
                color: mongoColors.textMedium,
                '&.Mui-selected': {
                  color: mongoColors.green
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: mongoColors.green
              }
            }}
          >
            <Tab 
              icon={<AutoAwesomeIcon />} 
              label="RAG Process" 
              sx={{ 
                minHeight: 72,
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            />
            <Tab 
              icon={<SearchIcon />}
              label="Context" 
              sx={{ 
                minHeight: 72,
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            />
            <Tab 
              icon={<BugReportIcon />}
              label="Debug" 
              sx={{ 
                minHeight: 72,
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            />
          </Tabs>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: mongoColors.darkGreen }}>
                  RAG Process Steps
                </Typography>
                {['Query Processing', 'Vector Search', 'Context Assembly', 'Response Generation'].map((step, index) => (
                  <Box
                    key={step}
                    sx={{
                      p: 2.5,
                      borderRadius: 1,
                      backgroundColor: mongoColors.lightGreen,
                      borderLeft: isTyping && index === (isTyping ? 1 : -1) 
                        ? `4px solid ${mongoColors.green}` 
                        : `4px solid transparent`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <AccountTreeIcon sx={{ color: mongoColors.blueGreen }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: mongoColors.darkGreen }}>
                        {index + 1}. {step}
                      </Typography>
                      <Typography variant="body2" sx={{ color: mongoColors.textMedium, mt: 0.5 }}>
                        {getStepDescription(index)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {activeTab === 1 && retrievedChunks.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: mongoColors.darkGreen }}>
                  Retrieved Context
                </Typography>
                {retrievedChunks.map((chunk, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2.5,
                      borderRadius: 1,
                      backgroundColor: mongoColors.lightGreen,
                      borderLeft: `4px solid ${mongoColors.green}`
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      display="block" 
                      gutterBottom 
                      sx={{ 
                        color: mongoColors.blueGreen,
                        fontWeight: 500,
                        mb: 1
                      }}
                    >
                      Match #{index + 1} • Relevance Score: {(chunk.score || 0.8 * (3-index)).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: mongoColors.darkGreen }}>
                      {chunk.text.substring(0, 150)}...
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: mongoColors.darkGreen }}>
                  Debug Information
                </Typography>
                <Box sx={{ 
                  backgroundColor: mongoColors.darkGreen,
                  p: 2.5,
                  borderRadius: 1,
                  color: mongoColors.white,
                  fontSize: '0.75rem'
                }}>
                  <Typography variant="subtitle2" gutterBottom>Current State:</Typography>
                  <pre style={{ 
                    margin: 0,
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {JSON.stringify({
                      pendingQuery,
                      isTyping,
                      hasGeneratedResponse: !!generatedResponse,
                      messageCount: messages.length,
                      retrievedChunksCount: retrievedChunks.length,
                      conversationHistoryLength: localConversationHistory.length
                    }, null, 2)}
                  </pre>
                </Box>

                <Typography variant="subtitle2" gutterBottom sx={{ color: mongoColors.darkGreen }}>
                  Conversation History:
                </Typography>
                <Box sx={{ 
                  backgroundColor: mongoColors.lightGreen,
                  p: 2.5,
                  borderRadius: 1,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {localConversationHistory.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {localConversationHistory.map((msg, index) => (
                        <Box 
                          key={index}
                          sx={{ 
                            p: 1.5,
                            borderRadius: 1,
                            backgroundColor: msg.role === 'user' ? mongoColors.mint : mongoColors.white,
                            fontSize: '0.75rem',
                            borderLeft: `3px solid ${msg.role === 'user' ? mongoColors.green : mongoColors.blueGreen}`
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: mongoColors.blueGreen }}>
                            {msg.role === 'user' ? 'User' : 'Assistant'}:
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: mongoColors.textMedium }}>
                      No conversation history yet.
                    </Typography>
                  )}
                </Box>

                <Typography variant="subtitle2" gutterBottom sx={{ color: mongoColors.darkGreen }}>
                  Event Log:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {debugLogs.slice().reverse().map((log, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: mongoColors.lightGreen,
                        fontSize: '0.75rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      <div style={{ color: mongoColors.textMedium }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div style={{ color: mongoColors.blueGreen, fontWeight: 'bold', margin: '4px 0' }}>
                        {log.action}
                      </div>
                      <pre style={{ 
                        margin: 0,
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: mongoColors.darkGreen
                      }}>
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

function getStepDescription(index) {
  const descriptions = [
    "Converting your question into a vector representation for semantic search",
    "Finding the most relevant policy documents using vector similarity",
    "Gathering and organizing the retrieved context for the AI",
    "Generating a response based on the relevant policy information"
  ];
  return descriptions[index];
}