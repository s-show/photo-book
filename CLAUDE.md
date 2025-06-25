# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Photo Book Creator web application (写真帳作成ページ) that allows users to upload images, organize them, and export to Word/Excel formats or print directly. The UI is in Japanese.

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Core Application Structure
- **Single-page vanilla JavaScript application** using ES6+ classes
- **PhotoBookApp class** (`src/main.js`) - Main application controller handling all UI interactions, file operations, and exports
- **TempImageStack class** - Utility for temporarily storing image data during export operations
- **Vite build system** with `vite-plugin-singlefile` to bundle everything into a single HTML file

### Key Functionality Areas

**File Management**:
- Uses FileReader API to convert images to DataURL format
- Drag-and-drop reordering with visual feedback (blue borders)
- Double-click interactions: rename files (caption) or delete images (thumbnail)

**Export System**:
- **Word Export**: HTML → Markdown (via Turndown) → DOCX (via markdown-docx)
- **Excel Export**: Uses ExcelJS with complex layout logic for 1-column vs 2-column displays
- **Print**: Canvas-based image resizing with CSS custom properties for headers

**Image Processing**:
- Canvas-based resizing with configurable ratios
- Temporary image stack for managing original/resized versions during exports

### SCSS Architecture
- Modular SCSS with `@use` imports in `src/style.scss`
- Separate partials: `_help`, `_image`, `_loading`, `_menu`, `_misc`, `_print`
- Print-specific styles handle hiding UI elements during printing

### UI State Management
- Toggle between 1-column and 2-column layouts (`columnToggleBtn`)
- Dynamic button enabling/disabling based on image presence
- Loading overlay system with customizable messages
- Help sidebar with click-outside-to-close behavior

## Build Configuration

Uses Vite with:
- `vite-plugin-singlefile` - Bundles everything into a single HTML file
- `minify: false` - Keeps output readable
- SCSS preprocessing with `sass` and `sass-embedded`

## Dependencies

**Core Libraries**:
- `exceljs` - Excel file generation
- `docx` + `markdown-docx` - Word document generation  
- `turndown` - HTML to Markdown conversion

**Build Tools**:
- `vite` - Build system and dev server
- `sass` - SCSS preprocessing
- `vite-plugin-singlefile` - Single-file bundling