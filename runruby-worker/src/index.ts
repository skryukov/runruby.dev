import { cors, error, html, json, Router, withCookies } from "itty-router";
import apiRouter from "./apiRouter";
import createSession from "./withEncryptedSession";
import compactIndexSpecs from "./compactIndexSpecs";
import proxy from "./proxy";

const dynamicOrigins = [
  /^https:\/\/httpslocalrunrubydev5173-[a-z0-9-]+\.w-corp-staticblitz\.com$/,
  /^https:\/\/httpslocalhost5173-[a-z0-9-]+\.w-corp-staticblitz\.com$/,
];

const { withEncryptedSession, setSessionCookie } = createSession();

const { preflight, corsify } = cors({
  allowMethods: ["GET", "PATCH", "POST"],
  origin: (origin: string) => {
    const staticOrigins = [
      "http://localhost:5173",
      "https://localhost:5173",
      "https://runruby.dev",
      "https://local.runruby.dev:5173",
      "https://local.runruby.dev:5173/",
    ];

    if (staticOrigins.includes(origin) || dynamicOrigins.some((regex) => regex.test(origin))) {
      console.log("IN THE IF CHECKING")
      return origin;
    }

    return;
  },
  credentials: true,
  allowHeaders: ["Access-Control-Allow-Credentials", "Access-Control-Allow-Origin"],
});

const router = Router({
  before: [withCookies, preflight, withEncryptedSession],
  catch: error,
  finally: [json, setSessionCookie, corsify],
});

router
  .all("/api/*", apiRouter.handle)
  .get("/proxy/*", proxy)
  .get("/compact_index_specs", compactIndexSpecs)
  .get("/", () => html(`Hello from <a href="https://runruby.dev">RunRuby.dev</a> backend lambda!`))
  .all("*", () => new Response("Not Found.", { status: 404 }));

export default {
  fetch: router.fetch,
};
