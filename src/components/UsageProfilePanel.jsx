import { useState, useEffect, useRef } from 'react'
import {
  Card, CardContent, Typography, Slider, Button,
  Stack, Box, CircularProgress, Divider,
} from '@mui/material'
import TuneIcon from '@mui/icons-material/Tune'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { getPresets, getUsageProfile } from '../api'
import { buildUsageProfile, fmtTime } from '../simulator'
import HourlySliderDrawer from './HourlySliderDrawer'

// Groups ordered left→right matching chart from 6am.
// flex values are proportional to each period's hour-span across 24h:
// Morning 6-11 (5h), Midday 11-16 (5h), Evening 16-23 (7h), Night 23-6 (7h)
const SLIDER_GROUPS = [
  {
    label: 'Morning',
    color: '#fb923c',
    flex: 5,
    sliders: [
      { key: 'morning_peak', label: 'Peak', min: 0,  max: 6,  step: 0.1,  unit: 'kW', isHour: false },
      { key: 'morning_hour', label: 'Time', min: 4,  max: 11, step: 0.5,  unit: 'h',  isHour: true  },
    ],
  },
  {
    label: 'Midday',
    color: '#facc15',
    flex: 5,
    sliders: [
      { key: 'midday_peak', label: 'Usage', min: 0,  max: 4,  step: 0.1,  unit: 'kW', isHour: false },
      { key: 'midday_hour', label: 'Time',  min: 10, max: 15, step: 0.5,  unit: 'h',  isHour: true  },
    ],
  },
  {
    label: 'Evening',
    color: '#c084fc',
    flex: 7,
    sliders: [
      { key: 'evening_peak', label: 'Peak', min: 0,  max: 8,  step: 0.1,  unit: 'kW', isHour: false },
      { key: 'evening_hour', label: 'Time', min: 15, max: 23, step: 0.5,  unit: 'h',  isHour: true  },
    ],
  },
  {
    label: 'Night',
    color: '#60a5fa',
    flex: 7,
    sliders: [
      { key: 'night_avg', label: 'Average', min: 0, max: 1.5, step: 0.05, unit: 'kW', isHour: false },
    ],
  },
]

function fmtHour(val) {
  const h = Math.floor(val)
  const m = val % 1 >= 0.5 ? '30' : '00'
  return `${h}:${m}`
}

function fmtVal(val, s) {
  return s.isHour ? fmtHour(val) : `${val.toFixed(2)} ${s.unit}`
}

export default function UsageProfilePanel({ params, onChange }) {
  const [presets, setPresets] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [hovered, setHovered] = useState(null)
  const customBtnRef = useRef(null)

  const isCustom = Boolean(params.hourly)

  useEffect(() => {
    getPresets().then(setPresets).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    getUsageProfile(params)
      .then((res) => {
        // No rotation — chart runs 0:00 → 23:45
        setChartData(
          Array.from({ length: 96 }, (_, i) => ({
            hour: fmtTime(res.intervals[i]),
            usage: res.usage[i],
          }))
        )
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params])

  return (
    <Card elevation={3} sx={{ width: '100%' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          ⚡ Daily Usage Profile
        </Typography>

        <Stack direction="row" mb={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {presets.map((p) => (
            <Button
              key={p.name}
              size="small"
              variant="outlined"
              onClick={() => onChange(p.params)}
              sx={{ borderRadius: 4, textTransform: 'none', fontSize: 12 }}
            >
              {p.name}
            </Button>
          ))}
          <Button
            ref={customBtnRef}
            size="small"
            variant={isCustom ? 'contained' : 'outlined'}
            color={isCustom ? 'warning' : 'inherit'}
            startIcon={<TuneIcon fontSize="small" />}
            onClick={(e) => {
              if (!isCustom) {
                onChange({ hourly: buildUsageProfile(params) })
              }
              setAnchorEl(e.currentTarget)
            }}
            sx={{ borderRadius: 4, textTransform: 'none', fontSize: 12 }}
          >
            Custom
          </Button>
        </Stack>

        <HourlySliderDrawer
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          hourly={isCustom ? params.hourly : Array(24).fill(0.3)}
          onChange={(hourly) => onChange({ hourly })}
        />

        {/* Hover info bar above chart */}
        <Box sx={{ height: 24, display: 'flex', alignItems: 'center', px: 0.5, mb: 0.5 }}>
          {hovered ? (
            <Typography variant="caption" color="primary" fontWeight={600}>
              {hovered.label} — {hovered.value?.toFixed(2)} kW
            </Typography>
          ) : (
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              Hover chart to inspect
            </Typography>
          )}
        </Box>

        {/* Chart — full width, proper Y axis */}
        <Box sx={{ height: 180, mb: 2, position: 'relative' }}>
          {loading && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 8, bottom: 0, left: 4 }}
              onMouseMove={(e) => e.activePayload && setHovered({ label: e.activeLabel, value: e.activePayload[0]?.value })}
              onMouseLeave={() => setHovered(null)}
            >
              <defs>
                <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={15} />
              <YAxis
                tick={{ fontSize: 10 }}
                width={52}
                tickFormatter={(v) => `${v} kW`}
                label={{ value: 'kW', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#94a3b8' }}
              />
              <Area
                type="monotone" dataKey="usage"
                stroke="#f59e0b" fill="url(#usageGrad)"
                strokeWidth={2} dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {isCustom ? (
          <Box sx={{ pl: '56px', pr: '8px' }}>
            <Typography variant="caption" color="text.secondary">
              Custom hourly profile active.{' '}
              <span
                onClick={() => setAnchorEl(customBtnRef.current)}
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
              >
                Edit hourly values
              </span>
              {' '}or select a preset above to switch back.
            </Typography>
          </Box>
        ) : (
          /*
            Sliders pinned under their chart sections.
            pl matches chart left-margin (4px) + YAxis width (52px) = 56px.
            pr matches chart right-margin (8px).
            Each group's flex value = its hour-span, so widths stay proportional.
          */
          <Box sx={{ pl: '56px', pr: '8px' }}>
            <Box sx={{ display: 'flex' }}>
              {SLIDER_GROUPS.map((group, gi) => (
                <Box
                  key={group.label}
                  sx={{
                    flex: group.flex,
                    minWidth: 0,
                    pl: gi === 0 ? 0 : 1,
                    borderLeft: gi > 0 ? '1px dashed' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: group.color, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}
                  >
                    {group.label}
                  </Typography>
                  {group.sliders.map((s) => (
                    <Box key={s.key} mb={0.5}>
                      <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3}>
                        {s.label}
                        <br />
                        <strong style={{ color: group.color }}>{fmtVal(params[s.key], s)}</strong>
                      </Typography>
                      <Slider
                        size="small"
                        value={params[s.key]}
                        min={s.min} max={s.max} step={s.step}
                        onChange={(_, v) => onChange({ ...params, [s.key]: v })}
                        sx={{ color: group.color, display: 'block', pt: 0.5, pb: 0 }}
                      />
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
