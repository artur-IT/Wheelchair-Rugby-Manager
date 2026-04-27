interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  readonly DATABASE_URL: string;
  readonly PUBLIC_SITE_URL: string;
  readonly SUPERTOKENS_CONNECTION_URI: string;
  readonly SUPERTOKENS_API_KEY?: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
