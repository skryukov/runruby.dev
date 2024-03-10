import { action, atom, onMount } from "nanostores";

export type Theme = "light" | "dark" | "system";

const THEME_KEY = "theme";

export const $theme = atom<Theme>("system");

export const setTheme = action($theme, "set", (store, theme: Theme) => {
  document.documentElement.setAttribute(THEME_KEY, theme);
  store.set(theme);
  localStorage.setItem(THEME_KEY, theme);
});

onMount($theme, () => {
  const url = new URL(window.location.href);
  let theme = url.searchParams.get("theme") as Theme;
  if (window.history.pushState) {
    url.searchParams.delete("theme");
    window.history.pushState(null, "", url.toString());
  }
  theme ||= localStorage.getItem(THEME_KEY) as Theme;
  setTheme(theme ?? "system");
});
