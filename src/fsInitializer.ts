import importFromGist from "./gist.ts";

const defaultGem = "octokit";

const mainRbHeader = (gem: string | null) => `# This is a Ruby WASI playground
# You can run any Ruby code here and see the result
# You can also install gems using a Gemfile and the "Bundle install" button.
${gem ? `\nrequire "${gem}"\n` : ""}`;

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

export const getQueryParam = (key: string) => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  return params.get(key);
};

const gemfileContents = (gem: string) => (
  `source "https://rubygems.org"

gem "${gem}"
`
);

const buildStarter = ({ gem, main }: { gem: string | null, main: string }) => {
  const result = [
    { filename: "main.rb", content: main },
  ];

  if (gem) {
    result.push({ filename: "Gemfile", content: gemfileContents(gem) })
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

const buildMainRB = () => {
  const initialGem = getQueryParam("gem");
  const initialCode = getQueryParam("code");

  if (!initialGem && !initialCode) {
    return { files: buildStarter({ gem: defaultGem, main: mainRb }) };
  }

  const code = initialCode ? decodeURIComponent(atob(initialCode)) : "";
  const main = mainRbHeader(initialGem) + "\n" + code;

  return { files: buildStarter({ gem: initialGem, main }) };
};
