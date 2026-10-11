# Indian content-pack source research

Date: 2026-10-11. This is source discovery only. No researched candidate is registered in
`BookCatalog`, annotated, ready, or playable.

## Method and limits

Each candidate's actual scan and archive metadata live under the ignored directory
`.local/book-people-candidate-research/<candidate>/`. The generic
`tools/book-prep/content-candidate-analysis.py` was run on every ranked PDF. It measures PDF
page count, pair count, OCR text density, low-text pages, and caption-keyword hints.

Those metrics, plus visual screens of rendered illustration candidates and recall samples, are
**heuristic source-screening estimates**. They are not automatic people detection and must never
be copied into final gameplay content. Individual count averages, 5+-person pages, draw rate, and
mean left/right difference are intentionally not reported: they need the later human annotation
pass. “Usable” excludes obvious cover, blank, preliminary, and end-matter pages.

## Ranked candidates

| Rank | Candidate | Year / category | PDF / usable pages | People pages, heuristic | 2+ people pages, heuristic | Est. eligible spreads | 5 / 10 / 15 |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | *Tales of the Punjab Told by the People* | 1894, illustrated folklore/social history | 424 / 304 | about 49 (16%) | about 14 (5%) | 45-48 | yes / yes / yes |
| 2 | *Indian Fairy Tales* | 1892, illustrated folklore | 294 / 244 | about 34 (14%) | about 10 (4%) | 32-34 | yes / yes / yes |
| 3 | *Prabasi*, Vol. 16 Pt. 2 | 1916, Bengali illustrated periodical | 652 / 652 | sample: about 4 of 72 (6%) | sample: about 2 of 72 (3%) | 10-14 | yes / maybe / no |
| 4 | *The Young Men of India*, v.29 no.6 | 1918, Calcutta periodical | 72 / 72 | about 4 (6%) | about 2 (3%) | about 4 | no / no / no |
| 5 | *The Journal of Indian Art and Industry*, vol.13 no.108 | 1909, cultural/craft periodical | 56 / 56 | about 2 (4%) | 0 observed | 1-2 | no / no / no |

“Eligible” here means a likely unexcluded pair with a visually human-containing side, not the
final game-core calculation. Punjab has about 152 candidate pairs, Fairy 122, Prabasi 326, Young
Men 36, and the Journal 28. A small number of Punjab both-side human pairs were observed, but this
is not a final pair annotation. Fairy had none observed in the screen. Prabasi is portrait-heavy;
Young Men had one crowd/car-party candidate; the Journal's downloaded silk-industry issue is mostly
objects, moths, and craft plates.

The reproducible proxy results support the screen: Punjab has a 76.2% OCR text-heavy rate and 29
illustration-caption-hint pages; Fairy has 71.8% and 19. The raw counts make clear why every
candidate still needs a hand-reviewed extraction range. Prabasi and the Journal have no usable OCR
in their downloaded scans; a zero OCR count means OCR is unavailable, not that every page is visual.
Young Men has an 81.9% text-heavy rate.

## Sources and rights

| Candidate | Institution / item | Rights evidence and confidence |
| --- | --- | --- |
| Punjab | Internet Archive, University of Toronto/Robarts scan: https://archive.org/details/talesofpunjabtol00steeuoft | 1894 metadata records `possible-copyright-status: NOT_IN_COPYRIGHT` (US) with an evidence note. High confidence. |
| Fairy | Internet Archive, University of Toronto/Robarts scan: https://archive.org/details/indianfairytales00jacouoft | 1892 metadata records `NOT_IN_COPYRIGHT` (US). High confidence. |
| Prabasi | Internet Archive mirror of West Bengal Public Library/DLI: https://archive.org/details/dli.bengal.10689.3474 | Source metadata explicitly says `dc.rights: In Public Domain`. Medium-high; confirm source-institution reuse terms before release. |
| Young Men | Internet Archive, Princeton Theological Seminary Library scan: https://archive.org/details/youngmenofindia296youn | 1918 publication, but no explicit reuse statement in the downloaded metadata. Medium/uncertain; do not redistribute without independent confirmation. |
| Journal | Internet Archive uploaded scan: https://archive.org/details/gfeg_the-journal-of-indian-art-and-industry-vol-13-no-108-oct-1909-govt-of-india | The item carries CC0 metadata, but its uploader is not a rights institution. Medium-low; do not rely on that claim alone. |

## Recommendation

**Select *Tales of the Punjab Told by the People* (1894) for the next manual-annotation
milestone.** It combines the deepest estimated playable pool, cleanest high-resolution scan,
varied village/court/craft scenes, direct Indian cultural relevance, and the clearest rights record.
It outranks *Indian Fairy Tales* on likely pool depth and scene variety. The Indian periodicals have
stronger publication context but fail visual-density screening in their downloaded issues.

Next: choose the final range, use `extract.py`, count every page in `counter.html`, validate,
finalize, then register only a ready pack. This report has made no people count authoritative.

## Other downloaded checks

*Every-day Life in India* (1881), *India Illustrated with Pen and Pencil* (1891), and *Winter
India* (1903) were also downloaded locally. Stratified renders showed the first and third as mostly
text/blank recto-verso. *India Illustrated* has more plates, but many depict architecture or
landscape rather than clearly countable people, so none was promoted into the ranked five.
