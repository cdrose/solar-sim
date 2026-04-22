// api.js — thin async wrappers around the local simulator.
// Keeping the same function signatures means no component changes are needed.
import { PRESETS, buildUsageProfile, runSimulation, calcPayback } from './simulator'

export const getPresets = () =>
  Promise.resolve(PRESETS)

export const getUsageProfile = (params) =>
  Promise.resolve({ hours: Array.from({ length: 24 }, (_, i) => i), usage: buildUsageProfile(params) })

export const simulate = ({ usage_params, solar_setup, season, conditions }) =>
  Promise.resolve(runSimulation(usage_params, solar_setup, season, conditions))

export const getPayback = (req) =>
  Promise.resolve(calcPayback(req))
