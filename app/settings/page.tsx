'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DynamicTimeNoSSR } from '@/components/DynamicTimeNoSSR'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { Settings, WeekDay } from '@/lib/types'
import { saveSettings, uploadAvatar } from '../actions/data'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useAtom(settingsAtom)

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
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="avatar">Avatar</Label>
                <div className="text-sm text-muted-foreground">
                  Customize your profile picture
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={settings.profile?.avatarPath ? `/api/avatars/${settings.profile.avatarPath.split('/').pop()}` : '/avatars/default.png'} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <form action={async (formData: FormData) => {
                  const newSettings = await uploadAvatar(formData)
                  setSettings(newSettings)
                }}>
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) { // 5MB
                          alert('File size must be less than 5MB')
                          e.target.value = ''
                          return
                        }
                        const form = e.target.form
                        if (form) form.requestSubmit()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('avatar')?.click()}
                  >
                    Change
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div >
    </>
  )
}
