import { useStore } from "@nanostores/react";
import { useMediaQuery } from "react-responsive";

import { $theme } from "./stores/theme.ts";

export const useEditorTheme = () => {
  const theme = useStore($theme);
  const systemDarkTheme = useMediaQuery({
    query: "(prefers-color-scheme: dark)"
  });
  const darkTheme = theme === "dark" || (theme === "system" && systemDarkTheme);

  return darkTheme ? "vs-dark" : "light";
};
