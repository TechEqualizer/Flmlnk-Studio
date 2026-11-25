export const STORAGE_KEYS = {
  film: "flmlnk_studio_film",
  email: "flmlnk_studio_email",
  visitor: "flmlnk_studio_visitor",
  done: "flmlnk_studio_done",
  waitlist: "flmlnk_studio_waitlist",
  forecastInputs: "flmlnk_studio_forecast_inputs",
  lastForecast: "flmlnk_studio_last_forecast",
  manageLinks: "flmlnk_studio_manage_links",
} as const;

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
