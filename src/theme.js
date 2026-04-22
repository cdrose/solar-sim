import { createTheme } from '@mui/material/styles'

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#f59e0b' },
      secondary: { main: '#3b82f6' },
      success: { main: '#22c55e' },
      error: { main: '#ef4444' },
      ...(mode === 'dark'
        ? {
            background: { default: '#0f172a', paper: '#1e293b' },
            text: { primary: '#f1f5f9', secondary: '#94a3b8' },
          }
        : {
            background: { default: '#f8fafc', paper: '#ffffff' },
          }),
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: { padding: '8px 0' },
        },
      },
    },
  })
