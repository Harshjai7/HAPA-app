# HAPA — Personal Gym Trainer 💪

A fully offline personal gym trainer built with **plain HTML, CSS, and JavaScript**. No frameworks, no servers, no accounts on the internet — everything is saved in your browser's **localStorage**.

Built for: beginner lifter, pure veg (no egg, no supplements), goal = lose belly fat + build a slim, strong, aesthetic body.

## How to run

Just double-click **`index.html`** — it opens in your browser and works immediately. Internet is only needed to watch the exercise videos; everything else works offline.

## Features

- **Login / create account** — local only, per-person profiles on the same computer
- **Profile form** — age, height, weight with live **BMI** calculation, target weight, goal
- **Optional photo upload** — profile photo + progress photos (compressed, stored locally)
- **Goal modes** — Fat Loss / Slim + Strong (aesthetic) / Build Muscle — changes calorie targets and adds cardio finishers
- **Day selector** — choose 3–6 days/week and *which* weekdays; the app picks the right split automatically:
  - 3 days → Full Body A/B/C
  - 4 days → Upper/Lower ×2
  - 5 days → Push/Pull/Legs + Upper + Lower
  - 6 days → Push/Pull/Legs ×2
- **Workout time + before/after food** preference, with real guidance for both
- **Workout tracker** — sets, reps, weight per set (only for exercises that use weight), auto **rest timer** with beep, remembers your last weight per exercise so you always know what to beat
- **Instruction videos** — every exercise has a verified YouTube tutorial embedded + a direct link
- **Step-by-step form instructions** + the #1 common mistake for every exercise
- **Optional calorie & protein tracker** — pure-veg Indian food database (dal, paneer, soya chunks, roti…), targets calculated from your body stats and goal
- **Add / edit foods** — create your own foods (➕ New food), edit any food's values with ✎ (editing a built-in food replaces it with your version; delete your version to get the original back)
- **Progress** — weight trend chart, progress photos, workout history
- **Guide** — beginner rules, veg protein guide (no egg), food timing, expectations timeline
- **Backup** — export/import all your data as a JSON file (Settings → Data)

## Files

```
index.html      — the app (open this)
css/style.css   — styles
js/data.js      — exercise database, food database, plan templates (JSON data)
js/app.js       — app logic + localStorage
```

## Important notes

- Data lives in **this browser on this computer**. Clearing browser data erases it — use **Settings → Export backup** regularly.
- The login is a convenience lock for family members sharing a PC, **not** real security.
- Food values are good-faith approximations of Indian household portions.
- Videos need internet; the rest of the app is fully offline.

## Disclaimer

This app gives general fitness guidance for healthy adults. If you have any medical condition, injury, or pain (not soreness — pain), talk to a doctor or a qualified trainer at your gym.
