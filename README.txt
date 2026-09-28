Insulin Dose Calculator v2

Changes from v1
- Removed glucose-unit toggle; calculator now uses mg/dL only.
- Removed rounding controls; final rapid-acting dose rounds to nearest whole unit.
- Target glucose defaults to 120 mg/dL but remains editable.
- Added activity adjustment toggle with editable reduction, default 20%.
- Added corticosteroid adjustment toggle with editable rapid-acting increase, default 20%.
  UI names examples such as prednisone and dexamethasone.
- Added editable active-insulin time, default 4 hours.
- Added recent rapid-acting insulin dose + hours-since-dose inputs.
- Added estimated IOB using a transparent linear active-insulin approximation.
- Manual IOB remains available as an override.
- Added basal insulin self-titration helper using 3 consecutive fasting morning BGs.
- Basal increment defaults to 2 units and remains editable.
- Basal helper displays median fasting BG and recommended adjusted basal dose.

Basal titration rule
- Median >120 mg/dL AND no value <80: increase by selected increment.
- Median 100–120 mg/dL: no change.
- Median <100 mg/dL OR any value <80: decrease by selected increment.
- Any value <70 adds a hypoglycemia warning.

Important
- Activity and steroid percentages are configurable heuristics rather than universal dosing rules.
- Recent-dose IOB uses a simple linear approximation and is not equivalent to a pump bolus calculator's pharmacodynamic model.
- This is a clinician-oriented reference calculator, not a substitute for individualized insulin settings or clinical judgment.
