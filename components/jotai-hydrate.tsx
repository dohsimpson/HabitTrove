'use client'

import { settingsAtom, habitsAtom, coinsAtom, wishlistAtom, usersAtom, serverSettingsAtom } from "@/lib/atoms"
import { useHydrateAtoms } from "jotai/utils"
import { JotaiHydrateInitialValues } from "@/lib/types"

export function JotaiHydrate({
  children,
  initialValues
}: { children: React.ReactNode, initialValues: JotaiHydrateInitialValues }) {
  useHydrateAtoms([
    [settingsAtom, initialValues.settings],
    [habitsAtom, initialValues.habits],
    [coinsAtom, initialValues.coins],
    [wishlistAtom, initialValues.wishlist],
    [usersAtom, initialValues.users],
    [serverSettingsAtom, initialValues.serverSettings],
  ])
  return children
}
