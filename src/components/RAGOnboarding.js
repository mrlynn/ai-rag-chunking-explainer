import { useState } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const pageColors = {
  background: '#E6D5A7',
  paper: '#F5E6C3',
  text: {
    primary: '#2C4A1E',
    secondary: '#66594C',
  },
  border: '#8B7355'
};

const steps = [
  {
    label: 'What is RAG?',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: pageColors.text.primary }}>
          Retrieval-Augmented Generation (RAG)
        </Typography>
        <Typography paragraph sx={{ color: pageColors.text.secondary }}>
          RAG is a technique that combines the power of large language models with your own data. It works by:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: pageColors.paper, border: `1px solid ${pageColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: pageColors.text.primary }}>1. Chunking</Typography>
                <Typography sx={{ color: pageColors.text.secondary }}>
                  Breaking down your documents into smaller, meaningful pieces that can be easily searched and retrieved.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: pageColors.paper, border: `1px solid ${pageColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: pageColors.text.primary }}>2. Vector Search</Typography>
                <Typography sx={{ color: pageColors.text.secondary }}>
                  Converting text into vectors and finding the most relevant pieces of information for a given query.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: pageColors.paper, border: `1px solid ${pageColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: pageColors.text.primary }}>3. Generation</Typography>
                <Typography sx={{ color: pageColors.text.secondary }}>
                  Using the retrieved information to generate accurate, context-aware responses.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    )
  },
  {
    label: 'Why Use RAG?',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: pageColors.text.primary }}>
          Benefits of RAG
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: pageColors.paper, border: `1px solid ${pageColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: pageColors.text.primary }}>Accuracy</Typography>
                <Typography sx={{ color: pageColors.text.secondary }}>
                  RAG provides more accurate responses by grounding them in your actual data rather than relying solely on the model's training data.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: pageColors.paper, border: `1px solid ${pageColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: pageColors.text.primary }}>Up-to-date Information</Typography>
                <Typography sx={{ color: pageColors.text.secondary }}>
                  Your responses stay current because RAG can access the latest information from your data sources.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    )
  },
  {
    label: 'Real-world Applications',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: pageColors.text.primary }}>
          Where to Use RAG
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: pageColors.paper, border: `1px solid ${pageColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: pageColors.text.primary }}>Customer Support</Typography>
                <Typography sx={{ color: pageColors.text.secondary }}>
                  Create AI assistants that can answer questions about your products using your documentation.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: pageColors.paper, border: `1px solid ${pageColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: pageColors.text.primary }}>Internal Knowledge</Typography>
                <Typography sx={{ color: pageColors.text.secondary }}>
                  Help employees find information in company documents and policies quickly.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: pageColors.paper, border: `1px solid ${pageColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: pageColors.text.primary }}>Research</Typography>
                <Typography sx={{ color: pageColors.text.secondary }}>
                  Analyze and summarize large collections of research papers or technical documentation.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    )
  }
];

export default function RAGOnboarding({ open, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          <Typography variant="h6" sx={{ color: pageColors.text.primary }}>
            Understanding RAG
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {steps[activeStep].content}
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: pageColors.paper, borderTop: `1px solid ${pageColors.border}` }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ color: pageColors.text.primary }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? handleClose : handleNext}
          sx={{
            bgcolor: pageColors.text.primary,
            '&:hover': { bgcolor: pageColors.text.primary },
          }}
        >
          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 