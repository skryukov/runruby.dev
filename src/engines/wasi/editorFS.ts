import { File, PreopenDirectory } from "@bjorn3/browser_wasi_shim";

const gem = "octokit";

const gemCode = `
# RunRuby.dev comes with a WASI-compatible Faraday adapter
# that uses the Fetch API to make HTTP requests
require "faraday/adapter/js"
Octokit.middleware.adapter :js

# Now we can use Octokit as we would in a normal Ruby environment
client = Octokit::Client.new
user = client.user("matz")

# And it just works 🚀
{login: user.login, name: user.name, company: user.company}
`;

export const initialCodeFromURI = () => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const base64code = params.get("initialCode");
  return base64code ? decodeURIComponent(atob(base64code)) : undefined;
}

export const embedFromURI = () => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  return params.get("embed");
}


export const gemFromURI = () => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  return params.get("gem");
}

export const gistFromURI = () => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  return params.get("gist");
}

const defaultGem = gemFromURI() || gem;

const defaultCode = `# This is a Ruby WASI playground
# You can run any Ruby code here and see the result
# You can also install gems using a Gemfile and the "Bundle install" button.

require "${defaultGem}"
${defaultGem === gem ? gemCode : ''}`;

const initialGemfile = `source "https://rubygems.org"

gem "${defaultGem}"
`;

const initialCode = initialCodeFromURI() || defaultCode;

export const encode = (() => {
  const encoder = new TextEncoder();
  return (str: string) => encoder.encode(str);
})();

export const decode = (() => {
  const decoder = new TextDecoder();
  return (buffer: Uint8Array) => decoder.decode(buffer);
})();

export const workDir = new PreopenDirectory("/", gistFromURI() ? {} : {
  "Gemfile": new File(encode(initialGemfile)),
  "main.rb": new File(encode(initialCode ?? defaultCode)),
});

