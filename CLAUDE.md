# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AD filmstudio is a single-page e-commerce website selling 3D-printed modular film scanning tools. It is a static site (no build step, no framework, no backend) — just vanilla HTML/CSS/JS served directly.

## Development

Open `index.html` in a browser. No build tools, package managers, or dev servers are required. The `.venv` directory is unused (PyCharm artifact).

## Architecture

**Single HTML entry point** (`index.html`) with SPA-style page switching via JS class toggling (`.page.active`). No router library — navigation is handled by `showPage()` in `app.js`.

### Pages (all defined as `<section class="page">` in index.html)
- **Shop overview** (`page-shop`) — product listing with criss-cross layout
- **Product configurator** (`page-product`) — interactive option selector with CSS-based 3D model preview and dynamic pricing
- **Blog** (`page-blog`), **About** (`page-about`), **Contact** (`page-contact`)

### Key Files
- `js/app.js` — IIFE containing all application logic: navigation, product configurator, cart (in-memory array, no persistence), toast notifications, scroll reveal (IntersectionObserver)
- `js/i18n.js` — Bilingual support (Korean/English). All translatable strings use `data-i18n` attributes on HTML elements. `translations` object holds ko/en maps. `t(key)` returns current-language string. `setLanguage(lang)` updates all `[data-i18n]` elements.
- `css/style.css` — Complete styling with CSS custom properties in `:root`. Black & white editorial theme. Responsive breakpoints at 768px and 480px.

### Product Data Model (in app.js)
Three products: `small` (35mm), `medium` (120 film), `multi` (all formats). Each has base/glass prices and optional add-ons (scan tube, roller, 110/APS film support). The `multi` product uniquely shows 110 and APS options.

### Fonts
- Display: Bricolage Grotesque (Google Fonts CDN)
- Body/Korean: Pretendard Variable (jsDelivr CDN)

## Conventions

- Bilingual: every user-facing string must have a `data-i18n` key and entries in both `ko` and `en` objects in `i18n.js`
- Prices are in KRW (₩), formatted with `toLocaleString()`
- No external JS dependencies — everything is vanilla
- CSS uses `var(--gray-*)` scale and `var(--transition)` for consistent theming
