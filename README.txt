Insulin Dose Calculator v6

Fixes:
- Corrected the mobile horizontal overflow that made the Rapid-acting dose panel
  wider than the screen.
- Top header card and Rapid-acting dose card are now constrained to the same
  full available width.
- Added strict min-width:0 / max-width:100% containment to nested grids, fields,
  inputs, modifier cards, and panels.
- Mobile one-column grid now uses minmax(0,1fr), preventing intrinsic content
  widths from forcing the page wider than the viewport.
- The page itself now prevents horizontal scrolling.
- Updated icon.svg (the icon actually displayed in the header) to the requested
  outline-style syringe + blood drop + calculator design.
- Calculation logic is unchanged.

Replace on GitHub Pages:
index.html
styles.css
insulin_app.js
sw.js
icon.svg
