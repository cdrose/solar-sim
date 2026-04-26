// simulator.js — client-side port of backend/simulator.py
// All simulation runs locally; no network calls needed.

const BATTERY_EFFICIENCY = 0.90
const SUMMER_DAYS = 183
const WINTER_DAYS = 182

const INTERVAL_HOURS = 0.25   // 15-minute intervals
const TOTAL_INTERVALS = 96    // 24h × 4

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Midpoint time (in hours) for interval index i
function intervalMidpoint(i) {
  return i * INTERVAL_HOURS + INTERVAL_HOURS / 2
}

function gaussian(t, center, sigma, amplitude) {
  return amplitude * Math.exp(-0.5 * ((t - center) / sigma) ** 2)
}

function arrayAdd(a, b) {
  return a.map((v, i) => v + b[i])
}

function arraySum(a) {
  return a.reduce((acc, v) => acc + v, 0)
}

function r3(v) {
  return Math.round(v * 1000) / 1000
}

function r2(v) {
  return Math.round(v * 100) / 100
}

function r1(v) {
  return Math.round(v * 10) / 10
}

// ---------------------------------------------------------------------------
// Time label formatter — shared by chart components
// ---------------------------------------------------------------------------

export function fmtTime(t) {
  const h = Math.floor(t)
  const m = Math.round((t % 1) * 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Usage profile
// ---------------------------------------------------------------------------

export function buildUsageProfile(params) {
  if (params.hourly) {
    // Custom 24-value profile: linearly interpolate to 96 midpoint samples
    const h = params.hourly
    return Array.from({ length: TOTAL_INTERVALS }, (_, i) => {
      const t = intervalMidpoint(i)
      const slot = Math.min(Math.floor(t), 22)  // clamp to avoid overflow at 23.875
      const frac = t - slot
      return r3(h[slot] + (h[slot + 1] - h[slot]) * frac)
    })
  }

  const {
    morning_peak, morning_hour,
    midday_peak,  midday_hour,
    evening_peak, evening_hour,
    night_avg,
  } = params

  return Array.from({ length: TOTAL_INTERVALS }, (_, i) => {
    const t = intervalMidpoint(i)
    const val = night_avg
      + gaussian(t, morning_hour, 1.2, morning_peak)
      + gaussian(t, midday_hour,  1.5, midday_peak)
      + gaussian(t, evening_hour, 2.0, evening_peak)
    return r3(val)
  })
}

// ---------------------------------------------------------------------------
// Solar generation curve
// ---------------------------------------------------------------------------

export function buildSolarCurve(setup, season, conditions) {
  const solarNoon = season === 'summer' ? 13.0 : 12.5
  const sigma     = season === 'summer' ? 2.8  : 1.8
  const peak      = conditions === 'sunny' ? setup.total_kw : setup.total_kw * 0.35

  return Array.from({ length: TOTAL_INTERVALS }, (_, i) => {
    const t = intervalMidpoint(i)
    return r3(Math.max(0, gaussian(t, solarNoon, sigma, peak)))
  })
}

// ---------------------------------------------------------------------------
// Hourly battery / grid simulation
// ---------------------------------------------------------------------------

export function runSimulation(usageParams, solarSetup, season, conditions) {
  const usage  = buildUsageProfile(usageParams)
  const solar  = buildSolarCurve(solarSetup, season, conditions)

  let batteryState = 0.0
  const battCap = solarSetup.battery_kwh

  const solarDirect      = Array(TOTAL_INTERVALS).fill(0)
  const batteryCharge    = Array(TOTAL_INTERVALS).fill(0)
  const batteryDischarge = Array(TOTAL_INTERVALS).fill(0)
  const gridImport       = Array(TOTAL_INTERVALS).fill(0)
  const gridExport       = Array(TOTAL_INTERVALS).fill(0)

  for (let i = 0; i < TOTAL_INTERVALS; i++) {
    const solarKW  = solar[i]
    const usageKW  = usage[i]
    const netKW    = solarKW - usageKW

    if (netKW >= 0) {
      // Solar surplus — charge battery then export remainder
      solarDirect[i] = usageKW

      const availableKWh  = netKW * INTERVAL_HOURS
      const headroomKWh   = (battCap - batteryState) / BATTERY_EFFICIENCY
      const chargeInputKWh = Math.min(availableKWh, headroomKWh)

      batteryCharge[i] = chargeInputKWh / INTERVAL_HOURS           // back to kW for display
      batteryState = Math.min(batteryState + chargeInputKWh * BATTERY_EFFICIENCY, battCap)
      gridExport[i] = Math.max(availableKWh - chargeInputKWh, 0) / INTERVAL_HOURS
    } else {
      // Solar deficit — discharge battery then import remainder
      solarDirect[i] = solarKW

      const deficitKWh        = (-netKW) * INTERVAL_HOURS
      const deliverableKWh    = batteryState * BATTERY_EFFICIENCY
      const dischargeOutputKWh = Math.min(deficitKWh, deliverableKWh)

      batteryDischarge[i] = dischargeOutputKWh / INTERVAL_HOURS    // back to kW for display
      batteryState = Math.max(batteryState - dischargeOutputKWh / BATTERY_EFFICIENCY, 0)
      gridImport[i] = Math.max(deficitKWh - dischargeOutputKWh, 0) / INTERVAL_HOURS
    }
  }

  // kWh = sum of kW values × interval duration
  const totalUsage    = arraySum(usage)   * INTERVAL_HOURS
  const totalSolar    = arraySum(solar)   * INTERVAL_HOURS
  const totalImport   = arraySum(gridImport)       * INTERVAL_HOURS
  const totalExport   = arraySum(gridExport)       * INTERVAL_HOURS
  const selfConsumed  = (arraySum(solarDirect) + arraySum(batteryDischarge)) * INTERVAL_HOURS

  return {
    intervals:         Array.from({ length: TOTAL_INTERVALS }, (_, i) => i * INTERVAL_HOURS),
    usage:             usage,
    solar:             solar,
    solar_direct:      solarDirect.map(r3),
    battery_discharge: batteryDischarge.map(r3),
    battery_charge:    batteryCharge.map(r3),
    grid_import:       gridImport.map(r3),
    grid_export:       gridExport.map(r3),
    summary: {
      total_usage_kwh:    r2(totalUsage),
      total_solar_kwh:    r2(totalSolar),
      total_import_kwh:   r2(totalImport),
      total_export_kwh:   r2(totalExport),
      self_consumed_kwh:  r2(selfConsumed),
      self_consumed_pct:  r1(100 * selfConsumed  / Math.max(totalUsage, 0.001)),
      solar_utilised_pct: r1(100 * selfConsumed  / Math.max(totalSolar, 0.001)),
      import_pct:         r1(100 * totalImport   / Math.max(totalUsage, 0.001)),
      export_pct:         r1(100 * totalExport   / Math.max(totalSolar, 0.001)),
    },
  }
}

// ---------------------------------------------------------------------------
// Payback calculation
// ---------------------------------------------------------------------------

export function calcPayback(req) {
  const {
    usage_params, solar_setup,
    num_panels, cost_per_panel, inverter_cost, battery_cost,
    import_tariff, export_tariff,
    sunny_fraction_summer, sunny_fraction_winter,
  } = req

  const systemCost =
    num_panels * cost_per_panel +
    inverter_cost +
    (solar_setup.battery_kwh > 0 ? battery_cost : 0)

  const importRate = import_tariff / 100  // $/kWh
  const exportRate = export_tariff / 100  // $/kWh

  const scenarioDefs = {
    summer_sunny:  { days: SUMMER_DAYS * sunny_fraction_summer,        season: 'summer', cond: 'sunny'  },
    summer_cloudy: { days: SUMMER_DAYS * (1 - sunny_fraction_summer),  season: 'summer', cond: 'cloudy' },
    winter_sunny:  { days: WINTER_DAYS * sunny_fraction_winter,        season: 'winter', cond: 'sunny'  },
    winter_cloudy: { days: WINTER_DAYS * (1 - sunny_fraction_winter),  season: 'winter', cond: 'cloudy' },
  }

  let annualSavings = 0
  const scenarioSavings = {}

  for (const [key, { days, season, cond }] of Object.entries(scenarioDefs)) {
    const { summary } = runSimulation(usage_params, solar_setup, season, cond)
    const dailySaving = summary.self_consumed_kwh * importRate + summary.total_export_kwh * exportRate
    const yearly = r2(dailySaving * days)
    scenarioSavings[key] = yearly
    annualSavings += yearly
  }

  annualSavings = r2(annualSavings)

  let paybackYears = null
  const yearlyData = []

  for (let year = 1; year <= 25; year++) {
    const cumulative = r2(annualSavings * year)
    yearlyData.push({ year, cumulative_savings: cumulative, system_cost: systemCost })
    if (paybackYears === null && cumulative >= systemCost) {
      paybackYears = r1(systemCost / Math.max(annualSavings, 0.01))
    }
  }

  return {
    system_cost:      r2(systemCost),
    annual_savings:   annualSavings,
    payback_years:    paybackYears,
    yearly_data:      yearlyData,
    scenario_savings: scenarioSavings,
  }
}

// ---------------------------------------------------------------------------
// Presets (was GET /api/presets)
// ---------------------------------------------------------------------------

export const PRESETS = [
  {
    name: 'Average Home',
    params: { morning_peak: 2.5, morning_hour: 7.5, midday_peak: 0.5, midday_hour: 12.0, evening_peak: 3.0, evening_hour: 19.0, night_avg: 0.3 },
  },
  {
    name: 'High Usage',
    params: { morning_peak: 4.0, morning_hour: 7.0, midday_peak: 1.0, midday_hour: 12.0, evening_peak: 5.0, evening_hour: 18.0, night_avg: 0.5 },
  },
  {
    name: 'Low Usage',
    params: { morning_peak: 1.5, morning_hour: 7.5, midday_peak: 0.3, midday_hour: 12.0, evening_peak: 2.0, evening_hour: 19.5, night_avg: 0.15 },
  },
  {
    name: 'Work From Home',
    params: { morning_peak: 2.0, morning_hour: 8.0, midday_peak: 1.5, midday_hour: 12.5, evening_peak: 2.5, evening_hour: 18.5, night_avg: 0.3 },
  },
  {
    name: 'Office / Away',
    params: { morning_peak: 1.0, morning_hour: 7.5, midday_peak: 0.1, midday_hour: 12.0, evening_peak: 2.5, evening_hour: 19.0, night_avg: 0.2 },
  },
]
