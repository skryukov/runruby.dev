import { File, PreopenDirectory } from "@bjorn3/browser_wasi_shim";

const gem = "uri-idna";

const gemCode = `
URI::IDNA.register(alabel: "xn--gdkl8fhk5egc.jp", ulabel: "ハロー・ワールド.jp")
`;

export const gemFromURI = () => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  return params.get("gem");
}

const defaultGem = gemFromURI() || gem;

export const initialRubyCode = `# This is a Ruby WASI playground
# You can run any Ruby code here and see the result
# You can also install gems using Gemfile an the "Bundle install" button.

require "${defaultGem}"
${defaultGem === gem ? gemCode : ''}`;

const initialGemfile = `source "https://rubygems.org"

gem "${defaultGem}"
`;

export const encode = (() => {
  const encoder = new TextEncoder();
  return (str: string) => encoder.encode(str);
})();

export const decode = (() => {
  const decoder = new TextDecoder();
  return (buffer: Uint8Array) => decoder.decode(buffer);
})();

export const workDir = new PreopenDirectory("/", {
  "Gemfile": new File(encode(initialGemfile)),
  "main.rb": new File(encode(initialRubyCode)),
});
