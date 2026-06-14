// Client for the Python render function (api/render.py). Sends a CV JSON and
// gets back base64-encoded .docx and .pdf renders plus a suggested basename.

import { env } from "./env";

export interface RenderResult {
  docxBase64: string;
  pdfBase64: string;
  basename: string;
}

interface RenderResponse {
  docx_base64?: string;
  pdf_base64?: string;
  docxBase64?: string;
  pdfBase64?: string;
  basename?: string;
}

/**
 * Render a CV JSON to docx + pdf via the Python render function.
 *
 * Resolves a relative `renderUrl()` (default "/api/render") against the app's
 * own base URL when available, so it works both server-side and in deployment.
 */
export async function renderCv(cvJson: Record<string, unknown>): Promise<RenderResult> {
  const url = resolveRenderUrl(env.renderUrl());

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ cv_json: cvJson }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`renderCv: render function ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as RenderResponse;
  const docxBase64 = data.docx_base64 ?? data.docxBase64;
  const pdfBase64 = data.pdf_base64 ?? data.pdfBase64;

  if (!docxBase64 || !pdfBase64) {
    throw new Error("renderCv: render response missing docx_base64 / pdf_base64");
  }

  return {
    docxBase64,
    pdfBase64,
    basename: data.basename ?? "cv",
  };
}

function resolveRenderUrl(configured: string): string {
  if (/^https?:\/\//i.test(configured)) return configured;
  // Relative path — anchor to the deployment base URL if we can find one.
  const base =
    process.env.RENDER_FUNCTION_BASE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (base) {
    return new URL(configured, base).toString();
  }
  return configured;
}
