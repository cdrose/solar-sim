import { useState, useEffect, useCallback } from 'react'
import {
  Card, CardContent, Typography, Grid, Box, TextField, Divider,
  CircularProgress, Alert, InputAdornment,
} from '@mui/material'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { getPayback } from '../api'

const DEFAULT_COSTS = {
  num_panels: 10,
  cost_per_panel: 300,
  inverter_cost: 1500,
  battery_cost: 3000,
  import_tariff: 28,
  export_tariff: 15,
  sunny_fraction_summer: 0.6,
  sunny_fraction_winter: 0.4,
}

function NumberInput({ label, value, onChange, adornment, helperText, min = 0 }) {
  return (
    <TextField
      label={label}
      type="number"
      size="small"
      fullWidth
      value={value}
      helperText={helperText}
      inputProps={{ min, step: 'any' }}
      InputProps={adornment ? {
        startAdornment: <InputAdornment position="start">{adornment}</InputAdornment>,
      } : undefined}
      onChange={(e) => {
        const v = parseFloat(e.target.value)
        if (!isNaN(v) && v >= min) onChange(v)
      }}
    />
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1.5, py: 1 }}>
        <Typography variant="caption" fontWeight={700}>Year {label}</Typography>
        {payload.map((p) => (
          <Box key={p.name} sx={{ color: p.color, fontSize: 12 }}>
            {p.name}: ${p.value?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </Box>
        ))}
      </Box>
    )
  }
  return null
}

export default function CostCalculator({ usageParams, solarSetup }) {
  const [costs, setCosts] = useState(DEFAULT_COSTS)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runPayback = useCallback(() => {
    setLoading(true)
    setError(null)
    getPayback({ usage_params: usageParams, solar_setup: solarSetup, ...costs })
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [usageParams, solarSetup, costs])

  useEffect(() => {
    const t = setTimeout(runPayback, 600)
    return () => clearTimeout(t)
  }, [runPayback])

  const set = (key) => (val) => setCosts((c) => ({ ...c, [key]: val }))

  const fmtUSD = (v) => `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          💷 Cost & Payback Calculator
        </Typography>

        <Grid container spacing={3}>
          {/* ── System Costs ── */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>System Costs</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <NumberInput label="Panels" value={costs.num_panels} onChange={set('num_panels')} min={1} helperText="number of panels" />
              </Grid>
              <Grid item xs={6}>
                <NumberInput label="Cost per Panel" value={costs.cost_per_panel} onChange={set('cost_per_panel')} adornment="$" helperText="installed" />
              </Grid>
              <Grid item xs={6}>
                <NumberInput label="Inverter Cost" value={costs.inverter_cost} onChange={set('inverter_cost')} adornment="$" />
              </Grid>
              <Grid item xs={6}>
                <NumberInput label="Battery Cost" value={costs.battery_cost} onChange={set('battery_cost')} adornment="$" />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Tariffs & Sunshine</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <NumberInput label="Import Tariff" value={costs.import_tariff} onChange={set('import_tariff')} adornment="¢" helperText="cents per kWh" />
              </Grid>
              <Grid item xs={6}>
                <NumberInput label="Export Tariff" value={costs.export_tariff} onChange={set('export_tariff')} adornment="¢" helperText="cents per kWh" />
              </Grid>
              <Grid item xs={6}>
                <NumberInput label="Summer Sunny Days" value={Math.round(costs.sunny_fraction_summer * 183)} onChange={(v) => set('sunny_fraction_summer')(v / 183)} min={0} helperText="of 183 summer days" />
              </Grid>
              <Grid item xs={6}>
                <NumberInput label="Winter Sunny Days" value={Math.round(costs.sunny_fraction_winter * 182)} onChange={(v) => set('sunny_fraction_winter')(v / 182)} min={0} helperText="of 182 winter days" />
              </Grid>
            </Grid>
          </Grid>

          {/* ── Results ── */}
          <Grid item xs={12} md={6}>
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            {loading && !result && (
              <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
            )}
            {result && (
              <>
                <Grid container spacing={2} mb={2}>
                  {[
                    { label: 'System Cost',    value: fmtUSD(result.system_cost),    color: '#ef4444' },
                    { label: 'Annual Savings', value: fmtUSD(result.annual_savings), color: '#22c55e' },
                    { label: 'Payback Period', value: result.payback_years ? `${result.payback_years} yrs` : '>25 yrs', color: '#f59e0b' },
                  ].map(({ label, value, color }) => (
                    <Grid item xs={4} key={label} sx={{ textAlign: 'center' }}>
                      <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                        <Typography variant="h6" fontWeight={800} color={color}>{value}</Typography>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Scenario breakdown */}
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Annual savings by scenario:</Typography>
                <Grid container spacing={1} mb={1}>
                  {Object.entries(result.scenario_savings).map(([k, v]) => (
                    <Grid item xs={6} key={k}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, py: 0.5, borderRadius: 1, bgcolor: 'background.default', fontSize: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          {k.replace('_', ' ').replace('_', ' ')}
                        </Typography>
                        <Typography variant="caption" color="success.main" fontWeight={700}>{fmtUSD(v)}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Grid>
        </Grid>

        {/* ── Payback Chart ── */}
        {result && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Cumulative Savings vs System Cost (25 years)
            </Typography>
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.yearly_data} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottomRight', offset: -4, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                  <ReferenceLine
                    y={result.system_cost}
                    stroke="#ef4444" strokeDasharray="6 3"
                    label={{ value: 'System Cost', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
                  />
                  {result.payback_years && (
                    <ReferenceLine
                      x={Math.ceil(result.payback_years)}
                      stroke="#22c55e" strokeDasharray="6 3"
                      label={{ value: `Payback`, position: 'insideTopLeft', fontSize: 10, fill: '#22c55e' }}
                    />
                  )}
                  <Line
                    type="monotone" dataKey="cumulative_savings" name="Cumulative Savings"
                    stroke="#22c55e" strokeWidth={2.5} dot={false}
                  />
                  <Line
                    type="monotone" dataKey="system_cost" name="System Cost"
                    stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}
