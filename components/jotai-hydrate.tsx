'use client'

import { loadSettings } from "@/app/actions/data"
import { settingsAtom } from "@/lib/atoms"
import { useAtom } from "jotai"
import { useEffect } from "react"

export function JotaiHydrate({ children }: { children: React.ReactNode }) {
  const [, setSettings] = useAtom(settingsAtom)
  useEffect(() => {
    loadSettings().then(setSettings)
  }, [])

  return children
}
