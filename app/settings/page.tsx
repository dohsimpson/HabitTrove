'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DynamicTimeNoSSR } from '@/components/DynamicTimeNoSSR';
import { useAtom } from 'jotai';
import { useTranslations } from 'next-intl';
import { settingsAtom, serverSettingsAtom } from '@/lib/atoms';
import { Settings, WeekDay } from '@/lib/types'
import { saveSettings } from '../actions/data'
import { sendNotificationToUser } from '../actions/push'
import { connectGoogleCalendar, disconnectGoogleCalendar, triggerSync } from '../actions/google-calendar'
import { Info } from 'lucide-react'; // Import Info icon
import { toast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'; // signOut removed
import { useRouter } from 'next/navigation';
import NotificationPermission from '@/components/NotificationPermission';
import { useState } from 'react';
// AlertDialog components removed
// Trash2 icon removed

export default function SettingsPage() {
  const t = useTranslations('SettingsPage');
  const tGcal = useTranslations('GoogleCalendar');
  // tWarning removed
  const [settings, setSettings] = useAtom(settingsAtom);
  const [serverSettings] = useAtom(serverSettingsAtom);
  const { data: session } = useSession();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  // showConfirmDialog and isDeleting states removed

  const updateSettings = async (newSettings: Settings) => {
    await saveSettings(newSettings)
    setSettings(newSettings)
  }

  const handleConnect = async () => {
    const url = await connectGoogleCalendar()
    if (url) window.location.href = url
  }

  const handleDisconnect = async () => {
    const newSettings = await disconnectGoogleCalendar(settings)
    setSettings(newSettings)
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      const result = await triggerSync(settings)
      toast({
        title: tGcal('synced'),
        description: `Synced ${result.synced} habit(s)${result.errors > 0 ? `, ${result.errors} error(s)` : ''}.`,
      })
    } catch {
      toast({
        title: tGcal('syncError'),
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  // handleDeleteAccount function removed

  if (!settings) return null

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('uiSettingsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="number-formatting">{t('numberFormattingLabel')}</Label>
                <div className="text-sm text-muted-foreground">
                  {t('numberFormattingDescription')}
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
                <Label htmlFor="number-grouping">{t('numberGroupingLabel')}</Label>
                <div className="text-sm text-muted-foreground">
                  {t('numberGroupingDescription')}
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
            <CardTitle>{t('systemSettingsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="timezone">{t('timezoneLabel')}</Label>
                <div className="text-sm text-muted-foreground">
                  {t('timezoneDescription')}
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
                  className="w-[110px] xs:w-[200px] rounded-md border border-input bg-background px-3 py-2 mb-4"
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
                <Label htmlFor="weekStartDay">{t('weekStartDayLabel')}</Label>
                <div className="text-sm text-muted-foreground">
                  {t('weekStartDayDescription')}
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
                  className="w-[110px] xs:w-[200px] rounded-md border border-input bg-background px-3 py-2"
                >
                  {([
                    ['sunday', 0],
                    ['monday', 1],
                    ['tuesday', 2],
                    ['wednesday', 3],
                    ['thursday', 4],
                    ['friday', 5],
                    ['saturday', 6]
                  ] as Array<["sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday", WeekDay]>).map(([dayName, dayNumber]) => (
                    <option key={dayNumber} value={dayNumber}>
                      {t(`weekdays.${dayName}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add this section for Auto Backup */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="auto-backup">{t('autoBackupLabel')}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start">
                        <p className="max-w-xs text-sm">
                          {t('autoBackupTooltip')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('autoBackupDescription')}
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="language-select">{t('languageLabel')}</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('languageDescription')}
                </div>
                {serverSettings.isDemo && (
                  <div className="text-sm text-red-500">
                    {t('languageDisabledInDemoTooltip')}
                  </div>
                )}
              </div>
              <select
                id="language-select"
                value={settings.system.language}
                disabled={serverSettings.isDemo}
                onChange={(e) => {
                  updateSettings({
                    ...settings,
                    system: { ...settings.system, language: e.target.value }
                  });
                  toast({
                    title: t('languageChangedTitle'),
                    description: t('languageChangedDescription'),
                    variant: 'default',
                  });
                }}
                className={`w-[110px] xs:w-[200px] rounded-md border border-input bg-background px-3 py-2 ${serverSettings.isDemo ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {/* Add more languages as needed */}
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="ca">Català</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="ru">Русский</option>
                <option value="zh">简体中文</option>
                <option value="ko">한국어</option>
                <option value="ja">日本語</option>
              </select>
            </div>

          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="global-notifications">Enable Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Master switch for all habit push notifications.
                </div>
              </div>
              <Switch
                id="global-notifications"
                checked={settings.notifications?.globalEnabled ?? false}
                onCheckedChange={() =>
                  updateSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      globalEnabled: !(settings.notifications?.globalEnabled ?? false),
                    },
                  })
                }
              />
            </div>

            {settings.notifications?.globalEnabled && (
              <>
                <div className="space-y-2">
                  <Label>Browser Permission</Label>
                  <NotificationPermission
                    userId={session?.user?.id ?? ''}
                    onSubscribed={() => {
                      toast({
                        title: 'Notifications enabled',
                        description: 'You will now receive habit reminders on this device.',
                      })
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Test Notification</Label>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const userId = session?.user?.id
                      if (!userId) return
                      await sendNotificationToUser(userId, {
                        title: 'HabitTrove',
                        body: 'Test notification — your notifications are working!',
                        tag: 'test-notification',
                      })
                      toast({
                        title: 'Test notification sent',
                        description: 'If you have notifications enabled, you should see it shortly.',
                      })
                    }}
                  >
                    Send Test Notification
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        {/* Google Calendar Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{tGcal('connectGoogleCalendar')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.googleCalendar?.connected ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">●</span>
                  <span>{tGcal('connected')}</span>
                  {settings.googleCalendar.lastSyncAt && (
                    <span className="text-sm text-muted-foreground ml-auto">
                      {tGcal('lastSynced')}: {new Date(settings.googleCalendar.lastSyncAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gcal-sync">{tGcal('synced')}</Label>
                  <Switch
                    id="gcal-sync"
                    checked={settings.googleCalendar?.syncEnabled ?? false}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        ...settings,
                        googleCalendar: {
                          ...settings.googleCalendar!,
                          syncEnabled: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSyncNow} disabled={syncing}>
                    {syncing ? tGcal('syncing') : tGcal('syncNow')}
                  </Button>
                  <Button variant="destructive" onClick={handleDisconnect}>
                    {tGcal('disconnect')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">●</span>
                  <span className="text-muted-foreground">{tGcal('disconnected')}</span>
                </div>
                <Button onClick={handleConnect}>{tGcal('connectGoogleCalendar')}</Button>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Danger Zone Card Removed */}
      </div >
    </>
  )
}
