import { IRequest } from "itty-router";
import { Buffer } from "node:buffer";

async function getKeyFromSecret(secret: string, crypto: Crypto) {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", data);

  // Convert the hash to a hex string
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function encrypt(text: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedPlaintext = new TextEncoder().encode(text);

  const secretKey = await crypto.subtle.importKey(
    "raw",
    Buffer.from(await getKeyFromSecret(secret, crypto), "hex"),
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    secretKey,
    encodedPlaintext
  );

  return {
    ciphertext: Buffer.from(ciphertext).toString("base64"),
    iv: Buffer.from(iv).toString("base64")
  };
}

async function decrypt(ciphertext: string, iv: string, secret: string) {
  const secretKey = await crypto.subtle.importKey(
    "raw",
    Buffer.from(await getKeyFromSecret(secret, crypto), "hex"),
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );

  const cleartext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: Buffer.from(iv, "base64")
    },
    secretKey,
    Buffer.from(ciphertext, "base64")
  );

  return new TextDecoder().decode(cleartext);
}

type ISession = { [key: string]: never };

function createSession() {
  let session: ISession = {};
  let sessionSecret: string;
  let updateSession = false;
  const withEncryptedSession = async (request: IRequest, env: Env) => {
    if (request.method === "OPTIONS") return;

    updateSession = true;
    sessionSecret = env.SESSION_SECRET;
    const sessionId = request.cookies.sessionId;
    if (sessionId) {
      const [ciphertext, iv] = sessionId.split(".");
      session = JSON.parse(await decrypt(ciphertext, iv, sessionSecret));
    }
    request.getSession = () => session;
    request.setSession = (newSession: ISession) => {
      session = newSession;
    };
  };

  const setSessionCookie = async (response: Response) => {
    if (!updateSession) return response;
    const ciphertext = await encrypt(JSON.stringify(session), sessionSecret);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Set-Cookie", `sessionId=${ciphertext.ciphertext}.${ciphertext.iv}; HttpOnly; Secure; SameSite=None; Path=/`);
    return newResponse;
  };

  return { withEncryptedSession, setSessionCookie };
}

export default createSession;
