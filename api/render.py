"""Vercel Python serverless function: render a tailored CV to DOCX + PDF.

POST JSON: { "cv_json": { ...matches cv.CVData.from_dict... } }
Returns:   { "docx_base64": "...", "pdf_base64": "...", "basename": "..." }

The Next.js backend calls this for the render stage and uploads the bytes to
Supabase Storage. Reuses the proven, ATS-safe renderers in the `cv` package.
"""
from __future__ import annotations

import base64
import json
import os
import sys
import tempfile
from http.server import BaseHTTPRequestHandler

# Make the repo root importable so `cv` resolves when Vercel runs this file.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cv import CVData, render_docx, render_pdf  # noqa: E402


def _render(cv_json: dict) -> dict:
    cv = CVData.from_dict(cv_json or {})
    safe = "".join(c if c.isalnum() else "_" for c in cv.name).strip("_") or "cv"
    with tempfile.TemporaryDirectory() as d:
        docx_path = os.path.join(d, safe + ".docx")
        pdf_path = os.path.join(d, safe + ".pdf")
        render_docx(cv, docx_path)
        render_pdf(cv, pdf_path)
        with open(docx_path, "rb") as f:
            docx_b64 = base64.b64encode(f.read()).decode("ascii")
        with open(pdf_path, "rb") as f:
            pdf_b64 = base64.b64encode(f.read()).decode("ascii")
    return {"docx_base64": docx_b64, "pdf_base64": pdf_b64, "basename": safe}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):  # noqa: N802 (Vercel expects this name)
        try:
            length = int(self.headers.get("content-length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
            result = _render(body.get("cv_json"))
            payload = json.dumps(result).encode("utf-8")
            self.send_response(200)
            self.send_header("content-type", "application/json")
            self.end_headers()
            self.wfile.write(payload)
        except Exception as exc:  # surface errors as JSON, not a 500 HTML page
            payload = json.dumps({"error": str(exc)}).encode("utf-8")
            self.send_response(400)
            self.send_header("content-type", "application/json")
            self.end_headers()
            self.wfile.write(payload)
