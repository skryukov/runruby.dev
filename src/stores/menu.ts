import { action, map } from "nanostores";

type OutputStoreValue = {
  isOpen: boolean;

}
export const $menu = map<OutputStoreValue>({
  isOpen: false
});

export const toggleMenu = action($menu, 'isOpen', (store) => {
  store.setKey("isOpen", !store.get().isOpen)
});
