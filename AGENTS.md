# DCCC Culture Map — agent guide

Read [docs/implementation.md](docs/implementation.md) before changing the map, its Google Sheets integration, or deployment.

## Project rules

- This is a static site: edit HTML, CSS, and JavaScript directly; there is no build step or package manager.
- The deployed site is GitHub Pages from the `main` branch: `https://ptrbodnar.github.io/dccc_map/`.
- Keep `.local-context/` local. It contains imported briefs and is intentionally ignored by Git.
- Preserve existing user changes. Check `git status --short` before edits and do not reset or overwrite unrelated files.
- Use the public Google Sheets endpoints already configured in `scripts/app.js` and `scripts/type-directory.js`; do not introduce credentials into the repository.

## Essential facts

- `index.html` is the page structure and loads all scripts in dependency order.
- `scripts/app.js` owns language switching, main-sheet parsing, filters, map markers, location panel, search, and fullscreen mode.
- `scripts/type-directory.js` loads the type/color directory before markers are created.
- Place markers use DOM `maplibregl.Marker` elements, not a MapLibre GeoJSON point source. Keep this approach unless replacing the entire marker/cluster implementation deliberately.
- The main sheet is currently parsed by column position, not header. Do not reorder its columns without changing `parseSheet()`.

## Before handing off

- Test a normal map load, a filter, search, marker panel, cluster expansion, UA/EN switching, and fullscreen mode.
- Run `git diff --check` and document any remaining known limitation.
