"""Build an IEEE two-column research paper (DOCX + PDF) on Pinecone in Relay."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Emu, Inches, Pt, RGBColor, Twips

ROOT = Path(__file__).resolve().parent
FIG = ROOT / "ieee-paper-figures"
DOCX = ROOT / "IEEE_Research_Paper_Pinecone.docx"
PDF = ROOT / "IEEE_Research_Paper_Pinecone.pdf"
SHOT = ROOT / "report-screenshots"

FONT = "Times New Roman"
BLACK = RGBColor(0, 0, 0)
TIMES = r"C:\Windows\Fonts\times.ttf"
TIMESBD = r"C:\Windows\Fonts\timesbd.ttf"
TIMESI = r"C:\Windows\Fonts\timesi.ttf"


# ---------------------------------------------------------------------------
# Figures
# ---------------------------------------------------------------------------
def _font(path, size):
    return ImageFont.truetype(path, size)


def _center_text(draw, xy, text, font, fill="black"):
    x0, y0, x1, y1 = xy
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((x0 + x1 - tw) / 2, (y0 + y1 - th) / 2 - 2), text, font=font, fill=fill)


def _multiline_center(draw, xy, lines, font, fill="black", gap=4):
    x0, y0, x1, y1 = xy
    bbox = draw.textbbox((0, 0), "Ay", font=font)
    th = bbox[3] - bbox[1]
    total = len(lines) * th + (len(lines) - 1) * gap
    y = (y0 + y1 - total) / 2
    for line in lines:
        bb = draw.textbbox((0, 0), line, font=font)
        tw = bb[2] - bb[0]
        draw.text(((x0 + x1 - tw) / 2, y), line, font=font, fill=fill)
        y += th + gap


def _arrow(draw, start, end, width=3):
    draw.line([start, end], fill="black", width=width)
    x0, y0 = start
    x1, y1 = end
    # simple downward/side arrow head
    if abs(y1 - y0) >= abs(x1 - x0):
        draw.polygon([(x1, y1), (x1 - 7, y1 - 12), (x1 + 7, y1 - 12)], fill="black")
    else:
        if x1 > x0:
            draw.polygon([(x1, y1), (x1 - 12, y1 - 7), (x1 - 12, y1 + 7)], fill="black")
        else:
            draw.polygon([(x1, y1), (x1 + 12, y1 - 7), (x1 + 12, y1 + 7)], fill="black")


def _box(draw, xy, lines, font, fill="#F2F2F2"):
    draw.rounded_rectangle(xy, radius=10, fill=fill, outline="black", width=2)
    _multiline_center(draw, xy, lines, font)


def make_fig_architecture():
    W, H = 1600, 1020
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    title_f = _font(TIMESBD, 28)
    body = _font(TIMES, 24)
    small = _font(TIMES, 20)
    _box(d, (80, 40, 700, 170), ["Chatbot Owner", "Dashboard (session / JWT)"], body, "#E8E8E8")
    _box(d, (900, 40, 1520, 170), ["Website Visitor", "Embeddable widget (API key)"], body, "#E8E8E8")
    _arrow(d, (390, 170), (390, 250))
    _arrow(d, (1210, 170), (1210, 250))
    _box(
        d,
        (120, 250, 1480, 560),
        ["Next.js application (Relay) — single service", "Auth.js  |  RAG pipeline  |  Public CORS API", "chunker  ·  parser  ·  answerChatbotQuery"],
        body,
        "#D9D9D9",
    )
    _arrow(d, (390, 560), (390, 640))
    _arrow(d, (800, 560), (800, 640))
    _arrow(d, (1210, 560), (1210, 640))
    _box(d, (80, 640, 520, 860), ["MongoDB", "Users, chatbots", "API keys, origins"], body, "#F7F7F7")
    _box(
        d,
        (560, 640, 1040, 980),
        ["Pinecone (this paper)", "Serverless index", "Hosted inference (E5)", "Metadata filter chatbot_id"],
        body,
        "#FFFFFF",
    )
    _box(d, (1080, 640, 1520, 860), ["OpenRouter", "LLM completion", "Model fallbacks"], body, "#F7F7F7")
    img.save(FIG / "fig1_architecture.png", "PNG")


def make_fig_isolation():
    W, H = 1600, 660
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    body = _font(TIMES, 24)
    small = _font(TIMES, 20)
    tiny = _font(TIMESBD, 22)
    d.rounded_rectangle((80, 40, 1520, 520), radius=12, outline="black", width=3, fill="#FAFAFA")
    d.text((100, 55), "Shared Pinecone index (one namespace)", font=_font(TIMESBD, 26), fill="black")
    tenants = [
        (120, "A", "#D0D0D0"),
        (120, "A", "#D0D0D0"),
        (120, "B", "#FFFFFF"),
        (120, "A", "#D0D0D0"),
        (120, "C", "#FFFFFF"),
        (120, "B", "#FFFFFF"),
        (120, "A", "#D0D0D0"),
        (120, "C", "#FFFFFF"),
    ]
    xs = [140, 320, 500, 680, 860, 1040, 1220, 1380]
    for i, x in enumerate(xs):
        label = ["A", "A", "B", "A", "C", "B", "A", "C"][i]
        fill = "#C8C8C8" if label == "A" else "#FFFFFF"
        d.rounded_rectangle((x, 140, x + 140, 300), radius=8, fill=fill, outline="black", width=2)
        _center_text(d, (x, 140, x + 140, 300), label, tiny)
    d.text((140, 330), "Vectors tagged with metadata chatbot_id  ∈  {A, B, C}", font=small, fill="black")
    d.rounded_rectangle((200, 400, 1400, 490), radius=8, fill="#E6E6E6", outline="black", width=2)
    _center_text(
        d,
        (200, 400, 1400, 490),
        "Query filter:  chatbot_id  =  A     →     only shaded vectors are eligible",
        body,
    )
    d.text((80, 560), "Without the filter, nearest-neighbour search would mix tenants.", font=small, fill="black")
    d.text((80, 600), "With the filter, Chatbot A cannot retrieve chunks of B or C.", font=small, fill="black")
    img.save(FIG / "fig2_isolation.png", "PNG")


def make_fig_pipelines():
    W, H = 1600, 900
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    body = _font(TIMES, 22)
    head = _font(TIMESBD, 26)
    small = _font(TIMES, 20)
    d.text((200, 30), "Ingestion", font=head, fill="black")
    d.text((1000, 30), "Query", font=head, fill="black")
    ing = [
        "PDF / DOCX / TXT upload",
        "Text extraction",
        "Recursive chunking",
        "E_passage  (hosted E5)",
        "Upsert + chatbot_id metadata",
    ]
    qry = [
        "Natural-language question",
        "E_query  (hosted E5)",
        "Top-k + metadata filter",
        "LLM grounded on chunks",
        "Answer + source citations",
    ]
    y = 90
    for a, b in zip(ing, qry):
        _box(d, (80, y, 720, y + 110), [a], body)
        _box(d, (880, y, 1520, y + 110), [b], body)
        if y < 90 + 4 * 150:
            _arrow(d, (400, y + 110), (400, y + 148))
            _arrow(d, (1200, y + 110), (1200, y + 148))
        y += 150
    d.text((80, 850), "No LLM is called during ingestion. Query is read-only on the index.", font=small, fill="black")
    img.save(FIG / "fig3_pipelines.png", "PNG")


def make_figures():
    FIG.mkdir(exist_ok=True)
    make_fig_architecture()
    make_fig_isolation()
    make_fig_pipelines()


# ---------------------------------------------------------------------------
# Word / IEEE layout helpers
# ---------------------------------------------------------------------------
def set_run_font(run, size=10, bold=False, italic=False, name=FONT, color=BLACK, all_caps=False):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.all_caps = all_caps


def pf(p, size=10, align="justify", after=0, before=0, line=1.0, indent=None, keep_next=False):
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.line_spacing = line
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.keep_with_next = keep_next
    if align == "justify":
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    elif align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "left":
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    elif align == "right":
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if indent is not None:
        p.paragraph_format.first_line_indent = Cm(indent)
    else:
        p.paragraph_format.first_line_indent = Cm(0)


def set_columns(section, num=2, space_twips=284):
    sectPr = section._sectPr
    cols = sectPr.find(qn("w:cols"))
    if cols is None:
        cols = OxmlElement("w:cols")
        sectPr.append(cols)
    cols.set(qn("w:num"), str(num))
    cols.set(qn("w:space"), str(space_twips))
    cols.set(qn("w:equalWidth"), "1")


def configure_page(section):
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin = Cm(1.57)
    section.right_margin = Cm(1.57)
    section.top_margin = Cm(1.90)
    section.bottom_margin = Cm(2.54)
    section.header_distance = Cm(0.5)
    section.footer_distance = Cm(0.5)
    # no page numbers
    section.footer.is_linked_to_previous = False
    for p in section.footer.paragraphs:
        p.clear()
    section.header.is_linked_to_previous = False
    for p in section.header.paragraphs:
        p.clear()


def shade_cell(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def cell_border(cell):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), "000000")
        borders.append(el)
    tcPr.append(borders)


def add_inline(p, text, size=10):
    """Support [n] citations, *italic*, **bold**."""
    import re

    pattern = re.compile(r"(\[\d+(?:,\s*\d+)*\]|\*\*[^*]+?\*\*|\*[^*]+?\*)")
    pos = 0
    for m in pattern.finditer(text):
        if m.start() > pos:
            r = p.add_run(text[pos : m.start()])
            set_run_font(r, size=size)
        tok = m.group(0)
        if tok.startswith("[") and tok.endswith("]"):
            r = p.add_run(tok)
            set_run_font(r, size=size)
        elif tok.startswith("**"):
            r = p.add_run(tok[2:-2])
            set_run_font(r, size=size, bold=True)
        else:
            r = p.add_run(tok[1:-1])
            set_run_font(r, size=size, italic=True)
        pos = m.end()
    if pos < len(text):
        r = p.add_run(text[pos:])
        set_run_font(r, size=size)


def para(doc, text, size=10, indent=0.5, after=0, before=0, align="justify"):
    p = doc.add_paragraph()
    pf(p, size=size, align=align, after=after, before=before, indent=indent)
    add_inline(p, text, size=size)
    return p


def heading_I(doc, text):
    p = doc.add_paragraph()
    pf(p, size=10, align="center", after=6, before=10, indent=0, keep_next=True)
    r = p.add_run(text)
    set_run_font(r, size=10, bold=True, all_caps=True)
    return p


def heading_A(doc, text):
    p = doc.add_paragraph()
    pf(p, size=10, align="left", after=3, before=8, indent=0, keep_next=True)
    r = p.add_run(text)
    set_run_font(r, size=10, italic=True, bold=True)
    return p


def equation(doc, tex, number):
    p = doc.add_paragraph()
    pf(p, size=10, align="center", after=4, before=6, indent=0)
    # tab to right for equation number
    p.paragraph_format.tab_stops.add_tab_stop(Cm(8.6), WD_TAB_ALIGNMENT.RIGHT)
    r = p.add_run(tex)
    set_run_font(r, size=10, italic=True)
    p.add_run("\t")
    n = p.add_run(f"({number})")
    set_run_font(n, size=10)


def caption(doc, text):
    p = doc.add_paragraph()
    pf(p, size=8, align="center", after=8, before=2, indent=0)
    r = p.add_run(text)
    set_run_font(r, size=8)
    return p


def table_title(doc, text):
    p = doc.add_paragraph()
    pf(p, size=8, align="center", after=2, before=8, indent=0, keep_next=True)
    r = p.add_run(text)
    set_run_font(r, size=8, bold=True, all_caps=True)


def add_table(doc, rows, font_size=8):
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.autofit = True
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            cell = table.rows[i].cells[j]
            cell.text = ""
            p = cell.paragraphs[0]
            pf(p, size=font_size, align="left", after=1, before=1, indent=0)
            r = p.add_run(val)
            set_run_font(r, size=font_size, bold=(i == 0))
            if i == 0:
                r.font.color.rgb = RGBColor(255, 255, 255)
                shade_cell(cell, "1F1F1F")
            elif i % 2 == 1:
                shade_cell(cell, "F0F0F0")
            cell_border(cell)
    p = doc.add_paragraph()
    pf(p, size=4, after=6, before=0, indent=0)


def add_figure(doc, path: Path, cap: str, width_in=3.25):
    p = doc.add_paragraph()
    pf(p, size=8, align="center", after=2, before=6, indent=0)
    r = p.add_run()
    r.add_picture(str(path), width=Inches(width_in))
    caption(doc, cap)


def ref_item(doc, number, text):
    p = doc.add_paragraph()
    pf(p, size=8, align="left", after=3, before=0, indent=0)
    p.paragraph_format.left_indent = Cm(0.6)
    p.paragraph_format.first_line_indent = Cm(-0.6)
    r = p.add_run(f"[{number}]  ")
    set_run_font(r, size=8)
    r2 = p.add_run(text)
    set_run_font(r2, size=8)


# ---------------------------------------------------------------------------
# Paper
# ---------------------------------------------------------------------------
def build():
    make_figures()
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = FONT
    style.font.size = Pt(10)
    style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

    sec0 = doc.sections[0]
    configure_page(sec0)
    set_columns(sec0, 1)

    # Title
    p = doc.add_paragraph()
    pf(p, size=24, align="center", after=12, before=0, indent=0)
    r = p.add_run("Multi-Tenant Retrieval-Augmented Generation Using a Shared Pinecone Vector Index")
    set_run_font(r, size=24, bold=True)

    # Authors
    p = doc.add_paragraph()
    pf(p, size=11, align="center", after=2, before=6, indent=0)
    r = p.add_run("Aditi Charmole, Chitrang Choudhari, Pratik Kamble, Sahil Dhanavade, and Swati Ghule")
    set_run_font(r, size=11)

    p = doc.add_paragraph()
    pf(p, size=10, align="center", after=1, before=0, indent=0)
    r = p.add_run("Department of Master of Computer Application")
    set_run_font(r, size=10, italic=True)

    p = doc.add_paragraph()
    pf(p, size=10, align="center", after=1, before=0, indent=0)
    r = p.add_run("P.E.S.'s Modern College of Engineering, Pune 411005, India")
    set_run_font(r, size=10, italic=True)
    p = doc.add_paragraph()
    pf(p, size=10, align="center", after=10, before=0, indent=0)
    r = p.add_run("(An Autonomous Institute Affiliated to Savitribai Phule Pune University)")
    set_run_font(r, size=9, italic=True)

    p = doc.add_paragraph()
    pf(p, size=9, align="center", after=12, before=0, indent=0)
    r = p.add_run("Corresponding author: Sahil Dhanavade (sahildhanavade769@gmail.com)")
    set_run_font(r, size=9)

    # Two-column body
    body = doc.add_section(WD_SECTION.CONTINUOUS)
    configure_page(body)
    set_columns(body, 2, space_twips=284)

    # Abstract
    p = doc.add_paragraph()
    pf(p, size=9, align="justify", after=6, before=0, indent=0)
    h = p.add_run("Abstract—")
    set_run_font(h, size=9, bold=True, italic=True)
    t = p.add_run(
        "Retrieval-augmented generation (RAG) reduces hallucination in large language models by "
        "conditioning answers on passages retrieved from a vector index. Deploying RAG as a "
        "multi-tenant product requires durable vector storage, tenant isolation, and an embedding "
        "path that does not force a separate machine-learning service beside the application. This "
        "paper presents a Pinecone-centred architecture for that setting. All chatbots of all owners "
        "share one serverless Pinecone index. Isolation is obtained by tagging every vector with a "
        "chatbot identifier and applying an equality metadata filter on every query. Embeddings are "
        "produced by Pinecone hosted inference with the multilingual-e5-large model, using distinct "
        "passage and query input types, so index dimensions cannot drift from the embedder. The "
        "design is realised in Relay, a Next.js platform that ingests PDF, DOCX, and TXT files, "
        "answers questions with source citations, and exposes the same retrieval function to a "
        "dashboard and to an embeddable website widget. We describe the index schema, the ingestion "
        "and query algorithms, the isolation invariant, and a qualitative evaluation on a deployed "
        "instance. The result is a practical blueprint for using Pinecone as a shared vector store "
        "in multi-tenant RAG systems without per-tenant physical indexes or a Python embedding sidecar."
    )
    set_run_font(t, size=9, italic=True)

    p = doc.add_paragraph()
    pf(p, size=9, align="justify", after=8, before=0, indent=0)
    h = p.add_run("Keywords—")
    set_run_font(h, size=9, bold=True, italic=True)
    t = p.add_run("Pinecone, vector database, retrieval-augmented generation, multi-tenancy, semantic search")
    set_run_font(t, size=9, italic=True)

    # I
    heading_I(doc, "I.  Introduction")
    para(
        doc,
        "Large language models generate fluent text from parametric memory learned during pre-training "
        "[1]. That memory is a poor fit for organisational question answering. Private policy manuals "
        "and product guides are not in the training corpus, they change without a retraining cycle, and "
        "an unconstrained model may invent plausible facts—a behaviour surveyed as hallucination [2]. "
        "Retrieval-augmented generation (RAG) couples a sequence generator with a non-parametric store "
        "of passages [3]. A question is embedded, similar chunks are retrieved, and the generator is "
        "prompted to answer using only that evidence. Dense retrieval in a shared embedding space [4], "
        "[5] is the usual first stage.",
    )
    para(
        doc,
        "The engineering problem is where those embeddings live. Research prototypes often keep vectors "
        "in process memory with FAISS [6]. A hosted product that serves many organisations cannot do so: "
        "vectors must survive deploys, queries must be filtered by tenant, and the service should scale "
        "without attaching a GPU worker to every web request. Vector database management systems have "
        "emerged to provide approximate nearest-neighbour search with metadata predicates [7]. Pinecone "
        "is a fully managed, serverless member of that class. It stores dense vectors, supports "
        "server-side metadata filters, and offers hosted inference so that the same vendor both embeds "
        "text and indexes the resulting vectors [8].",
        indent=0.5,
    )
    heading_A(doc, "A.  Objectives and Contributions")
    para(
        doc,
        "The objectives are (i) to isolate tenants on one Pinecone index, (ii) to embed documents and "
        "queries with the same hosted model, and (iii) to expose retrieval through both an authenticated "
        "owner dashboard and a public embeddable widget. The contributions of this paper are as follows.",
    )
    para(
        doc,
        "1) A tenancy model in which Pinecone metadata field chatbot_id is the isolation key, and every "
        "query issued by the application includes an equality filter on that field.",
        indent=0.4,
    )
    para(
        doc,
        "2) An ingestion and query pipeline that uses Pinecone hosted inference (multilingual-e5-large) "
        "with inputType passage for documents and inputType query for questions, eliminating a sidecar "
        "embedding process.",
        indent=0.4,
    )
    para(
        doc,
        "3) A dual authentication facade—Auth.js sessions for owners and a public pk_live_ API key bound "
        "to CORS origins for widgets—sharing a single Pinecone query function.",
        indent=0.4,
    )
    para(
        doc,
        "4) A deployed case study, Relay, which instantiates the architecture as a Next.js service with "
        "MongoDB for configuration and OpenRouter for answer synthesis, demonstrating that the Pinecone "
        "design is operational rather than merely schematic.",
        indent=0.4,
    )
    para(
        doc,
        "The remainder of the paper surveys the literature (Section II), states the problem (Section III), "
        "describes the research methodology (Section IV), states the hypotheses (Section V), and reports "
        "results and discussion (Section VI), followed by the conclusion, future scope, and limitations.",
    )

    heading_I(doc, "II.  Literature Survey")
    heading_A(doc, "A.  Retrieval-Augmented Generation")
    para(
        doc,
        "Lewis et al. introduced RAG as a generator conditioned on passages retrieved from a dense index "
        "of Wikipedia [3]. Fusion-in-Decoder concatenates many retrieved passages in a seq2seq encoder "
        "[9]. Gao et al. survey RAG for LLMs and distinguish naive, advanced, and modular pipelines [10]. "
        "Self-RAG adds reflection tokens that decide when to retrieve [11]. The system in this paper "
        "follows the naive/advanced pattern: recursive chunking and overlap before indexing, top-k "
        "cosine retrieval at query time, and a constrained generation prompt. It does not train a "
        "retriever or a critic; the contribution is the multi-tenant Pinecone substrate, not a new "
        "neural ranker.",
    )
    heading_A(doc, "B.  Dense Retrieval and Embeddings")
    para(
        doc,
        "Dense Passage Retrieval encodes questions and passages into one vector space [4]. Sentence-BERT "
        "made semantically comparable sentence embeddings practical [5]. Wang et al. released multilingual "
        "E5 models; multilingual-e5-large has 24 layers and 1024-dimensional outputs and is trained with "
        "distinct passage and query prefixes [12]. Using the same model with mismatched input types "
        "degrades retrieval. Pinecone hosted inference exposes those input types as parameters, which "
        "this work exploits.",
    )
    heading_A(doc, "C.  Vector Databases")
    para(
        doc,
        "Johnson et al. demonstrated billion-scale similarity search on GPUs with FAISS [6]. Subsequent "
        "systems add durability, filtering, and distribution. Pan et al. survey vector database management "
        "systems and their query predicates [7]. Open-source stores such as Qdrant, Weaviate, Chroma, and "
        "PostgreSQL with pgvector offer similar k-NN APIs with different operational models. Pinecone "
        "differs for our purposes in two respects that matter to a serverless web application: indexes "
        "are fully managed, and embeddings can be produced by the same API that writes vectors [8]. "
        "Table I summarises this comparison. Commercial RAG builders (Chatbase, CustomGPT, and similar "
        "products) validate market demand but do not disclose index-level isolation mechanics.",
    )
    heading_A(doc, "D.  Multi-Tenant Software")
    para(
        doc,
        "Krebs, Momm, and Kounev discuss isolation and customisation in multi-tenant SaaS [13]. Three "
        "database patterns are common: a database per tenant, a schema per tenant, and a shared schema "
        "with a tenant attribute. This work applies the third pattern to a vector index. The risk is "
        "well known: omitting the tenant predicate leaks data. Therefore the Pinecone filter is not left "
        "to callers of a generic search helper; it is inside the only function that may query the index.",
    )
    heading_A(doc, "E.  Research Gap")
    para(
        doc,
        "Tutorial RAG stacks, including LangChain notebooks [14], typically index one folder of files and omit tenancy. Papers on RAG quality "
        "rarely specify how a SaaS should share one managed index. Papers on multi-tenancy rarely treat "
        "vector metadata filters as the isolation mechanism. The gap addressed here is the combination: "
        "a documented, implemented, and deployed Pinecone shared-index design for document chatbots, "
        "including hosted embeddings and a public widget that must not gain write access to the index.",
    )

    table_title(doc, "TABLE I")
    caption(doc, "COMPARISON OF VECTOR STORES FOR A MULTI-TENANT RAG SERVICE")
    add_table(
        doc,
        [
            ["System", "Managed", "Metadata filter", "Hosted embed", "Fit in this work"],
            ["FAISS", "No", "Application", "No", "Prototype only"],
            ["Chroma", "Optional", "Limited", "No", "Local demos"],
            ["pgvector", "Via RDBMS", "SQL WHERE", "No", "Relational shops"],
            ["Qdrant / Weaviate", "Optional", "Yes", "No / modules", "Self-hosted prod."],
            ["Pinecone (used)", "Yes", "Yes (server-side)", "Yes (inference)", "Chosen substrate"],
        ],
    )

    heading_I(doc, "III.  Problem Statement")
    para(
        doc,
        "Consider several chatbot owners who upload disjoint document collections and expect that a "
        "question asked of Chatbot A never returns text belonging to Chatbot B. A naive shared index "
        "violates this requirement: nearest-neighbour search returns the globally closest vectors. "
        "Creating one physical index per chatbot is operationally heavy and expensive on a managed "
        "platform. A second problem is the split-brain architecture common in student and start-up RAG "
        "stacks, in which a Python embedder and a Node.js frontend disagree on model name or dimension. "
        "The question studied here is whether Pinecone’s shared index, metadata filters, and hosted "
        "inference are sufficient to implement logical multi-tenancy and a single-language retrieval path.",
    )

    heading_I(doc, "IV.  Research Methodology")
    heading_A(doc, "A.  System Model")
    para(
        doc,
        "Fig. 1 shows the system. Owners authenticate with Google through Auth.js [15] and manage chatbots "
        "stored in MongoDB [16]. Website visitors never receive a user session; they present a "
        "per-chatbot public API key. Both paths invoke one retrieval procedure that talks to Pinecone "
        "and then to an LLM router [17]. Pinecone is therefore on the critical path of every answer: "
        "if the filter is wrong, tenancy fails; if inference is wrong, retrieval quality collapses.",
    )
    add_figure(doc, FIG / "fig1_architecture.png", "Fig. 1. System architecture. Pinecone stores vectors and produces embeddings.")

    para(
        doc,
        "Let C be the set of chatbots and V the set of stored vectors. Each vector v_i carries metadata "
        "m_i including chatbot_id, document_id, document_name, chunk_id, and the raw chunk text. Define "
        "the tenant slice V_c = { v_i ∈ V | m_i.chatbot_id = c }. The isolation invariant required of "
        "the implementation is that a query issued in the name of chatbot c may retrieve only from V_c.",
    )

    heading_A(doc, "B.  Pinecone Index Design")
    para(
        doc,
        "A single serverless index is provisioned with cosine similarity and a hosted embedding model "
        "multilingual-e5-large [8], [12]. The index dimensionality is taken from the model (1024) and "
        "is not set by hand, which removes a class of production failures. All chatbots share one "
        "namespace. Physical isolation by namespace or by index-per-tenant is possible in Pinecone but "
        "was rejected: it multiplies operational objects and still requires the application to choose "
        "the correct target. Logical isolation with a mandatory filter concentrates the correctness "
        "argument in one predicate, illustrated in Fig. 2.",
    )
    add_figure(
        doc,
        FIG / "fig2_isolation.png",
        "Fig. 2. Shared index with logical isolation. Only vectors whose chatbot_id matches the query filter are searchable.",
    )

    heading_A(doc, "C.  Embedding and Similarity")
    para(
        doc,
        "Let E_passage and E_query denote Pinecone hosted inference with inputType set to passage and "
        "query respectively. For a chunk text t the stored embedding is",
    )
    equation(doc, "v = E_passage(t)  ∈  R^1024", 1)
    para(
        doc,
        "For a user question q the query embedding is",
        indent=0.5,
    )
    equation(doc, "v_q = E_query(q)  ∈  R^1024", 2)
    para(
        doc,
        "Pinecone ranks candidates by cosine similarity",
        indent=0.5,
    )
    equation(doc, "s(v_q, v) = (v_q · v) / ( ||v_q||  ||v|| )", 3)
    para(
        doc,
        "Given chatbot c and integer k (default 5, capped at 10 on the public API), the retrieved set is",
        indent=0.5,
    )
    equation(doc, "R(q, c) = TopK_{v ∈ V_c}  s(v_q, v)", 4)
    para(
        doc,
        "Equation (4) encodes the isolation invariant: the feasible set is V_c, not V. In the Pinecone "
        "SDK this is expressed as a query filter { chatbot_id: { $eq: c } } together with includeMetadata "
        "so that chunk text can be passed to the LLM. If R(q, c) is empty, generation is skipped and a "
        "fixed refusal is returned. Otherwise the LLM is instructed to use only the retrieved texts and "
        "to cite document_name values [17].",
        indent=0.5,
    )

    heading_A(doc, "D.  Ingestion Algorithm")
    para(
        doc,
        "Fig. 3 (left) summarises writes. After session and ownership checks, the file is parsed (PDF.js "
        "via unpdf, DOCX via mammoth, or UTF-8 text). Recursive character splitting uses separator order "
        "paragraph, line, sentence, space, with chunk size 800 characters and overlap 150, following "
        "standard RAG pre-processing practice [10]. Each chunk is labelled with chatbot_id and a new "
        "document_id. Pinecone inference accepts at most 96 strings per request; the implementation "
        "batches accordingly. Upserts are issued in batches of 100 records into the shared namespace. "
        "The LLM is not called during ingestion, so write load does not consume generation quota.",
    )
    add_figure(
        doc,
        FIG / "fig3_pipelines.png",
        "Fig. 3. Write path (left) versus read path (right). Both embedding calls use Pinecone hosted inference.",
    )

    heading_A(doc, "E.  Query Algorithm")
    para(
        doc,
        "Fig. 3 (right) summarises reads. The caller is either an owner with a JWT and a matching "
        "userId, or a widget with a valid API key and an allowed Origin [18]. After authorisation, "
        "Equations (2)–(4) are evaluated. Retrieved texts are concatenated as numbered documents and "
        "sent to the generator at low temperature. Free-tier LLM endpoints may be unavailable or may "
        "leak chain-of-thought; the implementation tries a fallback model list and, if needed, returns "
        "a quoted excerpt of the top Pinecone matches so that retrieval remains useful even when "
        "generation fails. Dashboard search and public chat call the same function, which prevents the "
        "two facades from drifting onto different filters.",
    )

    heading_A(doc, "F.  Security Properties of the Vector Layer")
    para(
        doc,
        "The public key is designed as a chat credential, not as a secret with write scope. It identifies "
        "the chatbot for Pinecone filtering but is not accepted by document-upload routes. Regenerating "
        "the key invalidates embedded widgets. Default CORS is permissive for first-run demonstration "
        "and is intended to be locked to a customer origin in production [18]. Deleting a chatbot "
        "currently removes the MongoDB document; orphan vectors may remain in Pinecone. They stay "
        "unreachable to other tenants because of (4), but they occupy storage. Delete-by-metadata-filter "
        "is listed as future work rather than claimed as implemented.",
    )

    heading_I(doc, "V.  Hypothesis")
    para(
        doc,
        "The problem in Section III is tested through three hypotheses. They are stated before the "
        "results so that the evaluation can be read against them. They concern tenancy, the embedding "
        "path, and access control. They are not claims about ranking scores on a public benchmark.",
    )
    para(
        doc,
        "H1 (Isolation). If every stored vector is tagged with chatbot_id and every Pinecone query "
        "includes an equality filter on that field, then a query for chatbot c returns only vectors "
        "belonging to c. A separate physical index per chatbot is not required.",
        indent=0.4,
    )
    para(
        doc,
        "H2 (Single embedding path). If documents and questions are embedded by Pinecone hosted "
        "inference with multilingual-e5-large, using inputType passage and inputType query respectively, "
        "then the service does not need a separate embedding process, and the vector dimension matches "
        "the index.",
        indent=0.4,
    )
    para(
        doc,
        "H3 (Shared read path). If the owner dashboard and the public widget call the same query "
        "function, and the public key is accepted only by chat routes, then both surfaces retrieve from "
        "Pinecone while the widget cannot write to the index.",
        indent=0.4,
    )

    heading_I(doc, "VI.  Results and Discussion")
    heading_A(doc, "A.  Implementation and Setup")
    para(
        doc,
        "The architecture was implemented as a TypeScript Next.js 15 application [19] with React 19, Mongoose "
        "on MongoDB [16], Auth.js v5 (Google OAuth, JWT sessions) [15], the official Pinecone SDK [8], and Jest tests "
        "for chunking, models, and chatbot APIs. The service is deployed at https://relayy-dun.vercel.app. "
        "An npm package, relay-chat-widget, loads appearance from a public config endpoint and posts "
        "questions to the public chat endpoint. No local GPU is used; embedding and search run in "
        "Pinecone, and generation runs on OpenRouter [17] using Llama-family instruction models [20]. "
        "This setup is the experimental platform.",
    )
    heading_A(doc, "B.  Functional and Isolation Evaluation")
    para(
        doc,
        "Evaluation is architectural and functional rather than a labelled IR benchmark; constructing a "
        "public multi-tenant RAG test set is left to future work. Table II records the behaviours that "
        "were checked on the deployed system. Fig. 4 shows the owner dashboard with several independent "
        "chatbots on one account, which is the visible form of tenancy above the vector layer.",
    )
    table_title(doc, "TABLE II")
    caption(doc, "FUNCTIONAL AND ISOLATION OUTCOMES ON THE DEPLOYED PINECONE-BACKED SYSTEM")
    add_table(
        doc,
        [
            ["Scenario", "Expected", "Observed"],
            ["Paraphrased question about uploaded skills text", "Dense hit on E5 + grounded answer", "Structured skill list returned in dashboard chat"],
            ["Question with no supporting chunk", "Refusal, no invented policy", "Fixed “could not find” path or honest limit"],
            ["Query chatbot A about B’s documents", "Empty / non-B context", "Filter in (4) excludes B"],
            ["Widget key used to upload files", "No write route", "Public API is chat/config only"],
            ["Missing API key or disallowed origin", "401 / 403", "Public auth helper enforces both"],
            ["LLM rate-limit or leaked reasoning", "Still show retrieved text", "Fallback to Pinecone chunk excerpt"],
        ],
        font_size=7,
    )
    dash = SHOT / "fig-11-3-dashboard.png"
    if dash.exists():
        add_figure(
            doc,
            dash,
            "Fig. 4. Deployed owner dashboard: multiple chatbots share one Pinecone index and remain separately addressable.",
        )
    chat = SHOT / "fig-11-6-chat-workspace.png"
    if chat.exists():
        add_figure(
            doc,
            chat,
            "Fig. 5. Dashboard question answering after Pinecone retrieval (example: skills of Sahil).",
        )

    heading_A(doc, "C.  Comparison with Alternative Pinecone Deployments")
    para(
        doc,
        "Table III contrasts three ways of using Pinecone (or a local ANN library) for the same product "
        "shape. A FAISS process per instance fails durability and tenancy. One Pinecone index per "
        "chatbot maximises isolation at the cost of index sprawl and slower provisioning. The chosen "
        "design—one index, hosted inference, mandatory metadata filter—minimises moving parts while "
        "keeping isolation in a single code path. Hosted inference also removes the failure mode in "
        "which a Python sidecar embeds with 768 dimensions while the index expects 1024.",
    )
    table_title(doc, "TABLE III")
    caption(doc, "ALTERNATIVE RETRIEVAL BACK ENDS FOR THE SAME CHATBOT PRODUCT")
    add_table(
        doc,
        [
            ["Design", "Isolation", "Ops burden", "Embed mismatch risk"],
            ["In-process FAISS", "Manual", "High (stateful)", "High"],
            ["Pinecone, index per chatbot", "Physical", "High (N indexes)", "Medium if local embed"],
            ["Pinecone shared + filter (this work)", "Logical, Eq. (4)", "One index", "Low (hosted E5)"],
        ],
    )

    heading_A(doc, "D.  Discussion")
    para(
        doc,
        "The results support three claims. First, Pinecone metadata filters are an adequate isolation "
        "mechanism for a teaching-scale and small-SaaS RAG product, provided the filter is not optional "
        "in application code. Second, hosted inference is a genuine simplification: the deployed artefact "
        "is one Node.js service. Third, a public widget can sit on Pinecone retrieval without being given "
        "upsert rights. The evaluation does not report nDCG or RAGAS scores; those metrics would measure "
        "chunking and prompt quality more than the choice of Pinecone, but they are the correct next "
        "experiment. A further limitation is orphan vectors after chatbot deletion, which is a Pinecone "
        "hygiene issue rather than an isolation leak.",
    )

    heading_I(doc, "VII.  Conclusion")
    para(
        doc,
        "This paper treated Pinecone not as an undifferentiated k-NN API but as the isolation and "
        "embedding backbone of a multi-tenant RAG chatbot platform. A shared serverless index, cosine "
        "retrieval, multilingual-e5-large hosted inference, and a mandatory chatbot_id filter together "
        "satisfy the requirement that Chatbot A cannot read Chatbot B, without provisioning an index "
        "per tenant. Relay instantiates the design, with MongoDB holding configuration, OpenRouter "
        "synthesising answers, and an npm widget consuming a read-only public API. The three hypotheses "
        "are supported by the functional and isolation checks: the filter keeps tenants apart, hosted "
        "inference removes the embedding sidecar, and the public key does not gain write access. The "
        "architecture is offered as a reproducible pattern for teams who need a managed vector database "
        "under a multi-tenant document assistant.",
    )

    heading_I(doc, "VIII.  Future Scope")
    para(
        doc,
        "The next steps follow directly from what this study did not implement. Delete-by-filter in "
        "Pinecone would remove vectors when a file or chatbot is deleted. Hybrid sparse–dense search "
        "would improve retrieval of identifiers, codes, and names. A cross-encoder reranker on the "
        "top-k list is the natural advanced-RAG extension [10]. Labelled evaluation with nDCG and RAGAS "
        "would measure chunking and answer quality, which this paper does not score. Per-key rate limits "
        "on the public query path would harden the widget API.",
    )

    heading_I(doc, "IX.  Limitations")
    para(
        doc,
        "The evaluation is architectural and functional. It does not report nDCG or RAGAS, so it does "
        "not measure retrieval or answer quality on a labelled question set. Those metrics would speak "
        "more to chunking and prompting than to the choice of Pinecone, but their absence is a limit of "
        "the evidence.",
    )
    para(
        doc,
        "Deleting a chatbot removes the MongoDB record. Orphan vectors may remain in Pinecone. They stay "
        "unreachable to other tenants because of (4), but they still occupy storage. The default origin "
        "list is permissive until an owner locks it. A public key placed in page script can be copied "
        "and used to query an allowed origin; it cannot upload documents. Answer quality still depends "
        "on how text is chunked and on the generator. The metadata filter does not repair a poor chunk.",
    )

    heading_I(doc, "References")
    refs = [
        'A. Vaswani et al., "Attention is all you need," in Proc. NeurIPS, 2017, pp. 5998–6008.',
        'Z. Ji et al., "Survey of hallucination in natural language generation," ACM Comput. Surv., vol. 55, no. 12, pp. 1–38, 2023.',
        'P. Lewis et al., "Retrieval-augmented generation for knowledge-intensive NLP tasks," in Proc. NeurIPS, vol. 33, 2020, pp. 9459–9474.',
        'V. Karpukhin et al., "Dense passage retrieval for open-domain question answering," in Proc. EMNLP, 2020, pp. 6769–6781.',
        'N. Reimers and I. Gurevych, "Sentence-BERT: Sentence embeddings using Siamese BERT-networks," in Proc. EMNLP-IJCNLP, 2019, pp. 3982–3992.',
        'J. Johnson, M. Douze, and H. Jégou, "Billion-scale similarity search with GPUs," IEEE Trans. Big Data, vol. 7, no. 3, pp. 535–547, 2019.',
        'J. J. Pan, J. Wang, and G. Li, "Survey of vector database management systems," VLDB J., vol. 33, pp. 1591–1615, 2024.',
        'Pinecone Systems, "Pinecone documentation: Indexes, metadata filtering, and inference," 2024. [Online]. Available: https://docs.pinecone.io',
        'G. Izacard and E. Grave, "Leveraging passage retrieval with generative models for open domain question answering," in Proc. EACL, 2021, pp. 874–880.',
        'Y. Gao et al., "Retrieval-augmented generation for large language models: A survey," arXiv:2312.10997, 2023.',
        'A. Asai, Z. Wu, Y. Wang, A. Sil, and H. Hajishirzi, "Self-RAG: Learning to retrieve, generate, and critique through self-reflection," in Proc. ICLR, 2024.',
        'L. Wang et al., "Multilingual E5 text embeddings: A technical report," arXiv:2402.05672, 2024.',
        'R. Krebs, C. Momm, and S. Kounev, "Architectural concerns in multi-tenant SaaS applications," in Proc. CLOSER, 2012, pp. 426–431.',
        'H. Chase, "LangChain documentation," 2022. [Online]. Available: https://python.langchain.com',
        'Auth.js, "Auth.js documentation (NextAuth.js v5)." [Online]. Available: https://authjs.dev',
        'MongoDB Inc., "MongoDB manual." [Online]. Available: https://www.mongodb.com/docs/manual/',
        'OpenRouter, "OpenRouter API reference." [Online]. Available: https://openrouter.ai/docs',
        'OWASP Foundation, "OWASP Top 10 – 2021." [Online]. Available: https://owasp.org/Top10/',
        'Vercel Inc., "Next.js documentation." [Online]. Available: https://nextjs.org/docs',
        'A. Grattafiori et al., "The Llama 3 herd of models," arXiv:2407.21783, 2024.',
    ]
    for i, t in enumerate(refs, 1):
        ref_item(doc, i, t)

    doc.save(DOCX)
    print(f"Wrote {DOCX}")


if __name__ == "__main__":
    build()
