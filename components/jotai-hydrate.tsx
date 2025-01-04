'use client'

import { settingsAtom } from "@/lib/atoms"
import { useHydrateAtoms } from "jotai/utils"
import { Settings } from "@/lib/types"

export function JotaiHydrate({ 
  children,
  initialSettings
}: { 
  children: React.ReactNode
  initialSettings: Settings 
}) {
  useHydrateAtoms([[settingsAtom, initialSettings]])
  return children
}
