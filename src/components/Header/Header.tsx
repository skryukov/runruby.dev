import { VscClose, VscMenu } from "react-icons/vsc";
import { useStore } from "@nanostores/react";

import { $menu, toggleMenu } from "../../stores/menu.ts";
import cs from "./Header.module.css";
import { TbMoon, TbSun, TbSunMoon } from "react-icons/tb";
import { $theme, toggleTheme } from "../../stores/theme.ts";

const themeIcons = {
  ["light"]: <TbSun size={24} />,
  ["dark"]: <TbMoon size={24} />,
  ["system"]: <TbSunMoon size={24} />
};

export const Header = () => {
  const { isOpen } = useStore($menu);
  const theme = useStore($theme);

  return (
    <header className={cs.header}>
      <button className={cs.headerMenuButton} onClick={toggleMenu}>
        {isOpen ? <VscClose size={16} /> : <VscMenu size={16} />}
      </button>

      <h1 className={cs.title}>RunRuby.dev</h1>

      <div className={cs.links}>
        <span className={cs.link} onClick={toggleTheme}>
          {themeIcons[theme]}
        </span>
      </div>
    </header>
  );
};
