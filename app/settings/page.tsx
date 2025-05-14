'use client'

import { DynamicTimeNoSSR } from '@/components/DynamicTimeNoSSR';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { settingsAtom } from '@/lib/atoms';
import { Settings, WeekDay } from '@/lib/types';
import { useAtom } from 'jotai';
import { Info } from 'lucide-react'; // Import Info icon
import { saveSettings } from '../actions/data';

export default function SettingsPage() {
  const [settings, setSettings] = useAtom(settingsAtom);

  const updateSettings = async (newSettings: Settings) => {
    await saveSettings(newSettings)
    setSettings(newSettings)
  }


  if (!settings) return null

  return (
    <>
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
                  className="w-[200px] rounded-md border border-input bg-background px-3 py-2 mb-4"
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="timezone">Week Start Day</Label>
                <div className="text-sm text-muted-foreground">
                  Select your preferred first day of the week
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <select
                  id="weekStartDay"
                  value={settings.system.weekStartDay}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      system: { ...settings.system, weekStartDay: Number(e.target.value) as WeekDay }
                    })
                  }
                  className="w-[200px] rounded-md border border-input bg-background px-3 py-2"
                >
                  {([
                    ['sunday', 0],
                    ['monday', 1],
                    ['tuesday', 2],
                    ['wednesday', 3],
                    ['thursday', 4],
                    ['friday', 5],
                    ['saturday', 6]
                  ] as Array<[string, WeekDay]>).map(([dayName, dayNumber]) => (
                    <option key={dayNumber} value={dayNumber}>
                      {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add this section for Auto Backup */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="auto-backup">Auto Backup</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start">
                        <p className="max-w-xs text-sm">
                          When enabled, the application data (habits, coins, settings, etc.)
                          will be automatically backed up daily around 2 AM server time.
                          Backups are stored as ZIP files in the `backups/` directory
                          at the project root. Only the last 7 backups are kept; older
                          ones are automatically deleted.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-sm text-muted-foreground">
                  Automatically back up data daily
                </div>
              </div>
              <Switch
                id="auto-backup"
                checked={settings.system.autoBackupEnabled}
                onCheckedChange={(checked) =>
                  updateSettings({
                    ...settings,
                    system: { ...settings.system, autoBackupEnabled: checked }
                  })
                }
              />
            </div>
            {/* End of Auto Backup section */}

          </CardContent>
        </Card>
      </div >
    </>
  )
}
