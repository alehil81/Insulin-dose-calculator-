Insulin Dose Calculator v1

Purpose
- Mobile-first outpatient rapid-acting meal/correction bolus calculator.
- Static GitHub Pages/PWA-style app with no server dependency.

Core calculator
- Meal dose = carbohydrate grams / ICR
- Correction dose = (current glucose - target glucose) / ISF
- Positive correction IOB is subtracted only from the positive correction component.
- Optional negative correction can reduce meal bolus.
- Final dose is floored at 0 and rounded to 0.1, 0.5, or 1 unit.

Features
- Meal + correction, meal-only, and correction-only modes
- mg/dL / mmol/L unit toggle with conversion
- IOB input
- Optional 500-rule ICR estimator and 1800-rule ISF estimator
- Low-glucose and high-glucose flags
- Saved clinician defaults stored locally
- Case-specific current glucose, carbs, and IOB are not persisted
- Dark/light system appearance
- Offline service worker

Clinical reference
UCSF Diabetes Teaching Center:
https://diabetesteachingcenter.ucsf.edu/about-diabetes/type-2-diabetes/use-insulin-type-2-diabetes/calculating-insulin-dose

Important
This is a transparent clinical-reference calculator, not a substitute for individualized
insulin settings, clinical judgment, device-specific bolus-calculator logic, or a patient's
prescribed hypoglycemia/sick-day plan.
