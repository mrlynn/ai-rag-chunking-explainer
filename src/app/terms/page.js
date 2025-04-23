'use client';

import { Box, Typography, Container, Paper } from '@mui/material';

const pageColors = {
  background: '#E6D5A7', // Warm golden background
  paper: '#F5E6C3',     // Lighter warm paper color
  text: {
    primary: '#2C4A1E',   // Dark green for primary text
    secondary: '#66594C', // Warm brown for secondary text
  },
  border: '#8B7355'      // Darker brown for borders
};

export default function TermsOfUse() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 6,
        backgroundColor: pageColors.background,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            backgroundColor: pageColors.paper,
            border: `1px solid ${pageColors.border}`,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ color: pageColors.text.primary }}
          >
            Terms of Use
          </Typography>

          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            Last updated: {new Date().toLocaleDateString()}
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Acceptance of Terms
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            By accessing and using this application, you accept and agree to be bound by these Terms of Use. This application is a demonstration tool for MongoDB Vector Search and RAG (Retrieval-Augmented Generation) technologies.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Use of the Application
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            This application is provided for educational and demonstration purposes only. You may use the application to explore and understand RAG and vector search concepts, but you may not use it for any commercial purposes without explicit permission.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Intellectual Property
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            The application, including its design, code, and content, is protected by copyright and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without permission.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Disclaimer
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            This application is provided "as is" without any warranties, express or implied. We do not guarantee that the application will be error-free or uninterrupted.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Limitation of Liability
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            In no event shall we be liable for any damages arising out of the use or inability to use this application.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Changes to Terms
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            We reserve the right to modify these terms at any time. Your continued use of the application after any changes indicates your acceptance of the modified terms.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Contact
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            For any questions regarding these terms, please contact us at{' '}
            <a
              href="mailto:contact@mlynn.org"
              style={{
                color: pageColors.text.primary,
                textDecoration: 'none',
              }}
            >
              contact@mlynn.org
            </a>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
} 