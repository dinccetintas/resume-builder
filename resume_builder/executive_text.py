"""Executive-theme Markdown and plain-text renderers.

Markdown: a readable source copy for review and version diffs.
Plain text: what to paste into "copy your CV here" boxes in application
portals; also the reference for what an ATS should extract from the files.
Both follow the same section order as the PDF/DOCX.
"""
from __future__ import annotations

from .markup import plain
from .schema import Job, Resume


def _sections(r: Resume) -> list[tuple[str, list[str]]]:
    """Ordered (heading, lines) pairs shared by the MD and TXT renderers.

    Lines keep **bold** markup; the TXT renderer strips it.
    """
    out: list[tuple[str, list[str]]] = []

    def job_lines(job: Job, compact: bool = False) -> list[str]:
        head = f"**{job.company or job.title}**"
        if job.location:
            head += f", {job.location}"
        lines = [f"{head} | {job.dates}"]
        if job.company:
            lines.append(job.title)
        if job.context:
            lines.append(f"_{job.context}_")
        lines += [b if compact else f"- {b}" for b in job.bullets]
        return lines + [""]

    if r.profile:
        out.append((r.heading("profile", "Executive Profile"), [r.profile]))
    if r.highlights:
        out.append((r.heading("highlights", "Signature Achievements"),
                    [f"- {h}" for h in r.highlights]))
    if r.experience:
        lines: list[str] = []
        for job in r.experience:
            lines += job_lines(job)
        out.append((r.heading("experience", "Professional Experience"), lines))
    if r.earlier_career:
        lines = []
        for job in r.earlier_career:
            lines += job_lines(job, compact=True)
        out.append((r.heading("earlier", "Earlier Career"), lines))
    if r.awards:
        out.append((r.heading("awards", "Awards & Recognition"),
                    [f"- {y}: {t}" for y, t in r.awards]))
    if r.competencies:
        out.append((r.heading("competencies", "Core Competencies"),
                    [" · ".join(r.competencies)]))
    if r.education:
        out.append((r.heading("education", "Education"),
                    [f"{s}, {d}" for s, d in r.education]))
    if r.details:
        out.append((r.heading("details", "Additional Information"),
                    [f"- **{k}:** {v}" for k, v in r.details]))
    if r.references:
        out.append((r.heading("references", "References"), [r.references]))
    return out


def build_executive_md(r: Resume, path: str) -> None:
    """Write the Markdown copy of an executive CV."""
    contact = " · ".join(f"[{t}]({u})" if u else t for t, u in r.contact_segments)
    lines = [f"# {r.name}", f"**{r.role}**"]
    if r.tagline:
        lines.append(f"_{r.tagline}_")
    lines += ["", contact]
    if r.metrics:
        lines += ["", " | ".join(f"**{v}** {lab}" for v, lab in r.metrics)]
    for head, body in _sections(r):
        lines += ["", f"## {head.upper()}", *body]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines).rstrip() + "\n")


def build_executive_txt(r: Resume, path: str) -> None:
    """Write the plain-text (paste-into-portal) copy of an executive CV."""
    contact = " | ".join(t for t, _ in r.contact_segments)
    lines = [r.name, r.role]
    if r.tagline:
        lines.append(r.tagline)
    lines += [contact]
    if r.metrics:
        lines += ["", " | ".join(f"{v} {lab}" for v, lab in r.metrics)]
    for head, body in _sections(r):
        lines += ["", head.upper()]
        lines += [plain(line).replace("_", "") if line.startswith("_") else plain(line)
                  for line in body]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines).rstrip() + "\n")
