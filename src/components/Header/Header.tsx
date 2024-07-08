import {
  VscClose,
  VscGithub,
  VscLoading,
  VscMenu,
  VscRepoForked,
  VscSave,
} from "react-icons/vsc";
import { useStore } from "@nanostores/react";

import { $menu, toggleMenu } from "../../stores/menu.ts";
import { $currentUser, $oauth, signOut } from "../../stores/oauth.ts";
import {
  $gist,
  $gistLoading,
  forkGist,
  saveGist,
  updateGist,
} from "../../stores/gists.ts";
import { $editor } from "../../stores/editor.ts";
import useComponentVisible from "../../useComponentVisible.ts";

import cs from "./Header.module.css";
import { getQueryParam } from "../../fsInitializer.ts";

export const Header = () => {
  const { isOpen } = useStore($menu);
  const { state } = useStore($oauth);
  const openedGist = useStore($gist);
  const currentUser = useStore($currentUser);
  const gistLoading = useStore($gistLoading);
  const dirtyFiles = useStore($editor).dirtyFiles;
  const showFork =
    openedGist.id &&
    (!currentUser.id ||
      (currentUser.id && openedGist.username !== currentUser?.username));
  const canFork = openedGist.id && currentUser.id && !gistLoading;
  const showSave = openedGist.id === undefined;
  const canSave = currentUser.id && openedGist.id === undefined && !gistLoading;
  const showUpdate =
    openedGist.id &&
    currentUser.id &&
    openedGist.username === currentUser.username;
  const canUpdate = dirtyFiles.length > 0 && !gistLoading;

  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);

  return (
    <header className={cs.header}>
      <div className={cs.buttons}>
        <button className={cs.headerMenuButton} onClick={toggleMenu}>
          {isOpen ? <VscClose size={16} /> : <VscMenu size={16} />}
        </button>
        {getQueryParam("embed") !== "1" && (
          <>
            {showFork && (
              <button
                className={`${cs.forkButton} ${canFork ? "" : cs.disabledButton}`}
                title={
                  canFork
                    ? "Fork this Gist"
                    : "You need to be logged in to fork this Gist"
                }
                disabled={!canFork}
                onClick={() => forkGist(openedGist.id)}
              >
                <VscRepoForked /> Fork
              </button>
            )}
            {showSave && (
              <button
                className={`${cs.saveButton} ${canSave ? "" : cs.disabledButton}`}
                title={
                  canSave
                    ? "Create a Gist"
                    : "You need to be logged in to create a Gist"
                }
                disabled={!canSave}
                onClick={saveGist}
              >
                <VscSave /> Create Gist
              </button>
            )}
            {showUpdate && (
              <button
                className={`${cs.saveButton} ${canUpdate ? "" : cs.disabledButton}`}
                title={canUpdate ? "Update Gist" : "No changes to save"}
                disabled={!canUpdate}
                onClick={() => {
                  updateGist(openedGist.id);
                }}
              >
                <VscSave /> Save
              </button>
            )}
            <div className={cs.gistLoading}>
              {gistLoading && <VscLoading size={20} />}
            </div>
          </>
        )}
      </div>

      <div className={cs.logoContainer}>
        <img src="/icon.svg" alt="RunRuby.dev" className={cs.logo} />
        <h1 className={cs.title}>RunRuby.dev</h1>
      </div>

      <div className={cs.links}>
        {getQueryParam("embed") !== "1" && (
          <>
            {currentUser.id ? (
              <div
                className={cs.userContainer}
                onClick={() => setIsComponentVisible(true)}
                ref={ref}
              >
                <img
                  className={cs.avatar}
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                />
                <div
                  className={`${cs.userMenu} ${isComponentVisible ? cs.show : ""}`}
                >
                  <button className={cs.signOutButton} onClick={signOut}>
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={cs.SignInButton}
                onClick={() => {
                  const bc = new BroadcastChannel("oauth");
                  bc.onmessage = (event) => {
                    const searchParams = new URLSearchParams(event.data);
                    if (searchParams.get("state") === state) {
                      $oauth.setKey(
                        "code",
                        searchParams.get("code") || undefined,
                      );
                      $oauth.setKey(
                        "error",
                        searchParams.get("error") || undefined,
                      );
                      bc.close();
                    }
                    bc.close();
                  };
                  window.open(
                    `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&scope=gist&state=${state}`,
                    "popup",
                    "popup=true, width=600, height=400",
                  );
                }}
              >
                <VscGithub size={16} /> Sign in
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
