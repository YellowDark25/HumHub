export const THEME_STORAGE_KEY = "nexhub-theme";
export type AppTheme = "light" | "dark";

const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isDarkTheme(value: string | null | undefined): boolean {
  return value === "dark";
}

export function applyThemeClass(theme: AppTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function readStoredTheme(): AppTheme {
  try {
    return isDarkTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function storeTheme(theme: AppTheme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = [
    `${THEME_STORAGE_KEY}=${theme}`,
    "path=/",
    `max-age=${THEME_COOKIE_MAX_AGE_SECONDS}`,
    "samesite=lax",
  ].join("; ");
}
