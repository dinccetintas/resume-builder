"""Regression tests for the executive theme and the shared builder.

They check what matters for a real application: Turkish characters survive
PDF text extraction, each key figure is read together with its label, the
ATS DOCX has no tables/images/header content, the public build carries no
private contact data, and the classic theme still builds.
"""
from __future__ import annotations

import importlib.util
import os
import zipfile

import pytest
from pypdf import PdfReader

from resume_builder import Job, Resume, build_all
from resume_builder.markup import plain, segments

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load(rel: str, public: bool = False) -> Resume:
    """Import a candidate file and return its RESUME (optionally redacted)."""
    if public:
        os.environ["RESUME_PUBLIC"] = "1"
    try:
        spec = importlib.util.spec_from_file_location("cand", os.path.join(ROOT, rel))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod.RESUME
    finally:
        os.environ.pop("RESUME_PUBLIC", None)


def _pdf_text(path: str) -> str:
    return "\n".join(page.extract_text() for page in PdfReader(path).pages)


@pytest.fixture(scope="module")
def built(tmp_path_factory):
    out = tmp_path_factory.mktemp("exec")
    resume = _load("candidates/ilksen_cetintas.py", public=True)
    paths = build_all(resume, str(out))
    return resume, {os.path.splitext(p)[1]: p for p in paths if not p.endswith("_photo.pdf")}


def test_markup_segments_and_plain():
    assert segments("**Lead:** rest") == [("Lead:", True), (" rest", False)]
    assert segments("no markup") == [("no markup", False)]
    assert plain("**a** b **c**") == "a b c"


def test_executive_outputs_exist(built):
    _, files = built
    assert set(files) == {".pdf", ".docx", ".md", ".txt"}
    for path in files.values():
        assert os.path.getsize(path) > 1000


def test_pdf_is_at_most_three_pages(built):
    _, files = built
    assert len(PdfReader(files[".pdf"]).pages) <= 3


def test_pdf_keeps_turkish_characters(built):
    text = _pdf_text(built[1][".pdf"])
    for word in ("İlkşen Çetintaş", "ŞA-RA", "Türkiye", "TREDAŞ", "İbrahim Çeçen"):
        assert word in text, word


def test_pdf_metric_value_and_label_extract_together(built):
    resume, files = built
    lines = _pdf_text(files[".pdf"]).splitlines()
    for value, label in resume.metrics:
        first_words = " ".join(label.split()[:2])
        assert any(value in ln and first_words in ln for ln in lines), value


def test_pdf_section_order(built):
    text = _pdf_text(built[1][".pdf"])
    order = ["EXECUTIVE PROFILE", "SIGNATURE ACHIEVEMENTS", "AWARDS & RECOGNITION",
             "PROFESSIONAL EXPERIENCE", "LEADERSHIP APPROACH", "CORE COMPETENCIES",
             "EDUCATION"]
    positions = [text.index(h) for h in order]
    assert positions == sorted(positions)


def test_docx_is_ats_safe(built):
    with zipfile.ZipFile(built[1][".docx"]) as z:
        names = z.namelist()
        body = z.read("word/document.xml").decode("utf-8")
    assert "<w:tbl>" not in body and "<w:tbl " not in body, "no tables"
    assert "<w:drawing" not in body and "<w:txbxContent" not in body, "no images/text boxes"
    assert not any(n.startswith("word/media/") for n in names)
    assert "İlkşen Çetintaş" in body


def test_public_build_has_no_private_contact_data(built):
    resume, files = built
    blob = " ".join(t for t, _ in resume.contact_segments)
    assert "@" not in blob and "+90" not in blob
    assert not resume.photo
    with open(files[".txt"], encoding="utf-8") as f:
        assert "+90" not in f.read()


def test_photo_variant_built_when_photo_exists(tmp_path):
    from PIL import Image

    photo = tmp_path / "p.jpg"
    Image.new("RGB", (60, 60), (200, 180, 160)).save(photo)
    r = Resume(name="Jane Doe", role="Chief People Officer", contact_segments=[("City", None)],
               profile="Profile.", experience=[Job("CPO", "2020 – Present", ["**Did** x."],
                                                   company="Co", context="Ctx")],
               theme="executive", photo=str(photo), metrics=[("10", "things")])
    paths = build_all(r, str(tmp_path / "out"))
    assert any(p.endswith("_photo.pdf") for p in paths)


def test_classic_theme_still_builds(tmp_path):
    paths = build_all(_load("candidates/dinc_cetintas.py"), str(tmp_path))
    assert sorted(os.path.splitext(p)[1] for p in paths) == [".docx", ".md", ".pdf"]
