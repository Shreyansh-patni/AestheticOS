# AestheticOS: Precision Personal Fitness Application

> **A genuine cross-platform native mobile application for Android and iOS built with React Native, Expo, TypeScript, Expo SQLite, and Apple-inspired Human Interface monochromatic design.**

---

## 1. Executive Summary

**AestheticOS** is designed for the focused athlete seeking to build a lean, aesthetic, and athletic physique. It strictly implements an offline-first architecture with persistent local storage, native screen transitions, haptic feedback, and a clean monochromatic design inspired by Apple's Human Interface Guidelines and Linear.

### Athlete Profile & Baseline Parameters
- **Height**: 175 cm
- **Current Weight**: 55.0 kg
- **Target Weight**: 65.0 kg (+10 kg lean muscular mass target)
- **Primary Goal**: Build a lean, aesthetic, and athletic physique with golden-ratio V-taper proportions.
- **Secondary Priorities**:
  - Upper clavicular chest development
  - Lateral deltoid width & 3D shoulder shape
  - Latissimus dorsi flare for V-taper aesthetics
  - Biceps, triceps, and forearm vascularity & strength
  - Core stability and defined abdominal wall
  - Balanced quadriceps, hamstrings, and calves
  - Cardiovascular baseline without interfering with hypertrophy
- **Training Frequency**: 5 Strength Training Days + 2 Active Recovery Days per week.
- **Cardio Targets**: 30 minutes daily walking + 2–3 easy aerobic base runs per week.
- **Nutrition Targets**: 2,350 kcal/day (gentle lean gaining surplus; strictly no aggressive deficits or crash diets) with 95g+ daily protein from high-quality vegetarian and egg sources, 3.0L daily hydration, and 5g daily creatine monohydrate.

---

## 2. Technology Stack

- **Framework**: [React Native](https://reactnative.dev/) `0.88` with [Expo SDK 58](https://expo.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) `~5.7` with strict typechecking
- **Routing**: [Expo Router v58](https://docs.expo.dev/router/introduction/) (File-based native routing with native tabs and stack screens)
- **Database**: [Expo SQLite v15](https://docs.expo.dev/versions/latest/sdk/sqlite/) (`expo-sqlite` WAL-mode offline relational database)
- **Secure Storage**: [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- **Haptics**: [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) (Subtle iOS/Android tactile feedback)
- **Graphics**: [react-native-svg](https://github.com/software-mansion/react-native-svg) (Apple-inspired concentric activity rings and vector charts)
- **Iconography**: `@expo/vector-icons` (Apple SF-aligned Ionicons)
- **Build System**: EAS Build (`eas.json`) + Local Gradle Wrapper (`android/gradlew`)

---

## 3. Apple-Inspired Monochromatic Palette

Following Apple's Human Interface Guidelines and modern monochromatic SaaS aesthetics, the interface uses true pitch-black dark mode with subtle slate surfaces:

| Token | Dark Theme (Default) | Light Theme | Usage |
|---|---|---|---|
| **Base** | `#000000` | `#FFFFFF` | Background canvas |
| **Card** | `#0A0A0A` | `#FAFAFA` | Elevated surfaces |
| **Subtle** | `#171717` | `#F5F5F5` | Input backgrounds, steppers |
| **Border** | `#262626` | `#E5E5E5` | Structural dividers |
| **Border Strong**| `#373737` | `#D4D4D4` | Active card outlines |
| **Text Primary** | `#FAFAFA` | `#0A0A0A` | Headings & active numbers |
| **Text Secondary**| `#D4D4D4` | `#525252` | Body copy & metrics |
| **Text Muted** | `#8A8A8A` | `#737373` | Tags, units, metadata |
| **Accent** | `#10B981` | `#10B981` | Completed checks, streaks, PRs |
| **Warning** | `#F59E0B` | `#F59E0B` | Fatigue warnings, paused timers |
| **Danger** | `#EF4444` | `#EF4444` | Destructive confirmations |

---

## 4. Application Architecture & Screens

```
AestheticOS/
├── app/
│   ├── _layout.tsx           # Root navigation stack & SQLite initializer
│   ├── (tabs)/
│   │   ├── _layout.tsx       # 5-tab native bar with Apple monochromatic styling
│   │   ├── index.tsx         # Today Dashboard (Rings, workout card, habits, spot-reduction cue)
│   │   ├── workout.tsx       # Gym Mode (Active set tracker, RIR, live stopwatch, rest timer)
│   │   ├── cardio.tsx        # Cardio Tracker (30m live walking timer, easy running logger)
│   │   ├── nutrition.tsx     # Fuel & Hydration (Macros, vegetarian/egg database, water, creatine)
│   │   └── progress.tsx      # Progress (V-taper ratio, weight trend, measurement ledger)
│   ├── exercises.tsx         # 40+ Exercise Library categorized by muscle with execution cues
│   ├── challenge.tsx         # 30-Day Aesthetic Foundation Challenge & Milestones
│   ├── history.tsx           # Workout History Ledger with volume and set breakdowns
│   ├── settings.tsx          # Profile editor, unit system, JSON export & DB reset
│   └── modal.tsx             # About AestheticOS modal
├── components/
│   ├── NativeCard.tsx        # Monochromatic bordered card surface
│   ├── NativeButton.tsx      # Haptic pressable button (primary, secondary, accent, danger)
│   ├── HeaderBar.tsx         # iOS/Android clean navigation header
│   ├── ActivityRings.tsx     # Concentric SVG rings (Strength, Walk, Nutrition)
│   └── RestTimerModal.tsx    # Standalone rest timer with presets (60s, 90s, 120s, 180s)
├── constants/
│   ├── Colors.ts             # Monochromatic theme palette
│   └── InitialData.ts        # 7-day program, 40+ exercises, vegetarian foods, profile
├── services/
│   ├── database.ts           # Expo SQLite offline database client & queries
│   ├── haptics.ts            # Tactile feedback service
│   └── secureStore.ts        # Encrypted settings storage
├── types/
│   └── index.ts              # Full TypeScript models & interfaces
├── android/                  # Native Android project with Gradle wrapper
├── app.json                  # Expo application configuration & plugins
└── eas.json                  # EAS Build configuration for APK and AAB
```

---

## 5. The Weekly Hypertrophy Programme

A scientific 5-day push/pull/legs/upper split engineered for shoulder width, lat flare, upper chest density, and arm development:

| Day | Routine | Focus Areas |
|---|---|---|
| **Monday** | Chest + Side Delts + Arms | Incline DB Press, Flat Bench, Cable Fly, DB Lateral Raise, Lean-Away Lateral Raise, Rear Delt Fly, Alternating DB Curl, Overhead DB Triceps Extension |
| **Tuesday** | Back + Lats + Traps + Forearms | Pull-ups / Lat Pulldown, 1-Arm DB Row, Chest-Supported Row, DB Pullover, Rear Delt Fly, DB Shrugs, Farmer's Carry, Incline DB Curl, Hammer Curl, Reverse DB Curl |
| **Wednesday** | Legs + Abs + Arms | Barbell Back Squat, Leg Press, Bulgarian Split Squat, Romanian Deadlift, Leg Curl, Standing Calf Raise, Hanging Knee Raise, Reverse Crunch, Side Plank, Hammer Curl, Overhead Triceps Ext |
| **Thursday** | Upper Chest + Shoulders + Arms | Incline DB Press, DB Squeeze Press, DB Shoulder Press, DB Lateral Raise, Rear Delt Fly, EZ-Bar / DB Curl, Hammer Curl, DB Skull Crusher, Rope Triceps Pushdown |
| **Friday** | Back + Leg Accessories + Abs + Arms | Pull-ups / Lat Pulldown, 1-Arm DB Row, Seated Cable Row, Leg Extension, Leg Curl, Standing Calf Raise, Reverse Crunch, Dead Bug, DB Curl, DB Skull Crusher, Wrist Curl |
| **Saturday** | Active Recovery | 30-min brisk walk, full-body & shoulder mobility, hip opening, gentle stretching |
| **Sunday** | Active Recovery | 30-min brisk walk, posture reset, deep breathing, recovery activities |

---

## 6. Offline SQLite Database Schema

All data is stored in the local SQLite database (`aestheticos.db`) using write-ahead logging (WAL):

- `profile`: User settings, height, current/target weights, calorie & protein targets.
- `program`: The 7-day workout routine with editable target sets and reps.
- `exercises`: Master exercise library with cues, common mistakes, and substitutions.
- `workout_history`: Recorded sessions with duration, total tonnage volume (kg), and set details.
- `active_session`: Persisted in-flight gym session allowing seamless app restarts without data loss.
- `walk_logs`: Daily walking sessions and duration.
- `run_logs`: Running sessions with distance, duration, pace (min/km), and type.
- `nutrition_logs`: Daily food logs with calories, protein, carbs, and fat.
- `daily_habits`: Daily completion checklist (workout, walk, run, protein, water, sleep, supplements).
- `measurements`: Weight, waist, chest, arms, shoulders, thighs, and notes.
- `challenge_days`: 30-Day Foundation Challenge completion ledger.

---

## 7. How to Run & Build

### Prerequisites
- Node.js `18+` or `20+`
- Expo CLI (`npm install -g eas-cli`)

### Run Development Server
```bash
npm install
npm start
```

Press `a` in the terminal to launch the Android emulator or connect your phone via Expo Go.

### Type Check
```bash
npm run tsc # or: npx tsc --noEmit
```

### Build Android APK (Installable on any Android device)
Using EAS Build (cloud):
```bash
eas build -p android --profile preview
```
This generates a direct download link for the standalone `.apk`.

Or build locally with the included Gradle wrapper:
```bash
cd android
./gradlew assembleRelease
# The APK is generated at: android/app/build/outputs/apk/release/app-release.apk
```

### Build Android AAB (For Google Play Store submission)
```bash
eas build -p android --profile production
```
Or build locally:
```bash
cd android
./gradlew bundleRelease
# The AAB is generated at: android/app/build/outputs/bundle/release/app-release.aab
```

### Build iOS Application
```bash
eas build -p ios --profile preview    # Simulator build (.tar.gz)
eas build -p ios --profile production # App Store production build (.ipa)
```

---

## 8. Fitness & Health Safety Compliance

1. **No Calorie Deficit**: AestheticOS is calibrated for lean mass gain (55kg → 65kg target) with 2,350 kcal/day and adequate carbohydrates to fuel intense resistance training.
2. **Spot Reduction Myth**: Prominently dispels the myth of spot fat reduction. Explains that systemic body composition improvements come from caloric balance, consistent progressive overload, and patience.
3. **Recovery Focus**: Incorporates active recovery guidelines, RIR (reps in reserve) target of 1–2 to avoid central nervous system burnout, and rest day encouragement.
4. **Vegetarian & Egg Nutrition**: Features rich protein sources (Eggs, Whey, Paneer, Tofu, Moong Dal, Greek Yogurt, Soya Chunks) tailored to vegetarian diets.
