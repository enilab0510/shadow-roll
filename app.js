const SUPABASE_URL = "https://livqhbwvdxafhrbltnxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_tz53K_v1PwnxAGC1QnZFOw_aeG-NaEE";
const STARTING_COINS = 20000;
const MAX_RISKS = 5;
const HINT_MAX_RISKS = 3;

const MODES = {
  Easy: {
    reward_boost: 0.9,
    loss_protection: 3,
    desc: "Softer losses, better hints, smaller wins.",
    hint_quality: "strong",
    drop_base: 0.18,
  },
  Normal: {
    reward_boost: 0.95,
    loss_protection: 0,
    desc: "Balanced standard mode.",
    hint_quality: "medium",
    drop_base: 0.16,
  },
  Hardcore: {
    reward_boost: 1.0,
    loss_protection: 0,
    desc: "Weaker hints, less forgiveness, full pressure.",
    hint_quality: "light",
    drop_base: 0.14,
  },
};

const EVENT_POOL = [
  ["none", "Normal Round"],
  ["none", "Normal Round"],
  ["none", "Normal Round"],
  ["cheap_hint", "Event: Hint is cheaper"],
  ["lucky_drop", "Event: Drop is slightly stronger"],
  ["hot_round", "Event: Payouts slightly increased"],
  ["calm_round", "Event: Early SAFE is a bit better"],
];

const WIN_FLAVOR = [
  "Well played.",
  "Risk paid off.",
  "Clean finish.",
  "That was close!",
  "Shadow got outplayed.",
];

const LOSE_FLAVOR = [
  "Too risky...",
  "Shadow wins this time.",
  "Bad beat.",
  "One step too far.",
  "You were too greedy.",
];

const DROP_FLAVOR = [
  "Smart escape.",
  "You got out just in time.",
  "Clean exit.",
  "Saved what you could.",
  "A tactical retreat.",
];

const ACHIEVEMENT_DEFS = {
  first_win: "🏁 First Win",
  three_streak: "🔥 3 Win Streak",
  five_streak: "⚡ 5 Win Streak",
  ten_games: "🎮 10 Games Played",
  fifty_k_record: "💎 50,000 Record",
  big_win: "💰 Big Win",
  escape_artist: "🏳️ Escape Artist",
  oracle: "🧠 Oracle",
};

document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const $ = (id) => document.getElementById(id);

  const startOverlay = $("startOverlay");
  const playBtn = $("playBtn");

  const revealOverlay = $("revealOverlay");
  const revealTitle = $("revealTitle");
  const revealCountdown = $("revealCountdown");
  const shadowRevealNumber = $("shadowRevealNumber");
  const shadowRevealFlavor = $("shadowRevealFlavor");

  const authCard = $("authCard");
  const appCard = $("appCard");
  const logoutBtn = $("logoutBtn");
  const headerSub = $("headerSub");

  const showLoginBtn = $("showLoginBtn");
  const showRegisterBtn = $("showRegisterBtn");
  const loginBox = $("loginBox");
  const registerBox = $("registerBox");

  const loginEmail = $("loginEmail");
  const loginPassword = $("loginPassword");
  const loginBtn = $("loginBtn");

  const registerUsername = $("registerUsername");
  const registerEmail = $("registerEmail");
  const registerPassword = $("registerPassword");
  const registerBtn = $("registerBtn");

  const authMessage = $("authMessage");

  const coinsValue = $("coinsValue");
  const recordValue = $("recordValue");
  const gamesValue = $("gamesValue");
  const winrateValue = $("winrateValue");

  const eventLabel = $("eventLabel");
  const modeDescLabel = $("modeDescLabel");
  const betInput = $("betInput");
  const playerValue = $("playerValue");
  const streakBadge = $("streakBadge");
  const hintLabel = $("hintLabel");
  const potLabel = $("potLabel");
  const multiplierLabel = $("multiplierLabel");
  const riskLabel = $("riskLabel");
  const hintCostLabel = $("hintCostLabel");
  const safePayoutLabel = $("safePayoutLabel");
  const dropPayoutLabel = $("dropPayoutLabel");
  const riskFill = $("riskFill");
  const animLabel = $("animLabel");
  const gameMessage = $("gameMessage");
  const summaryBox = $("summaryBox");

  const startBtn = $("startBtn");
  const safeBtn = $("safeBtn");
  const riskBtn = $("riskBtn");
  const hintBtn = $("hintBtn");
  const dropBtn = $("dropBtn");

  const overviewTabBtn = $("overviewTabBtn");
  const achievementsTabBtn = $("achievementsTabBtn");
  const logTabBtn = $("logTabBtn");
  const overviewTab = $("overviewTab");
  const achievementsTab = $("achievementsTab");
  const logTab = $("logTab");

  const overviewText = $("overviewText");
  const achievementsText = $("achievementsText");
  const logText = $("logText");

  const modeButtons = [...document.querySelectorAll(".mode-btn")];

  let currentUser = null;
  let profile = null;
  let currentMode = "Normal";
  let started = false;
  let revealInProgress = false;

  let round = {
    active: false,
    animating: false,
    bet_locked_in: false,
    bet: 100,
    player_value: null,
    start_value: null,
    shadow: null,
    risk_count: 0,
    hint_used: false,
    hint_text: null,
    hint_strength: 0,
    hint_cost_paid: 0,
    event_name: "none",
    event_text: "-",
  };

  function defaultProfilePatch() {
    return {
      hints: 0,
      drops: 0,
      total_profit: 0,
      total_hint_spent: 0,
      total_drop_recovered: 0,
      close_losses: 0,
      big_wins: 0,
      achievements: [],
      log: ["Welcome to Shadow Roll Deluxe."],
      summary: "No round played yet.",
    };
  }

  function setAuthMessage(text, type = "info") {
    authMessage.textContent = text;
    authMessage.className = `message ${type}`;
  }

  function setGameMessage(text, type = "info") {
    gameMessage.textContent = text;
    gameMessage.className = `message ${type}`;
  }

  function showLogin() {
    loginBox.classList.remove("hidden");
    registerBox.classList.add("hidden");
    showLoginBtn.classList.add("active");
    showRegisterBtn.classList.remove("active");
  }

  function showRegister() {
    loginBox.classList.add("hidden");
    registerBox.classList.remove("hidden");
    showLoginBtn.classList.remove("active");
    showRegisterBtn.classList.add("active");
  }

  function setRightTab(tab) {
    overviewTab.classList.toggle("hidden", tab !== "overview");
    achievementsTab.classList.toggle("hidden", tab !== "achievements");
    logTab.classList.toggle("hidden", tab !== "log");

    overviewTabBtn.classList.toggle("active", tab === "overview");
    achievementsTabBtn.classList.toggle("active", tab === "achievements");
    logTabBtn.classList.toggle("active", tab === "log");
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getMode() {
    return MODES[currentMode];
  }

  function getMultiplier(riskCount) {
    const table = { 0: 1.03, 1: 1.16, 2: 1.4, 3: 1.78, 4: 2.4, 5: 3.2 };
    return table[riskCount] || 3.2;
  }

  function currentMultiplier() {
    let mult = getMultiplier(round.risk_count) * getMode().reward_boost;
    if (round.event_name === "hot_round") mult *= 1.08;
    return mult;
  }

  function currentMaxRisks() {
    return round.hint_used ? HINT_MAX_RISKS : MAX_RISKS;
  }

  function currentModeDesc() {
    const base = getMode().desc;
    if (round.active && round.hint_used) {
      return `${base} | Hint active: max ${HINT_MAX_RISKS} risks, SAFE slightly weaker.`;
    }
    return base;
  }

  function safeBonus() {
    const baseTable = [1.03, 1.06, 1.1, 1.16, 1.24, 1.34];
    let bonus = baseTable[round.risk_count] ?? 1.34;

    if (round.hint_used) {
      bonus = Math.max(0.84, 1.0 - round.hint_strength * 0.1);
      bonus *= 0.9;
    }

    if (round.event_name === "calm_round" && round.risk_count <= 1) {
      bonus *= 1.03;
    }

    return bonus;
  }

  function safePayout() {
    if (!round.bet_locked_in) return 0;
    return Math.max(1, Math.round(round.bet * currentMultiplier() * safeBonus()));
  }

  function dropRatio() {
    if (!round.bet_locked_in) return 0;

    let ratio = getMode().drop_base + round.risk_count * 0.055;

    if (round.risk_count === 0) ratio -= 0.05;
    else if (round.risk_count === 1) ratio -= 0.02;

    if (round.hint_used) ratio -= 0.06 + round.hint_strength * 0.18;

    if (round.hint_cost_paid > 0) {
      ratio -= Math.min(0.08, round.hint_cost_paid / Math.max(1, round.bet * 10));
    }

    if (round.event_name === "lucky_drop") ratio += 0.05;
    else if (round.event_name === "hot_round") ratio -= 0.02;

    if (currentMode === "Hardcore") ratio -= 0.02;
    else if (currentMode === "Easy") ratio += 0.02;

    return Math.max(0.04, Math.min(ratio, 0.46));
  }

  function dropPayout() {
    if (!round.bet_locked_in) return 0;
    return Math.round(round.bet * dropRatio());
  }

  function hintCost() {
    let base = Math.max(
      12,
      Math.floor(round.bet * (getMultiplier(round.risk_count) * getMode().reward_boost) * 0.32 + round.risk_count * 8)
    );

    if (round.risk_count >= 4) base += 20;
    else if (round.risk_count >= 2) base += 10;

    if (currentMode === "Hardcore") base += 7;
    else if (currentMode === "Easy") base = Math.max(10, base - 2);

    if (round.event_name === "cheap_hint") base = Math.max(8, base - 6);

    return base;
  }

  function generateHint(shadow, quality) {
    if (quality === "strong") {
      if (Math.random() < 0.5) {
        if (shadow <= 25) return ["[ INTEL REPORT ]\nShadow is likely low (1-25).", 0.9];
        if (shadow <= 50) return ["[ INTEL REPORT ]\nShadow is likely low-mid (26-50).", 0.82];
        if (shadow <= 75) return ["[ INTEL REPORT ]\nShadow is likely high-mid (51-75).", 0.82];
        return ["[ INTEL REPORT ]\nShadow is likely high (76-100).", 0.9];
      }

      const low = Math.max(1, shadow - rand(12, 18));
      const high = Math.min(100, shadow + rand(12, 18));
      const width = high - low + 1;
      const strength = Math.max(0.55, 1.0 - width / 35);
      return [`[ INTEL REPORT ]\nShadow is roughly between ${low} and ${high}.`, strength];
    }

    if (quality === "medium") {
      const roll = rand(1, 3);
      if (roll === 1) return [`[ INTEL REPORT ]\nShadow is ${shadow % 2 === 0 ? "even" : "odd"}.`, 0.28];
      if (roll === 2) return [`[ INTEL REPORT ]\nShadow is ${shadow <= 50 ? "50 or below" : "above 50"}.`, 0.42];
      if (shadow <= 33) return ["[ INTEL REPORT ]\nShadow is likely low (1-33).", 0.56];
      if (shadow <= 66) return ["[ INTEL REPORT ]\nShadow is in the middle range (34-66).", 0.48];
      return ["[ INTEL REPORT ]\nShadow is likely high (67-100).", 0.56];
    }

    if (shadow <= 40) return ["[ INTEL REPORT ]\nShadow is probably not high.", 0.22];
    if (shadow <= 61) return ["[ INTEL REPORT ]\nShadow is probably not low.", 0.22];
    return ["[ INTEL REPORT ]\nShadow is probably in the middle range.", 0.18];
  }

  function pushLog(text) {
    const list = Array.isArray(profile.log) ? [...profile.log] : [];
    profile.log = [text, ...list].slice(0, 16);
  }

  function currentStreakBadge() {
    if ((profile.streak || 0) >= 5) return "⚡ Massive streak";
    if ((profile.streak || 0) >= 3) return "🔥 Hot streak";
    if ((profile.streak || 0) >= 1) return "✨ Streak active";
    return "No active streak";
  }

  function updateAchievements() {
    const current = Array.isArray(profile.achievements) ? [...profile.achievements] : [];
    const unlock = (label) => {
      if (!current.includes(label)) current.push(label);
    };

    if ((profile.wins || 0) >= 1) unlock(ACHIEVEMENT_DEFS.first_win);
    if ((profile.streak || 0) >= 3) unlock(ACHIEVEMENT_DEFS.three_streak);
    if ((profile.streak || 0) >= 5) unlock(ACHIEVEMENT_DEFS.five_streak);
    if ((profile.games || 0) >= 10) unlock(ACHIEVEMENT_DEFS.ten_games);
    if ((profile.record || 0) >= 50000) unlock(ACHIEVEMENT_DEFS.fifty_k_record);
    if ((profile.big_wins || 0) >= 1) unlock(ACHIEVEMENT_DEFS.big_win);
    if ((profile.drops || 0) >= 5) unlock(ACHIEVEMENT_DEFS.escape_artist);
    if ((profile.hints || 0) >= 10) unlock(ACHIEVEMENT_DEFS.oracle);

    profile.achievements = current;
  }

  async function loadProfile() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("Kein User gefunden.");

    currentUser = user;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Kein Profil gefunden.");

    profile = { ...defaultProfilePatch(), ...data };
    await updateProfile(defaultProfilePatch(), false);
  }

  async function updateProfile(patch, mergeLocal = true) {
    const payload = mergeLocal ? { ...profile, ...patch } : patch;

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", currentUser.id)
      .select()
      .single();

    if (error) throw error;
    profile = { ...defaultProfilePatch(), ...data };
  }

  function refreshStats() {
    headerSub.textContent = `Eingeloggt als: ${profile.username || "-"} • eigener Spielstand pro Spieler`;

    coinsValue.textContent = Number(profile.coins || 0).toLocaleString("de-DE");
    recordValue.textContent = Number(profile.record || 0).toLocaleString("de-DE");
    gamesValue.textContent = String(profile.games || 0);

    const wr = profile.games > 0 ? ((profile.wins / profile.games) * 100).toFixed(1) : "0.0";
    winrateValue.textContent = `${wr}%`;
  }

  function refreshRoundUI() {
    eventLabel.textContent = round.active ? round.event_text : "-";
    modeDescLabel.textContent = `Mode Info: ${currentModeDesc()}`;
    playerValue.textContent = round.player_value ?? "-";
    streakBadge.textContent = currentStreakBadge();
    hintLabel.textContent = `Hint: ${round.hint_text || "-"}`;

    potLabel.textContent = `Pot: ${round.bet_locked_in ? round.bet : "-"}`;
    multiplierLabel.textContent = round.active ? `Multiplier: x${currentMultiplier().toFixed(2)}` : "Multiplier: -";
    riskLabel.textContent = `Risks: ${round.risk_count}/${currentMaxRisks()}`;
    hintCostLabel.textContent = `Hint Cost: ${round.active && !round.hint_used ? hintCost() : "-"}`;
    safePayoutLabel.textContent = `SAFE Payout: ${round.bet_locked_in ? safePayout() : "-"}`;
    dropPayoutLabel.textContent = `DROP Now: ${round.bet_locked_in ? dropPayout() : "-"}`;

    riskFill.style.width = `${(round.risk_count / Math.max(1, currentMaxRisks())) * 100}%`;

    const controlsEnabled = round.active && !round.animating && !revealInProgress;
    startBtn.disabled = round.active || revealInProgress;
    safeBtn.disabled = !controlsEnabled;
    riskBtn.disabled = !(controlsEnabled && round.risk_count < currentMaxRisks());
    hintBtn.disabled = !(controlsEnabled && !round.hint_used);
    dropBtn.disabled = !controlsEnabled;
  }

  function refreshRightPanel() {
    const avgProfit = profile.games ? (profile.total_profit / profile.games).toFixed(1) : "0.0";

    overviewText.textContent =
      `User: ${profile.username || "-"}\n` +
      `Wins: ${profile.wins || 0}\n` +
      `Losses: ${profile.losses || 0}\n` +
      `Streak: ${profile.streak || 0}\n` +
      `Best Streak: ${profile.best_streak || 0}\n` +
      `Hints: ${profile.hints || 0}\n` +
      `Drops: ${profile.drops || 0}\n` +
      `Total Profit: ${profile.total_profit || 0}\n` +
      `Avg Profit/Game: ${avgProfit}\n` +
      `Close Losses: ${profile.close_losses || 0}\n` +
      `Big Wins: ${profile.big_wins || 0}`;

    achievementsText.textContent = Array.isArray(profile.achievements) && profile.achievements.length
      ? profile.achievements.join("\n")
      : "No achievements yet.";

    logText.textContent = Array.isArray(profile.log) && profile.log.length
      ? profile.log.join("\n\n")
      : "No log yet.";

    summaryBox.textContent = profile.summary || "No round played yet.";
  }

  function refreshModeButtons() {
    modeButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === currentMode);
    });
  }

  function refreshUI() {
    if (!profile) return;
    refreshStats();
    refreshModeButtons();
    refreshRoundUI();
    refreshRightPanel();
  }

  function resetRound() {
    round = {
      active: false,
      animating: false,
      bet_locked_in: false,
      bet: 100,
      player_value: null,
      start_value: null,
      shadow: null,
      risk_count: 0,
      hint_used: false,
      hint_text: null,
      hint_strength: 0,
      hint_cost_paid: 0,
      event_name: "none",
      event_text: "-",
    };
  }

  async function enterApp() {
    await loadProfile();
    authCard.classList.add("hidden");
    appCard.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    refreshUI();
  }

  function leaveApp() {
    currentUser = null;
    profile = null;
    resetRound();
    authCard.classList.remove("hidden");
    appCard.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    startOverlay.classList.remove("hidden");
    started = false;
    revealInProgress = false;
    showLogin();
  }

  function animateToFinal(finalValue, callback) {
    round.animating = true;
    const steps = 14;
    const values = Array.from({ length: steps - 1 }, () => rand(1, 100)).concat(finalValue);

    function run(i = 0) {
      round.player_value = values[i];
      playerValue.textContent = String(values[i]);

      if (i < values.length - 1) {
        setTimeout(() => run(i + 1), 50 + i * 2);
      } else {
        round.animating = false;
        callback(finalValue);
        refreshUI();
      }
    }

    run();
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function revealShadowSequence(title, color, flavorText, shadowNumber) {
    revealInProgress = true;
    revealTitle.textContent = title;
    revealCountdown.classList.remove("hidden");
    shadowRevealNumber.classList.add("hidden");
    shadowRevealFlavor.classList.add("hidden");
    revealOverlay.classList.remove("hidden");

    revealCountdown.textContent = "3...";
    await wait(420);
    revealCountdown.textContent = "2...";
    await wait(420);
    revealCountdown.textContent = "1...";
    await wait(420);

    revealCountdown.classList.add("hidden");
    shadowRevealNumber.classList.remove("hidden");
    shadowRevealFlavor.classList.remove("hidden");
    shadowRevealNumber.style.color = color;
    shadowRevealNumber.textContent = String(shadowNumber);
    shadowRevealFlavor.textContent = flavorText;

    await wait(1150);
    revealOverlay.classList.add("hidden");
    revealInProgress = false;
  }

  async function persistAndRefresh(patch) {
    updateAchievements();
    await updateProfile(patch);
    refreshUI();
  }

  showLoginBtn.addEventListener("click", showLogin);
  showRegisterBtn.addEventListener("click", showRegister);

  overviewTabBtn.addEventListener("click", () => setRightTab("overview"));
  achievementsTabBtn.addEventListener("click", () => setRightTab("achievements"));
  logTabBtn.addEventListener("click", () => setRightTab("log"));

  playBtn.addEventListener("click", () => {
    started = true;
    startOverlay.classList.add("hidden");
  });

  registerBtn.addEventListener("click", async () => {
    try {
      const username = registerUsername.value.trim();
      const email = registerEmail.value.trim();
      const password = registerPassword.value;

      if (!username || !email || !password) {
        setAuthMessage("Bitte Username, E-Mail und Passwort eingeben.", "error");
        return;
      }

      if (password.length < 6) {
        setAuthMessage("Passwort muss mindestens 6 Zeichen haben.", "error");
        return;
      }

      setAuthMessage("Registrierung läuft...", "info");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        setAuthMessage("Registrierung erfolgreich. Bitte E-Mail bestätigen.", "success");
        showLogin();
        return;
      }

      await enterApp();
      setAuthMessage("Registrierung erfolgreich.", "success");
    } catch (err) {
      setAuthMessage(`Registrierung Fehler: ${err.message}`, "error");
    }
  });

  loginBtn.addEventListener("click", async () => {
    try {
      const email = loginEmail.value.trim();
      const password = loginPassword.value;

      if (!email || !password) {
        setAuthMessage("Bitte E-Mail und Passwort eingeben.", "error");
        return;
      }

      setAuthMessage("Login läuft...", "info");

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      await enterApp();
      setAuthMessage("Login erfolgreich.", "success");
    } catch (err) {
      setAuthMessage(`Login Fehler: ${err.message}`, "error");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      if ((round.active || revealInProgress) && !confirm("Eine Runde ist noch aktiv. Trotzdem ausloggen?")) {
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      leaveApp();
      setAuthMessage("Erfolgreich ausgeloggt.", "success");
    } catch (err) {
      setAuthMessage(`Logout Fehler: ${err.message}`, "error");
    }
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (round.active || revealInProgress) return;
      currentMode = btn.dataset.mode;
      refreshUI();
    });
  });

  startBtn.addEventListener("click", async () => {
    try {
      if (!started) {
        started = true;
        startOverlay.classList.add("hidden");
      }

      if (round.active || revealInProgress) return;

      const bet = parseInt(betInput.value, 10);

      if (!bet || bet < 1) {
        alert("Bet must be at least 1.");
        return;
      }

      if (bet > profile.coins) {
        alert("You do not have enough coins.");
        return;
      }

      const [eventName, eventText] = choice(EVENT_POOL);

      profile.coins -= bet;
      profile.total_profit -= bet;

      round.active = true;
      round.animating = true;
      round.bet_locked_in = true;
      round.bet = bet;
      round.player_value = null;
      round.start_value = null;
      round.shadow = rand(1, 100);
      round.risk_count = 0;
      round.hint_used = false;
      round.hint_text = null;
      round.hint_strength = 0;
      round.hint_cost_paid = 0;
      round.event_name = eventName;
      round.event_text = eventText;

      setGameMessage("Round started.\nYour bet has been placed into the pot.\n\nRolling your value...", "info");
      animLabel.textContent = "Generating start value...";
      pushLog(`🎯 New Round | User: ${profile.username} | Mode: ${currentMode} | Pot: ${bet} | ${eventText}`);
      refreshUI();

      const finalValue = rand(1, 100);
      animateToFinal(finalValue, async (value) => {
        round.player_value = value;
        round.start_value = value;
        round.animating = false;
        animLabel.textContent = "Start roll complete.";
        setGameMessage("Round started. You can now choose SAFE, RISK, HINT, or DROP.", "info");
        pushLog(`🎲 Start Value: ${value}`);
        await persistAndRefresh({});
      });
    } catch (err) {
      setGameMessage(`Start Fehler: ${err.message}`, "error");
    }
  });

  riskBtn.addEventListener("click", () => {
    if (!round.active || round.animating || round.player_value == null) return;
    if (round.risk_count >= currentMaxRisks()) return;

    const oldValue = round.player_value;
    round.risk_count += 1;
    round.animating = true;

    setGameMessage("Risking it...", "error");
    animLabel.textContent = "Value reroll in progress...";
    refreshUI();

    const finalValue = rand(1, 100);
    animateToFinal(finalValue, (value) => {
      round.player_value = value;
      round.animating = false;

      if (value > oldValue) setGameMessage(`Nice roll! +${value - oldValue}`, "success");
      else if (value < oldValue) setGameMessage(`Bad roll... ${value - oldValue}`, "error");
      else setGameMessage("No change.", "info");

      animLabel.textContent = "Risk roll complete.";
      pushLog(`🎲 RISK: ${oldValue} → ${value}`);
      refreshUI();
    });
  });

  hintBtn.addEventListener("click", async () => {
    try {
      if (!round.active || round.animating || round.hint_used || round.shadow == null) return;

      const cost = hintCost();
      if (cost > profile.coins) {
        alert(`Hint costs ${cost} coins.`);
        return;
      }

      const [text, strength] = generateHint(round.shadow, getMode().hint_quality);

      profile.coins -= cost;
      profile.hints = (profile.hints || 0) + 1;
      profile.total_hint_spent = (profile.total_hint_spent || 0) + cost;
      profile.total_profit = (profile.total_profit || 0) - cost;

      round.hint_used = true;
      round.hint_text = text;
      round.hint_strength = strength;
      round.hint_cost_paid = cost;

      setGameMessage(`Intel acquired for ${cost} coins.\nHint active: you can now only RISK up to ${HINT_MAX_RISKS} times.`, "info");
      animLabel.textContent = "Hint loaded into round.";
      pushLog(`🔍 HINT (${cost}): ${text}`);

      await persistAndRefresh({
        coins: profile.coins,
        hints: profile.hints,
        total_hint_spent: profile.total_hint_spent,
        total_profit: profile.total_profit,
        achievements: profile.achievements,
        log: profile.log,
      });
    } catch (err) {
      setGameMessage(`Hint Fehler: ${err.message}`, "error");
    }
  });

  dropBtn.addEventListener("click", async () => {
    try {
      if (!round.active || round.animating || !round.bet_locked_in || round.shadow == null) return;

      const payout = dropPayout();
      const loss = round.bet - payout;
      const wouldHaveWon = round.player_value > round.shadow;
      const wouldText = wouldHaveWon
        ? `You would have WON against Shadow ${round.shadow}.`
        : `You would have LOST against Shadow ${round.shadow}.`;

      let extra = "";
      if (round.hint_used) {
        if (round.hint_strength >= 0.75) extra = "\nStrong hint made this drop much worse.";
        else if (round.hint_strength >= 0.45) extra = "\nHint reduced your drop payout.";
        else extra = "\nWeak hint slightly reduced your drop payout.";
      }

      setGameMessage("Dropping...\nRevealing Shadow first.", "info");
      animLabel.textContent = "Cashout reveal sequence started.";
      refreshUI();

      await revealShadowSequence("DROP locked in...\nShadow reveal incoming", "#69b7ff", `You escaped before the reveal.\n${wouldText}`, round.shadow);

      profile.coins += payout;
      profile.record = Math.max(profile.record, profile.coins);
      profile.games = (profile.games || 0) + 1;
      profile.drops = (profile.drops || 0) + 1;
      profile.total_drop_recovered = (profile.total_drop_recovered || 0) + payout;
      profile.total_profit = (profile.total_profit || 0) + payout;

      profile.summary =
        `Start Value: ${round.start_value ?? "-"}\n` +
        `Final Value: ${round.player_value ?? "-"}\n` +
        `Risks: ${round.risk_count}\n` +
        `Hint Used: ${round.hint_used ? "Yes" : "No"}\n` +
        `Shadow: ${round.shadow}\n` +
        `Would Have Won: ${wouldText}\n` +
        `Event: ${round.event_text}\n` +
        `Result: DROP | Recovered ${payout} | Loss ${loss}${extra}`;

      setGameMessage(`You escaped.\nRecovered ${payout}\nLoss -${loss}\nShadow was ${round.shadow}\n${wouldText}\n\n${choice(DROP_FLAVOR)}${extra}`, "info");
      animLabel.textContent = "Cashout confirmed. Shadow revealed.";
      pushLog(`🏳️ DROP | Pot ${round.bet} | Recovered ${payout} | Loss ${loss} | Shadow ${round.shadow} | ${wouldText}`);

      await persistAndRefresh({
        coins: profile.coins,
        record: profile.record,
        games: profile.games,
        drops: profile.drops,
        total_drop_recovered: profile.total_drop_recovered,
        total_profit: profile.total_profit,
        summary: profile.summary,
        achievements: profile.achievements,
        log: profile.log,
      });

      resetRound();
      refreshUI();
    } catch (err) {
      setGameMessage(`Drop Fehler: ${err.message}`, "error");
    }
  });

  safeBtn.addEventListener("click", async () => {
    try {
      if (!round.active || round.animating || round.player_value == null || round.shadow == null) return;

      round.animating = true;
      animLabel.textContent = "Shadow reveal sequence started.";
      refreshUI();

      const won = round.player_value > round.shadow;
      const flavor = choice(won ? WIN_FLAVOR : LOSE_FLAVOR);

      await revealShadowSequence("Revealing Shadow...", won ? "#f5c451" : "#ff6666", flavor, round.shadow);

      profile.games = (profile.games || 0) + 1;

      if (won) {
        const payout = safePayout();
        const net = payout - round.bet;

        profile.coins += payout;
        profile.record = Math.max(profile.record, profile.coins);
        profile.wins = (profile.wins || 0) + 1;
        profile.streak = (profile.streak || 0) + 1;
        profile.best_streak = Math.max(profile.best_streak || 0, profile.streak);
        profile.total_profit = (profile.total_profit || 0) + payout;

        if (net >= round.bet) {
          profile.big_wins = (profile.big_wins || 0) + 1;
        }

        let bonusNote = "";
        if (round.risk_count === 0) bonusNote = "\nInstant SAFE gives only a small bonus.";
        else if (round.risk_count >= 4) bonusNote = "\nBig SAFE bonus for high-risk commitment.";
        if (round.hint_used) bonusNote += "\nSAFE was slightly reduced because you used a Hint.";

        profile.summary =
          `Start Value: ${round.start_value}\n` +
          `Final Value: ${round.player_value}\n` +
          `Risks: ${round.risk_count}\n` +
          `Hint Used: ${round.hint_used ? "Yes" : "No"}\n` +
          `Shadow: ${round.shadow}\n` +
          `Event: ${round.event_text}\n` +
          `Result: WIN | Payout ${payout} | Profit +${net}${bonusNote}`;

        setGameMessage(`YOU WIN\n\nShadow ${round.shadow}\nPayout ${payout}\nProfit +${net}\n\n${flavor}${bonusNote}`, "success");
        animLabel.textContent = "SAFE reveal complete. Huge result.";
        pushLog(`✅ WIN | Shadow ${round.shadow} | Payout ${payout} | Profit +${net}`);
      } else {
        const refund = getMode().loss_protection;
        profile.losses = (profile.losses || 0) + 1;
        profile.streak = 0;

        if (refund > 0) {
          profile.coins += refund;
          profile.total_profit = (profile.total_profit || 0) + refund;
        }

        const diff = Math.abs(round.player_value - round.shadow);
        const closeText = diff <= 2 ? `\nSo close... only ${diff} away.` : "";
        if (diff <= 2) profile.close_losses = (profile.close_losses || 0) + 1;

        profile.summary =
          `Start Value: ${round.start_value}\n` +
          `Final Value: ${round.player_value}\n` +
          `Risks: ${round.risk_count}\n` +
          `Hint Used: ${round.hint_used ? "Yes" : "No"}\n` +
          `Shadow: ${round.shadow}\n` +
          `Event: ${round.event_text}\n` +
          `Result: LOSS | Pot lost${refund ? ` | Refund ${refund}` : ""}${closeText}`;

        setGameMessage(`YOU LOSE\n\nShadow ${round.shadow}\n\n${flavor}${refund ? `\nRefund ${refund}` : ""}${closeText}`, "error");
        animLabel.textContent = "SAFE reveal complete. Shadow wins.";
        pushLog(`❌ LOSS | Shadow ${round.shadow} | Pot lost`);
      }

      await persistAndRefresh({
        coins: profile.coins,
        record: profile.record,
        games: profile.games,
        wins: profile.wins,
        losses: profile.losses,
        streak: profile.streak,
        best_streak: profile.best_streak,
        total_profit: profile.total_profit,
        close_losses: profile.close_losses,
        big_wins: profile.big_wins,
        summary: profile.summary,
        achievements: profile.achievements,
        log: profile.log,
      });

      resetRound();
      refreshUI();
    } catch (err) {
      setGameMessage(`Safe Fehler: ${err.message}`, "error");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (authCard.classList.contains("hidden")) {
      if (e.key === "Enter") startBtn.click();
      if (e.key === "s" || e.key === "S") safeBtn.click();
      if (e.key === "r" || e.key === "R") riskBtn.click();
      if (e.key === "h" || e.key === "H") hintBtn.click();
      if (e.key === "d" || e.key === "D") dropBtn.click();
      if (e.key === "1") modeButtons.find(b => b.dataset.mode === "Easy")?.click();
      if (e.key === "2") modeButtons.find(b => b.dataset.mode === "Normal")?.click();
      if (e.key === "3") modeButtons.find(b => b.dataset.mode === "Hardcore")?.click();
    }
  });

  (async function init() {
    try {
      showLogin();
      setRightTab("overview");
      resetRound();

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session) {
        await enterApp();
        setAuthMessage("Session gefunden.", "success");
      } else {
        setAuthMessage("Bitte einloggen oder registrieren.", "info");
      }

      refreshUI();
    } catch (err) {
      setAuthMessage(`Init Fehler: ${err.message}`, "error");
    }
  })();
});
