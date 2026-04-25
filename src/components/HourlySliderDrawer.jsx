import {
  Drawer, Box, Typography, Slider, IconButton, Divider,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

const SLIDER_HEIGHT = 160

function hourColor(h) {
  if (h >= 6 && h < 11)  return '#fb923c'
  if (h >= 11 && h < 16) return '#facc15'
  if (h >= 16 && h < 23) return '#c084fc'
  return '#60a5fa'
}

export default function HourlySliderDrawer({ open, onClose, hourly, onChange }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100vw', sm: 700 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700} flex={1}>
          ⚡ Custom Hourly Profile
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Set power usage (kW) for each hour of the day. Drag sliders up to increase usage.
        </Typography>
      </Box>

      <Divider />

      {/* Legend */}
      <Box sx={{ px: 2, pt: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {[
          { label: 'Night (0–5)', color: '#60a5fa' },
          { label: 'Morning (6–10)', color: '#fb923c' },
          { label: 'Midday (11–15)', color: '#facc15' },
          { label: 'Evening (16–22)', color: '#c084fc' },
        ].map(({ label, color }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Sliders */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, pt: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: '3px', minWidth: 'max-content' }}>
          {hourly.map((val, h) => (
            <Box
              key={h}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 26,
              }}
            >
              <Typography variant="caption" sx={{ fontSize: 9, color: 'text.secondary', mb: 0.25 }}>
                {h}
              </Typography>
              <Box sx={{ height: SLIDER_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Slider
                  orientation="vertical"
                  value={val}
                  min={0}
                  max={8}
                  step={0.1}
                  onChange={(_, v) => {
                    const next = [...hourly]
                    next[h] = v
                    onChange(next)
                  }}
                  sx={{
                    height: SLIDER_HEIGHT - 16,
                    color: hourColor(h),
                    '& .MuiSlider-thumb': { width: 12, height: 12 },
                    '& .MuiSlider-track': { width: 4 },
                    '& .MuiSlider-rail': { width: 4 },
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ fontSize: 9, color: hourColor(h), fontWeight: 700, mt: 0.25 }}>
                {val.toFixed(1)}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Hour axis labels */}
        <Box sx={{ display: 'flex', gap: '3px', minWidth: 'max-content', mt: 0.5, pl: 0 }}>
          {hourly.map((_, h) => (
            <Box key={h} sx={{ width: 26, textAlign: 'center' }}>
              {h % 6 === 0 && (
                <Typography variant="caption" sx={{ fontSize: 9, color: 'text.disabled' }}>
                  {h}:00
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Drawer>
  )
}
