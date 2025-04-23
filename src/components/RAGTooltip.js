import { Tooltip, IconButton, Box, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const pageColors = {
  text: {
    primary: '#2C4A1E',
    secondary: '#66594C',
  },
  background: '#F5E6C3',
  border: '#8B7355'
};

export default function RAGTooltip({ title, content, placement = 'top' }) {
  return (
    <Tooltip
      title={
        <Box sx={{ p: 1, maxWidth: 300 }}>
          <Typography variant="subtitle2" sx={{ color: pageColors.text.primary, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: pageColors.text.secondary }}>
            {content}
          </Typography>
        </Box>
      }
      placement={placement}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: pageColors.background,
            border: `1px solid ${pageColors.border}`,
            '& .MuiTooltip-arrow': {
              color: pageColors.background,
            },
          },
        },
      }}
    >
      <IconButton size="small" sx={{ color: pageColors.text.primary }}>
        <HelpOutlineIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
} 