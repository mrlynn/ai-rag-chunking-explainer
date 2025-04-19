'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  Fab, 
  CircularProgress,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  Zoom,
  useTheme,
  Avatar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { mongoColors } from '../theme';

// Message component for chat messages
const Message = ({ message, isUser }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        gap: 1,
        alignItems: 'flex-start'
      }}
    >
      {!isUser && (
        <Avatar
          alt="Bot"
          src="/avatar-chunk.png"
          sx={{
            width: 32,
            height: 32,
            bgcolor: '#e2cf9d',
            mt: 1
          }}
        />
      )}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '80%',
          bgcolor: '#f4e2bb',
          color: isUser ? mongoColors.darkGreen : mongoColors.darkGreen,
          borderRadius: 2,
          border: isUser ? 'none' : `1px solid ${mongoColors.ui.border}`
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
        {message.sources && message.sources.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: mongoColors.darkGreen }}>
              Sources:
            </Typography>
            <List dense sx={{ p: 0, m: 0 }}>
              {message.sources.map((source, index) => (
                <ListItem key={index} sx={{ p: 0, pl: 1 }}>
                  <ListItemText 
                    primary={source.documentName}
                    secondary={source.score ? `Score: ${source.score.toFixed(4)}` : ''}
                    primaryTypographyProps={{ variant: 'caption' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                    sx={{ 
                      color: mongoColors.darkGreen,
                      '& .MuiListItemText-primary': { fontSize: '0.7rem' },
                      '& .MuiListItemText-secondary': { fontSize: '0.65rem' }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
      {isUser && (
        <Avatar sx={{ 
          width: 32, 
          height: 32,
          bgcolor: '#e2cf9d',
          mt: 1
        }}>
          <AccountCircleIcon sx={{ color: mongoColors.darkGreen }} />
        </Avatar>
      )}
    </Box>
  );
};

export default function Chatbot() {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { 
      content: "Hello! I'm your RAG-powered assistant. How can I help you today?", 
      isUser: false 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = { content: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Call the chatbot API to get a response
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add assistant message to chat
      setMessages(prev => [
        ...prev, 
        { 
          content: data.response, 
          isUser: false,
          sources: data.chunks
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      setMessages(prev => [
        ...prev, 
        { 
          content: "I'm sorry, I encountered an error processing your request. Please try again later.", 
          isUser: false 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press in input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating chat button */}
      <Fab
        aria-label="chat"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          bgcolor: '#e2cf9d',
          '&:hover': {
            bgcolor: mongoColors.forestGreen
          },
          width: 56,
          height: 56,
          p: 0
        }}
      >
        {isOpen ? <CloseIcon /> : (
          <Box
            component="img"
            src="/avatar-chunk.png"
            alt="Chat"
            sx={{
              width: 40,
              height: 40,
              objectFit: 'contain'
            }}
          />
        )}
      </Fab>
      
      {/* Chat window */}
      <Collapse in={isOpen}>
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            width: isExpanded ? '80vw' : 350,
            height: isExpanded ? '80vh' : 500,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#c7b482',
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${mongoColors.ui.border}`,
            transition: 'all 0.3s ease'
          }}
        >
          {/* Chat header */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#804f1e',
              color: mongoColors.text.primary,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>RAG Assistant</Typography>
            <Box>
              <Tooltip title={showSources ? "Hide Sources" : "Show Sources"}>
                <IconButton 
                  size="small" 
                  onClick={() => setShowSources(!showSources)}
                  sx={{ color: '#804f1e' }}
                >
                  {showSources ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title={isExpanded ? "Minimize" : "Maximize"}>
                <IconButton
                  size="small"
                  onClick={() => setIsExpanded(!isExpanded)}
                  sx={{ color: mongoColors.text.primary }}
                >
                  {isExpanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
                </IconButton>
              </Tooltip>
              <IconButton 
                size="small" 
                onClick={() => setIsOpen(false)}
                sx={{ color: mongoColors.text.primary }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          
          {/* Chat messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#f4e2bb'
            }}
          >
            {messages.map((message, index) => (
              <Message 
                key={index} 
                message={message} 
                isUser={message.isUser} 
              />
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} sx={{ color: mongoColors.green }} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
          
          {/* Chat input */}
          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${mongoColors.ui.border}`,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#686227'
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: mongoColors.background.light,
                  '& fieldset': {
                    borderColor: mongoColors.ui.border,
                  },
                  '&:hover fieldset': {
                    borderColor: mongoColors.green,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: mongoColors.green,
                  },
                  '& .MuiInputBase-input': {
                    color: mongoColors.darkGreen,
                  }
                }
              }}
            />
            <IconButton 
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              sx={{ 
                ml: 1,
                color: mongoColors.green,
                '&:hover': {
                  bgcolor: mongoColors.accent.mist,
                },
                '&.Mui-disabled': {
                  color: mongoColors.text.secondary,
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
} 