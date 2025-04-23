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

export default function PrivacyPolicy() {
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
            Privacy Policy
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
            Information We Collect
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            This application is a demonstration tool for MongoDB Vector Search and RAG (Retrieval-Augmented Generation) technologies. We do not collect or store any personal information from users. All data processing occurs locally in your browser.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Data Storage
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            Any text you input into this application is processed locally and is not stored on any servers. The application uses MongoDB Atlas for vector search functionality, but no user data is persisted.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Cookies and Tracking
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            This application does not use cookies or any tracking technologies. We do not collect analytics or usage data.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Changes to This Policy
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{ color: pageColors.text.primary, mt: 3 }}
          >
            Contact Us
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: pageColors.text.secondary }}
          >
            If you have any questions about this privacy policy, please contact us at{' '}
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