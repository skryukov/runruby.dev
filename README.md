# RunRuby.dev

<img align="right" height="150" width="150" title="RunRuby.dev logo" src="./public/icon.svg">

[RunRuby.dev](https://runruby.dev) brings Ruby programming into your browser, streamlining the process of writing and running Ruby code. Here's what sets it apart:

- **Simple Editing**: Easily create, rename, and manage text files and directories directly in your browser.
- **Gist integration**: Save your work to a GitHub Gist and share it with others.
- **Bundler Support**: Add a `Gemfile` to your project and click "Bundle Install". The absence of native networking in WASI is not a problem.
- **Networking**: For networking, try using `Faraday` with the `Faraday::Adapter::JS` adapter to make web requests from Ruby.wasm.
- **Quick start**: Access gems or gists quickly with `runruby.dev/{gem_name}` and `runruby.dev/gist/{id}` URLs.
- **Gems Caching**: Take advantage of the browser's cache to prevent re-downloading gems, enhancing efficiency.

Built on top of [ruby.wasm](https://github.com/ruby/ruby.wasm) 💕.

<img src="https://cdn.evilmartians.com/badges/logo-no-label.svg" alt="" width="22" height="16" /> Made in <b><a href="https://evilmartians.com/devtools?utm_source=runruby&utm_campaign=devtools-button&utm_medium=github">Evil Martians</a></b>, product consulting for <b>developer tools</b>.

## Development

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://pr.new/skryukov/runruby.dev)

To run project locally:

1. Install Node.js by [`asdf`](https://github.com/asdf-vm/asdf) or manually:

   ```sh
   asdf install
   ```

1. Install dependencies:

   ```sh
   npm install
   ```

1. Run local server:

   ```sh
   npm run dev
   ```
