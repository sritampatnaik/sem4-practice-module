# METS Evals — Slide Deck

Five-slide deck explaining what evaluations (evals) are in METS and why they matter for the project.

## Files

| File | Purpose |
| --- | --- |
| `METS-Evals-Deck.pptx` | Ready-to-import presentation (5 slides) |
| `generate-mets-evals-deck.py` | Regenerate the deck after editing content |
| `slide-outline.md` | Plain-text outline for manual copy into Google Slides |

## Open in Google Slides

1. Go to [Google Slides](https://slides.google.com) and create a blank presentation (or open an existing one).
2. **File → Import slides → Upload**
3. Select `METS-Evals-Deck.pptx`
4. Choose **Replace slides** or **Append slides**, then **Import slides**

Google Slides preserves titles, bullets, and colours from the PPTX import.

## Regenerate

```bash
pip install python-pptx
python docs/presentations/generate-mets-evals-deck.py
```

## Slide summary

1. **Title** — METS Evals: What they are & why they matter
2. **What are evals?** — Definition and scope in METS
3. **What we are building** — Harness, observability, schema checks, planned layers
4. **Why evals matter** — Trust, educator audit trail, multi-agent failure modes, Singapore governance
5. **Roadmap & next steps** — Live harness runs, tool-contract checks, routing/RAG evals, verifier/marker
