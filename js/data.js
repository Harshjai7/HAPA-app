/* ============================================================
   HAPA — Data layer (JSON structures)
   Exercise database, food database, weekly plan templates.
   Kept as JS constants so the app works when opened directly
   from disk (file://) without a web server. The shapes are pure
   JSON — you can copy them into .json files any time.
   ============================================================ */

/* ---------- EXERCISE DATABASE ----------
   needsWeight: true  -> app shows a weight input per set
   videoId: YouTube video id for inline embed (null -> search link)
*/
const EXERCISES = {
  /* ------------- CHEST ------------- */
  "machine-chest-press": {
    name: "Machine Chest Press", muscle: "Chest", equipment: "Machine",
    needsWeight: true, sets: 3, reps: "10-12", restSec: 90, level: "Beginner",
    startWeight: "Start light: pick a weight where the last 2 reps feel hard but form stays clean.",
    steps: [
      "Set the seat so handles line up with mid-chest.",
      "Press handles forward until arms are almost straight (don't lock elbows).",
      "Lower back slowly (2-3 seconds) until hands are near your chest.",
      "Keep back and head against the pad the whole time."
    ],
    mistake: "Bouncing the weight stack — control the way back, that's where muscle is built.",
    videoId: "sqNwDkUU_Ps", search: "machine chest press proper form beginner"
  },
  "incline-db-press": {
    name: "Incline Dumbbell Press", muscle: "Chest (upper)", equipment: "Dumbbell",
    needsWeight: true, sets: 3, reps: "8-10", restSec: 90, level: "Beginner",
    startWeight: "Start with 5-7.5 kg dumbbells and learn the path first.",
    steps: [
      "Set bench to ~30° incline. Sit with dumbbells on thighs, kick them up as you lie back.",
      "Press dumbbells up and slightly together over your upper chest.",
      "Lower slowly until elbows are just below shoulder level.",
      "Keep wrists straight and feet planted."
    ],
    mistake: "Setting the incline too steep (45°+) turns it into a shoulder press.",
    videoId: "hChjZQhX1Ls", search: "incline dumbbell press form"
  },
  "flat-db-press": {
    name: "Flat Dumbbell Bench Press", muscle: "Chest", equipment: "Dumbbell",
    needsWeight: true, sets: 3, reps: "8-10", restSec: 90, level: "Beginner",
    startWeight: "Start with 5-7.5 kg per hand.",
    steps: [
      "Lie flat, dumbbells over chest, palms facing forward.",
      "Lower slowly until you feel a chest stretch, elbows ~45° from body.",
      "Press back up without clanging the dumbbells together.",
      "Shoulder blades pinched back into the bench."
    ],
    mistake: "Flaring elbows straight out to 90° — stresses the shoulders.",
    videoId: "Vc63DPUoA40", search: "flat dumbbell bench press form"
  },
  "pec-deck": {
    name: "Pec Deck (Machine Fly)", muscle: "Chest", equipment: "Machine",
    needsWeight: true, sets: 3, reps: "12-15", restSec: 60, level: "Beginner",
    startWeight: "Light weight, big stretch — this is a feel exercise, not an ego lift.",
    steps: [
      "Adjust seat so handles are at chest height.",
      "With a slight elbow bend, bring the handles together in front of you.",
      "Squeeze the chest for 1 second at the middle.",
      "Open back slowly until you feel a comfortable stretch."
    ],
    mistake: "Going too heavy and jerking — keep it slow and squeezed.",
    videoId: "H4mVGHaK2f4", search: "pec deck machine fly form"
  },
  "pushup": {
    name: "Push-Up", muscle: "Chest / Triceps / Core", equipment: "Bodyweight",
    needsWeight: false, sets: 3, reps: "As many clean reps as possible", restSec: 60, level: "Beginner",
    startWeight: "Too hard? Do them with hands on a bench (incline push-ups).",
    steps: [
      "Hands slightly wider than shoulders, body in one straight line.",
      "Lower your chest to just above the floor, elbows ~45° from body.",
      "Push back up fully. Squeeze glutes and abs the whole time.",
      "If hips sag or pike up, rest — the set is over."
    ],
    mistake: "Half reps — chest should nearly touch the floor each rep.",
    videoId: "WDIpL0pjun0", search: "perfect push up form"
  },

  /* ------------- BACK ------------- */
  "lat-pulldown": {
    name: "Lat Pulldown", muscle: "Back (lats)", equipment: "Cable machine",
    needsWeight: true, sets: 3, reps: "10-12", restSec: 90, level: "Beginner",
    startWeight: "Start around half your body weight on the stack and adjust.",
    steps: [
      "Grip the bar slightly wider than shoulders, thighs locked under the pad.",
      "Pull the bar down to your upper chest, driving elbows down and back.",
      "Squeeze your back, then let the bar rise slowly to a full stretch.",
      "Lean back only slightly (10-15°) — no swinging."
    ],
    mistake: "Pulling behind the neck or using body momentum.",
    videoId: "CAwf7n6Luuc", search: "lat pulldown proper form"
  },
  "seated-cable-row": {
    name: "Seated Cable Row", muscle: "Back (mid)", equipment: "Cable machine",
    needsWeight: true, sets: 3, reps: "10-12", restSec: 90, level: "Beginner",
    startWeight: "Moderate weight — you should feel it in the back, not the arms.",
    steps: [
      "Sit tall, knees slightly bent, grab the handle.",
      "Pull the handle to your belly button, elbows sliding past your ribs.",
      "Squeeze shoulder blades together for 1 second.",
      "Return slowly, letting shoulders stretch forward slightly — keep the spine tall."
    ],
    mistake: "Rocking your torso back and forth to move the weight.",
    videoId: "sP_4vybjVJs", search: "seated cable row proper form"
  },
  "assisted-pullup": {
    name: "Assisted Pull-Up", muscle: "Back / Biceps", equipment: "Machine",
    needsWeight: true, sets: 3, reps: "6-10", restSec: 90, level: "Beginner",
    startWeight: "More assistance weight = easier. Pick assistance that lets you get 6-10 reps.",
    steps: [
      "Kneel or stand on the assist pad, grab the wide handles.",
      "Pull yourself up until your chin passes the handles' height.",
      "Lower slowly to a full hang — full range every rep.",
      "Reduce the assistance weight a little each week."
    ],
    mistake: "Short choppy reps at the top — the stretch at the bottom matters most.",
    videoId: "wFj808u2HWU", search: "assisted pull up machine form"
  },
  "one-arm-db-row": {
    name: "One-Arm Dumbbell Row", muscle: "Back", equipment: "Dumbbell",
    needsWeight: true, sets: 3, reps: "10-12 each side", restSec: 60, level: "Beginner",
    startWeight: "Start with 7.5-10 kg.",
    steps: [
      "One knee and hand on a bench, other foot on the floor, back flat.",
      "Row the dumbbell to your hip (not your chest), elbow close to body.",
      "Squeeze at the top, lower slowly to a full arm stretch.",
      "Do all reps one side, then switch."
    ],
    mistake: "Twisting the torso to heave the weight up.",
    videoId: "pYcpY20QaE8", search: "one arm dumbbell row form"
  },

  /* ------------- SHOULDERS ------------- */
  "db-shoulder-press": {
    name: "Seated Dumbbell Shoulder Press", muscle: "Shoulders", equipment: "Dumbbell",
    needsWeight: true, sets: 3, reps: "8-10", restSec: 90, level: "Beginner",
    startWeight: "Start with 5-7.5 kg per hand.",
    steps: [
      "Sit on a bench with back support, dumbbells at shoulder height, palms forward.",
      "Press straight up until arms are nearly locked overhead.",
      "Lower slowly back to ear level.",
      "Keep your lower back against the pad — don't arch hard."
    ],
    mistake: "Arching the lower back to press heavier weight.",
    videoId: "qEwKCR5JCog", search: "seated dumbbell shoulder press form"
  },
  "lateral-raise": {
    name: "Dumbbell Lateral Raise", muscle: "Shoulders (side)", equipment: "Dumbbell",
    needsWeight: true, sets: 3, reps: "12-15", restSec: 60, level: "Beginner",
    startWeight: "Go LIGHT: 2.5-5 kg. This one is famous for being done too heavy.",
    steps: [
      "Stand tall, dumbbells at your sides, slight elbow bend.",
      "Raise arms out to the sides until they reach shoulder height.",
      "Pause briefly, then lower slowly (3 seconds down).",
      "Lead with the elbows, like pouring water from a jug."
    ],
    mistake: "Swinging the weights up with momentum — cut the weight in half instead.",
    videoId: "3VcKaXpzqRo", search: "dumbbell lateral raise proper form"
  },
  "face-pull": {
    name: "Cable Face Pull", muscle: "Rear shoulders / Upper back", equipment: "Cable machine",
    needsWeight: true, sets: 3, reps: "12-15", restSec: 60, level: "Beginner",
    startWeight: "Light-moderate. Great for posture — desk workers' best friend.",
    steps: [
      "Set a rope attachment at upper-chest/face height.",
      "Pull the rope towards your face, splitting the ends past your ears.",
      "Squeeze shoulder blades and rotate knuckles towards the ceiling.",
      "Return slowly with control."
    ],
    mistake: "Pulling to the chest instead of the face — keep elbows high.",
    videoId: "eTCBSFlCJ_s", search: "cable face pull proper form"
  },
  "rear-delt-fly": {
    name: "Reverse Pec Deck (Rear Delt Fly)", muscle: "Rear shoulders", equipment: "Machine",
    needsWeight: true, sets: 3, reps: "12-15", restSec: 60, level: "Beginner",
    startWeight: "Light weight, strict form.",
    steps: [
      "Sit facing the pec deck machine, chest against the pad.",
      "Grab handles and sweep your arms back in a wide arc.",
      "Squeeze the back of your shoulders at the end.",
      "Return slowly — no stack slamming."
    ],
    mistake: "Shrugging shoulders up — keep them down and relaxed.",
    videoId: "dC7jhEk-29A", search: "reverse pec deck rear delt form"
  },

  /* ------------- ARMS ------------- */
  "db-curl": {
    name: "Dumbbell Bicep Curl", muscle: "Biceps", equipment: "Dumbbell",
    needsWeight: true, sets: 3, reps: "10-12", restSec: 60, level: "Beginner",
    startWeight: "Start with 5-7.5 kg per hand.",
    steps: [
      "Stand tall, dumbbells at sides, palms forward.",
      "Curl the weights up while keeping elbows pinned to your sides.",
      "Squeeze at the top, lower slowly (3 seconds).",
      "No swinging — if you rock, the weight is too heavy."
    ],
    mistake: "Moving the elbows forward to lift more — cheats the biceps.",
    videoId: "ykJmrZ5v0Oo", search: "dumbbell bicep curl proper form"
  },
  "hammer-curl": {
    name: "Hammer Curl", muscle: "Biceps / Forearms", equipment: "Dumbbell",
    needsWeight: true, sets: 3, reps: "10-12", restSec: 60, level: "Beginner",
    startWeight: "Same or slightly heavier than regular curls.",
    steps: [
      "Hold dumbbells with palms facing each other (like holding hammers).",
      "Curl up keeping the neutral grip the whole way.",
      "Elbows stay glued to your sides.",
      "Lower under control."
    ],
    mistake: "Turning it into a swing — slow negatives build the arm.",
    videoId: "zC3nLlEvin4", search: "hammer curl proper form"
  },
  "cable-curl": {
    name: "Cable Bicep Curl", muscle: "Biceps", equipment: "Cable machine",
    needsWeight: true, sets: 3, reps: "12-15", restSec: 60, level: "Beginner",
    startWeight: "Constant tension — go a bit lighter than dumbbell curls.",
    steps: [
      "Attach a straight or EZ bar to the low pulley.",
      "Curl the bar to shoulder height, elbows at your sides.",
      "Squeeze, then lower slowly until arms are fully straight.",
      "Stand a small step back from the machine for constant tension."
    ],
    mistake: "Leaning back as you curl.",
    videoId: "16aEi1a68E0", search: "cable bicep curl form"
  },
  "triceps-pushdown": {
    name: "Cable Triceps Pushdown", muscle: "Triceps", equipment: "Cable machine",
    needsWeight: true, sets: 3, reps: "10-12", restSec: 60, level: "Beginner",
    startWeight: "Moderate — you should feel the back of the arm burn.",
    steps: [
      "Rope or bar on the high pulley, elbows pinned to your sides.",
      "Push the handle down until arms are fully straight.",
      "Squeeze the triceps hard for 1 second.",
      "Let it rise slowly only to elbow height — elbows never move."
    ],
    mistake: "Letting elbows drift forward/back — they are hinges, not levers.",
    videoId: "2-LAMcpzODU", search: "tricep pushdown proper form"
  },
  "overhead-db-extension": {
    name: "Overhead Dumbbell Triceps Extension", muscle: "Triceps", equipment: "Dumbbell",
    needsWeight: true, sets: 3, reps: "10-12", restSec: 60, level: "Beginner",
    startWeight: "One dumbbell held with both hands; start 7.5-10 kg.",
    steps: [
      "Hold one dumbbell overhead with both palms under the top plate.",
      "Lower it slowly behind your head until you feel a big triceps stretch.",
      "Press back up to straight arms.",
      "Keep elbows pointing forward, close to your head."
    ],
    mistake: "Flaring elbows out wide — keep them tucked.",
    videoId: "-Vyt2QdsR7E", search: "overhead dumbbell tricep extension form"
  },
  "assisted-dip": {
    name: "Assisted Dip", muscle: "Triceps / Chest", equipment: "Machine",
    needsWeight: true, sets: 3, reps: "8-12", restSec: 90, level: "Beginner",
    startWeight: "More assistance = easier. Choose assistance for 8-12 clean reps.",
    steps: [
      "Kneel on the assist pad, grip the dip handles.",
      "Lower until upper arms are parallel to the floor.",
      "Press back to straight arms.",
      "Stay upright for triceps; lean forward slightly for more chest."
    ],
    mistake: "Dropping too deep too soon — parallel is enough for now.",
    videoId: "kbmVlw-i0Vs", search: "assisted dip machine form"
  },

  /* ------------- LEGS ------------- */
  "leg-press": {
    name: "Leg Press", muscle: "Quads / Glutes", equipment: "Machine",
    needsWeight: true, sets: 3, reps: "10-12", restSec: 120, level: "Beginner",
    startWeight: "Start with just the sled + light plates; add weight weekly.",
    steps: [
      "Feet shoulder-width on the platform, mid-height.",
      "Lower the platform until knees reach ~90° (or as deep as comfortable).",
      "Press back up through your whole foot — don't lock knees hard.",
      "Lower back stays pressed against the seat; never let it round off the pad."
    ],
    mistake: "Going so deep your hips curl off the seat — that risks the lower back.",
    videoId: "p5dCqF7wWUw", search: "leg press machine proper form"
  },
  "goblet-squat": {
    name: "Goblet Squat", muscle: "Quads / Glutes / Core", equipment: "Dumbbell",
    needsWeight: true, sets: 3, reps: "10-12", restSec: 90, level: "Beginner",
    startWeight: "Start with 8-12 kg held at your chest. THE best way to learn squatting.",
    steps: [
      "Hold one dumbbell vertically against your chest with both hands.",
      "Feet shoulder-width, toes slightly out.",
      "Squat down keeping chest up, until thighs are at least parallel.",
      "Drive up through your heels. Knees track over toes."
    ],
    mistake: "Heels lifting off the floor — slow down and sit back more.",
    videoId: "nfX7IFK9UNI", search: "goblet squat proper form"
  },
  "barbell-back-squat": {
    name: "Barbell Back Squat", muscle: "Quads / Glutes / Core", equipment: "Barbell",
    needsWeight: true, sets: 3, reps: "6-8", restSec: 150, level: "Learn after 3-4 weeks",
    startWeight: "Start with the empty bar (20 kg) — seriously. Master goblet squats first.",
    steps: [
      "Bar on upper back (not your neck), hands just outside shoulders.",
      "Unrack, step back, feet shoulder-width.",
      "Squat down with chest up until thighs are parallel or below.",
      "Drive up hard through the whole foot. Brace abs like someone will poke you."
    ],
    mistake: "Adding weight before form is solid. Film yourself or ask a trainer to watch.",
    videoId: "bEv6CCg2BC8", search: "barbell back squat beginner form"
  },
  "db-rdl": {
    name: "Dumbbell Romanian Deadlift", muscle: "Hamstrings / Glutes / Lower back", equipment: "Dumbbell",
    needsWeight: true, sets: 3, reps: "10-12", restSec: 90, level: "Beginner",
    startWeight: "Start with 7.5-10 kg per hand.",
    steps: [
      "Stand tall, dumbbells in front of thighs, slight knee bend.",
      "Push your hips BACK (like closing a car door with your bum) as the weights slide down your legs.",
      "Stop when you feel a strong hamstring stretch (mid-shin is plenty).",
      "Squeeze glutes to stand back up. Back stays flat the entire time."
    ],
    mistake: "Bending the back instead of hinging the hips — this is a hip movement.",
    videoId: "aa57T45iFSE", search: "dumbbell romanian deadlift form"
  },
  "leg-extension": {
    name: "Leg Extension", muscle: "Quads", equipment: "Machine",
    needsWeight: true, sets: 3, reps: "12-15", restSec: 60, level: "Beginner",
    startWeight: "Light-moderate; squeeze at the top.",
    steps: [
      "Adjust the pad to sit on your shins just above the ankles.",
      "Extend legs until straight, squeeze quads for 1 second.",
      "Lower slowly — don't let the stack crash.",
      "Hold the side handles to stay seated."
    ],
    mistake: "Kicking the weight up fast — slow and squeezed wins.",
    videoId: "YyvSfVjQeL0", search: "leg extension machine form"
  },
  "leg-curl": {
    name: "Leg Curl (Lying/Seated)", muscle: "Hamstrings", equipment: "Machine",
    needsWeight: true, sets: 3, reps: "12-15", restSec: 60, level: "Beginner",
    startWeight: "Light-moderate.",
    steps: [
      "Adjust the pad to rest just above your heels.",
      "Curl your heels towards your bum as far as possible.",
      "Pause, then return slowly to a full stretch.",
      "Hips stay pressed down (lying) or back against the seat (seated)."
    ],
    mistake: "Lifting hips off the pad to cheat the rep.",
    videoId: "lUH80pneL5w", search: "leg curl machine proper form"
  },
  "calf-raise": {
    name: "Standing Calf Raise", muscle: "Calves", equipment: "Machine / Bodyweight",
    needsWeight: true, sets: 3, reps: "15-20", restSec: 45, level: "Beginner",
    startWeight: "Machine, or hold a dumbbell standing on a step.",
    steps: [
      "Balls of feet on the edge, heels hanging off.",
      "Lower heels for a deep 2-second stretch.",
      "Rise as high as possible onto your toes.",
      "Pause 1 second at the top. Full range — no bouncing."
    ],
    mistake: "Fast half-rep bouncing — calves need the deep stretch and full squeeze.",
    videoId: "SVtg-1loH4c", search: "standing calf raise proper form"
  },
  "walking-lunge": {
    name: "Walking Lunge", muscle: "Quads / Glutes", equipment: "Dumbbell / Bodyweight",
    needsWeight: true, sets: 3, reps: "10 steps each leg", restSec: 90, level: "Beginner",
    startWeight: "Start with bodyweight only; add dumbbells when 20 steps feel easy.",
    steps: [
      "Step forward and lower until both knees reach ~90°.",
      "Back knee hovers just above the floor.",
      "Push through the front heel to step into the next lunge.",
      "Torso tall, core tight, steps controlled."
    ],
    mistake: "Front knee crashing inward — keep it tracking over the toes.",
    videoId: "_DLIS8SySzs", search: "walking lunge proper form"
  },
  "glute-bridge": {
    name: "Glute Bridge / Hip Thrust", muscle: "Glutes", equipment: "Bodyweight / Barbell",
    needsWeight: false, sets: 3, reps: "12-15", restSec: 60, level: "Beginner",
    startWeight: "Start on the floor with bodyweight; progress to a barbell hip thrust later.",
    steps: [
      "Lie on your back, knees bent, feet flat near your bum.",
      "Drive hips up until your body is straight from knees to shoulders.",
      "Squeeze glutes HARD at the top for 2 seconds.",
      "Lower slowly. Don't arch the lower back — the ribs stay down."
    ],
    mistake: "Pushing through the toes — drive through the heels.",
    videoId: "xDmFkJxPzeM", search: "glute bridge proper form"
  },

  /* ------------- CORE ------------- */
  "plank": {
    name: "Plank", muscle: "Core", equipment: "Bodyweight",
    needsWeight: false, sets: 3, reps: "20-45 sec hold", restSec: 60, level: "Beginner",
    startWeight: "Quality over time — a tight 20s beats a saggy 60s.",
    steps: [
      "Forearms on the floor, elbows under shoulders.",
      "Body in one straight line — squeeze glutes and abs.",
      "Breathe normally; don't hold your breath.",
      "Stop when your hips start to sag."
    ],
    mistake: "Hips too high or sagging low — film yourself once to check.",
    videoId: "ASdvN_XEl_c", search: "plank proper form"
  },
  "hanging-knee-raise": {
    name: "Hanging Knee Raise", muscle: "Abs (lower)", equipment: "Pull-up bar",
    needsWeight: false, sets: 3, reps: "8-12", restSec: 60, level: "Beginner",
    startWeight: "Too hard? Use the captain's chair machine (back supported).",
    steps: [
      "Hang from the bar with straight arms.",
      "Raise knees up towards your chest, tilting the pelvis up at the top.",
      "Lower slowly with control — no swinging.",
      "Exhale as you lift."
    ],
    mistake: "Swinging like a pendulum — pause at the bottom of each rep.",
    videoId: "X-ACS9vpRyU", search: "hanging knee raise proper form"
  },
  "cable-crunch": {
    name: "Cable Crunch", muscle: "Abs", equipment: "Cable machine",
    needsWeight: true, sets: 3, reps: "12-15", restSec: 60, level: "Beginner",
    startWeight: "Moderate — abs are a muscle; they like resistance too.",
    steps: [
      "Kneel below a high pulley holding a rope beside your head.",
      "Crunch down, bringing elbows towards your knees — bend from the ribs, not the hips.",
      "Squeeze abs hard at the bottom.",
      "Return slowly until your abs stretch."
    ],
    mistake: "Pulling with the arms — hands just hold the rope in place.",
    videoId: "36HK6uPM_PQ", search: "cable crunch proper form"
  },
  "dead-bug": {
    name: "Dead Bug", muscle: "Deep core", equipment: "Bodyweight",
    needsWeight: false, sets: 3, reps: "8-10 each side", restSec: 45, level: "Beginner",
    startWeight: "Feels easy? Slow it down until it isn't.",
    steps: [
      "Lie on your back, arms straight up, knees bent 90° over hips.",
      "Press your lower back flat into the floor — keep it there.",
      "Slowly lower opposite arm and leg towards the floor.",
      "Return and switch sides. If the lower back arches, shorten the range."
    ],
    mistake: "Letting the lower back pop off the floor — that's the whole exercise.",
    videoId: "bxn9FBrt4-A", search: "dead bug exercise proper form"
  },
  "russian-twist": {
    name: "Russian Twist", muscle: "Obliques", equipment: "Bodyweight / Dumbbell",
    needsWeight: false, sets: 3, reps: "10-12 each side", restSec: 45, level: "Beginner",
    startWeight: "Bodyweight first; hold a light plate/dumbbell later.",
    steps: [
      "Sit with knees bent, lean back to ~45°, chest proud.",
      "Rotate your torso side to side, touching the floor beside your hip.",
      "Move from the ribs — the head just follows.",
      "Feet down = easier. Feet lifted = harder."
    ],
    mistake: "Just swinging the arms without rotating the torso.",
    videoId: "wkD8rjkodUI", search: "russian twist proper form"
  },

  /* ------------- CARDIO ------------- */
  "treadmill-incline-walk": {
    name: "Treadmill Incline Walk", muscle: "Cardio / Fat loss", equipment: "Treadmill",
    needsWeight: false, sets: 1, reps: "10-20 min, incline 6-10%, speed 4.5-5.5 km/h", restSec: 0, level: "Beginner",
    startWeight: "The most underrated fat-loss tool. You should be able to talk, but be slightly breathless.",
    steps: [
      "Warm up 2 min flat, then raise the incline to 6-10%.",
      "Walk briskly WITHOUT holding the rails (lower incline if you must hold on).",
      "Keep a pace where talking is possible but slightly hard.",
      "Cool down 2 min flat at the end."
    ],
    mistake: "Holding the handrails — it erases most of the incline's benefit.",
    videoId: "MJ1Jdu1QTUk", search: "incline treadmill walking fat loss"
  },
  "stationary-bike": {
    name: "Stationary Bike", muscle: "Cardio", equipment: "Bike",
    needsWeight: false, sets: 1, reps: "10-20 min moderate pace", restSec: 0, level: "Beginner",
    startWeight: "Seat height: leg almost straight at the bottom of the pedal stroke.",
    steps: [
      "Adjust seat so your knee has a slight bend at the lowest pedal point.",
      "Ride at a pace where you can talk but feel you're working.",
      "Optional: alternate 1 min faster / 2 min easy.",
      "Keep shoulders relaxed, don't slump on the handlebars."
    ],
    mistake: "Seat too low — makes knees ache.",
    videoId: "NwwDBARCGgo", search: "stationary bike workout beginners"
  },
  "rowing-machine": {
    name: "Rowing Machine", muscle: "Cardio / Full body", equipment: "Rower",
    needsWeight: false, sets: 1, reps: "5-10 min steady", restSec: 0, level: "Beginner",
    startWeight: "Order is: legs push → body leans back → arms pull. Then reverse.",
    steps: [
      "Push with the LEGS first, then lean back slightly, then pull the handle to your ribs.",
      "Return in reverse: arms out, body forward, knees bend.",
      "Damper setting 3-5 is plenty.",
      "Long smooth strokes beat fast choppy ones."
    ],
    mistake: "Pulling with arms first — rowing is 60% legs.",
    videoId: "4zWu1yuJ0_g", search: "rowing machine proper technique beginner"
  }
};

/* ---------- WEEKLY PLAN TEMPLATES ----------
   Every workout starts with the same warm-up and ends with a
   fat-loss finisher (added dynamically when goal includes fat loss).
*/
const WARMUP = {
  title: "Warm-Up (do this EVERY session — 8-10 min)",
  items: [
    "5 min easy cardio: treadmill walk or bike — get slightly sweaty",
    "10 arm circles each direction + 10 shoulder rolls",
    "10 bodyweight squats (slow, full range)",
    "10 hip circles each direction",
    "Before your FIRST exercise: do 1 light 'practice set' of it with very light weight"
  ]
};

const COOLDOWN = {
  title: "Cool-Down (5 min)",
  items: [
    "2-3 min slow walk to bring heart rate down",
    "30 sec stretch: chest doorway stretch",
    "30 sec stretch: hamstrings (reach toward toes)",
    "30 sec stretch: quads (heel to bum, standing)",
    "30 sec stretch: shoulders (arm across chest, each side)"
  ]
};

const CARDIO_FINISHER = {
  title: "Fat-Loss Finisher (10-15 min)",
  note: "Because your goal includes losing belly fat: finish weight sessions with easy cardio. Belly fat is lost through overall calorie deficit — no exercise 'spot reduces' the belly.",
  options: ["treadmill-incline-walk", "stationary-bike", "rowing-machine"]
};

const PLAN_TEMPLATES = {
  3: {
    label: "3-Day Full Body (A/B/C)",
    description: "Every muscle trained 3× per week. The best beginner setup when time is tight.",
    days: [
      { id: "fbA", title: "Full Body A", focus: "Squat + Push + Pull",
        exercises: ["goblet-squat", "machine-chest-press", "lat-pulldown", "db-shoulder-press", "leg-curl", "plank"] },
      { id: "fbB", title: "Full Body B", focus: "Press + Row + Hinge",
        exercises: ["leg-press", "incline-db-press", "seated-cable-row", "lateral-raise", "db-curl", "triceps-pushdown", "dead-bug"] },
      { id: "fbC", title: "Full Body C", focus: "Hinge + Fly + Lunge",
        exercises: ["db-rdl", "pec-deck", "one-arm-db-row", "face-pull", "walking-lunge", "calf-raise", "cable-crunch"] }
    ]
  },
  4: {
    label: "4-Day Upper / Lower",
    description: "Upper body twice, lower body twice. The sweet spot for building an aesthetic base.",
    days: [
      { id: "upA", title: "Upper A", focus: "Chest & Back strength",
        exercises: ["machine-chest-press", "lat-pulldown", "db-shoulder-press", "seated-cable-row", "triceps-pushdown", "db-curl"] },
      { id: "loA", title: "Lower A", focus: "Quads & Core",
        exercises: ["leg-press", "goblet-squat", "leg-curl", "calf-raise", "plank", "russian-twist"] },
      { id: "upB", title: "Upper B", focus: "Shoulders & Arms shape",
        exercises: ["incline-db-press", "one-arm-db-row", "lateral-raise", "face-pull", "hammer-curl", "overhead-db-extension"] },
      { id: "loB", title: "Lower B", focus: "Hamstrings & Glutes",
        exercises: ["db-rdl", "leg-extension", "walking-lunge", "glute-bridge", "calf-raise", "cable-crunch"] }
    ]
  },
  5: {
    label: "5-Day Push / Pull / Legs / Upper / Lower",
    description: "More volume per muscle. Good once the 4-day plan feels comfortable.",
    days: [
      { id: "push", title: "Push Day", focus: "Chest, Shoulders, Triceps",
        exercises: ["machine-chest-press", "incline-db-press", "db-shoulder-press", "lateral-raise", "triceps-pushdown", "overhead-db-extension"] },
      { id: "pull", title: "Pull Day", focus: "Back, Rear delts, Biceps",
        exercises: ["lat-pulldown", "seated-cable-row", "one-arm-db-row", "face-pull", "db-curl", "hammer-curl"] },
      { id: "legs", title: "Leg Day", focus: "Quads, Hamstrings, Calves",
        exercises: ["leg-press", "leg-curl", "leg-extension", "db-rdl", "calf-raise", "plank"] },
      { id: "upper", title: "Upper Day", focus: "Upper body pump",
        exercises: ["pec-deck", "assisted-pullup", "rear-delt-fly", "cable-curl", "assisted-dip", "cable-crunch"] },
      { id: "lower", title: "Lower Day", focus: "Glutes & Legs",
        exercises: ["goblet-squat", "walking-lunge", "glute-bridge", "leg-curl", "calf-raise", "hanging-knee-raise"] }
    ]
  },
  6: {
    label: "6-Day Push / Pull / Legs ×2",
    description: "High frequency. Only pick this if you recover well and love being in the gym.",
    days: [
      { id: "pushA", title: "Push A", focus: "Chest, Shoulders, Triceps",
        exercises: ["machine-chest-press", "incline-db-press", "db-shoulder-press", "lateral-raise", "triceps-pushdown"] },
      { id: "pullA", title: "Pull A", focus: "Back & Biceps",
        exercises: ["lat-pulldown", "seated-cable-row", "face-pull", "db-curl", "hammer-curl"] },
      { id: "legsA", title: "Legs A", focus: "Quad focus",
        exercises: ["leg-press", "leg-extension", "leg-curl", "calf-raise", "plank"] },
      { id: "pushB", title: "Push B", focus: "Upper chest & Arms",
        exercises: ["flat-db-press", "pec-deck", "lateral-raise", "assisted-dip", "overhead-db-extension"] },
      { id: "pullB", title: "Pull B", focus: "Width & Rear delts",
        exercises: ["assisted-pullup", "one-arm-db-row", "rear-delt-fly", "cable-curl", "cable-crunch"] },
      { id: "legsB", title: "Legs B", focus: "Hamstring & Glute focus",
        exercises: ["db-rdl", "goblet-squat", "walking-lunge", "glute-bridge", "calf-raise", "hanging-knee-raise"] }
    ]
  }
};

/* ---------- FOOD DATABASE ----------
   Approximate values per stated serving. Indian household portions.
   diet: "vegan" (plant only) | "veg" (dairy, no egg) | "egg" | "nonveg"
   The app shows foods allowed by the user's diet:
   vegan -> vegan · veg -> vegan+veg · egg -> +egg · nonveg -> everything
*/
const FOODS = [
  { id: "roti",        name: "Roti / Chapati",            serving: "1 medium (40g)",    kcal: 120, protein: 3,    carbs: 18, fat: 3,   diet: "vegan"  },
  { id: "rice",        name: "White Rice (cooked)",       serving: "1 cup (160g)",      kcal: 205, protein: 4,    carbs: 45, fat: 0.5, diet: "vegan"  },
  { id: "brownrice",   name: "Brown Rice (cooked)",       serving: "1 cup (160g)",      kcal: 215, protein: 5,    carbs: 45, fat: 2,   diet: "vegan"  },
  { id: "dal",         name: "Dal (cooked)",              serving: "1 cup (200g)",      kcal: 200, protein: 12,   carbs: 30, fat: 3,   diet: "vegan"  },
  { id: "paneer",      name: "Paneer",                    serving: "100g",              kcal: 290, protein: 19,   carbs: 5,  fat: 22,  diet: "veg"    },
  { id: "tofu",        name: "Tofu",                      serving: "100g",              kcal: 76,  protein: 8,    carbs: 2,  fat: 4.5, diet: "vegan"  },
  { id: "soychunks",   name: "Soya Chunks (dry)",         serving: "50g dry",           kcal: 173, protein: 26,   carbs: 16, fat: 0.5, diet: "vegan"  },
  { id: "soymilk",     name: "Soy Milk (unsweetened)",    serving: "1 glass (250ml)",   kcal: 83,  protein: 7,    carbs: 4,  fat: 4.5, diet: "vegan"  },
  { id: "milk",        name: "Milk (toned)",              serving: "1 glass (250ml)",   kcal: 120, protein: 8,    carbs: 12, fat: 4,   diet: "veg"    },
  { id: "curd",        name: "Curd / Dahi",               serving: "1 cup (200g)",      kcal: 120, protein: 7,    carbs: 9,  fat: 6,   diet: "veg"    },
  { id: "greekyogurt", name: "Greek Yogurt (plain)",      serving: "100g",              kcal: 90,  protein: 10,   carbs: 4,  fat: 4,   diet: "veg"    },
  { id: "chana",       name: "Chana / Chickpeas (cooked)",serving: "1 cup (160g)",      kcal: 269, protein: 14.5, carbs: 45, fat: 4,   diet: "vegan"  },
  { id: "rajma",       name: "Rajma (cooked)",            serving: "1 cup (180g)",      kcal: 225, protein: 15,   carbs: 40, fat: 1,   diet: "vegan"  },
  { id: "sprouts",     name: "Moong Sprouts",             serving: "1 cup (100g)",      kcal: 62,  protein: 6,    carbs: 12, fat: 0.5, diet: "vegan"  },
  { id: "peanuts",     name: "Peanuts (roasted)",         serving: "handful (30g)",     kcal: 170, protein: 7,    carbs: 5,  fat: 14,  diet: "vegan"  },
  { id: "pb",          name: "Peanut Butter",             serving: "1 tbsp (16g)",      kcal: 95,  protein: 4,    carbs: 3,  fat: 8,   diet: "vegan"  },
  { id: "almonds",     name: "Almonds",                   serving: "10 pieces",         kcal: 70,  protein: 2.5,  carbs: 2.5,fat: 6,   diet: "vegan"  },
  { id: "banana",      name: "Banana",                    serving: "1 medium",          kcal: 105, protein: 1,    carbs: 27, fat: 0.5, diet: "vegan"  },
  { id: "apple",       name: "Apple",                     serving: "1 medium",          kcal: 95,  protein: 0.5,  carbs: 25, fat: 0.5, diet: "vegan"  },
  { id: "oats",        name: "Oats (dry)",                serving: "40g",               kcal: 150, protein: 5,    carbs: 27, fat: 3,   diet: "vegan"  },
  { id: "poha",        name: "Poha",                      serving: "1 plate (200g)",    kcal: 250, protein: 5,    carbs: 45, fat: 6,   diet: "vegan"  },
  { id: "idli",        name: "Idli",                      serving: "2 pieces",          kcal: 120, protein: 4,    carbs: 24, fat: 0.5, diet: "vegan"  },
  { id: "dosa",        name: "Plain Dosa",                serving: "1 medium",          kcal: 170, protein: 4,    carbs: 28, fat: 5,   diet: "vegan"  },
  { id: "upma",        name: "Upma",                      serving: "1 bowl (200g)",     kcal: 250, protein: 6,    carbs: 40, fat: 8,   diet: "vegan"  },
  { id: "khichdi",     name: "Khichdi (dal + rice)",      serving: "1 bowl (250g)",     kcal: 250, protein: 9,    carbs: 40, fat: 6,   diet: "vegan"  },
  { id: "besanchilla", name: "Besan Chilla",              serving: "2 medium",          kcal: 200, protein: 10,   carbs: 22, fat: 8,   diet: "vegan"  },
  { id: "sattu",       name: "Sattu Drink",               serving: "30g in water",      kcal: 110, protein: 6,    carbs: 18, fat: 1.5, diet: "vegan"  },
  { id: "vegsabzi",    name: "Mixed Veg Sabzi",           serving: "1 cup (150g)",      kcal: 120, protein: 3,    carbs: 12, fat: 7,   diet: "vegan"  },
  { id: "palakpaneer", name: "Palak Paneer",              serving: "1 cup (200g)",      kcal: 280, protein: 12,   carbs: 10, fat: 22,  diet: "veg"    },
  { id: "chole",       name: "Chole (curry)",             serving: "1 cup (200g)",      kcal: 280, protein: 12,   carbs: 40, fat: 9,   diet: "vegan"  },
  { id: "peas",        name: "Green Peas (cooked)",       serving: "1 cup (145g)",      kcal: 118, protein: 8,    carbs: 21, fat: 0.5, diet: "vegan"  },
  { id: "broccoli",    name: "Broccoli (cooked)",         serving: "1 cup (150g)",      kcal: 55,  protein: 4,    carbs: 11, fat: 0.5, diet: "vegan"  },
  { id: "quinoa",      name: "Quinoa (cooked)",           serving: "1 cup (185g)",      kcal: 222, protein: 8,    carbs: 39, fat: 3.5, diet: "vegan"  },
  { id: "buttermilk",  name: "Buttermilk / Chaas",        serving: "1 glass (250ml)",   kcal: 40,  protein: 2,    carbs: 4,  fat: 1.5, diet: "veg"    },
  { id: "cheese",      name: "Cheese Slice",              serving: "1 slice (20g)",     kcal: 60,  protein: 4,    carbs: 1,  fat: 5,   diet: "veg"    },
  { id: "ghee",        name: "Ghee",                      serving: "1 tsp (5g)",        kcal: 45,  protein: 0,    carbs: 0,  fat: 5,   diet: "veg"    },
  { id: "salad",       name: "Salad Bowl (veg)",          serving: "1 bowl",            kcal: 50,  protein: 2,    carbs: 8,  fat: 1,   diet: "vegan"  },
  { id: "eggs",        name: "Boiled Eggs",               serving: "2 eggs",            kcal: 155, protein: 13,   carbs: 1,  fat: 11,  diet: "egg"    },
  { id: "omelette",    name: "Omelette",                  serving: "2 eggs",            kcal: 220, protein: 13,   carbs: 2,  fat: 17,  diet: "egg"    },
  { id: "eggbhurji",   name: "Egg Bhurji",                serving: "2 eggs",            kcal: 240, protein: 13,   carbs: 4,  fat: 18,  diet: "egg"    },
  { id: "chickenbreast", name: "Chicken Breast (grilled)",serving: "100g",              kcal: 165, protein: 31,   carbs: 0,  fat: 3.5, diet: "nonveg" },
  { id: "chickencurry", name: "Chicken Curry",            serving: "1 cup (200g)",      kcal: 280, protein: 25,   carbs: 8,  fat: 16,  diet: "nonveg" },
  { id: "tandoori",    name: "Tandoori Chicken",          serving: "2 pieces",          kcal: 260, protein: 30,   carbs: 4,  fat: 13,  diet: "nonveg" },
  { id: "fish",        name: "Fish (grilled)",            serving: "100g",              kcal: 180, protein: 22,   carbs: 2,  fat: 9,   diet: "nonveg" },
  { id: "fishcurry",   name: "Fish Curry",                serving: "1 cup (200g)",      kcal: 250, protein: 20,   carbs: 8,  fat: 15,  diet: "nonveg" },
  { id: "prawns",      name: "Prawns (cooked)",           serving: "100g",              kcal: 100, protein: 20,   carbs: 1,  fat: 1.5, diet: "nonveg" },
  { id: "muttoncurry", name: "Mutton Curry",              serving: "1 cup (200g)",      kcal: 350, protein: 25,   carbs: 6,  fat: 24,  diet: "nonveg" }
];

/* ---------- PROTEIN GUIDE (shown in Guide tab, filtered by diet) ---------- */
const DIET_LABELS = { vegan: "Vegan 🌱", veg: "Pure Veg (no egg) 🥬", egg: "Veg + Egg 🥚", nonveg: "Non-Veg 🍗" };
const DIET_NOTES = {
  vegan: "You're vegan — protein needs real planning, but it's absolutely doable. Soya and dals are your foundation:",
  veg: "You're pure veg with no eggs — completely fine, but you must be intentional. These are your best friends:",
  egg: "Veg + eggs gives you the cheapest complete protein there is. Build meals around these:",
  nonveg: "You have the easiest protein options available — lean meats plus the veg staples:"
};
const PROTEIN_GUIDE = {
  target: "Aim for about 1.6g of protein per kg of body weight daily. Example: 70 kg → ~110g protein/day.",
  best: [
    { food: "Chicken breast (100g)", protein: "31g", tip: "The gold standard — lean, cheap per gram of protein.", diet: "nonveg" },
    { food: "Soya chunks (50g dry)", protein: "26g", tip: "The highest veg protein per rupee. Boil, squeeze, add to any sabzi/pulao.", diet: "vegan" },
    { food: "Fish (100g)", protein: "22g", tip: "Protein + omega-3 fats. Grilled beats fried for fat loss.", diet: "nonveg" },
    { food: "Prawns (100g)", protein: "20g", tip: "Very high protein, very low calorie.", diet: "nonveg" },
    { food: "Paneer (100g)", protein: "19g", tip: "Great, but calorie-dense — weigh portions if fat loss stalls.", diet: "veg" },
    { food: "Chana / Rajma (1 cup)", protein: "14-15g", tip: "Also loaded with fiber — keeps you full during fat loss.", diet: "vegan" },
    { food: "Eggs (2 boiled)", protein: "13g", tip: "The cheapest complete protein. Whole eggs are fine.", diet: "egg" },
    { food: "Dal (1 cup cooked)", protein: "12g", tip: "Have dal at both lunch and dinner, not just one.", diet: "vegan" },
    { food: "Greek yogurt / hung curd (100g)", protein: "10g", tip: "Great evening snack; add fruit.", diet: "veg" },
    { food: "Tofu (100g)", protein: "8g", tip: "Cheaper than paneer per gram of protein, much lower fat.", diet: "vegan" },
    { food: "Milk (1 glass)", protein: "8g", tip: "A glass after your workout is an easy 8g.", diet: "veg" },
    { food: "Soy milk (1 glass)", protein: "7g", tip: "The best plant milk for protein by far.", diet: "vegan" },
    { food: "Peanuts / Peanut butter", protein: "7g per handful", tip: "Good protein but very high calorie — measure it.", diet: "vegan" },
    { food: "Sattu (30g)", protein: "6g", tip: "Mix in water/buttermilk for a portable protein drink.", diet: "vegan" }
  ],
  combos: "Combine dal + rice or dal + roti: together they form a complete protein (all amino acids). Indian food figured this out centuries ago."
};

/* ---------- FOOD & WORKOUT TIMING GUIDE ---------- */
const TIMING_GUIDE = {
  beforeFood: {
    label: "Training BEFORE eating (empty-ish stomach)",
    points: [
      "Fine for morning workouts if you feel OK. Have a banana or a few dates 15-20 min before if you feel weak.",
      "Best for: people who feel heavy/sluggish training after meals.",
      "After training, eat a proper meal within 60-90 minutes: protein + carbs (e.g. paneer/dal + rice/roti).",
      "If you feel dizzy training empty, switch — this is preference, not a rule."
    ]
  },
  afterFood: {
    label: "Training AFTER eating",
    points: [
      "Leave a gap: big meal → wait 2-3 hours. Small snack (banana, poha, toast) → 45-60 min is enough.",
      "Best for: evening training after lunch has digested, or after a light pre-workout snack.",
      "Never train right after a heavy meal — you'll feel bloated and weak.",
      "A good pre-workout snack: banana + few peanuts, or a small bowl of poha ~1 hour before."
    ]
  }
};

/* ---------- BEGINNER RULES (Guide tab) ---------- */
const BEGINNER_RULES = [
  { title: "Progressive overload = the whole game", body: "Each week, try to add a tiny bit: +1 rep per set, or +2.5 kg when you hit the top of the rep range on all sets. The app records your weights so you always know what to beat." },
  { title: "Form first, weight second", body: "Weeks 1-2: use lighter weights and learn the movement. A clean rep with 10 kg builds more muscle than an ugly rep with 20 kg — and doesn't injure you." },
  { title: "Belly fat truth", body: "You cannot crunch away belly fat. It leaves through a calorie deficit (eat slightly less than you burn) while weights make sure what remains is muscle. That combo = the aesthetic look." },
  { title: "The last 2 reps should be hard", body: "If you finish a set feeling like you could do 5 more reps, the weight is too light. If your form breaks, it's too heavy." },
  { title: "Rest days grow muscle", body: "Muscle is built while you recover, not while you train. Sleep 7-8 hours. Rest days are part of the plan, not cheating." },
  { title: "Soreness is normal, pain is not", body: "Dull muscle soreness for 1-2 days after training = normal, it fades in a couple of weeks. Sharp pain in a joint = stop that exercise and lower the weight." },
  { title: "Weigh yourself smart", body: "Log weight 2-3× per week, in the morning, after the toilet, before eating. Look at the weekly trend, not daily jumps — water weight moves ±1 kg for no reason." },
  { title: "Expect this timeline", body: "Weeks 1-4: strength jumps fast (that's your nervous system learning). Weeks 6-12: clothes fit differently. Month 3-6: visible muscle and a smaller belly. Trust the process." }
];
