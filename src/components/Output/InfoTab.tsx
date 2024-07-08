import cs from "./InfoTab.module.css";

export const InfoTab = () => {
  return (
    <div className={cs.about}>
      <p>
        <strong>RunRuby.dev</strong> brings Ruby programming into your browser,
        streamlining the process of writing and running Ruby code. Here's what
        sets it apart:
      </p>
      <ul>
        <li>
          <strong>Simple Editing</strong>: Easily create, rename, and manage
          text files and directories directly in your browser.
        </li>
        <li>
          <strong>Gist integration</strong>: Save your work to a GitHub Gist and
          share it with others.
        </li>
        <li>
          <strong>Bundler Support</strong>: Add a <code>Gemfile</code> to your
          project and click "Bundle Install". The absence of native networking
          in WASI is not a problem.
        </li>
        <li>
          <strong>Networking</strong>: For networking, try using{" "}
          <code>Faraday</code> with the <code>Faraday::Adapter::JS</code>{" "}
          adapter to make web requests from Ruby.wasm.
        </li>
        <li>
          <strong>Quick start</strong>: Access gems or gists quickly with{" "}
          <code>
            runruby.dev/{"{"}gem_name{"}"}
          </code>{" "}
          and{" "}
          <code>
            runruby.dev/gist/{"{"}id{"}"}
          </code>{" "}
          URLs.
        </li>
        <li>
          <strong>Gems Caching</strong>: Take advantage of the browser's cache
          to prevent re-downloading gems, enhancing efficiency.
        </li>
        <li>
          <strong>Source code</strong>:{" "}
          <a className={cs.link} href="https://github.com/skryukov/runruby.dev">
            skryukov/runruby.dev
          </a>
        </li>
      </ul>
    </div>
  );
};
