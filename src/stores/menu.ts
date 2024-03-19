import { map } from "nanostores";

type OutputStoreValue = {
  isOpen: boolean;

}
export const $menu = map<OutputStoreValue>({
  isOpen: false
});

export const toggleMenu = () => {
  $menu.setKey("isOpen", !$menu.get().isOpen);
};
