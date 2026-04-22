import { useState, useMemo } from 'react'
import {
  ThemeProvider, CssBaseline, AppBar, Toolbar, Typography,
  Container, IconButton, Tooltip, Box,
} from '@mui/material'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import BoltIcon from '@mui/icons-material/Bolt'
import { getTheme } from './theme'
import UsageProfilePanel from './components/UsageProfilePanel'
import SolarSetupPanel from './components/SolarSetupPanel'
import SimulationResults from './components/SimulationResults'
import CostCalculator from './components/CostCalculator'

const DEFAULT_USAGE = {
  morning_peak: 2.5, morning_hour: 7.5,
  midday_peak: 0.5,  midday_hour: 12.0,
  evening_peak: 3.0, evening_hour: 19.0,
  night_avg: 0.3,
}
const DEFAULT_SOLAR = { total_kw: 4.0, battery_kwh: 10.0 }

export default function App() {
  const [themeMode, setThemeMode] = useState('dark')
  const [usageParams, setUsageParams] = useState(DEFAULT_USAGE)
  const [solarSetup, setSolarSetup] = useState(DEFAULT_SOLAR)

  const theme = useMemo(() => getTheme(themeMode), [themeMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" elevation={0}
        sx={{ background: 'linear-gradient(90deg, #78350f 0%, #92400e 50%, #78350f 100%)', borderBottom: '1px solid rgba(245,158,11,0.3)' }}>
        <Toolbar>
          <BoltIcon sx={{ color: '#f59e0b', mr: 1, fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={800} letterSpacing={0.5}>
              SolarSim
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1 }}>
              Home Solar Simulator
            </Typography>
          </Box>
          <Box flex={1} />
          <Tooltip title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton onClick={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')} sx={{ color: 'white' }}>
              {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Outer column — all rows share this exact width */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Top row: Usage Profile + Solar Setup, equal height */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'stretch' }}>
            <Box sx={{ flex: 7, minWidth: 0, display: 'flex' }}>
              <UsageProfilePanel params={usageParams} onChange={setUsageParams} />
            </Box>
            <Box sx={{ flex: 5, minWidth: 0, display: 'flex' }}>
              <SolarSetupPanel setup={solarSetup} onChange={setSolarSetup} />
            </Box>
          </Box>

          <SimulationResults usageParams={usageParams} solarSetup={solarSetup} />
          <CostCalculator usageParams={usageParams} solarSetup={solarSetup} />

        </Box>
      </Container>
    </ThemeProvider>
  )
}
