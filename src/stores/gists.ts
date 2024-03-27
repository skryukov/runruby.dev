import { atom, map, onSet } from "nanostores";

import { walkFileTree } from "../engines/wasi/editorFS.ts";
import { cleanDirty } from "./editor.ts";

type GistStoreValue = {
  id: undefined;
} |
  {
    id: string;
    username: string;
    avatarUrl: string;
    description: string;
    files: { filename: string, content: string }[];
  }
export const $gist = map<GistStoreValue>({
  id: undefined
});

export const $gistLoading = atom<boolean>(false);

onSet($gist, ({ newValue }) => {
  if (newValue.id) {
    const url = new URL(window.location.href);
    url.searchParams.set("gist", newValue.id);
    window.history.pushState(null, "", url.toString());
  }
});

const files = () => {
  const res: { [p: string]: { content: string } } = {};

  walkFileTree(({ filename, contents }) => {
    if (contents) {
      res[filename.split("/").join("$$")] = { content: contents };
    }
  });

  return res;
};

export const saveGist = () => {
  $gistLoading.set(true);
  fetch(`${import.meta.env.VITE_WORKER_URL}/api/gists`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      description: "RunRuby.dev Gist",
      public: false,
      files: files()
    })
  }).then((res) => res.json()).then((data) => {
      $gist.set({
        ...$gist.get(),
        id: data.id,
        description: data.description,
        username: data.owner.login,
        avatarUrl: data.owner.avatar_url
      });
      $gistLoading.set(false);
      cleanDirty();
    }
  );
};

export const updateGist = (id: string) => {
  $gistLoading.set(true);
  fetch(`${import.meta.env.VITE_WORKER_URL}/api/gists/${id}`, {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({
      // description: "RunRuby.dev Gist",
      files: files()
    })
  }).then((res) => res.json()).then((data) => {
      $gist.set({
        ...$gist.get(),
        id: data.id,
        description: data.description,
        username: data.owner.login,
        avatarUrl: data.owner.avatar_url
      });
      $gistLoading.set(false);
      cleanDirty();
    }
  );
};

export const forkGist = (id: string) => {
  $gistLoading.set(true);
  fetch(`${import.meta.env.VITE_WORKER_URL}/api/gists/${id}/forks`, {
    method: "POST",
    credentials: "include"
  }).then((res) => res.json()).then((data) => {
      $gist.set({
        ...$gist.get(),
        id: data.id,
        description: data.description,
        username: data.owner.login,
        avatarUrl: data.owner.avatar_url
      });
    $gistLoading.set(false);
    }
  );
};
