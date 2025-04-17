import { createTheme } from '@mui/material/styles';

export const mongoColors = {
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

export const theme = createTheme({
  palette: {
    primary: {
      main: mongoColors.green,
      dark: mongoColors.blueGreen,
      light: mongoColors.mint,
      contrastText: mongoColors.darkGreen
    },
    secondary: {
      main: mongoColors.darkGreen,
      light: mongoColors.lightGreen,
      contrastText: mongoColors.white
    },
    background: {
      default: mongoColors.white,
      paper: mongoColors.white
    },
    text: {
      primary: mongoColors.textDark,
      secondary: mongoColors.textMedium
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
      color: mongoColors.textDark
    },
    body2: {
      color: mongoColors.textMedium
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