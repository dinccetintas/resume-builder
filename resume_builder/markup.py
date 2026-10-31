"""Tiny inline-markup helpers shared by the executive renderers.

The only markup supported is `**bold**`, used for lead-in phrases in
bullets ("**Built HR from the ground up** for ..."). Keeping it this small
means the same string renders identically to PDF, DOCX, Markdown and text.
"""
from __future__ import annotations

import re

_BOLD = re.compile(r"\*\*(.+?)\*\*")


def segments(text: str) -> list[tuple[str, bool]]:
    """Split `text` into (chunk, is_bold) pairs in reading order.

    >>> segments("**Lead:** rest")
    [('Lead:', True), (' rest', False)]
    """
    out: list[tuple[str, bool]] = []
    pos = 0
    for m in _BOLD.finditer(text):
        if m.start() > pos:
            out.append((text[pos:m.start()], False))
        out.append((m.group(1), True))
        pos = m.end()
    if pos < len(text):
        out.append((text[pos:], False))
    return out


def plain(text: str) -> str:
    """`text` with all markup removed (for plain-text / ATS output)."""
    return _BOLD.sub(r"\1", text)
