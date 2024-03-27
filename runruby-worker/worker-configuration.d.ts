interface Env {
  // Used to encrypt/decrypt cookies
  SESSION_SECRET: string;
  // GitHub OAuth app client ID
  GITHUB_CLIENT_ID: string;
  // GitHub OAuth app client secret
  GITHUB_CLIENT_SECRET: string;
  // Allowed hosts for CORS
  ALLOWED_HOSTS: string;
}
