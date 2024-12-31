'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSettings } from '@/hooks/useSettings'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()

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
    </div>
  )
}
