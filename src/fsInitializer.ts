import importFromGist from "./gist.ts";

export const getQueryParam = (key: string) => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  return params.get(key);
};

const defaultGem = "octokit";

const description = `# This is a Ruby WASI playground
# You can run any Ruby code here and see the result
# You can also install gems using a Gemfile and the "Bundle install" button.`;

const mainRbHeader = (gem: string | null) => {
  const strings: string[] = [];
  if (getQueryParam("embed") !== "1") {
    strings.push(description);
  }
  if (gem) {
    strings.push(`require "${gem.split("@")[0]}"\n`);
  }

  return strings.join("\n");
};

const mainRb = `${mainRbHeader(defaultGem)}
# RunRuby.dev comes with a WASI-compatible Faraday adapter
# that uses the Fetch API to make HTTP requests
require "faraday/adapter/js"
Octokit.middleware.adapter :js

# Now we can use Octokit as we would in a normal Ruby environment
client = Octokit::Client.new
user = client.user("matz")

# And it just works 🚀
pp({login: user.login, name: user.name, company: user.company})
`;

const gemfileContents = (gem: string) => (
  `source "https://rubygems.org"

gem "${gem.split("@")[0]}", "${gem.split("@")[1] || ">= 0"}"
`
);

const buildStarter = ({ gem, main }: { gem: string | null, main: string }) => {
  const result = [
    { filename: "main.rb", content: main }
  ];

  if (gem) {
    result.push({ filename: "Gemfile", content: gemfileContents(gem) });
  }

  return result;
};

export const composeInitialFS = async () => {
  const gist = getQueryParam("gist");
  if (gist) {
    try {
      return await importFromGist(gist);
    } catch (e) {
      console.error(e);
      const url = new URL(window.location.href);
      url.searchParams.delete("gist");
      window.history.pushState(null, "", url.toString());
    }
  }

  return buildMainRB();
};

export const urlSafeAtob = (str: string) => {
  return decodeURIComponent(atob(str.replace(/-/g, "+").replace(/_/g, "/")));
};

const buildMainRB = () => {
  const initialGem = getQueryParam("gem");
  const initialCode = getQueryParam("code");

  if (!initialGem && !initialCode) {
    return { files: buildStarter({ gem: defaultGem, main: mainRb }) };
  }

  const code = initialCode ? urlSafeAtob(initialCode) : "";
  const main = mainRbHeader(initialGem) + "\n" + code;

  return { files: buildStarter({ gem: initialGem, main }) };
};
