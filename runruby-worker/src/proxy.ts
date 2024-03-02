import { IRequest } from "itty-router";

export default async (request: IRequest) => {
  const url = new URL(request.url);

  const proxyUrl = decodeURIComponent(decodeURIComponent(url.search.slice(1)));

  if (!proxyUrl) {
    return new Response("Bad request: Missing `proxyUrl` query param", { status: 400 });
  }

  const newRequest = new Request(request, { cf: { cacheEverything: true } });
  return await fetch(proxyUrl, newRequest);
}



