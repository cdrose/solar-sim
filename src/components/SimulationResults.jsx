import { useState, useEffect } from 'react'
import {
  Card, CardContent, Typography, Box, CircularProgress,
  Divider,
} from '@mui/material'
import {
  Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line,
} from 'recharts'
import { simulate } from '../api'
import { fmtTime } from '../simulator'

const SCENARIOS = [
  { season: 'summer', conditions: 'sunny',  label: 'Summer Sunny',  emoji: '☀️',  accent: '#f59e0b' },
  { season: 'summer', conditions: 'cloudy', label: 'Summer Cloudy', emoji: '🌤',  accent: '#94a3b8' },
  { season: 'winter', conditions: 'sunny',  label: 'Winter Sunny',  emoji: '🌞',  accent: '#3b82f6' },
  { season: 'winter', conditions: 'cloudy', label: 'Winter Cloudy', emoji: '🌧',  accent: '#64748b' },
]

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444']

const SERIES = [
  { key: 'Solar Direct',   color: '#22c55e' },
  { key: 'Battery Charge', color: '#06b6d4' },
  { key: 'Battery',        color: '#3b82f6' },
  { key: 'Grid Import',    color: '#ef4444' },
  { key: 'Solar Gen',      color: '#f59e0b' },
]

function StatRow({ label, value, color }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '3px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
      <Typography variant="caption" fontWeight={800} color={color}>{value}</Typography>
    </Box>
  )
}

function HoverBar({ hovered }) {
  return (
    <Box sx={{
      height: 36, display: 'flex', alignItems: 'center', gap: 1.5,
      px: 1, mb: 0.5, borderRadius: 1, flexWrap: 'wrap',
      bgcolor: hovered ? 'action.hover' : 'transparent',
      minHeight: 36,
    }}>
      {hovered ? (
        <>
          <Typography variant="caption" fontWeight={700} sx={{ minWidth: 36 }}>{hovered.label}</Typography>
          {SERIES.map(({ key, color }) => {
            const entry = hovered.payload.find(p => p.name === key)
            if (!entry) return null
            return (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
                  {entry.value?.toFixed(2)}
                </Typography>
              </Box>
            )
          })}
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>kW</Typography>
        </>
      ) : (
        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          Hover chart to inspect
        </Typography>
      )}
    </Box>
  )
}

function ScenarioCard({ scenario, usageParams, solarSetup }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    setLoading(true)
    simulate({ usage_params: usageParams, solar_setup: solarSetup, ...scenario })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [usageParams, solarSetup, scenario.season, scenario.conditions])

  const chartData = data
    ? data.intervals.map((t, i) => ({
        hour: fmtTime(t),
        'Solar Direct':    data.solar_direct[i],
        'Battery':         data.battery_discharge[i],
        'Grid Import':     data.grid_import[i],
        'Solar Gen':       data.solar[i],
        'Battery Charge':  data.battery_charge[i],
      }))
    : []

  const pieData = data
    ? [
        { name: 'Self-consumed', value: data.summary.self_consumed_pct },
        { name: 'Exported',      value: data.summary.export_pct },
        { name: 'Grid Import',   value: data.summary.import_pct },
      ]
    : []

  return (
    <Card elevation={2} sx={{ height: '100%', borderTop: `3px solid ${scenario.accent}` }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          {scenario.emoji} {scenario.label}
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={180}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <HoverBar hovered={hovered} />

            {/* Stacked area chart */}
            <Box sx={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                  onMouseMove={(e) => e.activePayload && setHovered({ label: e.activeLabel, payload: e.activePayload })}
                  onMouseLeave={() => setHovered(null)}
                >
                  <defs>
                    {[['solarGrad','#22c55e'],['battGrad','#3b82f6'],['gridGrad','#ef4444'],['chargeGrad','#06b6d4']].map(([id, col]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={col} stopOpacity={0.6} />
                        <stop offset="95%" stopColor={col} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={23} />
                  <YAxis tick={{ fontSize: 9 }} unit="kW" width={36} />
                  <Tooltip content={() => null} />
                  <Area type="monotone" dataKey="Battery Charge" stackId="2" stroke="#06b6d4" fill="url(#chargeGrad)" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="Solar Gen" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                  <Area type="monotone" dataKey="Solar Direct" stackId="1" stroke="#22c55e" fill="url(#solarGrad)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="Battery"      stackId="1" stroke="#3b82f6" fill="url(#battGrad)"  strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="Grid Import"  stackId="1" stroke="#ef4444" fill="url(#gridGrad)"  strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>

            {/* Stats list + pie chart side by side */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <StatRow label="Solar Gen"   value={`${data.summary.total_solar_kwh} kWh`} color="#f59e0b" />
                <StatRow label="Self-used"   value={`${data.summary.self_consumed_pct}%`}  color="#22c55e" />
                <StatRow label="Grid Import" value={`${data.summary.import_pct}%`}          color="#ef4444" />
                <StatRow label="Exported"    value={`${data.summary.export_pct}%`}          color="#3b82f6" />
              </Box>

              {/* Mini pie chart */}
              <Box sx={{ width: 130, height: 110, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%"
                      innerRadius={28} outerRadius={44} paddingAngle={2}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function SimulationResults({ usageParams, solarSetup }) {
  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          📊 Simulation Results
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Hourly energy flows for four seasonal scenarios — adjust panels and usage above to update.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {SCENARIOS.map((s) => (
            <Box key={`${s.season}-${s.conditions}`} sx={{ flex: 1, minWidth: 0 }}>
              <ScenarioCard
                scenario={s}
                usageParams={usageParams}
                solarSetup={solarSetup}
              />
            </Box>
          ))}
        </Box>

        <Divider sx={{ mt: 2, mb: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          {[['#22c55e','Solar Direct'],['#3b82f6','Battery Discharge'],['#06b6d4','Battery Charging'],['#ef4444','Grid Import']].map(([c,l]) => (
            <Box key={l} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary">{l}</Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 18, height: 0, borderTop: '2px dashed #f59e0b', flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary">Solar Generation</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
