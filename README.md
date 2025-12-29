# FitTrack (static fitness app)

FitTrack is a **simple workout tracker** that runs entirely in the browser (no backend, no account).

## Features

- **Workout logging**: add exercises and sets (weight + reps + notes)
- **Exercise library**: built-in exercises + add custom ones
- **Progress**: per-exercise estimated 1RM chart (Epley)
- **Privacy-first**: data stored locally in your browser (`localStorage`)
- **Data portability**: export/import JSON backups

## Run locally

From the repo root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Deploy

This is a static site. You can deploy it on GitHub Pages, Netlify, Cloudflare Pages, or any static host.

## Files

- `index.html`: app shell
- `assets/styles.css`: UI styles
- `assets/app.js`: app logic + storage
- `privacypolicy/index.html`: privacy policy page
