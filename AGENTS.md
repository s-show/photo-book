# Repository Guidelines

## Project Structure & Module Organization
This repository is a small Vite-based web app for building printable/exportable photo books. Main application logic lives in `src/main.js`, with shared conversion helpers in `src/utils.js`. Styles are organized in `src/style.scss` and SCSS partials such as `src/_menu.scss`, `src/_print.scss`, and `src/_help.scss`. Static HTML entry points are `index.html` for the app and `dist/index.html` for build output. Tests live in `test/`, currently `test/convert.test.js`. Supporting notes and release documentation are in `doc/`, `CHANGE.md`, and `release_manual.md`.

## Build, Test, and Development Commands
Use the existing package scripts:

- `npm run dev`: start the Vite dev server for local UI work.
- `npm run build`: produce the single-file production bundle in `dist/`.
- `npm run preview`: serve the built app locally for a final check.
- `npm test`: run the Vitest suite once.

CI uses `pnpm install` and `pnpm run build` on GitHub Actions with Node.js 24, so keep `npm` and `pnpm` workflows compatible.

## Coding Style & Naming Conventions
Follow the existing style in `src/main.js` and `src/utils.js`: ES modules, semicolon-light JavaScript, and 2-space indentation in config files / 2-space to compact indentation elsewhere already present in source. Use `camelCase` for functions and variables, `PascalCase` for classes, and descriptive DOM IDs matching the current UI names (`addFileBtn`, `imageWidthInput`). Keep file names lowercase; SCSS partials continue the `_name.scss` pattern. There is no configured linter or formatter, so keep changes minimal and consistent with surrounding code.

## Testing Guidelines
Tests use Vitest with globals enabled through `vite.config.js`. Add new unit tests under `test/` with `*.test.js` names. Prefer small, deterministic tests around utility logic and export-related calculations. Run `npm test` before opening a PR; if logic affects bundling or print/export behavior, also run `npm run build`.

## Commit & Pull Request Guidelines
Recent history favors short, task-focused commits, including Japanese summaries such as `改ページ挿入処理の改善` and concise maintenance commits like `Update Node.js version to 20 in workflow`. Keep commit messages specific to one change. PRs should include a short description, testing performed, linked issues when applicable, and screenshots or output notes for UI/export changes.
