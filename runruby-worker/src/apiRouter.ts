import { IRequest, Router, StatusError } from "itty-router";
import { GitHubApi, IGistParams } from "./GitHubApi";

const authGitHub = async (request: IRequest, env: Env) => {
  const code = request.query.code;

  if (typeof code !== "string") {
    throw new StatusError(422, "Code required.");
  }

  const response = await GitHubApi.oauth({
    client_id: env.GITHUB_CLIENT_ID,
    client_secret: env.GITHUB_CLIENT_SECRET,
    code
  });

  if (!response.ok) {
    throw new StatusError(response.status, await response.text());
  }

  const data = await response.json() as { access_token: string };

  if (data.access_token) {
    request.setSession({ ...request.getSession(), githubAccessToken: data.access_token });
  }
  return { message: "Success" };
};

const user = async (request: IRequest) => {
  if (!request.getSession().githubAccessToken) {
    throw new StatusError(401, "Unauthorized");
  }

  const github = new GitHubApi({ token: request.getSession().githubAccessToken });
  return await github.user();
};

const createOrUpdateGist = async (request: IRequest) => {
  if (!request.getSession().githubAccessToken) {
    throw new StatusError(401, "Unauthorized");
  }

  const github = new GitHubApi({ token: request.getSession().githubAccessToken });

  const gistParams = await request.json() as IGistParams;

  if (request.params.id) {
    return await github.updateGist(request.params.id, gistParams);
  }
  return await github.createGist(gistParams);
};

const forkGist = async (request: IRequest) => {
  if (!request.getSession().githubAccessToken) {
    throw new StatusError(401, "Unauthorized");
  }

  const github = new GitHubApi({ token: request.getSession().githubAccessToken });

  return await github.forkGist(request.params.id);

}

const signOut = (request: IRequest) => {
  request.setSession({});
  return { message: "Signed out" };
};

const router = Router({ base: "/api" });

router
  .get("/auth/github", authGitHub)
  .get("/auth/sign_out", signOut)
  .post("/gists", createOrUpdateGist)
  .patch("/gists/:id", createOrUpdateGist)
  .post("/gists/:id/forks", forkGist)
  .get("/user", user)
  .all("*", () => new Response("Not Found.", { status: 404 }));

export default router;
