import { createCors, error, html, json, Router, withCookies } from "itty-router";

import apiRouter from "./apiRouter";
import createSession from "./withEncryptedSession";
import compactIndexSpecs from "./compactIndexSpecs";
import proxy from "./proxy";

const { withEncryptedSession, setSessionCookie } = createSession();
const { preflight, corsify } = createCors({
  methods: ["GET", "PATCH", "POST"],
  // TODO: use env
  origins: ["http://localhost:5173", "https://localhost:5173", "https://runruby.dev", "https://next.runruby.dev", "https://local.runruby.dev:5173"],
  headers: {
    "Access-Control-Allow-Credentials": "true",
  },
});

const router = Router();

router
  .all("*", withCookies)
  .all("*", preflight)
  .all("*", withEncryptedSession)
  .all("/api/*", apiRouter.handle)
  .get("/proxy/*", proxy)
  .get("/compact_index_specs", compactIndexSpecs)
  .get("/", () => html(`Hello from <a href="https://runruby.dev">RunRuby.dev</a> backend lambda!`))
  .all("*", () => new Response("Not Found.", { status: 404 }));

export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) =>
    router.handle(req, env, ctx).then(json).catch(error).then(setSessionCookie).then(corsify),
};
