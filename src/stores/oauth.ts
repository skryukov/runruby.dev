import { map, onMount, onSet } from "nanostores";
import { nanoid } from "nanoid";

type OAuthStoreValue = {
  state?: string;
  code?: string;
  error?: string;
}
export const $oauth = map<OAuthStoreValue>({
  state: nanoid()
});

onSet($oauth, ({ changed, newValue }) => {
  if (changed === "code" && newValue.code) {
    fetch(
      `https://worker.runruby.dev/api/auth/github?code=${newValue.code}`,
      {
        credentials: "include"
      }).then(fetchUser)
      .catch((error) => {
        $oauth.setKey("error", error.message);
      });
  }
});

type CurrentUserStoreValue = {
  id: undefined;
} |
  {
    id: string;
    username: string;
    avatarUrl: string;
  }

export const $currentUser = map<CurrentUserStoreValue>({
  id: undefined
});

const fetchUser = () => {
  fetch("https://worker.runruby.dev/api/user", {
    credentials: "include"
  }).then((res) => res.json()).then((data) => {
      $currentUser.set({ username: data.login, avatarUrl: data.avatar_url, id: data.id });
    }
  );
};

onMount($currentUser, () => {
  fetchUser();
});

export const signOut = () => {
  fetch("https://worker.runruby.dev/api/auth/sign_out", {
    credentials: "include"
  }).then(() => {
    $currentUser.set({ id: undefined });
  });
};
