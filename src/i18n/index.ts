import de from './langfiles/de';
import en from './langfiles/en';
import it from './langfiles/it';

const catalogs = [de, en, it] as const;

type Catalog = (typeof catalogs)[number];
type AdminDict = Catalog['dict']['admin'];

export function getAdminI18n(language: string) {
  const normalizedLanguage = language.toLowerCase();
  const activeCatalog =
    catalogs.find((catalog) => normalizedLanguage === catalog.code || normalizedLanguage.startsWith(`${catalog.code}-`)) ?? de;

  return {
    t<Key extends keyof AdminDict>(key: Key, params?: Record<string, string | number>) {
      return format(activeCatalog.dict.admin[key], params);
    },
  };
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
