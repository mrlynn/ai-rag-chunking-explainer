import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { mongoColors } from '../theme';

const steps = [
  {
    label: 'Text Chunking',
    description: `The first step in the RAG process is breaking down your documents into smaller, meaningful chunks. This is crucial because:
• It helps manage token limits for the embedding model
• Improves retrieval accuracy by keeping related content together
• Allows for more precise context matching

The app supports multiple chunking strategies:
• Fixed-size chunks: Splits text into equal-sized pieces
• Sentence-based: Splits on sentence boundaries
• Paragraph-based: Splits on paragraph breaks
• Semantic: Uses AI to identify natural content boundaries`
  },
  {
    label: 'Embedding Generation',
    description: `Each text chunk is converted into a vector (embedding) that captures its semantic meaning:
• Uses OpenAI's text-embedding-ada-002 model
• Creates 1536-dimensional vectors
• Preserves semantic relationships between chunks
• Enables similarity-based search

The embeddings are stored in MongoDB Atlas with vector search capabilities, allowing for efficient similarity queries.`
  },
  {
    label: 'Retrieval',
    description: `When you ask a question, the system:
1. Converts your query into an embedding
2. Performs a vector similarity search
3. Retrieves the most relevant chunks
4. Ranks them by relevance score

This ensures the AI has the most relevant context to answer your question accurately.`
  },
  {
    label: 'Generation',
    description: `The final step combines your question with the retrieved context:
• The AI model receives your question and relevant chunks
• It generates a response based on the provided context
• Responses are streamed in real-time
• The system maintains conversation history

The result is an AI assistant that can provide accurate, context-aware answers from your document collection.`
  }
];

export default function HelpDialog({ open, onClose }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: mongoColors.white,
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: mongoColors.darkGreen,
        color: mongoColors.white,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <HelpOutlineIcon />
        RAG Lifecycle Documentation
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body1" paragraph>
          This application demonstrates the complete RAG (Retrieval-Augmented Generation) lifecycle, from document processing to AI-powered responses. Below is a detailed explanation of each step in the process.
        </Typography>
        
        <Stepper orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label} active={true}>
              <StepLabel>
                <Typography variant="h6" sx={{ color: mongoColors.darkGreen }}>
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body1" sx={{ 
                  color: mongoColors.textDark,
                  whiteSpace: 'pre-line',
                  mb: 2
                }}>
                  {step.description}
                </Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4, p: 2, bgcolor: mongoColors.lightGreen, borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ color: mongoColors.darkGreen }}>
            Best Practices
          </Typography>
          <Typography variant="body1" sx={{ color: mongoColors.textDark }}>
            • Keep chunks between 100-500 tokens for optimal performance
            • Use semantic chunking for complex documents
            • Ensure chunks maintain context and coherence
            • Regularly update your document collection
            • Monitor retrieval quality and adjust chunking strategies
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: mongoColors.lightGreen }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{ 
            bgcolor: mongoColors.green,
            color: mongoColors.darkGreen,
            '&:hover': {
              bgcolor: mongoColors.mint
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 