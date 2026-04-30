import { useState } from 'react'
import { Zap, TrendingUp, Lock, CheckCircle, Save, Settings, AlertCircle } from 'lucide-react'

interface RouterConfig {
  operatingPct: number
  treasuryPct: number
  lockedPct: number
  allowanceAmount: number
  allowancePeriod: number
}

const PRESETS = [
  {
    name: 'Balanced',
    description: 'Equal focus on all three buckets',
    operating: 34,
    treasury: 33,
    locked: 33,
  },
  {
    name: 'Growth',
    description: 'Maximize yield generation',
    operating: 20,
    treasury: 50,
    locked: 30,
  },
  {
    name: 'Discipline',
    description: 'Focus on locked savings',
    operating: 30,
    treasury: 20,
    locked: 50,
  },
  {
    name: 'Operational',
    description: 'Maximum liquidity',
    operating: 60,
    treasury: 25,
    locked: 15,
  },
]

const PERIOD_OPTIONS = [
  { label: 'Daily', value: 86400, description: '24 hours' },
  { label: 'Weekly', value: 604800, description: '7 days' },
  { label: 'Bi-weekly', value: 1209600, description: '14 days' },
  { label: 'Monthly', value: 2592000, description: '30 days' },
]

export default function SettingsPage() {
  const [config, setConfig] = useState<RouterConfig>({
    operatingPct: 40,
    treasuryPct: 30,
    lockedPct: 30,
    allowanceAmount: 100,
    allowancePeriod: 604800,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const updatePercentages = (field: keyof Pick<RouterConfig, 'operatingPct' | 'treasuryPct' | 'lockedPct'>, value: number) => {
    const newConfig = { ...config }
    newConfig[field] = value

    // Auto-adjust others to maintain 100%
    const total = newConfig.operatingPct + newConfig.treasuryPct + newConfig.lockedPct
    if (total !== 100) {
      const diff = 100 - total
      if (field === 'operatingPct') {
        newConfig.treasuryPct = Math.max(0, Math.min(100, newConfig.treasuryPct + diff / 2))
        newConfig.lockedPct = 100 - newConfig.operatingPct - newConfig.treasuryPct
      } else if (field === 'treasuryPct') {
        newConfig.lockedPct = Math.max(0, Math.min(100, newConfig.lockedPct + diff))
      } else {
        newConfig.treasuryPct = Math.max(0, Math.min(100, newConfig.treasuryPct + diff))
      }
    }

    setConfig(newConfig)
    setIsSaved(false)
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setConfig({
      ...config,
      operatingPct: preset.operating,
      treasuryPct: preset.treasury,
      lockedPct: preset.locked,
    })
    setIsSaved(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate API call
    try {
      // In real app, call contract updateSettings()
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Advanced Settings</h1>
          <p className="text-ink-400">Configure routing strategy and allowance rules</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isSaved}
          className="flex items-center gap-2 rounded-xl bg-flare-500 px-6 py-3 font-semibold text-white hover:bg-flare-600 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving...
            </>
          ) : isSaved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Split Configuration */}
      <div className="rounded-2xl bg-ink-900/50 ring-1 ring-ink-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-ink-400" />
          <h2 className="font-semibold text-white">Payment Split Configuration</h2>
        </div>

        <p className="text-sm text-ink-400 mb-4">
          Configure how incoming payments are distributed between operating capital, yield treasury, and locked savings.
        </p>

        {/* Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`rounded-xl p-4 text-left ring-1 transition-all ${
                config.operatingPct === preset.operating && config.treasuryPct === preset.treasury
                  ? 'bg-flare-500/10 ring-flare-500/50'
                  : 'bg-ink-800/50 ring-ink-800 hover:ring-ink-700'
              }`}
            >
              <div className="font-semibold text-white text-sm">{preset.name}</div>
              <div className="text-xs text-ink-400 mt-1">{preset.description}</div>
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-400" />
                <span className="font-medium text-white">Operating Capital</span>
              </div>
              <span className="font-display text-xl font-bold text-green-400">
                {config.operatingPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.operatingPct}
              onChange={(e) => updatePercentages('operatingPct', parseInt(e.target.value))}
              className="w-full h-2 bg-ink-800 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <p className="text-xs text-ink-500 mt-1">Liquid funds available for immediate use</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <span className="font-medium text-white">Yield Treasury</span>
              </div>
              <span className="font-display text-xl font-bold text-blue-400">
                {config.treasuryPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.treasuryPct}
              onChange={(e) => updatePercentages('treasuryPct', parseInt(e.target.value))}
              className="w-full h-2 bg-ink-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-xs text-ink-500 mt-1">Funds earning yield in vault strategies</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-flare-400" />
                <span className="font-medium text-white">Locked Savings</span>
              </div>
              <span className="font-display text-xl font-bold text-flare-400">
                {config.lockedPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.lockedPct}
              onChange={(e) => updatePercentages('lockedPct', parseInt(e.target.value))}
              className="w-full h-2 bg-ink-800 rounded-lg appearance-none cursor-pointer accent-flare-500"
            />
            <p className="text-xs text-ink-500 mt-1">Time-locked savings with periodic releases</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-ink-800">
          <div className="text-center text-sm font-medium text-ink-400 mb-4">
            Total: {config.operatingPct + config.treasuryPct + config.lockedPct}%
            {config.operatingPct + config.treasuryPct + config.lockedPct !== 100 && (
              <span className="text-amber-400 ml-2">(Adjusting...)</span>
            )}
          </div>
        </div>
      </div>

      {/* Allowance Settings */}
      <div className="rounded-2xl bg-ink-900/50 ring-1 ring-ink-800 p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-flare-400" />
          Allowance Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-400 mb-3">
              Release Period
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setConfig({ ...config, allowancePeriod: option.value })}
                  className={`rounded-xl p-4 text-center ring-1 transition-all ${
                    config.allowancePeriod === option.value
                      ? 'bg-flare-500/10 ring-flare-500/50'
                      : 'bg-ink-800/50 ring-ink-700 hover:ring-ink-600'
                  }`}
                >
                  <div className="font-semibold text-white text-sm">{option.label}</div>
                  <div className="text-xs text-ink-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-400 mb-2">
              Allowance Amount (per period)
            </label>
            <div className="relative">
              <input
                type="number"
                value={config.allowanceAmount}
                onChange={(e) => setConfig({ ...config, allowanceAmount: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl bg-ink-800 px-4 py-3 text-white text-xl font-semibold placeholder-ink-500 ring-1 ring-ink-700 focus:outline-none focus:ring-flare-500"
                placeholder="100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 text-lg">
                USDC
              </span>
            </div>
            <p className="text-sm text-ink-500 mt-2">
              Maximum amount that can be withdrawn from locked savings each period
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-ink-900/50 p-4 ring-1 ring-amber-500/20">
        <p className="text-sm text-amber-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          These are advanced settings. Changes will require a new router deployment to take effect.
        </p>
      </div>
    </div>
  )
}
