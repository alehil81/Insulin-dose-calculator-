Insulin Dose Calculator v7 — exponential active-insulin model

Changes
- Added a case-specific question for the most recent rapid-acting bolus:
  * Meal
  * Correction
  * Meal + correction
- Replaced the prior linear IOB decay with the configurable exponential insulin
  model equation used by LoopKit.
- Standard rapid-acting model parameters used:
  * peak activity: 75 minutes
  * onset/effect delay: 10 minutes
  * action duration: the user's entered Active insulin time (default remains 4 h)
- Active insulin is still applied to the positive correction component rather
  than automatically subtracting it from carbohydrate coverage.
- The recent-bolus purpose does NOT change the pharmacologic amount of insulin
  remaining; it changes the clinical interpretation/warning.
- Added model detail to the UI and updated warnings.

Important
- This is still a model, not a direct measurement of circulating/effective insulin.
- Pharmacodynamics vary by insulin formulation, dose, site, perfusion, exercise,
  temperature, and individual physiology.
- The model requires an active insulin time >2.5 h with the 75-minute peak.

Reference implementation
LoopKit ExponentialInsulinModel / rapidActingAdult preset.

All other v6 calculator logic is preserved.
