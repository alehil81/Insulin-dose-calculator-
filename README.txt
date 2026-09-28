Insulin Dose Calculator v4

Changes from v3
- Fixed iPhone Safari focus zoom by using 16px text size for inputs on mobile.
- Expanded abbreviations in the main interface:
  * Meal + Correction
  * Correction
  * Insulin:carb ratio
  * Insulin sensitivity
  * Active insulin time
- Removed manual IOB input entirely.
- Active insulin is now estimated only from the most recent rapid-acting dose,
  hours since dose, and the entered active insulin time.
- Updated dose-breakdown and TDD labels to use clearer wording.
- Preserved the compact v3 layout and all existing calculations otherwise.

Files to replace on GitHub Pages
- index.html
- styles.css
- insulin_app.js
- sw.js

The icon files and manifest are unchanged but are included in the package.
