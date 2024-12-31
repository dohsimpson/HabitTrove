import { Settings } from "../types";

function formatWithLocale(amount: number, useGrouping: boolean, maximumFractionDigits?: number): string {
  return amount.toLocaleString(undefined, {
    maximumFractionDigits,
    useGrouping,
  });
}

export function formatNumber({ amount, settings }: { amount: number, settings: Settings }): string {
  const useFormatting = settings?.ui.useNumberFormatting ?? true;
  const useGrouping = settings?.ui.useGrouping ?? true;

  if (!useFormatting) {
    return useGrouping ? formatWithLocale(amount, true) : amount.toString();
  }

  const absNum = Math.abs(amount);

  if (absNum >= 1e12) {
    return amount.toExponential(2);
  }

  if (absNum >= 1e9) {
    return formatWithLocale(amount / 1e9, useGrouping, 1) + 'B';
  }

  if (absNum >= 1e6) {
    return formatWithLocale(amount / 1e6, useGrouping, 1) + 'M';
  }

  if (absNum >= 1e3) {
    return formatWithLocale(amount / 1e3, useGrouping, 1) + 'K';
  }

  return formatWithLocale(amount, useGrouping);
}
