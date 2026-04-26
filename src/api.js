// api.js — thin async wrappers around the local simulator.
// Keeping the same function signatures means no component changes are needed.
import { PRESETS, buildUsageProfile, runSimulation, calcPayback } from './simulator'

export const getPresets = () =>
  Promise.resolve(PRESETS)

export const getUsageProfile = (params) => {
  const usage = buildUsageProfile(params)
  const intervals = Array.from({ length: 96 }, (_, i) => i * 0.25 + 0.125)
  return Promise.resolve({ intervals, usage })
}

export const simulate = ({ usage_params, solar_setup, season, conditions }) =>
  Promise.resolve(runSimulation(usage_params, solar_setup, season, conditions))

export const getPayback = (req) =>
  Promise.resolve(calcPayback(req))
