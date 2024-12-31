'use client'

import { useEffect, useState } from 'react'
import { getDefaultSettings, Settings } from '@/lib/types'
import { loadSettings, saveSettings } from '@/app/actions/data'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(getDefaultSettings()) // TODO: do we need to initialize the settings here?

  useEffect(() => {
    loadSettings().then(setSettings)
  }, [])

  const updateSettings = async (newSettings: Settings) => {
    await saveSettings(newSettings)
    setSettings(newSettings)
  }

  return {
    settings,
    updateSettings,
  }
}
