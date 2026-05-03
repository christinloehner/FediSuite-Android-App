import { useAppSettingsStore } from '../store/appSettingsStore';
import de from './langfiles/de';
import en from './langfiles/en';
import it from './langfiles/it';

const catalogs = { de, en, it } as const;

type SupportedLanguage = keyof typeof catalogs;
type Dict = (typeof de)['dict'];
export type Namespace = keyof Dict;

function resolveLanguage(language: string): SupportedLanguage {
  const lower = language.toLowerCase();
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('it')) return 'it';
  return 'de';
}

function format(template: string, params?: Record<string, string | number>) {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    template,
  );
}

export function getI18n<NS extends Namespace>(language: string, namespace: NS) {
  const catalog = catalogs[resolveLanguage(language)];
  const dict = catalog.dict[namespace] as Record<string, string>;

  return {
    t(key: keyof Dict[NS] & string, params?: Record<string, string | number>) {
      return format(dict[key] ?? key, params);
    },
  };
}

export function useI18n<NS extends Namespace>(namespace: NS) {
  const language = useAppSettingsStore((state) => state.language);
  return getI18n(language, namespace);
}

// Legacy export — AdminScreen still calls this; now reads from appSettingsStore language
export function getAdminI18n(language: string) {
  return getI18n(language, 'admin');
}
