/* ============================================================
   HAPA — App logic
   Plain JS, no dependencies. All data lives in localStorage.
   ============================================================ */

"use strict";

/* ================= STORAGE ================= */

const LS_USERS = "hapa_users";
const LS_SESSION = "hapa_session";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS)) || {}; }
  catch { return {}; }
}
function saveUsers(users) {
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}
function currentUsername() { return localStorage.getItem(LS_SESSION); }

let USERS = loadUsers();
let U = null; // current user object (reference into USERS)

function persist() { saveUsers(USERS); }

/* Simple obfuscation hash (NOT real security — data never leaves this device) */
function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return "h" + h.toString(36);
}

/* ================= HELPERS ================= */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function todayISO(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2400);
}

function bmiOf(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}
function bmiCategory(bmi) {
  if (bmi == null) return ["--", "gray"];
  if (bmi < 18.5) return ["Underweight", "blue"];
  if (bmi < 25) return ["Healthy", ""];
  if (bmi < 30) return ["Overweight", "orange"];
  return ["Obese", "orange"];
}

/* Calorie targets — Mifflin-St Jeor */
function calorieTargets(p) {
  if (!p.weightKg || !p.heightCm || !p.age) return null;
  let bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.gender === "female" ? -161 : 5);
  const activity = 1.45; // gym 3-6 days/week, otherwise light activity
  let tdee = bmr * activity;
  let adj = 0, label = "";
  if (p.goal === "fatloss") { adj = -400; label = "deficit for fat loss"; }
  else if (p.goal === "muscle") { adj = +250; label = "surplus for muscle gain"; }
  else { adj = -200; label = "small deficit: lose fat while building muscle"; }
  const kcal = Math.round((tdee + adj) / 10) * 10;
  const protein = Math.round(p.weightKg * 1.6);
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
  return { kcal, protein, fat, carbs, label, tdee: Math.round(tdee) };
}

/* ================= PLAN LOGIC ================= */

function getPlanTemplate() {
  const n = U.schedule.daysPerWeek;
  return PLAN_TEMPLATES[n] || PLAN_TEMPLATES[4];
}

/* Map selected weekdays -> template day ids, in week order (Mon-first sort) */
function weekAssignment() {
  const tpl = getPlanTemplate();
  const sel = [...U.schedule.selectedDays].sort((a, b) => {
    const ma = a === 0 ? 7 : a, mb = b === 0 ? 7 : b; // Monday-first ordering
    return ma - mb;
  });
  const map = {}; // weekday(0-6) -> template day object
  sel.forEach((wd, i) => { map[wd] = tpl.days[i % tpl.days.length]; });
  return map;
}

function templateDayById(id) {
  let d = getPlanTemplate().days.find((x) => x.id === id);
  if (!d) {
    for (const k of Object.keys(PLAN_TEMPLATES)) {
      d = PLAN_TEMPLATES[k].days.find((x) => x.id === id);
      if (d) break;
    }
  }
  return d || null;
}

function todaysWorkout() {
  const wd = new Date().getDay();
  const map = weekAssignment();
  return map[wd] || null;
}

/* ---- Exercise resolution (built-in + user's custom exercises) ---- */
function getEx(id) {
  return (U && U.customExercises && U.customExercises[id]) || EXERCISES[id] || null;
}
function allExerciseIds() {
  return [...Object.keys(EXERCISES), ...Object.keys((U && U.customExercises) || {})];
}
/* A day's exercise list, honouring the user's plan edits */
function dayExercises(day) {
  return (U.customPlan && U.customPlan[day.id]) || day.exercises;
}

const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Core", "Cardio"];
function muscleGroup(ex) {
  const primary = (ex.muscle || "").split("/")[0].toLowerCase();
  if (primary.includes("cardio")) return "Cardio";
  if (/(quad|hamstring|glute|calf|calv|leg)/.test(primary)) return "Legs";
  if (/(core|abs|oblique)/.test(primary)) return "Core";
  if (primary.includes("shoulder")) return "Shoulders";
  if (primary.includes("bicep")) return "Biceps";
  if (primary.includes("tricep")) return "Triceps";
  if (primary.includes("chest")) return "Chest";
  if (primary.includes("back")) return "Back";
  return "Other";
}

/* ---- Progressive overload assistant ---- */
const BIG_LIFTS = new Set(["leg-press", "barbell-back-squat", "goblet-squat", "db-rdl"]);

function lastPerformance(exId, beforeDate) {
  const entries = Object.entries(U.logs.workouts)
    .filter(([d, l]) => (!beforeDate || d < beforeDate) && l.sets && l.sets[exId] && l.sets[exId].some((s) => s.done))
    .sort((a, b) => b[0].localeCompare(a[0]));
  if (!entries.length) return null;
  const [date, log] = entries[0];
  return { date, sets: log.sets[exId].filter((s) => s.done) };
}

function overloadSuggestion(exId) {
  const ex = getEx(exId);
  const perf = lastPerformance(exId, todayISO());
  if (!ex || !perf) return null;
  const summary = perf.sets
    .map((s) => (ex.needsWeight && s.w !== "" ? s.w + "kg×" : "") + (s.r !== "" ? s.r : "?"))
    .join(", ");
  if (!ex.needsWeight) return { date: perf.date, summary, advice: "Beat last time by 1 rep (or a few seconds)." };
  const weights = perf.sets.map((s) => +s.w || 0);
  const reps = perf.sets.map((s) => +s.r || 0);
  const w = Math.max(...weights, 0);
  const range = String(ex.reps).match(/^(\d+)\s*-\s*(\d+)/);
  if (!range || !w) return { date: perf.date, summary, advice: "Match last time; add a little when it feels easy." };
  const bottom = +range[1], top = +range[2];
  const inc = BIG_LIFTS.has(exId) ? 5 : 2.5;
  if (reps.length && reps.every((r) => r >= top))
    return { date: perf.date, summary, advice: `All sets hit ${top} reps — go up to ${w + inc} kg today! 📈` };
  if (reps.some((r) => r > 0) && reps.every((r) => r < bottom))
    return { date: perf.date, summary, advice: `Reps fell under ${bottom} — stay at ${w} kg and nail the form.` };
  return { date: perf.date, summary, advice: `Stay at ${w} kg and try to add 1 rep per set.` };
}

/* ---- Personal records ---- */
function bestWeightBefore(exId, excludeDate) {
  let best = 0;
  Object.entries(U.logs.workouts).forEach(([date, l]) => {
    if (date === excludeDate || !l.sets || !l.sets[exId]) return;
    l.sets[exId].forEach((s) => { if (s.done && +s.w > best) best = +s.w; });
  });
  return best;
}
function personalRecords() {
  const prs = {};
  Object.entries(U.logs.workouts).forEach(([date, l]) => {
    if (!l.sets) return;
    Object.entries(l.sets).forEach(([exId, sets]) => {
      sets.forEach((s) => {
        if (s.done && +s.w > 0 && (!prs[exId] || +s.w > prs[exId].w)) prs[exId] = { w: +s.w, date };
      });
    });
  });
  return prs;
}

/* ---- Deload detection: consecutive training weeks, counting back from now ---- */
function weeksConsistent() {
  const weekKey = (iso) => {
    const dt = new Date(iso + "T12:00:00");
    dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
    return todayISO(dt);
  };
  const weeks = new Set(
    Object.entries(U.logs.workouts).filter(([, l]) => l.completed).map(([d]) => weekKey(d))
  );
  let count = 0;
  let cur = weekKey(todayISO());
  while (weeks.has(cur)) {
    count++;
    const d = new Date(cur + "T12:00:00");
    d.setDate(d.getDate() - 7);
    cur = todayISO(d);
  }
  return count;
}

/* ---- Generic modal helper ---- */
function openModal(html) {
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop";
  wrap.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(wrap);
  wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
  return wrap;
}

/* ================= VIDEO ================= */

function videoBlock(ex) {
  const q = encodeURIComponent(ex.search || ex.name + " proper form");
  const searchUrl = "https://www.youtube.com/results?search_query=" + q;
  if (!ex.videoId) {
    return `<a class="video-link" href="${searchUrl}" target="_blank" rel="noopener">▶ Watch form videos on YouTube</a>`;
  }
  const watchUrl = `https://www.youtube.com/watch?v=${esc(ex.videoId)}`;
  // YouTube refuses inline embeds when the page is opened from disk (file://,
  // no valid referer -> player error 153) and inside the Android app shell
  // (Capacitor serves from localhost). In those cases show the video
  // thumbnail as a click-through to YouTube instead.
  if (location.protocol === "file:" || location.protocol === "capacitor:" || location.hostname === "localhost") {
    return `
      <div class="video-wrap">
        <a class="video-thumb" href="${watchUrl}" target="_blank" rel="noopener" title="Watch: ${esc(ex.name)} tutorial">
          <img src="https://i.ytimg.com/vi/${esc(ex.videoId)}/hqdefault.jpg" alt="${esc(ex.name)} video tutorial" loading="lazy">
          <span class="play-badge">▶</span>
        </a>
        <a class="video-link" href="${watchUrl}" target="_blank" rel="noopener">▶ Watch tutorial on YouTube</a>
      </div>`;
  }
  return `
    <div class="video-wrap">
      <iframe src="https://www.youtube-nocookie.com/embed/${esc(ex.videoId)}" title="${esc(ex.name)} tutorial"
        allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>
      <a class="video-link" href="${watchUrl}" target="_blank" rel="noopener">▶ Open on YouTube</a>
    </div>`;
}

/* ================= REST TIMER ================= */

let timerInterval = null;
function startRestTimer(seconds) {
  stopRestTimer();
  const el = $("#restTimer");
  el.classList.remove("hidden");
  let left = seconds;
  const numEl = $("#timerNum");
  numEl.textContent = fmtTime(left);
  timerInterval = setInterval(() => {
    left--;
    numEl.textContent = fmtTime(Math.max(0, left));
    if (left <= 0) {
      stopRestTimer();
      beep();
      toast("Rest over — next set! 💪");
    }
  }, 1000);
}
function stopRestTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  $("#restTimer").classList.add("hidden");
}
function fmtTime(s) {
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.12;
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 350);
  } catch { /* audio not available — fine */ }
}

/* ================= VIEW ROUTER ================= */

const VIEWS = ["dashboard", "workout", "plan", "food", "progress", "guide", "settings"];

function show(view) {
  stopRestTimer();
  VIEWS.forEach((v) => $("#view-" + v).classList.add("hidden"));
  $("#view-" + view).classList.remove("hidden");
  $$(".bottom-nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  const renderers = {
    dashboard: renderDashboard, workout: () => renderWorkout(), plan: renderPlan,
    food: renderFood, progress: renderProgress, guide: renderGuide, settings: renderSettings
  };
  renderers[view]();
  window.scrollTo(0, 0);
}

/* ================= AUTH ================= */

/* True if the browser can actually persist data. When this is false the
   whole app is a goldfish — warn loudly instead of failing silently. */
function storageHealthy() {
  try {
    localStorage.setItem("hapa_storage_test", "1");
    localStorage.removeItem("hapa_storage_test");
    return true;
  } catch { return false; }
}

function renderAccountsHint() {
  const el = $("#accountsHint");
  const names = Object.values(USERS).map((u) => u.displayName);
  if (!names.length) {
    el.innerHTML = `No accounts in this browser yet — <strong>create one below</strong>. (Accounts are saved per browser: if you made yours in a different browser or opened the app a different way, it lives there.)`;
    return;
  }
  el.innerHTML = `Accounts on this device: ` + names.map((n) => `<button type="button" class="account-chip">${esc(n)}</button>`).join(" ");
  el.querySelectorAll(".account-chip").forEach((b) => b.onclick = () => {
    $("#liName").value = b.textContent;
    $("#liPass").focus();
  });
}

function initAuth() {
  const loginForm = $("#loginForm"), signupForm = $("#signupForm");

  if (!storageHealthy()) $("#storageWarning").classList.remove("hidden");
  renderAccountsHint();

  $("#showSignup").onclick = () => { loginForm.classList.add("hidden"); signupForm.classList.remove("hidden"); };
  $("#showLogin").onclick = () => { signupForm.classList.add("hidden"); loginForm.classList.remove("hidden"); };

  /* Forgot PIN — local convenience lock, so the owner of the device can reset it */
  $("#forgotPin").onclick = () => {
    $("#resetBox").classList.toggle("hidden");
    $("#resetError").textContent = "";
  };
  $("#resetConfirm").onclick = () => {
    const name = $("#liName").value.trim().toLowerCase();
    const newPass = $("#resetPass").value;
    const err = $("#resetError");
    err.textContent = "";
    if (!name) { err.textContent = "Type your account name in the Name field above first."; return; }
    if (!USERS[name]) { err.textContent = `No account named "${$("#liName").value.trim()}" in this browser.`; return; }
    if (newPass.length < 4) { err.textContent = "New PIN must be at least 4 characters."; return; }
    if (!confirm(`Set a new PIN for "${USERS[name].displayName}"?`)) return;
    USERS[name].pass = simpleHash(newPass);
    persist();
    $("#resetBox").classList.add("hidden");
    $("#resetPass").value = "";
    $("#liPass").value = "";
    toast("PIN updated — log in with your new PIN ✔");
  };

  signupForm.onsubmit = (e) => {
    e.preventDefault();
    const name = $("#suName").value.trim();
    const pass = $("#suPass").value;
    const err = $("#suError");
    err.textContent = "";
    if (name.length < 2) { err.textContent = "Name must be at least 2 characters."; return; }
    if (pass.length < 4) { err.textContent = "PIN/password must be at least 4 characters."; return; }
    const key = name.toLowerCase();
    if (USERS[key]) { err.textContent = "That name already exists — try logging in."; return; }
    USERS[key] = {
      displayName: name,
      pass: simpleHash(pass),
      createdAt: todayISO(),
      profile: {},
      schedule: null,
      settings: { calorieTracker: false },
      logs: { weights: [], workouts: {}, food: {}, photos: {}, lastWeights: {} }
    };
    try {
      persist();
      localStorage.setItem(LS_SESSION, key);
    } catch {
      err.textContent = "Your browser refused to save the account (storage blocked or full). Don't use Incognito mode.";
      delete USERS[key];
      return;
    }
    enterApp();
  };

  loginForm.onsubmit = (e) => {
    e.preventDefault();
    const name = $("#liName").value.trim().toLowerCase();
    const pass = $("#liPass").value;
    const err = $("#liError");
    err.textContent = "";
    const user = USERS[name];
    if (!user) {
      err.textContent = `No account named "${$("#liName").value.trim()}" in this browser. Accounts are saved per browser & per way you open the app — use the same one where you created it, or create the account again here.`;
      return;
    }
    if (user.pass !== simpleHash(pass)) { err.textContent = "Wrong PIN for this account. Use 'Forgot PIN?' below to set a new one."; return; }
    localStorage.setItem(LS_SESSION, name);
    enterApp();
  };
}

function logout() {
  localStorage.removeItem(LS_SESSION);
  location.reload();
}

function enterApp() {
  const key = currentUsername();
  U = USERS[key];
  if (!U) { localStorage.removeItem(LS_SESSION); return; }
  $("#authScreen").classList.add("hidden");
  if (!U.schedule || !U.profile.heightCm) {
    $("#wizardScreen").classList.remove("hidden");
    startWizard();
  } else {
    $("#appScreen").classList.remove("hidden");
    renderUserChip();
    show("dashboard");
  }
}

function renderUserChip() {
  const chip = $("#userChip");
  const initial = (U.displayName || "?").charAt(0).toUpperCase();
  chip.innerHTML = U.profile.photo
    ? `<img src="${U.profile.photo}" alt=""> <span>${esc(U.displayName)}</span>`
    : `<div class="avatar-fallback">${esc(initial)}</div> <span>${esc(U.displayName)}</span>`;
}

/* ================= ONBOARDING WIZARD ================= */

const wizardState = { step: 0 };

function startWizard() {
  wizardState.step = 0;
  wizardState.data = {
    age: U.profile.age || "", gender: U.profile.gender || "male",
    heightCm: U.profile.heightCm || "", weightKg: U.profile.weightKg || "",
    targetWeightKg: U.profile.targetWeightKg || "", goal: U.profile.goal || "recomp",
    photo: U.profile.photo || null, notes: U.profile.notes || "",
    daysPerWeek: (U.schedule && U.schedule.daysPerWeek) || 4,
    selectedDays: (U.schedule && [...U.schedule.selectedDays]) || [1, 2, 4, 5],
    time: (U.schedule && U.schedule.time) || "18:00",
    foodTiming: (U.schedule && U.schedule.foodTiming) || "after",
    calorieTracker: U.settings.calorieTracker || false
  };
  renderWizardStep();
}

function renderWizardStep() {
  const s = wizardState.step, d = wizardState.data;
  const host = $("#wizardBody");
  $$("#wizardProgress .step-dot").forEach((dot, i) => dot.classList.toggle("done", i <= s));

  if (s === 0) {
    host.innerHTML = `
      <h2>About you</h2>
      <p class="muted">Used to calculate your BMI and calorie needs. Everything stays on this device.</p>
      <div class="form-row" style="margin-top:14px">
        <div class="field"><label>Age</label><input id="wAge" type="number" min="10" max="99" value="${esc(d.age)}" placeholder="e.g. 24"></div>
        <div class="field"><label>Gender</label>
          <select id="wGender">
            <option value="male" ${d.gender === "male" ? "selected" : ""}>Male</option>
            <option value="female" ${d.gender === "female" ? "selected" : ""}>Female</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="field"><label>Height (cm)</label><input id="wHeight" type="number" min="100" max="250" value="${esc(d.heightCm)}" placeholder="e.g. 172"></div>
        <div class="field"><label>Current weight (kg)</label><input id="wWeight" type="number" min="25" max="300" step="0.1" value="${esc(d.weightKg)}" placeholder="e.g. 76"></div>
      </div>
      <div class="bmi-preview" id="bmiPreview"><span class="muted">Enter height & weight to see your BMI</span></div>
      <div class="error-msg" id="wErr"></div>
      <button class="btn block" id="wNext">Next →</button>`;
    const upd = () => {
      const bmi = bmiOf(+$("#wWeight").value, +$("#wHeight").value);
      const [cat, cls] = bmiCategory(bmi);
      $("#bmiPreview").innerHTML = bmi
        ? `<div class="bmi-num">${bmi}</div><div><div style="font-weight:700">BMI</div><span class="pill ${cls}">${cat}</span></div>`
        : `<span class="muted">Enter height & weight to see your BMI</span>`;
    };
    $("#wHeight").oninput = upd; $("#wWeight").oninput = upd; upd();
    $("#wNext").onclick = () => {
      d.age = +$("#wAge").value; d.gender = $("#wGender").value;
      d.heightCm = +$("#wHeight").value; d.weightKg = +$("#wWeight").value;
      if (!d.age || !d.heightCm || !d.weightKg) { $("#wErr").textContent = "Please fill age, height and weight."; return; }
      wizardState.step = 1; renderWizardStep();
    };
  }

  if (s === 1) {
    host.innerHTML = `
      <h2>Your goal</h2>
      <p class="muted">This changes your calorie target and adds fat-burning cardio to your plan.</p>
      <div class="segment" style="margin-top:14px" id="goalSeg">
        <button data-goal="fatloss"><span class="seg-title">🔥 Fat Loss</span><span class="seg-sub">Lose the belly first</span></button>
        <button data-goal="recomp"><span class="seg-title">💎 Slim + Strong</span><span class="seg-sub">Lose fat AND build muscle (aesthetic)</span></button>
        <button data-goal="muscle"><span class="seg-title">💪 Build Muscle</span><span class="seg-sub">Get bigger & stronger</span></button>
      </div>
      <div class="field" style="margin-top:16px"><label>Target weight (kg) — optional</label>
        <input id="wTarget" type="number" min="25" max="300" step="0.1" value="${esc(d.targetWeightKg)}" placeholder="e.g. 68">
        <div class="hint">A healthy pace is losing 0.4-0.7 kg per week.</div>
      </div>
      <div class="error-msg" id="wErr"></div>
      <div class="form-row">
        <button class="btn secondary" id="wBack">← Back</button>
        <button class="btn block" id="wNext">Next →</button>
      </div>`;
    const seg = $("#goalSeg");
    const sync = () => $$("#goalSeg button").forEach((b) => b.classList.toggle("selected", b.dataset.goal === d.goal));
    seg.onclick = (e) => { const b = e.target.closest("button"); if (b) { d.goal = b.dataset.goal; sync(); } };
    sync();
    $("#wBack").onclick = () => { wizardState.step = 0; renderWizardStep(); };
    $("#wNext").onclick = () => {
      d.targetWeightKg = +$("#wTarget").value || null;
      wizardState.step = 2; renderWizardStep();
    };
  }

  if (s === 2) {
    host.innerHTML = `
      <h2>Photo & notes <span class="pill gray">optional</span></h2>
      <p class="muted">A starting photo is the best motivation you'll ever have — the mirror lies, photos don't. It never leaves this device.</p>
      <div class="photo-drop" id="photoDrop" style="margin-top:14px">
        <div>📷 Tap to add a profile / before photo</div>
        <div id="photoPreview">${d.photo ? `<img src="${d.photo}" alt="preview">` : ""}</div>
      </div>
      <input type="file" id="photoInput" accept="image/*" class="hidden">
      <div class="field" style="margin-top:16px"><label>Anything about you / what you want to do</label>
        <textarea id="wNotes" placeholder="e.g. I sit all day at a desk, my lower back gets stiff, I want visible abs...">${esc(d.notes)}</textarea>
      </div>
      <div class="form-row">
        <button class="btn secondary" id="wBack">← Back</button>
        <button class="btn block" id="wNext">Next →</button>
      </div>`;
    $("#photoDrop").onclick = () => $("#photoInput").click();
    $("#photoInput").onchange = (e) => {
      const f = e.target.files[0];
      if (f) compressImage(f, 500, (dataUrl) => {
        d.photo = dataUrl;
        $("#photoPreview").innerHTML = `<img src="${dataUrl}" alt="preview">`;
      });
    };
    $("#wBack").onclick = () => { wizardState.step = 1; renderWizardStep(); };
    $("#wNext").onclick = () => { d.notes = $("#wNotes").value.trim(); wizardState.step = 3; renderWizardStep(); };
  }

  if (s === 3) {
    host.innerHTML = `
      <h2>Your week</h2>
      <p class="muted">Pick how many days you'll train and which days. The app builds the right split automatically.</p>
      <div class="field" style="margin-top:14px"><label>Days per week</label>
        <div class="segment" id="dpwSeg">
          ${[3, 4, 5, 6].map((n) => `<button data-n="${n}"><span class="seg-title">${n} days</span><span class="seg-sub">${PLAN_TEMPLATES[n].label.replace(/^\d-Day /, "")}</span></button>`).join("")}
        </div>
      </div>
      <div class="field"><label>Which days? <span id="dayCount" class="accent"></span></label>
        <div class="day-picker" id="dayPicker">
          ${[1, 2, 3, 4, 5, 6, 0].map((wd) => `<button data-wd="${wd}">${DAY_NAMES[wd]}</button>`).join("")}
        </div>
        <div class="hint">Tip: avoid training many days in a row — spread them out (e.g. Mon, Tue, Thu, Fri).</div>
      </div>
      <div class="form-row">
        <div class="field"><label>Usual workout time</label><input id="wTime" type="time" value="${esc(d.time)}"></div>
        <div class="field"><label>Train before or after food?</label>
          <select id="wFood">
            <option value="after" ${d.foodTiming === "after" ? "selected" : ""}>After eating (1-2 hr gap)</option>
            <option value="before" ${d.foodTiming === "before" ? "selected" : ""}>Before eating (empty stomach)</option>
          </select>
        </div>
      </div>
      <div class="field"><label>Optional: calorie & protein tracker</label>
        <div class="segment" id="calSeg">
          <button data-v="on"><span class="seg-title">✅ Turn it on</span><span class="seg-sub">Recommended for fat loss</span></button>
          <button data-v="off"><span class="seg-title">Skip for now</span><span class="seg-sub">You can enable it later</span></button>
        </div>
      </div>
      <div class="error-msg" id="wErr"></div>
      <div class="form-row">
        <button class="btn secondary" id="wBack">← Back</button>
        <button class="btn block" id="wFinish">Finish ✔</button>
      </div>`;

    const syncDpw = () => $$("#dpwSeg button").forEach((b) => b.classList.toggle("selected", +b.dataset.n === d.daysPerWeek));
    const syncDays = () => {
      $$("#dayPicker button").forEach((b) => b.classList.toggle("selected", d.selectedDays.includes(+b.dataset.wd)));
      $("#dayCount").textContent = `(${d.selectedDays.length}/${d.daysPerWeek} picked)`;
    };
    const syncCal = () => $$("#calSeg button").forEach((b) => b.classList.toggle("selected", (b.dataset.v === "on") === d.calorieTracker));

    $("#dpwSeg").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      d.daysPerWeek = +b.dataset.n;
      if (d.selectedDays.length > d.daysPerWeek) d.selectedDays = d.selectedDays.slice(0, d.daysPerWeek);
      syncDpw(); syncDays();
    };
    $("#dayPicker").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const wd = +b.dataset.wd;
      if (d.selectedDays.includes(wd)) d.selectedDays = d.selectedDays.filter((x) => x !== wd);
      else if (d.selectedDays.length < d.daysPerWeek) d.selectedDays.push(wd);
      else toast(`You already picked ${d.daysPerWeek} days — unselect one first.`);
      syncDays();
    };
    $("#calSeg").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      d.calorieTracker = b.dataset.v === "on"; syncCal();
    };
    syncDpw(); syncDays(); syncCal();

    $("#wBack").onclick = () => { wizardState.step = 2; renderWizardStep(); };
    $("#wFinish").onclick = () => {
      if (d.selectedDays.length !== d.daysPerWeek) {
        $("#wErr").textContent = `Please pick exactly ${d.daysPerWeek} days (you picked ${d.selectedDays.length}).`;
        return;
      }
      d.time = $("#wTime").value || "18:00";
      d.foodTiming = $("#wFood").value;
      // Save everything
      U.profile = {
        age: d.age, gender: d.gender, heightCm: d.heightCm, weightKg: d.weightKg,
        targetWeightKg: d.targetWeightKg, goal: d.goal, photo: d.photo, notes: d.notes
      };
      U.schedule = { daysPerWeek: d.daysPerWeek, selectedDays: d.selectedDays, time: d.time, foodTiming: d.foodTiming };
      U.settings.calorieTracker = d.calorieTracker;
      if (!U.logs.weights.length) U.logs.weights.push({ date: todayISO(), kg: d.weightKg });
      persist();
      $("#wizardScreen").classList.add("hidden");
      $("#appScreen").classList.remove("hidden");
      renderUserChip();
      show("dashboard");
      toast("Your plan is ready! 🎉");
    };
  }
}

/* Image compression -> small base64 (localStorage friendly) */
function compressImage(file, maxDim, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ================= DASHBOARD ================= */

function weekWorkoutStats() {
  // Count completed workouts in the current week (Mon-Sun)
  const now = new Date();
  const monday = new Date(now);
  const shift = (now.getDay() + 6) % 7;
  monday.setDate(now.getDate() - shift);
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday); dd.setDate(monday.getDate() + i);
    const log = U.logs.workouts[todayISO(dd)];
    if (log && log.completed) done++;
  }
  return { done, planned: U.schedule.daysPerWeek };
}

function latestWeight() {
  const ws = U.logs.weights;
  return ws.length ? ws[ws.length - 1].kg : U.profile.weightKg;
}

function renderDashboard() {
  const host = $("#view-dashboard");
  const w = todaysWorkout();
  const wd = new Date().getDay();
  const bmi = bmiOf(latestWeight(), U.profile.heightCm);
  const [cat, cls] = bmiCategory(bmi);
  const stats = weekWorkoutStats();
  const todayLog = U.logs.workouts[todayISO()];
  const targets = calorieTargets({ ...U.profile, weightKg: latestWeight() });
  const foodToday = (U.logs.food[todayISO()] || []);
  const kcalToday = foodToday.reduce((s, it) => s + foodById(it.foodId).kcal * it.qty, 0);
  const protToday = foodToday.reduce((s, it) => s + foodById(it.foodId).protein * it.qty, 0);

  const timing = U.schedule.foodTiming === "before"
    ? "Training before food — grab a banana if you feel weak."
    : "Training after food — leave 1-2 hrs after a meal (45-60 min after a snack).";

  host.innerHTML = `
    <div class="card today-hero">
      <div class="hero-row">
        <div>
          <div class="muted small">${DAY_FULL[wd]} · ${U.schedule.time}</div>
          <h2 style="margin:4px 0">${w ? "Today: " + esc(w.title) : "Rest Day 😌"}</h2>
          <div class="muted">${w ? esc(w.focus) : "Recovery is where muscle is built. Walk, stretch, sleep well."}</div>
          ${w ? `<div class="small" style="margin-top:6px">🍽️ ${timing}</div>` : ""}
        </div>
        ${w ? (todayLog && todayLog.completed
          ? `<span class="pill">✔ Completed</span>`
          : `<button class="btn" id="goWorkout">Start Workout →</button>`) : ""}
      </div>
    </div>

    ${(() => {
      const wk = weeksConsistent();
      const dismissed = U.lastDeloadDismiss && (new Date(todayISO()) - new Date(U.lastDeloadDismiss)) / 86400000 < 28;
      if (wk < 6 || dismissed) return "";
      return `<div class="card" style="border-color: rgba(245,158,11,0.5)">
        <h3>🔋 ${wk} weeks consistent — time for a deload?</h3>
        <p class="muted small">Every 6-8 weeks, one lighter week (same exercises, ~60% of your usual weights) lets joints and muscles fully recover — you come back stronger. This is what real programs do; it's not slacking.</p>
        <button class="btn small-btn secondary" id="deloadDismiss" style="margin-top:8px">Got it — remind me again in 4 weeks</button>
      </div>`;
    })()}

    <div class="stat-grid">
      <div class="stat-card"><div class="stat-num">${latestWeight() || "--"}<span class="small muted"> kg</span></div><div class="stat-label">Current weight</div></div>
      <div class="stat-card"><div class="stat-num">${bmi ?? "--"}</div><div class="stat-label">BMI · <span class="pill ${cls}" style="font-size:0.65rem">${cat}</span></div></div>
      <div class="stat-card"><div class="stat-num">${stats.done}<span class="small muted">/${stats.planned}</span></div><div class="stat-label">Workouts this week</div></div>
      ${U.profile.targetWeightKg ? `<div class="stat-card"><div class="stat-num">${Math.abs(latestWeight() - U.profile.targetWeightKg).toFixed(1)}<span class="small muted"> kg</span></div><div class="stat-label">To target (${U.profile.targetWeightKg} kg)</div></div>` : ""}
    </div>

    ${U.settings.calorieTracker && targets ? `
    <div class="card">
      <h3>Today's food</h3>
      <div class="muted small">${Math.round(kcalToday)} / ${targets.kcal} kcal · Protein ${Math.round(protToday)} / ${targets.protein} g</div>
      <div class="macro-bar"><div class="seg-p" style="width:${Math.min(100, (kcalToday / targets.kcal) * 100)}%"></div></div>
      <button class="btn small-btn secondary" id="goFood">Log food →</button>
    </div>` : ""}

    <div class="card">
      <h3>Quick weight log</h3>
      <p class="muted small">Best done in the morning, before eating. Log 2-3× per week.</p>
      <div class="form-row" style="margin-top:8px; align-items:flex-end">
        <div class="field" style="margin:0"><input id="quickWeight" type="number" step="0.1" min="25" max="300" placeholder="Today's weight (kg)"></div>
        <button class="btn" id="logWeightBtn">Log</button>
      </div>
    </div>`;

  const gw = $("#goWorkout"); if (gw) gw.onclick = () => show("workout");
  const dd = $("#deloadDismiss"); if (dd) dd.onclick = () => { U.lastDeloadDismiss = todayISO(); persist(); renderDashboard(); };
  const gf = $("#goFood"); if (gf) gf.onclick = () => show("food");
  $("#logWeightBtn").onclick = () => {
    const v = +$("#quickWeight").value;
    if (!v || v < 25 || v > 300) { toast("Enter a valid weight"); return; }
    const t = todayISO();
    const existing = U.logs.weights.find((x) => x.date === t);
    if (existing) existing.kg = v; else U.logs.weights.push({ date: t, kg: v });
    persist();
    toast("Weight logged ✔");
    renderDashboard();
  };
}

/* ================= WORKOUT VIEW ================= */

function renderWorkout(templateDayId = null) {
  const host = $("#view-workout");
  const day = templateDayId ? templateDayById(templateDayId) : todaysWorkout();

  if (!day) {
    const map = weekAssignment();
    host.innerHTML = `
      <div class="card">
        <h2>Rest day 😌</h2>
        <p class="muted">No workout scheduled today. Want to preview a workout day anyway?</p>
        <div class="segment" style="margin-top:12px">
          ${getPlanTemplate().days.map((d) => `<button data-day="${d.id}">${esc(d.title)}</button>`).join("")}
        </div>
      </div>`;
    host.querySelectorAll("[data-day]").forEach((b) => b.onclick = () => renderWorkout(b.dataset.day));
    return;
  }

  const dateKey = todayISO();
  if (!U.logs.workouts[dateKey] || U.logs.workouts[dateKey].dayId !== day.id) {
    U.logs.workouts[dateKey] = U.logs.workouts[dateKey] && U.logs.workouts[dateKey].dayId === day.id
      ? U.logs.workouts[dateKey]
      : { dayId: day.id, completed: false, sets: {} };
  }
  const log = U.logs.workouts[dateKey];
  if (!log.swaps) log.swaps = {};
  const isFatLoss = U.profile.goal === "fatloss" || U.profile.goal === "recomp";

  let html = `
    <div class="card">
      <h2>${esc(day.title)} <span class="pill blue">${esc(day.focus)}</span></h2>
      <p class="muted small">Rest ~60-90s between sets (timer starts when you tick a set). Add a little weight or a rep every week.</p>
    </div>
    <div class="card">
      <h3>🔥 ${esc(WARMUP.title)}</h3>
      <ul class="checklist">${WARMUP.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
    </div>`;

  const exList = dayExercises(day).map((id) => log.swaps[id] || id);
  exList.forEach((exId) => {
    const ex = getEx(exId);
    if (!ex) return;
    const lastW = U.logs.lastWeights[exId];
    const setCount = ex.sets;
    if (!log.sets[exId]) log.sets[exId] = Array.from({ length: setCount }, () => ({ w: lastW || "", r: "", done: false }));
    const sets = log.sets[exId];
    const sug = overloadSuggestion(exId);
    const isSwapped = Object.values(log.swaps).includes(exId);

    html += `
    <div class="card exercise-card" data-ex="${exId}">
      <div class="ex-head">
        <div>
          <div class="ex-title">${esc(ex.name)} ${isSwapped ? '<span class="pill blue">swapped</span>' : ""}</div>
          <div class="ex-meta">${esc(ex.muscle)} · ${esc(ex.equipment)} · ${ex.sets} sets × ${esc(ex.reps)}</div>
          ${sug ? `<div class="overload-hint">📈 Last (${sug.date.slice(5)}): ${esc(sug.summary)} — <strong>${esc(sug.advice)}</strong></div>` : (lastW ? `<div class="overload-hint">📈 Last weight: ${lastW} kg</div>` : "")}
        </div>
        <div class="ex-actions">
          <button class="btn small-btn secondary swap-ex" title="Machine busy? Swap for a similar exercise">⇄</button>
          <button class="btn small-btn secondary toggle-detail">How to ▾</button>
        </div>
      </div>

      <table class="set-table">
        <tr><th>Set</th>${ex.needsWeight ? "<th>Weight (kg)</th>" : ""}<th>${ex.needsWeight ? "Reps" : "Reps / secs"}</th><th>Done</th></tr>
        ${sets.map((st, i) => `
          <tr class="${st.done ? "set-done" : ""}">
            <td>${i + 1}</td>
            ${ex.needsWeight ? `<td><input type="number" step="0.5" min="0" class="set-w" data-i="${i}" value="${esc(st.w)}" placeholder="kg"></td>` : ""}
            <td><input type="number" min="0" class="set-r" data-i="${i}" value="${esc(st.r)}" placeholder="${ex.needsWeight ? "reps" : "amount"}"></td>
            <td><input type="checkbox" class="set-done-cb" data-i="${i}" ${st.done ? "checked" : ""}></td>
          </tr>`).join("")}
      </table>

      <div class="ex-detail hidden">
        ${ex.startWeight ? `<p class="muted small">${esc(ex.startWeight)}</p>` : ""}
        ${ex.steps && ex.steps.length ? `<ol>${ex.steps.map((st) => `<li>${esc(st)}</li>`).join("")}</ol>` : ""}
        ${ex.mistake ? `<div class="mistake-box">⚠️ <strong>Common mistake:</strong> ${esc(ex.mistake)}</div>` : ""}
        ${videoBlock(ex)}
      </div>
    </div>`;
  });

  if (isFatLoss) {
    html += `
    <div class="card exercise-card cardio-card">
      <div class="ex-title">🏃 ${esc(CARDIO_FINISHER.title)}</div>
      <p class="muted small" style="margin-top:6px">${esc(CARDIO_FINISHER.note)}</p>
      <div class="segment" style="margin-top:10px">
        ${CARDIO_FINISHER.options.map((id) => `<button class="cardio-opt" data-c="${id}">${esc(EXERCISES[id].name)}</button>`).join("")}
      </div>
      <div id="cardioDetail"></div>
    </div>`;
  }

  html += `
    <div class="card">
      <h3>🧘 ${esc(COOLDOWN.title)}</h3>
      <ul class="checklist">${COOLDOWN.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
    </div>
    <button class="btn block" id="completeWorkout" ${log.completed ? "disabled" : ""}>${log.completed ? "✔ Workout completed — great job!" : "Finish & Save Workout ✔"}</button>
    <div style="height:20px"></div>`;

  host.innerHTML = html;

  // Wire up per-exercise interactions
  host.querySelectorAll(".exercise-card[data-ex]").forEach((card) => {
    const exId = card.dataset.ex;
    const ex = getEx(exId);
    const toggle = card.querySelector(".toggle-detail");
    if (toggle) toggle.onclick = () => {
      const det = card.querySelector(".ex-detail");
      det.classList.toggle("hidden");
      toggle.textContent = det.classList.contains("hidden") ? "How to ▾" : "Hide ▴";
    };
    const swapBtn = card.querySelector(".swap-ex");
    if (swapBtn) swapBtn.onclick = () => openSwapModal(day, log, exId);
    card.querySelectorAll(".set-w").forEach((inp) => inp.onchange = () => {
      log.sets[exId][+inp.dataset.i].w = inp.value === "" ? "" : +inp.value;
      persist();
    });
    card.querySelectorAll(".set-r").forEach((inp) => inp.onchange = () => {
      log.sets[exId][+inp.dataset.i].r = inp.value === "" ? "" : +inp.value;
      persist();
    });
    card.querySelectorAll(".set-done-cb").forEach((cb) => cb.onchange = () => {
      const st = log.sets[exId][+cb.dataset.i];
      st.done = cb.checked;
      cb.closest("tr").classList.toggle("set-done", cb.checked);
      if (cb.checked) {
        if (st.w) {
          const prevBest = bestWeightBefore(exId, dateKey);
          if (prevBest > 0 && +st.w > prevBest) toast(`🎉 New PR on ${ex.name}: ${st.w} kg!`);
          U.logs.lastWeights[exId] = +st.w;
        }
        if (ex.restSec > 0) startRestTimer(ex.restSec);
      }
      persist();
    });
  });

  host.querySelectorAll(".cardio-opt").forEach((b) => b.onclick = () => {
    host.querySelectorAll(".cardio-opt").forEach((x) => x.classList.toggle("selected", x === b));
    const ex = EXERCISES[b.dataset.c];
    $("#cardioDetail").innerHTML = `
      <div class="ex-detail">
        <p class="muted small"><strong>${esc(ex.reps)}</strong> — ${esc(ex.startWeight)}</p>
        <ol>${ex.steps.map((st) => `<li>${esc(st)}</li>`).join("")}</ol>
        ${videoBlock(ex)}
      </div>`;
  });

  $("#completeWorkout").onclick = () => {
    log.completed = true;
    persist();
    stopRestTimer();
    toast("Workout saved! 🎉 Consistency is the secret.");
    renderWorkout(day.id);
  };
}

/* ---- Swap an exercise for today's session only ---- */
function openSwapModal(day, log, exId) {
  const cur = getEx(exId);
  const group = muscleGroup(cur);
  // the slot in the plan this exercise occupies (it may itself be a swap)
  const slotId = Object.keys(log.swaps).find((k) => log.swaps[k] === exId) || exId;
  const inUse = new Set(dayExercises(day).map((id) => log.swaps[id] || id));
  const options = allExerciseIds().filter((id) => {
    const e = getEx(id);
    return e && id !== exId && !inUse.has(id) && muscleGroup(e) === group;
  });

  const wrap = openModal(`
    <h2>Swap: ${esc(cur.name)}</h2>
    <p class="muted small">Machine busy or exercise not possible today? Pick a replacement that trains the same muscles (${esc(group)}). This changes today only — your plan stays the same.</p>
    <div style="margin-top:10px">
      ${slotId !== exId ? `<div class="food-row"><div class="fr-name">↩ Restore original (${esc(getEx(slotId)?.name || slotId)})</div><div class="qty-controls"><button data-swap="__restore__">Use</button></div></div>` : ""}
      ${options.map((id) => {
        const e = getEx(id);
        return `<div class="food-row">
          <div><div class="fr-name">${esc(e.name)}</div><div class="fr-sub">${esc(e.muscle)} · ${esc(e.equipment)} · ${e.sets}×${esc(e.reps)}</div></div>
          <div class="qty-controls"><button data-swap="${id}">Use</button></div>
        </div>`;
      }).join("") || `<p class="muted small">No alternatives available for this muscle group.</p>`}
    </div>
    <button class="btn secondary block" style="margin-top:12px" id="swapCancel">Cancel</button>`);

  wrap.querySelector("#swapCancel").onclick = () => wrap.remove();
  wrap.querySelectorAll("[data-swap]").forEach((b) => b.onclick = () => {
    const chosen = b.dataset.swap;
    if (chosen === "__restore__" || chosen === slotId) delete log.swaps[slotId];
    else log.swaps[slotId] = chosen;
    persist();
    wrap.remove();
    renderWorkout(day.id);
    toast(chosen === "__restore__" ? "Original exercise restored" : "Swapped for today ⇄");
  });
}

/* ---- Edit a plan day permanently ---- */
function openPlanEditor(day) {
  let list = [...dayExercises(day)];

  const wrap = openModal(`<div id="planEditorBody"></div>`);
  const body = wrap.querySelector("#planEditorBody");

  const draw = () => {
    const grouped = {};
    allExerciseIds().forEach((id) => {
      const e = getEx(id);
      if (!e || list.includes(id)) return;
      const g = muscleGroup(e);
      (grouped[g] = grouped[g] || []).push(`<option value="${id}">${esc(e.name)} (${e.sets}×${esc(e.reps)})</option>`);
    });
    body.innerHTML = `
      <h2>Edit: ${esc(day.title)}</h2>
      <p class="muted small">Remove (✕), reorder (↑), or add exercises. This changes the plan permanently — use ⇄ in a workout for one-day swaps.</p>
      <div style="margin:12px 0">
        ${list.map((id, i) => {
          const e = getEx(id);
          return `<div class="food-row">
            <div><div class="fr-name">${e ? esc(e.name) : id}</div><div class="fr-sub">${e ? esc(muscleGroup(e)) + " · " + e.sets + "×" + esc(e.reps) : "unknown exercise"}</div></div>
            <div class="qty-controls">
              <button data-up="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
              <button data-rm="${i}">✕</button>
            </div>
          </div>`;
        }).join("") || `<p class="muted small">No exercises — add some below.</p>`}
      </div>
      <div class="field"><label>Add exercise</label>
        <select id="peAdd"><option value="">— pick an exercise —</option>
          ${MUSCLE_GROUPS.filter((g) => grouped[g]).map((g) => `<optgroup label="${g}">${grouped[g].join("")}</optgroup>`).join("")}
        </select>
      </div>
      <div class="error-msg" id="peErr"></div>
      <div class="form-row">
        <button class="btn secondary" id="peReset">Reset to default</button>
        <button class="btn secondary" id="peCancel">Cancel</button>
        <button class="btn block" id="peSave">Save ✔</button>
      </div>`;

    body.querySelectorAll("[data-up]").forEach((b) => b.onclick = () => {
      const i = +b.dataset.up;
      [list[i - 1], list[i]] = [list[i], list[i - 1]];
      draw();
    });
    body.querySelectorAll("[data-rm]").forEach((b) => b.onclick = () => {
      list.splice(+b.dataset.rm, 1);
      draw();
    });
    body.querySelector("#peAdd").onchange = (e) => {
      if (e.target.value) { list.push(e.target.value); draw(); }
    };
    body.querySelector("#peCancel").onclick = () => wrap.remove();
    body.querySelector("#peReset").onclick = () => {
      if (U.customPlan) delete U.customPlan[day.id];
      persist();
      wrap.remove();
      renderPlan();
      toast("Day reset to the default plan");
    };
    body.querySelector("#peSave").onclick = () => {
      if (!list.length) { body.querySelector("#peErr").textContent = "A workout day needs at least 1 exercise."; return; }
      if (!U.customPlan) U.customPlan = {};
      U.customPlan[day.id] = list;
      persist();
      wrap.remove();
      renderPlan();
      toast("Plan updated ✔");
    };
  };
  draw();
}

/* ---- Create / edit a custom exercise ---- */
function openExerciseModal(existingId, onSaved) {
  const existing = existingId ? U.customExercises[existingId] : null;
  const wrap = openModal(`
    <h2>${existing ? "Edit exercise" : "New exercise"}</h2>
    <div class="field" style="margin-top:10px"><label>Name</label><input id="cxName" maxlength="60" placeholder="e.g. Chest press machine at my gym" value="${esc(existing ? existing.name : "")}"></div>
    <div class="form-row">
      <div class="field"><label>Muscle group</label>
        <select id="cxGroup">${MUSCLE_GROUPS.map((g) => `<option ${existing && existing.muscle === g ? "selected" : ""}>${g}</option>`).join("")}</select>
      </div>
      <div class="field"><label>Equipment</label><input id="cxEquip" maxlength="30" placeholder="e.g. Machine" value="${esc(existing ? existing.equipment : "")}"></div>
    </div>
    <div class="form-row">
      <div class="field"><label>Uses weight?</label>
        <select id="cxWeight"><option value="yes" ${!existing || existing.needsWeight ? "selected" : ""}>Yes — track kg</option><option value="no" ${existing && !existing.needsWeight ? "selected" : ""}>No — bodyweight/time</option></select>
      </div>
      <div class="field"><label>Sets</label><input id="cxSets" type="number" min="1" max="10" value="${existing ? existing.sets : 3}"></div>
    </div>
    <div class="form-row">
      <div class="field"><label>Reps (e.g. 10-12)</label><input id="cxReps" maxlength="30" value="${esc(existing ? existing.reps : "10-12")}"></div>
      <div class="field"><label>Rest (seconds)</label><input id="cxRest" type="number" min="0" max="600" value="${existing ? existing.restSec : 90}"></div>
    </div>
    <div class="field"><label>YouTube video link (optional)</label><input id="cxVideo" placeholder="https://www.youtube.com/watch?v=..." value="${existing && existing.videoId ? "https://www.youtube.com/watch?v=" + esc(existing.videoId) : ""}"></div>
    <div class="field"><label>How to do it (optional, one step per line)</label><textarea id="cxSteps">${existing && existing.steps ? esc(existing.steps.join("\n")) : ""}</textarea></div>
    <div class="error-msg" id="cxErr"></div>
    <div class="form-row">
      <button class="btn secondary" id="cxCancel">Cancel</button>
      <button class="btn block" id="cxSave">Save ✔</button>
    </div>`);

  wrap.querySelector("#cxCancel").onclick = () => wrap.remove();
  wrap.querySelector("#cxSave").onclick = () => {
    const name = wrap.querySelector("#cxName").value.trim();
    if (!name) { wrap.querySelector("#cxErr").textContent = "Give the exercise a name."; return; }
    const vid = wrap.querySelector("#cxVideo").value.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    const id = existingId || "cx_" + Date.now().toString(36);
    if (!U.customExercises) U.customExercises = {};
    U.customExercises[id] = {
      name,
      muscle: wrap.querySelector("#cxGroup").value,
      equipment: wrap.querySelector("#cxEquip").value.trim() || "—",
      needsWeight: wrap.querySelector("#cxWeight").value === "yes",
      sets: Math.min(10, Math.max(1, +wrap.querySelector("#cxSets").value || 3)),
      reps: wrap.querySelector("#cxReps").value.trim() || "10-12",
      restSec: Math.max(0, +wrap.querySelector("#cxRest").value || 90),
      steps: wrap.querySelector("#cxSteps").value.split("\n").map((s) => s.trim()).filter(Boolean),
      mistake: "", startWeight: "",
      videoId: vid ? vid[1] : null,
      search: name + " proper form",
      custom: true
    };
    persist();
    wrap.remove();
    toast(existing ? "Exercise updated ✔" : "Exercise added ✔");
    if (onSaved) onSaved();
  };
}

function deleteCustomExercise(id) {
  delete U.customExercises[id];
  // strip it from any edited plan days
  if (U.customPlan) {
    Object.keys(U.customPlan).forEach((dayId) => {
      U.customPlan[dayId] = U.customPlan[dayId].filter((x) => x !== id);
      if (!U.customPlan[dayId].length) delete U.customPlan[dayId];
    });
  }
  // strip from today's swaps
  const t = U.logs.workouts[todayISO()];
  if (t && t.swaps) Object.keys(t.swaps).forEach((k) => { if (t.swaps[k] === id || k === id) delete t.swaps[k]; });
  persist();
}

/* ================= WEEK PLAN VIEW ================= */

function renderPlan() {
  const host = $("#view-plan");
  const tpl = getPlanTemplate();
  const map = weekAssignment();
  const today = new Date().getDay();
  const timingInfo = TIMING_GUIDE[U.schedule.foodTiming === "before" ? "beforeFood" : "afterFood"];

  host.innerHTML = `
    <div class="card">
      <h2>${esc(tpl.label)}</h2>
      <p class="muted">${esc(tpl.description)}</p>
      <p class="muted small" style="margin-top:6px">⏰ Usual time: <strong>${esc(U.schedule.time)}</strong> · 🍽️ ${U.schedule.foodTiming === "before" ? "Before food" : "After food"} — change in Settings.</p>
    </div>
    <div class="week-grid">
      ${[1, 2, 3, 4, 5, 6, 0].map((wd) => {
        const d = map[wd];
        const edited = d && U.customPlan && U.customPlan[d.id];
        return `
        <div class="week-day ${wd === today ? "today-row" : ""} ${d ? "" : "rest-day"}">
          <div class="wd-name">${DAY_NAMES[wd]}</div>
          <div class="wd-info">
            <div class="wd-title">${d ? esc(d.title) : "Rest"} ${edited ? '<span class="pill" style="font-size:0.62rem">customized</span>' : ""}</div>
            <div class="wd-sub">${d ? esc(d.focus) + " · " + dayExercises(d).length + " exercises" : "Recovery day"}</div>
          </div>
          ${d ? `<button class="btn small-btn secondary" data-editday="${d.id}">✎</button><button class="btn small-btn secondary" data-day="${d.id}">View</button>` : ""}
        </div>`;
      }).join("")}
    </div>
    <div class="card">
      <h3>🍽️ ${esc(timingInfo.label)}</h3>
      <ul class="checklist">${timingInfo.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </div>`;

  host.querySelectorAll("[data-day]").forEach((b) => b.onclick = () => {
    show("workout");
    renderWorkout(b.dataset.day);
  });
  host.querySelectorAll("[data-editday]").forEach((b) => b.onclick = () => {
    const d = templateDayById(b.dataset.editday);
    if (d) openPlanEditor(d);
  });
}

/* ================= FOOD / CALORIE TRACKER ================= */

/* Custom foods: user-created foods + edited copies of built-in foods.
   An entry with overrideOf replaces that built-in food everywhere. */
function customFoods() {
  if (!U.customFoods) U.customFoods = [];
  return U.customFoods;
}
function foodById(id) {
  const cf = customFoods();
  return cf.find((f) => f.id === id)
    || cf.find((f) => f.overrideOf === id)
    || FOODS.find((f) => f.id === id)
    || { name: "?", kcal: 0, protein: 0, carbs: 0, fat: 0, serving: "" };
}
function allFoods() {
  const cf = customFoods();
  const overridden = new Set(cf.map((f) => f.overrideOf).filter(Boolean));
  return [...cf, ...FOODS.filter((f) => !overridden.has(f.id))];
}

/* Create/edit food modal. `existing` = food object being edited (or null). */
function openFoodModal(existing, onSaved) {
  const isBuiltin = existing && !existing.custom;
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop";
  wrap.innerHTML = `
    <div class="modal">
      <h2>${existing ? "Edit food" : "New food"}</h2>
      ${isBuiltin ? `<p class="muted small">You're editing a built-in food — your version will replace it everywhere in the app.</p>` : ""}
      <div class="field" style="margin-top:10px"><label>Name</label><input id="cfName" type="text" maxlength="60" placeholder="e.g. Mom's dal fry" value="${esc(existing ? existing.name : "")}"></div>
      <div class="field"><label>Serving description</label><input id="cfServing" type="text" maxlength="40" placeholder="e.g. 1 bowl (200g)" value="${esc(existing ? existing.serving : "")}"></div>
      <div class="form-row">
        <div class="field"><label>Calories (kcal)</label><input id="cfKcal" type="number" min="0" max="5000" step="1" value="${existing ? existing.kcal : ""}"></div>
        <div class="field"><label>Protein (g)</label><input id="cfP" type="number" min="0" max="500" step="0.5" value="${existing ? existing.protein : ""}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Carbs (g)</label><input id="cfC" type="number" min="0" max="500" step="0.5" value="${existing ? existing.carbs : ""}"></div>
        <div class="field"><label>Fat (g)</label><input id="cfF" type="number" min="0" max="500" step="0.5" value="${existing ? existing.fat : ""}"></div>
      </div>
      <p class="muted small">Tip: values are per ONE serving. Food packet labels usually show per 100g — adjust for your portion.</p>
      <div class="error-msg" id="cfErr"></div>
      <div class="form-row">
        <button class="btn secondary" id="cfCancel">Cancel</button>
        <button class="btn block" id="cfSave">Save ✔</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  wrap.querySelector("#cfName").focus();
  const close = () => wrap.remove();
  wrap.onclick = (e) => { if (e.target === wrap) close(); };
  wrap.querySelector("#cfCancel").onclick = close;
  wrap.querySelector("#cfSave").onclick = () => {
    const name = wrap.querySelector("#cfName").value.trim();
    const serving = wrap.querySelector("#cfServing").value.trim() || "1 serving";
    const kcal = +wrap.querySelector("#cfKcal").value;
    const p = +wrap.querySelector("#cfP").value || 0;
    const c = +wrap.querySelector("#cfC").value || 0;
    const f = +wrap.querySelector("#cfF").value || 0;
    if (!name) { wrap.querySelector("#cfErr").textContent = "Give the food a name."; return; }
    if (!(kcal >= 0) || wrap.querySelector("#cfKcal").value === "") { wrap.querySelector("#cfErr").textContent = "Enter the calories (0 is allowed)."; return; }
    const cf = customFoods();
    if (existing && existing.custom) {
      Object.assign(existing, { name, serving, kcal, protein: p, carbs: c, fat: f });
    } else {
      cf.push({
        id: "cf_" + Date.now().toString(36),
        name, serving, kcal, protein: p, carbs: c, fat: f,
        custom: true,
        ...(isBuiltin ? { overrideOf: existing.id } : {})
      });
    }
    persist();
    close();
    toast(existing ? "Food updated ✔" : "Food added ✔");
    if (onSaved) onSaved();
  };
}

function deleteCustomFood(id) {
  const cf = customFoods();
  const idx = cf.findIndex((f) => f.id === id);
  if (idx === -1) return;
  const wasOverride = cf[idx].overrideOf;
  cf.splice(idx, 1);
  // Remove log entries pointing at the deleted custom food (they'd become orphans).
  // If it was an edited built-in, point the entries back at the original instead.
  Object.values(U.logs.food).forEach((arr) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].foodId === id) {
        if (wasOverride) arr[i].foodId = wasOverride;
        else arr.splice(i, 1);
      }
    }
  });
  persist();
}

function renderFood() {
  const host = $("#view-food");

  if (!U.settings.calorieTracker) {
    host.innerHTML = `
      <div class="card">
        <h2>Calorie & protein tracker</h2>
        <p class="muted">Fat loss = eating slightly fewer calories than you burn. Tracking for even 2-3 weeks teaches you more about food than years of guessing. All pure-veg foods, no egg.</p>
        <button class="btn" id="enableCal" style="margin-top:12px">Turn on the tracker</button>
      </div>`;
    $("#enableCal").onclick = () => { U.settings.calorieTracker = true; persist(); renderFood(); };
    return;
  }

  const targets = calorieTargets({ ...U.profile, weightKg: latestWeight() });
  const dateKey = todayISO();
  const items = U.logs.food[dateKey] || [];
  const tot = items.reduce((a, it) => {
    const f = foodById(it.foodId);
    a.kcal += f.kcal * it.qty; a.p += f.protein * it.qty; a.c += f.carbs * it.qty; a.f += f.fat * it.qty;
    return a;
  }, { kcal: 0, p: 0, c: 0, f: 0 });

  host.innerHTML = `
    <div class="card">
      <h2>Today's food</h2>
      ${targets ? `
      <div class="muted small">Target: <strong>${targets.kcal} kcal</strong> (${esc(targets.label)}) · Protein <strong>${targets.protein} g</strong></div>
      <div class="macro-bar" title="protein / carbs / fat">
        <div class="seg-p" style="width:${pct(tot.p * 4, targets.kcal)}%"></div>
        <div class="seg-c" style="width:${pct(tot.c * 4, targets.kcal)}%"></div>
        <div class="seg-f" style="width:${pct(tot.f * 9, targets.kcal)}%"></div>
      </div>` : ""}
      <div class="stat-grid" style="margin-top:10px">
        <div class="stat-card"><div class="stat-num">${Math.round(tot.kcal)}</div><div class="stat-label">kcal eaten${targets ? " / " + targets.kcal : ""}</div></div>
        <div class="stat-card"><div class="stat-num accent">${Math.round(tot.p)}g</div><div class="stat-label">protein${targets ? " / " + targets.protein + "g" : ""}</div></div>
        <div class="stat-card"><div class="stat-num">${Math.round(tot.c)}g</div><div class="stat-label">carbs</div></div>
        <div class="stat-card"><div class="stat-num">${Math.round(tot.f)}g</div><div class="stat-label">fat</div></div>
      </div>
    </div>

    <div class="card">
      <h3>Logged today</h3>
      <div id="foodLogList">
        ${items.length ? items.map((it, idx) => {
          const f = foodById(it.foodId);
          return `
          <div class="food-row">
            <div><div class="fr-name">${esc(f.name)}</div><div class="fr-sub">${esc(f.serving)} × ${it.qty}</div></div>
            <div class="qty-controls">
              <span class="fr-kcal">${Math.round(f.kcal * it.qty)} kcal</span>
              <button data-act="minus" data-idx="${idx}">−</button>
              <button data-act="plus" data-idx="${idx}">+</button>
              <button data-act="del" data-idx="${idx}">✕</button>
            </div>
          </div>`;
        }).join("") : `<p class="muted small">Nothing logged yet — search below and add your meals.</p>`}
      </div>
    </div>

    <div class="card">
      <div class="food-add-head">
        <h3>Add food (pure veg)</h3>
        <button class="btn small-btn" id="newFoodBtn">➕ New food</button>
      </div>
      <input class="search-box" id="foodSearch" placeholder="Search: dal, paneer, roti, soya...">
      <p class="muted small" style="margin-bottom:8px">Don't see your food or the values look off? Create your own with ➕, or tap ✎ on any food to edit it.</p>
      <div id="foodResults"></div>
    </div>`;

  $("#newFoodBtn").onclick = () => openFoodModal(null, renderFood);

  const renderResults = (q) => {
    const list = allFoods().filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 12);
    $("#foodResults").innerHTML = list.map((f) => `
      <div class="food-row">
        <div>
          <div class="fr-name">${esc(f.name)} ${f.custom ? `<span class="pill" style="font-size:0.62rem">${f.overrideOf ? "edited" : "custom"}</span>` : ""}</div>
          <div class="fr-sub">${esc(f.serving)} · P ${f.protein}g C ${f.carbs}g F ${f.fat}g</div>
        </div>
        <div class="qty-controls">
          <span class="fr-kcal">${f.kcal} kcal</span>
          <button data-edit="${f.id}" title="Edit this food">✎</button>
          ${f.custom ? `<button data-delfood="${f.id}" title="Delete this food">🗑</button>` : ""}
          <button data-add="${f.id}">＋ Add</button>
        </div>
      </div>`).join("") || `<p class="muted small">No match — tap ➕ New food to create it.</p>`;
    $("#foodResults").querySelectorAll("[data-add]").forEach((b) => b.onclick = () => {
      if (!U.logs.food[dateKey]) U.logs.food[dateKey] = [];
      const ex = U.logs.food[dateKey].find((x) => x.foodId === b.dataset.add);
      if (ex) ex.qty += 1; else U.logs.food[dateKey].push({ foodId: b.dataset.add, qty: 1 });
      persist(); renderFood();
    });
    $("#foodResults").querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => {
      const f = allFoods().find((x) => x.id === b.dataset.edit);
      if (f) openFoodModal(f, renderFood);
    });
    $("#foodResults").querySelectorAll("[data-delfood]").forEach((b) => b.onclick = () => {
      const f = customFoods().find((x) => x.id === b.dataset.delfood);
      if (f && confirm(`Delete "${f.name}"?${f.overrideOf ? " The original built-in food will come back." : ""}`)) {
        deleteCustomFood(f.id);
        renderFood();
        toast("Food deleted");
      }
    });
  };
  $("#foodSearch").oninput = (e) => renderResults(e.target.value);
  renderResults("");

  $("#foodLogList").querySelectorAll("button").forEach((b) => b.onclick = () => {
    const idx = +b.dataset.idx, act = b.dataset.act;
    const arr = U.logs.food[dateKey];
    if (act === "plus") arr[idx].qty += 1;
    if (act === "minus") { arr[idx].qty -= 1; if (arr[idx].qty <= 0) arr.splice(idx, 1); }
    if (act === "del") arr.splice(idx, 1);
    persist(); renderFood();
  });
}
function pct(part, whole) { return whole ? Math.min(100, (part / whole) * 100).toFixed(1) : 0; }

/* ================= PROGRESS ================= */

function renderProgress() {
  const host = $("#view-progress");
  const weights = [...U.logs.weights].sort((a, b) => a.date.localeCompare(b.date));
  const workoutDates = Object.entries(U.logs.workouts).filter(([, l]) => l.completed).map(([d]) => d).sort().reverse();
  const photos = Object.entries(U.logs.photos || {}).sort((a, b) => a[0].localeCompare(b[0]));

  host.innerHTML = `
    <div class="card">
      <h2>Weight trend</h2>
      ${weights.length >= 2
        ? `<div class="chart-wrap"><canvas class="weight-chart" id="weightChart" width="900" height="220"></canvas></div>`
        : `<p class="muted">Log your weight a few times (Dashboard → Quick weight log) and the chart appears here.</p>`}
      ${weights.length ? `<p class="muted small" style="margin-top:8px">Start: <strong>${weights[0].kg} kg</strong> → Now: <strong>${weights[weights.length - 1].kg} kg</strong> (${change(weights)})${U.profile.targetWeightKg ? ` · Target: ${U.profile.targetWeightKg} kg` : ""}</p>` : ""}
    </div>

    <div class="card">
      <h3>Progress photos</h3>
      <p class="muted small">Take one every 2 weeks — same pose, same lighting. This is where you'll SEE the change even when the scale is boring.</p>
      <button class="btn small-btn secondary" id="addPhotoBtn" style="margin:8px 0">📷 Add progress photo</button>
      <input type="file" id="progressPhotoInput" accept="image/*" class="hidden">
      <div class="progress-photos" id="photoGrid">
        ${photos.map(([date, src]) => `
          <figure data-date="${date}">
            <img src="${src}" alt="progress ${date}">
            <button class="del-photo" data-date="${date}">✕</button>
            <figcaption>${date}</figcaption>
          </figure>`).join("")}
      </div>
    </div>

    <div class="card">
      <h3>🏆 Personal records</h3>
      ${(() => {
        const prs = Object.entries(personalRecords()).sort((a, b) => b[1].w - a[1].w);
        if (!prs.length) return `<p class="muted small">Complete weighted sets and your best lifts appear here. Beat one mid-workout and you'll get a 🎉.</p>`;
        return `<div style="overflow-x:auto"><table class="protein-table">
          <tr><th>Exercise</th><th>Best</th><th>Date</th></tr>
          ${prs.map(([exId, pr]) => {
            const e = getEx(exId);
            return `<tr><td>${e ? esc(e.name) : exId}</td><td>${pr.w} kg</td><td class="muted small">${pr.date}</td></tr>`;
          }).join("")}
        </table></div>`;
      })()}
    </div>

    <div class="card">
      <h3>Workout history</h3>
      <p class="muted small">${workoutDates.length} workouts completed total 💪 — tap one to see every set.</p>
      <div>
        ${workoutDates.slice(0, 15).map((d) => {
          const l = U.logs.workouts[d];
          const day = templateDayById(l.dayId);
          return `<div class="food-row">
            <div><div class="fr-name">${day ? esc(day.title) : "Workout"}</div><div class="fr-sub">${d}</div></div>
            <div class="qty-controls"><button data-hist="${d}">View</button></div>
          </div>`;
        }).join("") || "<p class='muted small'>No workouts yet — today is a great day to start.</p>"}
      </div>
    </div>`;

  if (weights.length >= 2) drawWeightChart($("#weightChart"), weights);

  $("#addPhotoBtn").onclick = () => $("#progressPhotoInput").click();
  $("#progressPhotoInput").onchange = (e) => {
    const f = e.target.files[0];
    if (f) compressImage(f, 600, (dataUrl) => {
      if (!U.logs.photos) U.logs.photos = {};
      U.logs.photos[todayISO()] = dataUrl;
      try { persist(); } catch { toast("Storage full — delete an older photo first."); return; }
      renderProgress();
      toast("Photo saved 📷");
    });
  };
  host.querySelectorAll(".del-photo").forEach((b) => b.onclick = () => {
    delete U.logs.photos[b.dataset.date];
    persist(); renderProgress();
  });
  host.querySelectorAll("[data-hist]").forEach((b) => b.onclick = () => openHistoryModal(b.dataset.hist));
}

/* ---- Workout history detail ---- */
function openHistoryModal(date) {
  const l = U.logs.workouts[date];
  if (!l) return;
  const day = templateDayById(l.dayId);
  const wrap = openModal(`
    <h2>${day ? esc(day.title) : "Workout"} <span class="pill blue">${date}</span></h2>
    <div style="margin-top:10px">
      ${Object.entries(l.sets || {}).map(([exId, sets]) => {
        const e = getEx(exId);
        const doneSets = sets.filter((s) => s.done);
        if (!doneSets.length && !sets.some((s) => s.w || s.r)) return "";
        return `<div style="margin-bottom:12px">
          <div class="fr-name">${e ? esc(e.name) : exId}</div>
          <div class="fr-sub">${sets.map((s, i) =>
            `Set ${i + 1}: ${s.w !== "" && s.w != null ? s.w + " kg × " : ""}${s.r !== "" && s.r != null ? s.r : "—"} ${s.done ? "✔" : "✗"}`
          ).join(" · ")}</div>
        </div>`;
      }).join("") || `<p class="muted small">No set data was recorded for this workout.</p>`}
    </div>
    <button class="btn secondary block" id="histClose">Close</button>`);
  wrap.querySelector("#histClose").onclick = () => wrap.remove();
}

function change(weights) {
  const diff = +(weights[weights.length - 1].kg - weights[0].kg).toFixed(1);
  if (diff === 0) return "no change yet";
  return (diff > 0 ? "+" : "") + diff + " kg";
}

function drawWeightChart(canvas, weights) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, pad = 36;
  ctx.clearRect(0, 0, W, H);
  const vals = weights.map((w) => w.kg);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (U.profile.targetWeightKg) { min = Math.min(min, U.profile.targetWeightKg); max = Math.max(max, U.profile.targetWeightKg); }
  const range = Math.max(2, max - min);
  min -= range * 0.1; max += range * 0.1;

  const x = (i) => pad + (i / Math.max(1, weights.length - 1)) * (W - pad * 2);
  const y = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);

  // grid
  ctx.strokeStyle = "#2c3648"; ctx.fillStyle = "#93a0b4"; ctx.font = "11px sans-serif"; ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const v = min + ((max - min) * g) / 4;
    ctx.beginPath(); ctx.moveTo(pad, y(v)); ctx.lineTo(W - pad, y(v)); ctx.stroke();
    ctx.fillText(v.toFixed(1), 2, y(v) + 4);
  }
  // target line
  if (U.profile.targetWeightKg) {
    ctx.strokeStyle = "#f59e0b"; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(pad, y(U.profile.targetWeightKg)); ctx.lineTo(W - pad, y(U.profile.targetWeightKg)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f59e0b"; ctx.fillText("target", W - pad - 34, y(U.profile.targetWeightKg) - 6);
  }
  // line
  ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 2.5; ctx.beginPath();
  weights.forEach((w, i) => { i === 0 ? ctx.moveTo(x(i), y(w.kg)) : ctx.lineTo(x(i), y(w.kg)); });
  ctx.stroke();
  // dots
  ctx.fillStyle = "#22c55e";
  weights.forEach((w, i) => { ctx.beginPath(); ctx.arc(x(i), y(w.kg), 3.5, 0, Math.PI * 2); ctx.fill(); });
  // x labels (first, mid, last)
  ctx.fillStyle = "#93a0b4";
  [0, Math.floor((weights.length - 1) / 2), weights.length - 1].forEach((i) => {
    if (i >= 0 && weights[i]) ctx.fillText(weights[i].date.slice(5), x(i) - 14, H - 8);
  });
}

/* ================= GUIDE ================= */

function renderGuide() {
  const host = $("#view-guide");
  const targets = calorieTargets({ ...U.profile, weightKg: latestWeight() });

  host.innerHTML = `
    <div class="card guide-card">
      <h2>Your beginner guide 📖</h2>
      <p class="muted">You said you're new to weights — this page is your personal trainer's briefing. Read it once fully, revisit any time.</p>
    </div>

    <div class="card">
      <h3>The 8 rules that matter</h3>
      ${BEGINNER_RULES.map((r) => `
        <details class="guide-acc"><summary>${esc(r.title)}</summary><div class="acc-body">${esc(r.body)}</div></details>`).join("")}
    </div>

    <div class="card">
      <h3>🌱 Pure-veg protein guide (no egg)</h3>
      <p class="muted small">${esc(PROTEIN_GUIDE.target)}${targets ? ` For you right now that's about <strong class="accent">${targets.protein} g/day</strong>.` : ""}</p>
      <p class="muted small" style="margin:8px 0">${esc(PROTEIN_GUIDE.note)}</p>
      <div style="overflow-x:auto">
      <table class="protein-table">
        <tr><th>Food</th><th>Protein</th><th>Tip</th></tr>
        ${PROTEIN_GUIDE.best.map((b) => `<tr><td>${esc(b.food)}</td><td>${esc(b.protein)}</td><td class="muted small">${esc(b.tip)}</td></tr>`).join("")}
      </table>
      </div>
      <div class="mistake-box" style="margin-top:12px">💡 ${esc(PROTEIN_GUIDE.combos)}</div>
    </div>

    <div class="card">
      <h3>🍽️ Food & workout timing</h3>
      ${[TIMING_GUIDE.beforeFood, TIMING_GUIDE.afterFood].map((t) => `
        <details class="guide-acc"><summary>${esc(t.label)}</summary>
          <div class="acc-body"><ul class="checklist">${t.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
        </details>`).join("")}
    </div>

    <div class="card">
      <h3>📅 About your current plan</h3>
      <p class="muted">${esc(getPlanTemplate().label)} — ${esc(getPlanTemplate().description)}</p>
      <p class="muted small" style="margin-top:8px">Coming from weeks of cardio-only training, your first 2 weeks with weights will feel sore — that's normal adaptation, not damage. Start lighter than your ego wants.</p>
    </div>`;
}

/* ================= SETTINGS ================= */

function renderSettings() {
  const host = $("#view-settings");
  const p = U.profile, sc = U.schedule;

  host.innerHTML = `
    <div class="card">
      <h2>Profile</h2>
      <div class="form-row">
        <div class="field"><label>Age</label><input id="sAge" type="number" value="${esc(p.age)}"></div>
        <div class="field"><label>Gender</label>
          <select id="sGender">
            <option value="male" ${p.gender === "male" ? "selected" : ""}>Male</option>
            <option value="female" ${p.gender === "female" ? "selected" : ""}>Female</option>
          </select></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Height (cm)</label><input id="sHeight" type="number" value="${esc(p.heightCm)}"></div>
        <div class="field"><label>Target weight (kg)</label><input id="sTarget" type="number" step="0.1" value="${esc(p.targetWeightKg ?? "")}"></div>
      </div>
      <div class="field"><label>Goal</label>
        <select id="sGoal">
          <option value="fatloss" ${p.goal === "fatloss" ? "selected" : ""}>🔥 Fat loss</option>
          <option value="recomp" ${p.goal === "recomp" ? "selected" : ""}>💎 Slim + strong (aesthetic)</option>
          <option value="muscle" ${p.goal === "muscle" ? "selected" : ""}>💪 Build muscle</option>
        </select></div>
      <div class="field"><label>Notes</label><textarea id="sNotes">${esc(p.notes || "")}</textarea></div>
    </div>

    <div class="card">
      <h2>Weekly schedule</h2>
      <div class="field"><label>Days per week</label>
        <div class="segment" id="sDpw">
          ${[3, 4, 5, 6].map((n) => `<button data-n="${n}" class="${sc.daysPerWeek === n ? "selected" : ""}">${n} days</button>`).join("")}
        </div>
        <div class="hint" id="sDpwHint">${esc(PLAN_TEMPLATES[sc.daysPerWeek].label)}</div>
      </div>
      <div class="field"><label>Training days <span class="accent" id="sDayCount"></span></label>
        <div class="day-picker" id="sDayPicker">
          ${[1, 2, 3, 4, 5, 6, 0].map((wd) => `<button data-wd="${wd}" class="${sc.selectedDays.includes(wd) ? "selected" : ""}">${DAY_NAMES[wd]}</button>`).join("")}
        </div>
      </div>
      <div class="form-row">
        <div class="field"><label>Workout time</label><input id="sTime" type="time" value="${esc(sc.time)}"></div>
        <div class="field"><label>Before or after food</label>
          <select id="sFood">
            <option value="after" ${sc.foodTiming === "after" ? "selected" : ""}>After eating</option>
            <option value="before" ${sc.foodTiming === "before" ? "selected" : ""}>Before eating</option>
          </select></div>
      </div>
      <div class="field"><label>Calorie tracker</label>
        <select id="sCal">
          <option value="on" ${U.settings.calorieTracker ? "selected" : ""}>On</option>
          <option value="off" ${!U.settings.calorieTracker ? "selected" : ""}>Off</option>
        </select></div>
      <div class="error-msg" id="sErr"></div>
      <button class="btn block" id="saveSettings">Save changes ✔</button>
    </div>

    <div class="card">
      <h2>My exercises</h2>
      <p class="muted small">Add machines/exercises from your gym that aren't in the app. They become available in plan editing (Plan → ✎) and swaps (⇄).</p>
      <div id="customExList" style="margin:10px 0">
        ${Object.entries(U.customExercises || {}).map(([id, e]) => `
          <div class="food-row">
            <div><div class="fr-name">${esc(e.name)}</div><div class="fr-sub">${esc(e.muscle)} · ${e.sets}×${esc(e.reps)}${e.videoId ? " · 📹" : ""}</div></div>
            <div class="qty-controls"><button data-cxedit="${id}">✎</button><button data-cxdel="${id}">🗑</button></div>
          </div>`).join("") || `<p class="muted small">None yet.</p>`}
      </div>
      <button class="btn small-btn" id="addExerciseBtn">➕ New exercise</button>
    </div>

    <div class="card">
      <h2>Data</h2>
      <p class="muted small">Everything is stored only in this browser (localStorage). Export a backup if you clear browser data or switch devices.</p>
      <div class="form-row" style="margin-top:10px">
        <button class="btn secondary" id="exportBtn">⬇ Export backup</button>
        <button class="btn secondary" id="importBtn">⬆ Import backup</button>
      </div>
      <input type="file" id="importInput" accept=".json,application/json" class="hidden">
      <div class="form-row" style="margin-top:10px">
        <button class="btn secondary" id="logoutBtn">Log out</button>
        <button class="btn danger" id="resetBtn">Delete my account & data</button>
      </div>
    </div>

    <p class="app-credit">HAPA — Created by <strong>Harsh</strong> 💪</p>`;

  // schedule editing state
  let dpw = sc.daysPerWeek;
  let days = [...sc.selectedDays];
  const syncCount = () => $("#sDayCount").textContent = `(${days.length}/${dpw})`;
  syncCount();

  $("#sDpw").onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    dpw = +b.dataset.n;
    $$("#sDpw button").forEach((x) => x.classList.toggle("selected", +x.dataset.n === dpw));
    $("#sDpwHint").textContent = PLAN_TEMPLATES[dpw].label;
    if (days.length > dpw) days = days.slice(0, dpw);
    $$("#sDayPicker button").forEach((x) => x.classList.toggle("selected", days.includes(+x.dataset.wd)));
    syncCount();
  };
  $("#sDayPicker").onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const wd = +b.dataset.wd;
    if (days.includes(wd)) days = days.filter((x) => x !== wd);
    else if (days.length < dpw) days.push(wd);
    else { toast(`Already ${dpw} days picked — unselect one first.`); return; }
    b.classList.toggle("selected", days.includes(wd));
    syncCount();
  };

  $("#saveSettings").onclick = () => {
    if (days.length !== dpw) { $("#sErr").textContent = `Pick exactly ${dpw} training days (you picked ${days.length}).`; return; }
    p.age = +$("#sAge").value || p.age;
    p.gender = $("#sGender").value;
    p.heightCm = +$("#sHeight").value || p.heightCm;
    p.targetWeightKg = +$("#sTarget").value || null;
    p.goal = $("#sGoal").value;
    p.notes = $("#sNotes").value.trim();
    U.schedule = { daysPerWeek: dpw, selectedDays: days, time: $("#sTime").value || "18:00", foodTiming: $("#sFood").value };
    U.settings.calorieTracker = $("#sCal").value === "on";
    persist();
    toast("Settings saved — plan updated ✔");
    renderSettings();
  };

  $("#exportBtn").onclick = () => {
    const key = currentUsername();
    const blob = new Blob([JSON.stringify({ hapaBackup: 1, user: key, data: USERS[key] }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hapa-backup-${key}-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $("#importBtn").onclick = () => $("#importInput").click();
  $("#importInput").onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (!obj.hapaBackup || !obj.data) throw new Error("bad file");
        const key = currentUsername();
        USERS[key] = obj.data;
        persist();
        U = USERS[key];
        toast("Backup imported ✔");
        renderUserChip();
        show("dashboard");
      } catch {
        toast("That doesn't look like a HAPA backup file.");
      }
    };
    reader.readAsText(f);
  };
  $("#addExerciseBtn").onclick = () => openExerciseModal(null, renderSettings);
  host.querySelectorAll("[data-cxedit]").forEach((b) => b.onclick = () => openExerciseModal(b.dataset.cxedit, renderSettings));
  host.querySelectorAll("[data-cxdel]").forEach((b) => b.onclick = () => {
    const e = U.customExercises[b.dataset.cxdel];
    if (e && confirm(`Delete "${e.name}"? It will be removed from your plan too (past workout logs are kept).`)) {
      deleteCustomExercise(b.dataset.cxdel);
      renderSettings();
      toast("Exercise deleted");
    }
  });
  $("#logoutBtn").onclick = logout;
  $("#resetBtn").onclick = () => {
    if (confirm("Delete this account and ALL its data from this device? This cannot be undone.")) {
      delete USERS[currentUsername()];
      persist();
      logout();
    }
  };
}

/* ================= BOOT ================= */

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  $$(".bottom-nav button").forEach((b) => b.onclick = () => show(b.dataset.view));
  $("#timerSkip").onclick = stopRestTimer;
  if (currentUsername() && USERS[currentUsername()]) enterApp();
});
