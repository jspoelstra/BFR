# BFR Trainer (FAR Part 91)

An interactive, static web app for studying FAR Part 91 as part of a Biennial/Basic Flight Review (BFR). The app is fully client-side, loads reference content from `data/part91.html`, and includes study modes like flashcards, quizzes, and visual identification practice.

## Features
- Study view with key sections of Part 91
- Search within the selected sections
- Flashcards with keyboard shortcuts: `Space` (flip), `Y/1` (knew it), `N/0` (didn't know)
- Multiple-choice quizzes
- Sectional chart symbol identification practice
- Runway marking/sign identification practice
- Progress tracking in `localStorage`
- Route and last-read section persistence
- Import/Export progress as JSON

## Getting Started

This is a static site. You can serve it locally with any static file server.

Option A — Python (built-in):

```bash
cd BFR
python3 -m http.server 5173
```

Then open `http://localhost:5173/` in your browser.

Option B — Node.js (`serve`):

```bash
npm -g install serve
serve -l 5173 .
```

No build step is required.

## Development

- Source files live in `src/` with `index.html`, `styles.css`, and assets in `assets/`.
- All app state is stored in the browser (`localStorage`). Use the in-app Progress page to reset or export/import your progress JSON.
- Symbols/markings are simplified SVG representations intended for training.
- The app restores your last visited tab and last opened study section on reload.

### Project structure

```
BFR/
├─ index.html
├─ styles.css
├─ src/
│  ├─ main.js
│  └─ state.js
├─ data/
│  └─ part91.html
├─ assets/
│  ├─ sectional/
│  └─ runway/
├─ scripts/
│  └─ fetch_assets.py
├─ ATTRIBUTION.md
├─ LICENSE
└─ README.md
```

### Optional: Override built-in SVGs with images

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

#### Auto-fetch starter images

A helper script can download a few standardized symbol/marking SVGs from Wikimedia (publicly hosted) as temporary stand-ins:

```bash
python3 scripts/fetch_assets.py
```

You may replace them with images extracted from FAA publications at any time.

## Contributing

Contributions are welcome! A simple workflow:

1) Fork the repo and create a topic branch from `main` or your working branch.
2) Make changes with clear, small commits.
3) Run locally to verify behavior (see Getting Started).
4) Open a Pull Request with a concise summary and screenshots if UI changes.

Coding guidelines:
- Keep it dependency-free where reasonable; this is a static site.
- Prefer small, focused functions and vanilla JS in `src/`.
- Maintain accessibility and keyboard support.
- Update this README or `ATTRIBUTION.md` if assets or usage change.

## Attribution & Sources

Please see `ATTRIBUTION.md` for full details. Relevant references include:
- FAA Aeronautical Chart Users’ Guide (Effective June 12, 2025): https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/aero_guide/
- FAA Runway Safety Publications: https://www.faa.gov/airports/runway_safety/publications
- Some starter images may be downloaded from Wikimedia Commons (licensed or public domain as indicated on each file page). Ensure license compliance if you redistribute.

## License

This project is licensed under the MIT License — see `LICENSE` for details.
