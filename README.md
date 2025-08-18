# BFR Trainer (FAR Part 91)

An interactive, static web app to study FAR Part 91 for your Biennial/Basic Flight Review. It loads `data/part91.html` for reference material and offers:

- Study view with key sections
- Search within the selected key sections
- Flashcards
- Multiple-choice quizzes
- Sectional symbol ID practice
- Runway marking ID practice
- Progress tracking in `localStorage`
- Route and last-read section persistence
- Import/Export progress as JSON
- Flashcard keyboard shortcuts: `Space` (flip), `Y/1` (knew it), `N/0` (didn't know)

## Run locally

Use any static file server. The simplest is Python's built-in HTTP server.

### macOS (zsh)

```bash
cd /Users/jacobspoelstra/git/bfr
python3 -m http.server 5173
```

Then open:

```
http://localhost:5173/
```

If you prefer Node:

```bash
npm -g install serve
serve -l 5173 .
```

## Notes
- All data stays in your browser storage. Use the Progress page to reset.
- Symbols/markings are simplified SVG representations for training purposes.
- Your last visited tab and last opened study section are restored on reload.
- Use the Progress page to Export/Import your progress JSON between browsers.

### Optional: Use real images for symbols and markings

Place images in these folders to override the built‑in SVGs:

- `assets/sectional/`
	- `towered-airport.png`
	- `nontowered-airport.png`
	- `vor.png`
	- `restricted-area.png`

- `assets/runway/`
	- `threshold.png`
	- `displaced-threshold.png`
	- `touchdown-zone.png`
	- `hold-short.png`

Images are loaded if present; otherwise the app falls back to inline SVGs.

Suggested public-domain sources:
- FAA Aeronautical Chart User’s Guide (ACUG): section on symbology (chart symbols are typically federal works).
- FAA AIM sections on airport markings and signs.

If you add images from third parties, ensure license compatibility and add attribution notes here.

#### Auto-fetch starter images

There is a small helper script to download a few standardized symbol/marking SVGs from Wikimedia (publicly hosted), which depict the same standardized shapes used in FAA references:

```bash
cd /Users/jacobspoelstra/git/bfr
python3 scripts/fetch_assets.py
```

These serve as stand-ins if you don’t yet have official FAA-sourced images. You may replace them with images extracted from FAA publications at any time.

Attribution:
- FAA Aeronautical Chart Users’ Guide (Effective June 12, 2025): https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/aero_guide/
- FAA Runway Safety Publications (Signs/Markings references): https://www.faa.gov/airports/runway_safety/publications
- Some starter images may be downloaded from Wikimedia Commons (licensed or public domain as indicated on each file page). Ensure license compliance if you redistribute.
