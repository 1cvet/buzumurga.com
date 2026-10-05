# buzumurga.com

Personal website of Mikhail Buzumurga: <https://buzumurga.com/> (EN) and <https://buzumurga.com/ru/> (RU).
Static pages built from one template and two content files.

## Structure

| Path | What |
| --- | --- |
| `content/en.json`, `content/ru.json` | All texts. Edit both so the languages stay in sync |
| `content/site.json` | Shared settings: email, LinkedIn, Metrica id, `SHOW_KYPITO` flag |
| `src/page.mjs` | The page template (one for both languages) |
| `src/404.mjs` | Bilingual 404 page |
| `static/` | Files copied as is; `static/assets/` gets fingerprinted file names |
| `build.mjs` | Build script, no dependencies: `node build.mjs` -> `dist/` |
| `scripts/check.mjs` | Internal links, anchors, no em dashes; `--external` checks outside links |
| `scripts/serve.mjs` | Local preview with production-like headers |
| `scripts/og.mjs` | Regenerates `static/og-en.jpg` and `static/og-ru.jpg` (needs Playwright) |
| `cv/Buzumurga_Mikhail.docx` | CV source (not published); export to `static/Buzumurga_Mikhail.pdf` |
| `deploy/` | Nginx configs, server audit script, server setup guide (`deploy/SERVER.md`) |
| `.github/workflows/deploy.yml` | Build and checks on every PR; rsync deploy to the VPS on `master` |

## Everyday tasks

```bash
node build.mjs                 # build dist/
node scripts/serve.mjs 8080    # preview at http://127.0.0.1:8080/
npm install && npm run check   # HTML validation + link check (what CI runs)
```

- **Change a text:** edit `content/en.json` and `content/ru.json`, push to `master` - the site deploys itself.
  Inline markup in texts: `[text](https://link)` and `*emphasis*`. Use a hyphen "-", never a long dash.
- **New CV:** edit `cv/Buzumurga_Mikhail.docx`, export to PDF
  (`soffice --headless --convert-to pdf cv/Buzumurga_Mikhail.docx --outdir static/`), keep the file name.
- **Show the Kypito block:** set `"SHOW_KYPITO": true` in `content/site.json`.
- **Fonts:** Montserrat / Libre Baskerville files have no Cyrillic, so the RU page uses system fonts.
  Add Cyrillic `.woff2` files to `static/assets/fonts/` and `@font-face` rules to use Montserrat there too.

`geron.py` is an unrelated Python exercise kept from the original repository.
