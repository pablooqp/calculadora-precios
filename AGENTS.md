# AGENTS.md

## Project Overview

Calculadora de Costos Factura — a single-page vanilla HTML/CSS/JS calculator for Chilean invoice cost analysis, PVP pricing, and tax calculations (ILA, IABA, IVA). Imports SII XML invoices, parses PDF invoices, and persists data to `localStorage`.

- **No build tools, no framework, no package manager.**
- **Entry point:** `index.html` → loads Tailwind CDN, `style.css`, `script.js?v=N`
- **State:** the DOM is the source of truth; no separate state management.

## How to Run

```bash
# Just open index.html in a browser, or serve locally:
python3 -m http.server 8080
# Then visit http://localhost:8080
```

There are no lint, test, or build commands. For syntax checks use:
```bash
node -e "new Function(require('fs').readFileSync('script.js','utf8'))" && echo "Syntax OK"
```

## Cache Busting

Every change to `script.js` must bump the version query parameter in `index.html`:
```html
<script src="script.js?v=N"></script>  <!-- increment N -->
```
Users should hard-refresh with **Cmd+Shift+R** after deploying changes.

## Architecture

```
index.html     — UI skeleton (Tailwind classes, form inputs, sidebar panels)
script.js      — All business logic (1100+ lines)
style.css      — Custom styles (cards, autocomplete dropdown, mobile responsive)
```

**Data flow:** User fills form → every input triggers `calcularTodo()` → reads DOM values → computes Chilean tax math → writes results back to DOM spans/inputs. Saved to `localStorage["facturas"]`.

## Code Conventions

### Language
- **All identifiers, comments, and user-facing strings are in Spanish** (e.g., `calcularTodo`, `guardarFactura`, `fleteTotal`, `cuerpoTabla`).

### Naming
- **camelCase** for JS variables and functions.
- **kebab-case** for DOM IDs with prefix conventions:
  - `res*` — sidebar Resumen Factura
  - `rent*` — sidebar Resumen Rentabilidad
  - `det*` — expandable detail panel inside product rows
  - `fila-main-{id}` / `fila-details-{id}` — product row pairs

### Function Style
- Use `function` declarations (not arrow functions) at module scope for hoisting.
- Arrow functions OK for callbacks (`.forEach`, `.map`, `onload` handlers).
- All DOM IDs referenced directly via `document.getElementById()` — no caching.

### Error Handling
- Use `try/catch` for async operations and file parsing.
- User feedback via `alert()` and `confirm()`.
- Guard clauses with early returns for null elements, zero quantities, empty arrays.

### Async Patterns
- `async/await` for fetch, PDF.js, and dynamic script loading.
- `FileReader` callbacks (not promisified) for file imports.
- Dynamic CDN scripts loaded with `new Promise` wrapping `onload`/`onerror`.

### DOM Manipulation
- Product rows are generated via `innerHTML` template literals, not `createElement`.
- Detail panels use CSS transitions (`.collapsed`/`.expanded` classes toggling `max-height`, `opacity`).
- Autocomplete dropdown uses fixed positioning via `getBoundingClientRect()`, appended to `document.body`.

### Calculations
- All financial calculations use Chilean tax rates: IVA 19%, ILA 20.5% (wine/beer), ILA 31.5% (spirits), IABA 10%/18%.
- Logistics allocation supports 3 methods: `proporcional`, `simple`, `ccu`.
- `calcularTodo()` is the master recalculation function — call it after any form change.
- `calcularDesdePVP(id)` back-calculates margin from a user-entered PVP value.

### Number Parsing
- `parsearNumeroCL(str)` handles Chilean format: dot as thousands separator, comma as decimal.
- `formatoDinero(valor)` outputs CLP formatting via `Intl.NumberFormat("es-CL")`.

## PDF Import Pipeline

1. `importarPDFFactura(event)` — loads PDF.js from CDN, extracts text grouped by Y-coordinate
2. `parsearTextoFactura(texto)` — regex extraction: company name (line before "Giro:"), folio, Spanish dates, flete, products
3. `extraerProductosPDF(lineas)` — numeric pattern matching per row with multi-format detection:
   - Comma-decimal (Chilean): ILA at last comma < 100, qty 2 before it
   - Dot-decimal (normalized): ILA at n-3 with dot, qty at n-5
   - Compact (no tax): 4 matches, qty at position 1
   - No-comma with many extras: n-3 has dot or is "10"/"18" → 5-from-end; else 3-from-end
4. `generarXMLdesdePDF(datos)` → SII DTE XML
5. `procesarXMLSII(xmlText)` → fills form

## Tax Detection

- **ILA**: codes 15/16 (wine 20.5%), 17/18 (spirits 31.5%)
- **IABA**: TasaImp 10% or 18% (no CodImp in XML)
- Product row dropdown includes all 4 options (Sin Impuesto, ILA Vino, ILA Destilado, IABA 10%, IABA 18%)
- In calculations, the dropdown value directly becomes the tax multiplier

## Weight Detection

Products classified as "pesados" (sold by kilos) when quantity has decimals (`cant !== Math.floor(cant)`). Also keyword-based for analysis panel (`PESO_PATTERNS`). Only decimal-quantity products contribute to the peso total in the rentability sidebar.

## SKU Pattern

Product codes are removed from names before display. Current pattern handles:
- `INT1-VIN004118` (letters+digits-dash-letters+digits)
- `INT1-870205` (letters+digits-dash-digits)
- `INTERNO-4081` (all-letters-dash-digits)
- `INT1-000295-008` (multi-dash)

Pattern: `/^[A-Za-z0-9]+(?:[-][A-Za-z0-9]+)+\s*/`

## Edit Mode

`facturaEnEdicion` — when non-null, "Guardar" overwrites the existing invoice instead of creating a new one. Set automatically when:
- User clicks edit on a saved invoice
- User saves and chooses "No" to clearing the form

Set to `null` when "Nueva Factura" or "Limpiar" is clicked.

## Testing

Manual testing only. Test with the sample invoices in `document-create/` and `document-example-origin/`. After code changes, spot-check:
- Product quantities, names, and totals
- Tax detection (ILA/IABA)
- PDF import for all known formats (Tropezon, CCU, Clara Luz, Santa Elena)
- Save/load/edit/delete cycle from localStorage
