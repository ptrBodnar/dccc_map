# DCCC Culture Map: current implementation

This document describes the repository as it works now. It is the canonical technical handoff for maintainers and coding agents. Product requirements and uncommitted imported briefs are intentionally not duplicated here.

## 1. Runtime and deployment

- **Format:** a static HTML site; no Node.js, bundler, tests, or build command.
- **Repository:** `git@github.com:ptrBodnar/dccc_map.git`.
- **Branch / deploy:** GitHub Pages publishes `main` at <https://ptrbodnar.github.io/dccc_map/>.
- **Map library:** MapLibre GL JS 4.7.1, loaded from unpkg in `index.html`.
- **Map style:** `styles/minimal-light.json`, with an OpenFreeMap/OpenMapTiles basemap.
- **Local context:** `.local-context/` is ignored and must not be committed.

For a browser preview, open `index.html`. The map requires network access for MapLibre assets, map tiles, and the two public Google Sheets endpoints.

## 2. Repository map

| Path | Responsibility |
| --- | --- |
| `index.html` | Semantic one-page layout, map controls and panel markup, external assets, script order. |
| `scripts/app.js` | Application state, translations, main data parsing, search, filters, DOM markers, clustering, panel, fullscreen. |
| `scripts/type-directory.js` | Loads and validates the type/color directory, then updates the shared type labels and color map. |
| `scripts/overrides.js` | Hides the loading overlay after a short fallback delay. |
| `styles/site.css` | Main visual system; currently minified. |
| `styles/overrides.css` | Small readable CSS overrides, including filter swatches and fullscreen icon styling. |
| `data/dnipro-boundary.geojson` | Boundary line rendered above the basemap. |
| `AGENTS.md` | Short operating guide for future coding agents. |

## 3. Page and UI

The site has a sticky header, Hero, About, embedded map, methodology, Partners placeholder, and footer. It is a single `index.html` rather than a component framework.

The `UA / EN` switch stores the selected UI language in `localStorage` under `dccc-map-language`. It translates the static interface and category labels only. Location records themselves are not bilingual yet because the current main sheet does not provide separate UA/EN fields.

The fullscreen button toggles the `is-fullscreen` class on `#map-shell`, preserves the current map state, calls `map.resize()`, and can be closed with the button or `Escape`.

## 4. Data sources

### Main locations sheet

`scripts/app.js` uses the public Google Visualization endpoint in `SHEET_URL`:

```text
https://docs.google.com/spreadsheets/d/1kOzR-QWaQoam2Rs6Ot_6rOHfEBG2q-TZlwGoB4IGJhI/gviz/tq?tqx=out:json
```

`parseSheet()` currently expects this exact column order:

| Index | Used as | Notes |
| ---: | --- | --- |
| 0 | latitude | Parsed as a number. |
| 1 | longitude | Parsed as a number. |
| 2 | title | Used in search and the panel. |
| 3 | image URL | Used only when it is an `http(s)` image URL. |
| 4 | description | HTML is stripped for UI; `http(s)` links are extracted from its HTML. |
| 7 | type ID | Lowercased; matches a type in the directory. |

The application creates a temporary ID `point-<row index>`. It is not a stable CMS ID. Address, status, and year are currently deliberately blank because the sheet does not yet expose a reliable agreed schema.

Coordinates are only checked for being numeric. The current dataset contains records at `0,0`; they produce markers outside Dnipro and must be corrected in Sheets. A future schema migration should validate Dnipro bounds and discard invalid records with a visible diagnostic.

### Type and color directory

`scripts/type-directory.js` loads the sheet tab **`Довідник типів та кольорів`** from the same spreadsheet. It accepts these header aliases:

| Meaning | Accepted headers |
| --- | --- |
| Type key | `type_id`, `type` |
| Ukrainian label | `Назва UA`, `label_ua`, `name_ua` |
| English label | `Назва EN`, `label_en`, `name_en` |
| Color | `Колір`, `color` |

Only a valid six-character HEX color (for example, `#03A775`) is accepted. Missing or unreachable directory data falls back to the values in `TYPE_COLORS` / `LABELS` in `scripts/app.js`; unknown types use `#253d40`.

The script must load before markers are created. `app.js` waits for `window.typeDirectoryReady` after receiving the main sheet data.

## 5. Map, markers, and clustering

`initialise()` creates the MapLibre map, navigation controls, Dnipro boundary, fetches the main sheet, waits for the type directory, then creates markers.

### Why markers are DOM elements

Places use `maplibregl.Marker` with button elements rather than a MapLibre GeoJSON source. The earlier GeoJSON/source update approach produced unreliable visible clusters in this project after source updates. Do not reintroduce `setData()`-based point clustering as an incremental patch; replace the implementation and validate it end-to-end if native clustering is required later.

### Current cluster algorithm

- At zoom **14 and above**, every location is an individual 16 px colored dot.
- Below zoom 14, `clusteredData()` projects each point into screen space and groups points in a **56 px grid**.
- A group with more than one location becomes a neutral graphite `#171a18` 36 px round marker with a light border and count.
- Clusters may include different types. A cluster click centers on the group and adds two zoom levels, to a maximum of 14.
- Individual point clicks open the information panel.
- Markers are regenerated after filters change and when the integer zoom level changes. They are not recalculated for a pan at the same zoom; this is an accepted current simplification and should be improved if visual grouping during horizontal movement becomes important.

At the time of writing, 85 records are loaded from the sheet. Nine currently use `0,0` coordinates, so only the remaining valid-city records are visible around Dnipro.

## 6. Search, filters, and panel

- Search matches title, address, and stripped description. Address is presently empty in the parsed model.
- The filter list is generated from the types found in the main sheet. It supports multiple selected types and reset.
- A filter regenerates both individual markers and clusters from only the selected locations, so counts stay correct.
- The panel renders title, category, description, optional image, extracted `http(s)` links, and a Google Maps directions link. Empty optional fields are omitted.
- Links found in descriptions are generic `Сайт` / `Website` links; Instagram, Facebook, Wikipedia, and other sources are not classified until the sheet has dedicated URL fields.

## 7. Current limitations and planned migration targets

The following are known product/technical gaps, not accidental omissions:

1. Main-sheet columns are positional; migrate to a header-based schema with stable `id`, bilingual fields, structured URLs, status, address, and one-or-more type IDs.
2. Location text is not bilingual; only the interface is.
3. Categories support one `type` per location, not multiple independent category axes.
4. There are no location deep links, `/uk/` and `/en/` routes, Open Graph tags, analytics, cache strategy, staging flow, or editor documentation yet.
5. Partner logos/links, a hero visual, legal links, and a confirmed no-image placeholder are still content decisions.
6. Browser/device QA has not been completed for the supported browser matrix.
7. The DOM marker clustering is suitable for the current small dataset. If the dataset becomes much larger, replace it with a tested native/source-based implementation or a dedicated clustering solution.

## 8. Safe change workflow

1. Inspect `git status --short`; this workspace may contain user changes.
2. Read `AGENTS.md` and this document.
3. Keep public endpoints and credentials separate: never commit API keys or private Sheets links.
4. Make a focused change with `apply_patch`.
5. In a browser, check:
   - initial data load and type colors;
   - filter and reset;
   - search result and location panel;
   - a cluster at low zoom, then its expansion click;
   - individual points at zoom 14+;
   - UA/EN persistence and fullscreen / Escape.
6. Run `git diff --check` before committing.

## 9. Git and deployment

The remote uses SSH. A normal deployment is:

```bash
git status
git add <intended files>
git commit -m "Describe the change"
git push origin main
```

Do not add `.local-context/`. GitHub Pages deployment may take a short time after the push; verify the public URL after it finishes.
