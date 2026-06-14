// Centralized environment access. Server-only secrets are read lazily so the
// app can build without them; callers that need a secret get a clear error.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  anthropicApiKey: () => required("ANTHROPIC_API_KEY"),
  tailorModel: () => process.env.TAILOR_MODEL ?? "claude-sonnet-4-6",

  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),

  adzunaAppId: () => required("ADZUNA_APP_ID"),
  adzunaAppKey: () => required("ADZUNA_APP_KEY"),

  imap: () => ({
    host: required("IMAP_HOST"),
    port: Number(process.env.IMAP_PORT ?? 993),
    user: required("IMAP_USER"),
    pass: required("IMAP_APP_PASSWORD"),
  }),

  // URL of the Vercel Python render function (api/render.py).
  renderUrl: () => process.env.RENDER_FUNCTION_URL ?? "/api/render",
};
