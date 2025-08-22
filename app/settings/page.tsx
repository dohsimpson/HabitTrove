'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { Info } from 'lucide-react'; // Import Info icon
import { toast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'; // signOut removed
import { useRouter } from 'next/navigation';
// AlertDialog components and useState removed
// Trash2 icon removed

export default function SettingsPage() {
  const t = useTranslations('SettingsPage');
  // tWarning removed
  const [settings, setSettings] = useAtom(settingsAtom);
  const [serverSettings] = useAtom(serverSettingsAtom);
  const { data: session } = useSession();
  const router = useRouter();
  // showConfirmDialog and isDeleting states removed

  const updateSettings = async (newSettings: Settings) => {
    await saveSettings(newSettings)
    setSettings(newSettings)
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

        {/* Danger Zone Card Removed */}
      </div >
    </>
  )
}
