import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import BookIcon from '@mui/icons-material/Book';

const pageColors = {
  background: '#E6D5A7',
  paper: '#F5E6C3',
  text: {
    primary: '#2C4A1E',
    secondary: '#66594C',
  },
  border: '#8B7355'
};

const knowledgeSections = [
  {
    title: 'RAG Fundamentals',
    content: [
      {
        question: 'What is RAG?',
        answer: 'Retrieval-Augmented Generation (RAG) is a technique that combines the power of large language models with your own data. It works by retrieving relevant information from your data sources and using it to generate more accurate and context-aware responses.'
      },
      {
        question: 'How does RAG work?',
        answer: 'RAG works in three main steps: 1) Chunking - breaking down documents into smaller pieces, 2) Vector Search - finding relevant information using semantic similarity, and 3) Generation - using the retrieved information to generate responses.'
      }
    ]
  },
  {
    title: 'Best Practices',
    content: [
      {
        question: 'How to choose the right chunking strategy?',
        answer: 'The best chunking strategy depends on your data type and use case. For technical documentation, semantic chunking works well. For conversations or Q&A, consider using fixed-size chunks with overlap. Always test different strategies to find what works best for your specific needs.'
      },
      {
        question: 'What makes a good vector search?',
        answer: 'A good vector search requires: 1) High-quality embeddings that capture semantic meaning, 2) Proper indexing for fast retrieval, 3) Appropriate similarity metrics (cosine similarity is commonly used), and 4) Careful tuning of the number of results returned.'
      }
    ]
  },
  {
    title: 'Common Challenges',
    content: [
      {
        question: 'How to handle context windows?',
        answer: 'Large language models have limited context windows. To handle this: 1) Use appropriate chunk sizes, 2) Implement smart context selection, 3) Consider using techniques like sliding windows for long documents, and 4) Experiment with different context compression methods.'
      },
      {
        question: 'How to improve response quality?',
        answer: 'To improve response quality: 1) Ensure your data is clean and well-structured, 2) Use appropriate chunking strategies, 3) Implement proper filtering of retrieved results, 4) Consider using multiple retrieval passes, and 5) Fine-tune your prompt engineering.'
      }
    ]
  },
  {
    title: 'Advanced Topics',
    content: [
      {
        question: 'What is hybrid search?',
        answer: 'Hybrid search combines vector search with traditional keyword-based search. This approach can provide better results by leveraging both semantic understanding and exact keyword matches. It\'s particularly useful when you need to find specific terms or phrases while maintaining semantic relevance.'
      },
      {
        question: 'How to implement RAG at scale?',
        answer: 'For large-scale RAG implementations: 1) Use distributed vector databases, 2) Implement caching strategies, 3) Consider using approximate nearest neighbor (ANN) algorithms, 4) Implement proper monitoring and logging, and 5) Use load balancing for high availability.'
      }
    ]
  }
];

export default function RAGKnowledgeBase({ open, onClose }) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: pageColors.background,
          border: `1px solid ${pageColors.border}`,
        },
      }}
    >
      <DialogTitle sx={{ bgcolor: pageColors.paper, borderBottom: `1px solid ${pageColors.border}` }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <BookIcon sx={{ color: pageColors.text.primary }} />
            <Typography variant="h6" sx={{ color: pageColors.text.primary }}>
              RAG Knowledge Base
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Container maxWidth="md">
          {knowledgeSections.map((section, index) => (
            <Accordion
              key={index}
              expanded={expanded === `panel${index}`}
              onChange={handleChange(`panel${index}`)}
              sx={{
                bgcolor: pageColors.paper,
                border: `1px solid ${pageColors.border}`,
                mb: 2,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: pageColors.text.primary }} />}
              >
                <Typography sx={{ color: pageColors.text.primary, fontWeight: 500 }}>
                  {section.title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {section.content.map((item, itemIndex) => (
                    <Box key={itemIndex}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ color: pageColors.text.primary }}>
                              {item.question}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ color: pageColors.text.secondary, mt: 1 }}>
                              {item.answer}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {itemIndex < section.content.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: pageColors.paper, borderTop: `1px solid ${pageColors.border}` }}>
        <Button
          onClick={onClose}
          sx={{ color: pageColors.text.primary }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 