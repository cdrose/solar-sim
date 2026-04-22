import { Card, CardContent, Typography, Slider, Grid, Box, useTheme } from '@mui/material'

const PANEL_SLIDERS = [
  { key: 'total_kw',    label: 'Solar Array Size', min: 0.5, max: 20, step: 0.5, unit: 'kW' },
  { key: 'battery_kwh', label: 'Battery Storage',  min: 0,   max: 30, step: 1,   unit: 'kWh' },
]

function SolarDiagram({ totalKw, batteryKwh }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const fg = isDark ? '#f1f5f9' : '#1e293b'
  const muted = isDark ? '#475569' : '#94a3b8'
  const bg = isDark ? '#0f172a' : '#e2e8f0'
  const panelFill = '#1e40af'
  const batteryPct = Math.min(batteryKwh / 30, 1)
  const batteryColor = batteryPct > 0.6 ? '#22c55e' : batteryPct > 0.3 ? '#f59e0b' : '#ef4444'

  return (
    <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto', mt: 1 }}>
      <svg viewBox="0 0 440 220" style={{ width: '100%', height: 'auto' }}>
        {/* ── Sun ── */}
        <circle cx="220" cy="28" r="18" fill="#fbbf24" opacity={0.95} />
        {[0,45,90,135,180,225,270,315].map((deg) => {
          const rad = (deg * Math.PI) / 180
          return (
            <line key={deg}
              x1={220 + 22 * Math.cos(rad)} y1={28 + 22 * Math.sin(rad)}
              x2={220 + 30 * Math.cos(rad)} y2={28 + 30 * Math.sin(rad)}
              stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round"
            />
          )
        })}

        {/* ── Solar Panels ── */}
        <rect x="155" y="60" width="130" height="50" rx="4" fill={panelFill} stroke="#3b82f6" strokeWidth="1.5" />
        {/* Panel grid lines */}
        {[0,1,2].map(i => (
          <line key={`ph${i}`} x1="155" y1={68 + i * 17} x2="285" y2={68 + i * 17} stroke="#60a5fa" strokeWidth="0.8" opacity={0.6} />
        ))}
        {[0,1,2,3].map(i => (
          <line key={`pv${i}`} x1={188 + i * 32} y1="60" x2={188 + i * 32} y2="110" stroke="#60a5fa" strokeWidth="0.8" opacity={0.6} />
        ))}
        <text x="220" y="92" textAnchor="middle" fontSize="11" fill="#93c5fd" fontWeight="600">
          {totalKw} kW Panels
        </text>

        {/* ── Arrow: Sun → Panels ── */}
        <line x1="220" y1="47" x2="220" y2="58" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrowAmber)" />

        {/* ── Inverter box ── */}
        <rect x="185" y="118" width="70" height="28" rx="5"
          fill={isDark ? '#1e293b' : '#f8fafc'} stroke="#f59e0b" strokeWidth="1.5" />
        <text x="220" y="136" textAnchor="middle" fontSize="10" fill="#f59e0b" fontWeight="600">Inverter</text>

        {/* ── Arrow: Panels → Inverter ── */}
        <line x1="220" y1="110" x2="220" y2="117" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowAmber)" />

        {/* ── Battery ── */}
        {batteryKwh > 0 && (
          <>
            <rect x="22" y="118" width="90" height="42" rx="6"
              fill={isDark ? '#1e293b' : '#f8fafc'} stroke={batteryColor} strokeWidth="2" />
            {/* Battery fill */}
            <rect x="27" y="124" width={Math.max(0, 80 * batteryPct)} height="30" rx="3"
              fill={batteryColor} opacity={0.35} />
            <rect x="27" y="124" width="80" height="30" rx="3"
              fill="none" stroke={batteryColor} strokeWidth="1" opacity={0.5} />
            <text x="67" y="143" textAnchor="middle" fontSize="10" fill={batteryColor} fontWeight="700">
              🔋 {batteryKwh} kWh
            </text>
            {/* Arrow: Inverter ↔ Battery */}
            <line x1="184" y1="132" x2="114" y2="132" stroke={batteryColor} strokeWidth="2"
              markerEnd="url(#arrowGreen)" markerStart="url(#arrowGreenR)" strokeDasharray="4 2" />
          </>
        )}

        {/* ── House ── */}
        <polygon points="220,155 260,175 260,205 180,205 180,175" fill={isDark ? '#334155' : '#e2e8f0'} stroke={fg} strokeWidth="1.5" />
        <polygon points="220,148 268,178 172,178" fill={isDark ? '#475569' : '#cbd5e1'} stroke={fg} strokeWidth="1.5" />
        {/* Door */}
        <rect x="210" y="188" width="20" height="17" rx="2" fill={isDark ? '#1e293b' : '#94a3b8'} />
        {/* Window */}
        <rect x="184" y="181" width="14" height="12" rx="2" fill="#93c5fd" opacity={0.7} />
        <rect x="242" y="181" width="14" height="12" rx="2" fill="#93c5fd" opacity={0.7} />
        <text x="220" y="172" textAnchor="middle" fontSize="10" fill={fg} fontWeight="600">Home</text>

        {/* Arrow: Inverter → House */}
        <line x1="220" y1="147" x2="220" y2="154" stroke="#22c55e" strokeWidth="2" markerEnd="url(#arrowGreen)" />

        {/* ── Grid ── */}
        <line x1="360" y1="120" x2="360" y2="205" stroke={muted} strokeWidth="3" />
        <line x1="340" y1="128" x2="380" y2="128" stroke={muted} strokeWidth="2.5" />
        <line x1="345" y1="140" x2="375" y2="140" stroke={muted} strokeWidth="2" />
        <text x="360" y="116" textAnchor="middle" fontSize="10" fill={muted} fontWeight="600">Grid</text>
        <text x="360" y="208" textAnchor="middle" fontSize="9" fill={muted}>⚡</text>
        {/* Wires from pole */}
        <line x1="340" y1="128" x2="262" y2="180" stroke={muted} strokeWidth="1.5" strokeDasharray="3 2" opacity={0.6} />

        {/* Arrow labels */}
        <text x="295" y="155" textAnchor="middle" fontSize="9" fill="#ef4444">Import</text>
        <text x="295" y="170" textAnchor="middle" fontSize="9" fill="#22c55e">Export</text>

        {/* ── Arrow defs ── */}
        <defs>
          <marker id="arrowAmber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" />
          </marker>
          <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#22c55e" />
          </marker>
          <marker id="arrowGreenR" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto-start-reverse">
            <path d="M0,0 L0,6 L8,3 z" fill="#22c55e" />
          </marker>
        </defs>
      </svg>
    </Box>
  )
}

export default function SolarSetupPanel({ setup, onChange }) {
  return (
    <Card elevation={3} sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: '16px !important', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          ☀️ Solar Setup
        </Typography>

        {/* Diagram grows to fill available vertical space */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <SolarDiagram totalKw={setup.total_kw} batteryKwh={setup.battery_kwh} />
        </Box>

        <Grid container spacing={2} mt={0.5}>
          {PANEL_SLIDERS.map((s) => (
            <Grid item xs={12} key={s.key}>
              <Typography variant="body2" color="text.secondary">
                {s.label}:{' '}
                <strong style={{ color: '#f59e0b' }}>
                  {setup[s.key]} {s.unit}
                </strong>
              </Typography>
              <Slider
                value={setup[s.key]}
                min={s.min} max={s.max} step={s.step}
                onChange={(_, v) => onChange({ ...setup, [s.key]: v })}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v} ${s.unit}`}
                sx={{ color: 'primary.main' }}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}
