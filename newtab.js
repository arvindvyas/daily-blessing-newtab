// Daily Verse — New Tab. Pure client-side, chrome.storage.sync. No network.

const $ = (id) => document.getElementById(id);
const VERSES = (window.VERSES || [])
  .filter((v) => v && v.t && v.r)
  .map((v) => ({ ...v, faith: v.faith || "christian" }));

const state = {
  name: "",
  theme: "auto",
  faith: "", // "" = not chosen yet -> show first-run welcome
  sanskrit: true, // include Sanskrit shlokas?
  showPrayers: true,
  prayers: [],
  favorites: [],
};

let current = null; // the verse on screen right now

const uid = () => "x" + Math.random().toString(36).slice(2, 9);
const keyOf = (v) => (v ? v.r + "|" + v.t.slice(0, 24) : "");
const epochDay = () => Math.floor(Date.now() / 86400000);

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 1500);
}

async function loadState() {
  const data = await chrome.storage.sync.get(Object.keys(state));
  Object.assign(state, {
    name: data.name || "",
    theme: data.theme || "auto",
    faith: data.faith || "",
    sanskrit: data.sanskrit !== false,
    showPrayers: data.showPrayers !== false,
    prayers: Array.isArray(data.prayers) ? data.prayers : [],
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
  });
}

function persist(keys) {
  const out = {};
  for (const k of keys) out[k] = state[k];
  return chrome.storage.sync.set(out);
}

/* ---------- theme ---------- */
function applyTheme() {
  let theme = state.theme;
  if (theme === "auto") {
    theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  document.documentElement.setAttribute("data-theme", theme);
}

/* ---------- clock + greeting ---------- */
function tick() {
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const h = now.getHours();
  const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const name = state.name ? `, ${state.name}` : "";
  const date = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  $("greeting").textContent = `${part}${name} · ${date}`;
}

/* ---------- verse ---------- */
function showVerse(v) {
  current = v;
  const sa = $("verseSanskrit");
  if (v.sa) {
    sa.textContent = v.sa;
    sa.classList.remove("hidden");
  } else {
    sa.textContent = "";
    sa.classList.add("hidden");
  }
  $("verseText").textContent = v.t;
  $("verseRef").textContent = v.r;
  updateCredit(v);
  reflectFav();
}

// Credit matches the source of the verse actually on screen (correct even in "mix" mode).
function updateCredit(v) {
  const privacy = "No ads, no tracking — everything stays on your device.";
  let src;
  if (v.faith === "hindu") {
    src = v.sa
      ? "Shloka: Bhagavad Gita (Sanskrit, public domain); Hindi rendering original."
      : "Reflection: original devotional thought.";
  } else {
    src = "Verse: King James Version (public domain).";
  }
  $("credit").textContent = `${src} ${privacy}`;
}

// the active pool depends on the chosen tradition ("all"/"" = mix of everything)
function pool() {
  let p = VERSES;
  if (state.faith && state.faith !== "all") p = p.filter((v) => v.faith === state.faith);
  if (!state.sanskrit) p = p.filter((v) => !v.sa); // honour "no Sanskrit" preference
  return p.length ? p : VERSES;
}

function dailyVerse() {
  const p = pool();
  if (!p.length) return { t: "Be still, and know that I am God.", r: "Psalm 46:10" };
  return p[epochDay() % p.length];
}

function randomVerse() {
  const p = pool();
  if (p.length < 2) return dailyVerse();
  let v;
  do {
    v = p[Math.floor(Math.random() * p.length)];
  } while (current && keyOf(v) === keyOf(current));
  return v;
}

function reflectFav() {
  const on = state.favorites.some((f) => keyOf(f) === keyOf(current));
  const btn = $("favBtn");
  btn.classList.toggle("is-fav", on);
  btn.textContent = on ? "♥ Favorited" : "♡ Favorite";
}

async function toggleFav() {
  if (!current) return;
  const k = keyOf(current);
  const i = state.favorites.findIndex((f) => keyOf(f) === k);
  if (i >= 0) {
    state.favorites.splice(i, 1);
    toast("Removed from favorites");
  } else {
    state.favorites.unshift({ t: current.t, r: current.r });
    toast("Saved to favorites ♥");
  }
  await persist(["favorites"]);
  reflectFav();
  renderFavs();
}

/* ---------- prayers ---------- */
function renderPrayers() {
  const list = $("prayerList");
  list.innerHTML = "";
  if (!state.prayers.length) {
    list.innerHTML = `<li class="prayer-empty">Nothing yet — add an intention above.</li>`;
  }
  for (const p of state.prayers) {
    const li = document.createElement("li");
    li.className = "prayer-item" + (p.done ? " done" : "");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!p.done;
    cb.onchange = async () => { p.done = cb.checked; await persist(["prayers"]); renderPrayers(); };
    const span = document.createElement("span");
    span.className = "txt";
    span.textContent = p.text;
    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "🗑";
    del.title = "Remove";
    del.onclick = async () => {
      state.prayers = state.prayers.filter((x) => x.id !== p.id);
      await persist(["prayers"]);
      renderPrayers();
    };
    li.append(cb, span, del);
    list.appendChild(li);
  }
  const open = state.prayers.filter((p) => !p.done).length;
  $("prayerCount").textContent = open ? `${open} open` : "";
}

/* ---------- favorites (in settings) ---------- */
function renderFavs() {
  const list = $("favList");
  list.innerHTML = "";
  $("favCount").textContent = state.favorites.length ? `(${state.favorites.length})` : "";
  if (!state.favorites.length) {
    list.innerHTML = `<li class="prayer-empty">No favorites yet.</li>`;
    return;
  }
  for (const f of state.favorites) {
    const li = document.createElement("li");
    li.className = "fav-item";
    const wrap = document.createElement("div");
    wrap.className = "fav-txt";
    wrap.textContent = `“${f.t}”`;
    const ref = document.createElement("span");
    ref.className = "fav-ref";
    ref.textContent = f.r;
    wrap.appendChild(ref);
    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "✕";
    del.onclick = async () => {
      state.favorites = state.favorites.filter((x) => keyOf(x) !== keyOf(f));
      await persist(["favorites"]);
      renderFavs();
      reflectFav();
    };
    li.append(wrap, del);
    list.appendChild(li);
  }
}

/* ---------- settings ---------- */
function applyPrayersVisibility() {
  $("prayersPanel").classList.toggle("hidden", !state.showPrayers);
}

function openSettings() {
  $("nameInput").value = state.name;
  $("themeSelect").value = state.theme;
  $("faithSelect").value = state.faith || "all";
  $("sanskritToggle").checked = state.sanskrit;
  $("showPrayers").checked = state.showPrayers;
  renderFavs();
  $("settings").classList.remove("hidden");
}
function closeSettings() { $("settings").classList.add("hidden"); }

// first-run chooser so users never get surprised by content they didn't pick
function showWelcome() {
  const w = $("welcome");
  w.classList.remove("hidden");
  w.querySelectorAll(".choice").forEach((btn) => {
    btn.onclick = async () => {
      state.faith = btn.dataset.faith;
      await persist(["faith"]);
      w.classList.add("hidden");
      showVerse(dailyVerse());
    };
  });
}

/* ---------- wire up ---------- */
function bind() {
  $("copyBtn").onclick = () => {
    if (!current) return;
    navigator.clipboard.writeText(`“${current.t}” — ${current.r}`);
    toast("Copied");
  };
  $("shuffleBtn").onclick = () => showVerse(randomVerse());
  $("favBtn").onclick = toggleFav;
  $("settingsBtn").onclick = openSettings;
  $("closeSettings").onclick = closeSettings;
  $("settings").addEventListener("click", (e) => { if (e.target.id === "settings") closeSettings(); });

  $("prayerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = $("prayerInput").value.trim();
    if (!text) return;
    state.prayers.unshift({ id: uid(), text, done: false });
    $("prayerInput").value = "";
    await persist(["prayers"]);
    renderPrayers();
  });

  $("nameInput").addEventListener("input", async (e) => {
    state.name = e.target.value.trim();
    await persist(["name"]);
    tick();
  });
  $("themeSelect").addEventListener("change", async (e) => {
    state.theme = e.target.value;
    await persist(["theme"]);
    applyTheme();
  });
  $("faithSelect").addEventListener("change", async (e) => {
    state.faith = e.target.value;
    await persist(["faith"]);
    showVerse(dailyVerse());
  });
  $("sanskritToggle").addEventListener("change", async (e) => {
    state.sanskrit = e.target.checked;
    await persist(["sanskrit"]);
    showVerse(dailyVerse());
  });
  $("showPrayers").addEventListener("change", async (e) => {
    state.showPrayers = e.target.checked;
    await persist(["showPrayers"]);
    applyPrayersVisibility();
  });

  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (state.theme === "auto") applyTheme();
  });
}

async function init() {
  await loadState();
  applyTheme();
  applyPrayersVisibility();
  renderPrayers();
  bind();
  tick();
  setInterval(tick, 1000 * 30);
  if (!state.faith) showWelcome(); // first run: let them choose before showing anything
  else showVerse(dailyVerse());
}

init();
