export type IGistParams = {
  description: string;
  files: { [name: string]: { content: string } }
}

export class GitHubApi {
  private static oauthEndpoint = "https://github.com/login/oauth/access_token";
  private static apiEndpoint = "https://api.github.com";
  private static defaultHeaders = {
    "User-Agent": "Cloudflare Worker",
    "Content-Type": "application/json",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  static oauth(params: { code: string, client_id: string, client_secret: string }) {
    return fetch(this.oauthEndpoint, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify(params)
    });
  }

  private token: string;

  constructor(params: { token: string }) {
    this.token = params.token;
  }

  async user() {
    const response = await fetch(`${GitHubApi.apiEndpoint}/user`, {
      headers: this.headers()
    });
    return await response.json();
  }

  async createGist(params: IGistParams) {
    return await this.fetch("gists", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }

  async updateGist(id: string, params: IGistParams) {
    return await this.fetch(`gists/${id}`, {
      method: "PATCH",
      body: JSON.stringify(params)
    });
  }

  async forkGist(id: string) {
    return await this.fetch(`gists/${id}/forks`, {
      method: "POST"
    });
  }

  private async fetch(path: string, options: RequestInit = {}) {
    const response = await fetch(`${GitHubApi.apiEndpoint}/${path}`, {
        ...options,
        headers: {
          ...this.headers(),
          ...options.headers
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Request to ${path} failed with status ${response.status}`);
    }

    return await response.json();
  }

  private headers() {
    return {
      ...GitHubApi.defaultHeaders,
      "Authorization": `token ${this.token}`
    };
  }
}
