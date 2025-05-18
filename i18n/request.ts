import { getRequestConfig } from 'next-intl/server';
import { loadSettings } from '@/app/actions/data'; // Adjust path as necessary

export default getRequestConfig(async () => {
  // Load settings to get the user's preferred language
  const settings = await loadSettings();
  const locale = settings.system.language || 'en'; // Fallback to 'en' if not set

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
