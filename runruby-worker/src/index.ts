import { createCors, error, html, json, Router, withCookies } from "itty-router";

import apiRouter from "./apiRouter";
import createSession from "./withEncryptedSession";
import compactIndexSpecs from "./compactIndexSpecs";
import proxy from "./proxy";

export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) => {

    const { withEncryptedSession, setSessionCookie } = createSession();
    const { preflight, corsify } = createCors({
      methods: ["GET", "PATCH", "POST"],
      origins: (origin: string) => {
        const hostname = new URL(origin).hostname;
        const allowedHosts = env.ALLOWED_HOSTS.split(",").map(h => h.trim());
        for (const allowedHost of allowedHosts) {
          if (allowedHost.startsWith("*.")) {
            if (hostname.endsWith(allowedHost.slice(1))) {
              return true;
            }
          } else if (hostname === allowedHost) {
            return true;
          }
        }
        return false;
      },
      headers: {
        "Access-Control-Allow-Credentials": "true"
      }
    });

    const router = Router();

    router
      .all("*", withCookies)
      .all("*", preflight)
      .all("*", withEncryptedSession)
      .all("/api/*", apiRouter.handle)
      .get("/proxy/*", proxy)
      .get("/compact_index_specs", compactIndexSpecs)
      .get("/", () => html(
        `Hello from <a href="https://runruby.dev">RunRuby.dev</a> backend lambda!`
      ))
      .all("*", () => new Response("Not Found.", { status: 404 }));

    return router
      .handle(req, env, ctx)
      .then(json)
      .catch(error)
      .then(setSessionCookie)
      .then(corsify)
  }
};

