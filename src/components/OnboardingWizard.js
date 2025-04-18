'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import DataArrayIcon from '@mui/icons-material/DataArray';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const steps = [
  {
    label: 'Text Chunking',
    description: 'Documents are broken down into smaller, manageable chunks. This helps in processing large documents and maintaining context. You can experiment with different chunking strategies to see how they affect the final results.',
    icon: ContentCutIcon,
    image: '/chunking.png'
  },
  {
    label: 'Vector Embeddings',
    description: 'Each chunk is converted into a numerical vector using AI. These vectors capture the semantic meaning of the text, allowing for similarity-based search. The visualization shows how similar chunks are positioned closer together.',
    icon: DataArrayIcon,
    image: '/embedding.png'
  },
  {
    label: 'Semantic Search',
    description: 'When you ask a question, the system finds the most relevant chunks by comparing vector similarities. This ensures that the AI has the most pertinent information to answer your query.',
    icon: ManageSearchIcon,
    image: '/search.png'
  },
  {
    label: 'AI Generation',
    description: 'Finally, an AI model uses the retrieved chunks as context to generate accurate, informed responses to your questions. The response is grounded in your document\'s content, reducing hallucinations.',
    icon: SmartToyIcon,
    image: '/generation.png'
  }
];

export default function OnboardingWizard({ open, onClose, colors }) {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSkip = () => {
    onClose();
    // Here you could set a flag in localStorage to not show the wizard again
    localStorage.setItem('ragWizardCompleted', 'true');
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.background.paper,
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: colors.primary.main,
        color: colors.text.light,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">Welcome to the RAG Pipeline Demo</Typography>
        <IconButton
          aria-label="close"
          onClick={handleSkip}
          sx={{ color: colors.text.light }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: activeStep >= index ? colors.primary.main : colors.background.dark,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.text.light
                      }}
                    >
                      <StepIcon />
                    </Box>
                  )}
                >
                  {step.label}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>

        <Box sx={{ 
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          p: 2
        }}>
          <Typography variant="h5" sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
            {steps[activeStep].label}
          </Typography>
          
          <Box
            component="img"
            src={steps[activeStep].image}
            alt={steps[activeStep].label}
            sx={{
              maxWidth: '100%',
              height: 200,
              objectFit: 'contain',
              borderRadius: 1,
              border: `1px solid ${colors.accent.brown}`
            }}
          />

          <Typography 
            variant="body1" 
            sx={{ 
              color: colors.text.secondary,
              textAlign: 'center',
              maxWidth: 600
            }}
          >
            {steps[activeStep].description}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: colors.background.paper }}>
        <Button
          onClick={handleSkip}
          sx={{ 
            color: colors.text.secondary,
            '&:hover': {
              color: colors.primary.main
            }
          }}
        >
          Skip Tutorial
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          sx={{ 
            color: colors.primary.main,
            '&.Mui-disabled': {
              color: colors.text.secondary
            }
          }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? onClose : handleNext}
          sx={{
            bgcolor: colors.primary.main,
            color: colors.text.light,
            '&:hover': {
              bgcolor: colors.primary.dark
            }
          }}
        >
          {activeStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 