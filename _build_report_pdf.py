"""Build PROJECT_REPORT.docx then export to PDF via Microsoft Word."""
from __future__ import annotations

import re
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor, Twips, Emu
from docx.enum.section import WD_SECTION

ROOT = Path(__file__).resolve().parent
MD_PATH = ROOT / "PROJECT_REPORT.md"
DOCX_PATH = ROOT / "PROJECT_REPORT.docx"
SCREENSHOTS = ROOT / "report-screenshots"

FONT = "Times New Roman"
BLUE = RGBColor(0x00, 0x70, 0xC0)
BLACK = RGBColor(0x00, 0x00, 0x00)

FIGURE_IMAGES = {
    "Fig. 11.3": SCREENSHOTS / "fig-11-3-dashboard.png",
    "Fig. 11.6": SCREENSHOTS / "fig-11-6-chat-workspace.png",
    "Fig. 11.7": SCREENSHOTS / "fig-11-7-embed-api-settings.png",
    "Fig. 11.8": SCREENSHOTS / "fig-11-8-embed-snippets.png",
}


def set_run_font(run, size=12, bold=False, italic=False, color=BLACK, name=FONT):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color


def set_paragraph_format(p, size=12, align="justify", space_after=8, space_before=0, line=1.5, first_line=None):
    pf = p.paragraph_format
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(space_before)
    pf.line_spacing = line
    pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    if align == "justify":
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    elif align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "left":
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    elif align == "right":
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if first_line is not None:
        pf.first_line_indent = Cm(first_line)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld_char_begin = OxmlElement("w:fldChar")
    fld_char_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_char_end = OxmlElement("w:fldChar")
    fld_char_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char_begin)
    run._r.append(instr)
    run._r.append(fld_char_end)
    set_run_font(run, size=9, bold=True, italic=True, color=BLUE)


def set_footer(section, enabled=True):
    footer = section.footer
    footer.is_linked_to_previous = False
    # clear existing
    for p in list(footer.paragraphs):
        p.clear()
    p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    if not enabled:
        return
    tab_stops = p.paragraph_format.tab_stops
    tab_stops.add_tab_stop(Inches(6.27), WD_TAB_ALIGNMENT.RIGHT)
    run = p.add_run("PES's Modern College of Engineering, MCA Department")
    set_run_font(run, size=9, bold=True, italic=True, color=BLUE)
    p.add_run("\t")
    add_page_number(p)


def set_page_start(section, start=1):
    sectPr = section._sectPr
    for child in list(sectPr):
        if child.tag == qn("w:pgNumType"):
            sectPr.remove(child)
    pg = OxmlElement("w:pgNumType")
    pg.set(qn("w:start"), str(start))
    sectPr.append(pg)


def shade_cell(cell, hex_color="1F4E79"):
    tc = cell._tePr if hasattr(cell, "_tePr") else cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell_border(cell):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), "666666")
        tcBorders.append(el)
    tcPr.append(tcBorders)


def add_runs(paragraph, text, size=12, italic=False):
    """Render inline **bold**, *italic*, and `code`."""
    pattern = re.compile(r"(\*\*[^*]+?\*\*|`[^`]+?`|\*[^*]+?\*)")
    pos = 0
    for m in pattern.finditer(text):
        if m.start() > pos:
            run = paragraph.add_run(text[pos : m.start()])
            set_run_font(run, size=size, italic=italic)
        token = m.group(0)
        if token.startswith("**"):
            run = paragraph.add_run(token[2:-2])
            set_run_font(run, size=size, bold=True, italic=italic)
        elif token.startswith("`"):
            run = paragraph.add_run(token[1:-1])
            set_run_font(run, size=size - 1, name="Courier New", italic=italic)
        else:
            run = paragraph.add_run(token[1:-1])
            set_run_font(run, size=size, italic=True)
        pos = m.end()
    if pos < len(text):
        run = paragraph.add_run(text[pos:])
        set_run_font(run, size=size, italic=italic)


def add_body(doc, text, size=12, align="justify", space_after=8, space_before=0, first_line=1.25):
    p = doc.add_paragraph()
    set_paragraph_format(
        p, size=size, align=align, space_after=space_after, space_before=space_before, first_line=first_line
    )
    add_runs(p, text, size=size)
    return p


def add_heading_custom(doc, text, level=1, page_break=False):
    p = doc.add_paragraph()
    if page_break:
        br = p.add_run()
        br.add_break(WD_BREAK.PAGE)
    if level == 1:
        set_paragraph_format(p, size=16, align="center", space_after=14, space_before=18, line=1.15, first_line=0)
        run = p.add_run(text)
        set_run_font(run, size=16, bold=True)
    elif level == 2:
        set_paragraph_format(p, size=14, align="left", space_after=10, space_before=14, line=1.15, first_line=0)
        run = p.add_run(text)
        set_run_font(run, size=14, bold=True)
    else:
        set_paragraph_format(p, size=12, align="left", space_after=8, space_before=10, line=1.15, first_line=0)
        run = p.add_run(text)
        set_run_font(run, size=12, bold=True, italic=True)
    return p


def add_center_line(doc, text, size=16, bold=False, space_after=6, space_before=0, italic=False):
    p = doc.add_paragraph()
    set_paragraph_format(p, size=size, align="center", space_after=space_after, space_before=space_before, line=1.15, first_line=0)
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold, italic=italic)
    return p


def add_blank(doc, count=1):
    for _ in range(count):
        p = doc.add_paragraph()
        set_paragraph_format(p, size=12, align="center", space_after=0, space_before=0, line=1.0, first_line=0)
        run = p.add_run(" ")
        set_run_font(run, size=12)


def add_table(doc, rows):
    if not rows:
        return
    cols = max(len(r) for r in rows)
    table = doc.add_table(rows=len(rows), cols=cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    for i, row in enumerate(rows):
        for j in range(cols):
            cell = table.rows[i].cells[j]
            cell.text = ""
            p = cell.paragraphs[0]
            set_paragraph_format(p, size=10, align="left", space_after=2, space_before=2, line=1.15, first_line=0)
            val = row[j] if j < len(row) else ""
            add_runs(p, val, size=10 if i else 10)
            if i == 0:
                for run in p.runs:
                    run.bold = True
                    run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                shade_cell(cell, "1F4E79")
            elif i % 2 == 1:
                shade_cell(cell, "F2F2F2")
            set_cell_border(cell)
    p = doc.add_paragraph()
    set_paragraph_format(p, size=6, space_after=8, space_before=4, line=1.0, first_line=0)


def add_code_block(doc, lines):
    table = doc.add_table(rows=1, cols=1)
    cell = table.rows[0].cells[0]
    shade_cell(cell, "F7F7F7")
    set_cell_border(cell)
    cell.text = ""
    p = cell.paragraphs[0]
    set_paragraph_format(p, size=8, align="left", space_after=0, space_before=0, line=1.08, first_line=0)
    text = "\n".join(lines)
    run = p.add_run(text)
    set_run_font(run, size=8, name="Courier New")
    p = doc.add_paragraph()
    set_paragraph_format(p, size=6, space_after=8, space_before=2, line=1.0, first_line=0)


def add_picture(doc, path: Path, caption: str):
    if not path.exists():
        add_body(doc, f"[Screenshot missing: {path.name}]", align="center", first_line=0)
        return
    p = doc.add_paragraph()
    set_paragraph_format(p, size=12, align="center", space_after=4, space_before=10, line=1.0, first_line=0)
    run = p.add_run()
    run.add_picture(str(path), width=Inches(6.1))
    cap = doc.add_paragraph()
    set_paragraph_format(cap, size=11, align="center", space_after=12, space_before=2, line=1.15, first_line=0)
    run = cap.add_run(caption)
    set_run_font(run, size=11, bold=True, italic=True)


def parse_table_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip() for c in line.split("|")]


def is_table_sep(line: str) -> bool:
    s = line.replace(" ", "").replace("|", "").replace(":", "")
    return bool(s) and set(s) <= {"-"}


def strip_md_source(text: str) -> str:
    lines = text.splitlines()
    out = []
    skip_howto = False
    i = 0
    # Drop the opening title block and the "How to use" note; we build a cover instead.
    while i < len(lines):
        if lines[i].startswith("> **How to use this file:**"):
            skip_howto = True
            i += 1
            continue
        if skip_howto:
            if lines[i].startswith("---"):
                skip_howto = False
            i += 1
            continue
        if lines[i].startswith("## Annexure B"):
            break
        out.append(lines[i])
        i += 1
    # Start from CERTIFICATE (first real chapter heading after the MD title block)
    joined = "\n".join(out)
    idx = joined.find("# CERTIFICATE")
    if idx >= 0:
        joined = joined[idx:]
    return joined


def configure_section(section):
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)


def add_cover(doc):
    add_blank(doc, 2)
    add_center_line(doc, "RESEARCH PROJECT", size=18, bold=True, space_after=6)
    add_center_line(doc, "ON", size=14, bold=True, space_after=12, space_before=6)
    add_center_line(
        doc,
        "RELAY: A MULTI-TENANT RETRIEVAL-AUGMENTED GENERATION",
        size=16,
        bold=True,
        space_after=0,
    )
    add_center_line(
        doc,
        "PLATFORM FOR DOCUMENT-GROUNDED CHATBOTS",
        size=16,
        bold=True,
        space_after=24,
    )
    add_blank(doc, 1)
    add_center_line(doc, "BY", size=14, bold=True, space_after=10)
    for name in ["Aditi Charmole", "Chitrang Choudhari", "Pratik Kamble", "Sahil Dhanavade"]:
        add_center_line(doc, name, size=16, bold=True, space_after=2)
    add_blank(doc, 2)
    add_center_line(doc, "Under the Guidance of", size=14, bold=False, space_after=8)
    add_center_line(doc, "Prof. Swati Ghule", size=16, bold=True, space_after=24)
    add_blank(doc, 2)
    add_center_line(doc, "MASTER OF COMPUTER APPLICATION", size=14, bold=True, space_after=4)
    add_center_line(doc, "P.E.S'S MODERN COLLEGE OF ENGINEERING", size=14, bold=True, space_after=2)
    add_center_line(doc, "PUNE – 411 005", size=14, bold=True, space_after=2)
    add_center_line(
        doc,
        "(An Autonomous Institute Affiliated to Savitribai Phule Pune University)",
        size=12,
        italic=True,
        space_after=8,
    )
    add_center_line(doc, "2026-27", size=14, bold=True, space_after=0)
    doc.add_page_break()


def convert():
    raw = MD_PATH.read_text(encoding="utf-8")
    body = strip_md_source(raw)
    lines = body.splitlines()

    doc = Document()
    configure_section(doc.sections[0])
    set_footer(doc.sections[0], enabled=False)
    style = doc.styles["Normal"]
    style.font.name = FONT
    style.font.size = Pt(12)
    style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

    add_cover(doc)

    intro_started = False
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()

        if stripped == "---" or stripped == "&nbsp;":
            i += 1
            continue

        if stripped.startswith("File: `") and stripped.endswith("`"):
            i += 1
            continue
        if stripped.startswith("Paste the colour figures"):
            i += 1
            continue

        # Section break + footer when Chapter 1 begins
        if stripped.startswith("# 1. INTRODUCTION") and not intro_started:
            intro_started = True
            new_sec = doc.add_section(WD_SECTION.NEW_PAGE)
            configure_section(new_sec)
            set_page_start(new_sec, 1)
            set_footer(new_sec, enabled=True)

        if stripped.startswith("# "):
            title = stripped[2:].strip()
            # Own page for front-matter sections and later chapters (Ch. 1 already
            # starts a new section).
            needs_break = title not in ("CERTIFICATE",) and not title.startswith("1. INTRODUCTION")
            add_heading_custom(doc, title, 1, page_break=needs_break)
            i += 1
            continue
        if stripped.startswith("## "):
            add_heading_custom(doc, stripped[3:].strip(), 2)
            i += 1
            continue
        if stripped.startswith("### "):
            add_heading_custom(doc, stripped[4:].strip(), 3)
            i += 1
            continue

        if stripped.startswith("```"):
            code = []
            i += 1
            while i < n and not lines[i].strip().startswith("```"):
                code.append(lines[i])
                i += 1
            if i < n:
                i += 1
            add_code_block(doc, code)
            continue

        if stripped.startswith("|") and i + 1 < n and is_table_sep(lines[i + 1]):
            rows = [parse_table_row(stripped)]
            i += 2
            while i < n and lines[i].strip().startswith("|"):
                rows.append(parse_table_row(lines[i]))
                i += 1
            add_table(doc, rows)
            continue

        if stripped.startswith("- "):
            p = doc.add_paragraph()
            set_paragraph_format(p, size=12, align="justify", space_after=4, space_before=0, line=1.5, first_line=0)
            p.paragraph_format.left_indent = Cm(1.0)
            run = p.add_run("•  ")
            set_run_font(run, size=12, bold=True)
            add_runs(p, stripped[2:].strip(), size=12)
            i += 1
            continue

        numbered = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if numbered:
            p = doc.add_paragraph()
            set_paragraph_format(p, size=12, align="justify", space_after=6, space_before=2, line=1.5, first_line=0)
            p.paragraph_format.left_indent = Cm(1.0)
            run = p.add_run(f"{numbered.group(1)}.  ")
            set_run_font(run, size=12, bold=True)
            add_runs(p, numbered.group(2), size=12)
            i += 1
            continue

        if stripped.startswith("*(Capture") or stripped.startswith("*(Insert") or stripped.startswith("*(Redraw"):
            i += 1
            continue

        if stripped.startswith("**Fig.") or stripped.startswith("**GUI"):
            caption = stripped.strip("*").strip()
            fig_key = None
            for key in FIGURE_IMAGES:
                if caption.startswith(key):
                    fig_key = key
                    break
            if fig_key:
                add_picture(doc, FIGURE_IMAGES[fig_key], caption)
            else:
                p = doc.add_paragraph()
                set_paragraph_format(p, size=12, align="left", space_after=6, space_before=10, line=1.15, first_line=0)
                add_runs(p, stripped, size=12)
            i += 1
            continue

        if not stripped:
            i += 1
            continue

        # Signature / short un-indented lines
        if stripped.startswith("Sign of student") or stripped.startswith("Name of student") or stripped.startswith("Roll no") or stripped.startswith("External Examiner") or stripped.startswith("Prof. Dr.") or stripped.startswith("Principal"):
            p = doc.add_paragraph()
            set_paragraph_format(p, size=12, align="left", space_after=6, space_before=4, line=1.5, first_line=0)
            add_runs(p, stripped, size=12)
            i += 1
            continue

        add_body(doc, stripped, first_line=1.25)
        i += 1

    doc.save(DOCX_PATH)
    print(f"Wrote {DOCX_PATH}")


if __name__ == "__main__":
    convert()
