import { useState, useEffect } from 'react'
import {
  Popover, Box, Typography, Slider, Button, Divider,
} from '@mui/material'

const SLIDER_HEIGHT = 160

function hourColor(h) {
  if (h >= 6 && h < 11)  return '#fb923c'
  if (h >= 11 && h < 16) return '#facc15'
  if (h >= 16 && h < 23) return '#c084fc'
  return '#60a5fa'
}

export default function HourlySliderDrawer({ anchorEl, onClose, hourly, onChange }) {
  const open = Boolean(anchorEl)
  const [draft, setDraft] = useState(() => [...hourly])

  // Reset draft to committed values each time the popover opens
  useEffect(() => {
    if (open) setDraft([...hourly])
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleApply() {
    onChange(draft)
    onClose()
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { width: { xs: '95vw', sm: 690 }, p: 2 } }}
    >
      <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
        ⚡ Custom Hourly Profile
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Set power usage (kW) for each hour. Click Apply to update the simulation.
      </Typography>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
        {[
          { label: 'Night (0–5)', color: '#60a5fa' },
          { label: 'Morning (6–10)', color: '#fb923c' },
          { label: 'Midday (11–15)', color: '#facc15' },
          { label: 'Evening (16–22)', color: '#c084fc' },
        ].map(({ label, color }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Sliders */}
      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <Box sx={{ display: 'flex', gap: '3px', minWidth: 'max-content' }}>
          {draft.map((val, h) => (
            <Box key={h} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26 }}>
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
                    const next = [...draft]
                    next[h] = v
                    setDraft(next)
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
        <Box sx={{ display: 'flex', gap: '3px', minWidth: 'max-content', mt: 0.5 }}>
          {draft.map((_, h) => (
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

      <Divider sx={{ mt: 1, mb: 1.5 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button size="small" variant="contained" color="warning" onClick={handleApply} sx={{ textTransform: 'none' }}>
          Apply
        </Button>
      </Box>
    </Popover>
  )
}
