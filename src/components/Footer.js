import { Box, Typography, Link, Container } from '@mui/material';
import NextLink from 'next/link';

const footerColors = {
  background: '#8B7355',   // Darker brown for contrast
  text: '#F5E6C3',        // Light text for dark backgrounds
  accent: '#4A6741',      // Sage green for links
  border: '#66594C'       // Warm brown for borders
};

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: footerColors.background,
        color: footerColors.text,
        borderTop: `1px solid ${footerColors.border}`,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2">
            © {new Date().getFullYear()} MongoDB RAG Chunking Demo
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link
              href="https://mlynn.org"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: footerColors.accent,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Created by Michael Lynn
            </Link>
            <Typography variant="body2" sx={{ color: footerColors.text }}>
              •
            </Typography>
            <Link
              component={NextLink}
              href="/privacy"
              sx={{
                color: footerColors.text,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Privacy Policy
            </Link>
            <Typography variant="body2" sx={{ color: footerColors.text }}>
              •
            </Typography>
            <Link
              component={NextLink}
              href="/terms"
              sx={{
                color: footerColors.text,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Terms of Use
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
} 