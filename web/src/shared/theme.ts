export const THEME_STORAGE_KEY = "nexhub-theme";

export type AppTheme = "light" | "dark";

export const THEME_BOOTSTRAP = `(function(){try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;

export function applyThemeClass(theme: AppTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function readStoredTheme(): AppTheme {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function storeTheme(theme: AppTheme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
