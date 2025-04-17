import { createTheme } from '@mui/material/styles';

export const mongoColors = {
  // Primary Colors
  green: "#00ED64",          // MongoDB Vibrant Green
  darkGreen: "#001E2B",      // MongoDB Dark Background
  evergreen: "#023430",      // MongoDB Deep Green
  forestGreen: "#00684A",    // MongoDB Forest Green
  
  // Secondary Colors
  slate: "#001E2B",          // MongoDB Slate Blue
  spring: "#00ED64",         // MongoDB Spring Green
  mint: "#C6E6D3",          // MongoDB Mint
  
  // Background Colors
  background: {
    dark: "#001E2B",         // Dark mode background
    light: "#FFFFFF",        // Light mode background
    paper: "#0C2440",        // Slightly lighter dark background
  },
  
  // Text Colors
  text: {
    primary: "#FFFFFF",      // Primary text on dark
    secondary: "#89989B",    // Secondary text
    muted: "#89989B",        // Muted text
    success: "#00ED64",      // Success text
  },
  
  // UI Elements
  ui: {
    hover: "#023430",        // Hover state
    active: "#00ED64",       // Active state
    border: "#89989B",       // Border color
    divider: "rgba(255, 255, 255, 0.12)", // Divider lines
  },
  
  // Accent Colors
  accent: {
    lavender: "#F9F6FF",     // Light accent
    mist: "#E3FCF7",         // Mist accent
    white: "#FFFFFF",        // Pure white
  }
};

export const theme = createTheme({
  palette: {
    primary: {
      main: mongoColors.green,
      dark: mongoColors.darkGreen,
      light: mongoColors.mint,
      contrastText: mongoColors.darkGreen
    },
    secondary: {
      main: mongoColors.darkGreen,
      light: mongoColors.spring,
      contrastText: mongoColors.white
    },
    background: {
      default: mongoColors.background.light,
      paper: mongoColors.background.paper
    },
    text: {
      primary: mongoColors.text.primary,
      secondary: mongoColors.text.secondary
    }
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      color: mongoColors.darkGreen,
      fontWeight: 600
    },
    h2: {
      color: mongoColors.darkGreen,
      fontWeight: 600
    },
    h3: {
      color: mongoColors.darkGreen,
      fontWeight: 600
    },
    h4: {
      color: mongoColors.darkGreen,
      fontWeight: 600
    },
    h5: {
      color: mongoColors.darkGreen,
      fontWeight: 600
    },
    h6: {
      color: mongoColors.darkGreen,
      fontWeight: 600
    },
    body1: {
      color: mongoColors.text.primary
    },
    body2: {
      color: mongoColors.text.secondary
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    }
  }
}); 