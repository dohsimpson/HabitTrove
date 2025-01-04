'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DynamicTimeNoSSR } from '@/components/DynamicTimeNoSSR'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { Settings } from '@/lib/types'
import { saveSettings } from '../actions/data'

export default function SettingsPage() {
  const [settings, setSettings] = useAtom(settingsAtom)

  const updateSettings = async (newSettings: Settings) => {
    await saveSettings(newSettings)
    setSettings(newSettings)
  }


  if (!settings) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>UI Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="number-formatting">Number Formatting</Label>
              <div className="text-sm text-muted-foreground">
                Format large numbers (e.g., 1K, 1M, 1B)
              </div>
            </div>
            <Switch
              id="number-formatting"
              checked={settings.ui.useNumberFormatting}
              onCheckedChange={(checked) =>
                updateSettings({
                  ...settings,
                  ui: { ...settings.ui, useNumberFormatting: checked }
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="number-grouping">Number Grouping</Label>
              <div className="text-sm text-muted-foreground">
                Use thousand separators (e.g., 1,000 vs 1000)
              </div>
            </div>
            <Switch
              id="number-grouping"
              checked={settings.ui.useGrouping}
              onCheckedChange={(checked) =>
                updateSettings({
                  ...settings,
                  ui: { ...settings.ui, useGrouping: checked }
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="timezone">Timezone</Label>
              <div className="text-sm text-muted-foreground">
                Select your timezone for accurate date tracking
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <select
                id="timezone"
                value={settings.system.timezone}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    system: { ...settings.system, timezone: e.target.value }
                  })
                }
                className="w-[200px] rounded-md border border-input bg-background px-3 py-2"
              >
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <DynamicTimeNoSSR />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
