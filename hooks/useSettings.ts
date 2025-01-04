'use client'

import { useEffect, useState } from 'react'
import { getDefaultSettings, Settings } from '@/lib/types'
import { loadSettings, saveSettings } from '@/app/actions/data'
import { atom, useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'

export function useSettings() {
  const [settings, setSettings] = useAtom(settingsAtom)

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
