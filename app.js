const SUPABASE_URL = "https://livqhbwvdxafhrbltnxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_tz53K_v1PwnxAGC1QnZFOw_aeG-NaEE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const STARTING_COINS = 20000;
const MAX_RISKS = 5;
const HINT_MAX_RISKS = 3;

const MODES = {
  Easy: {
    rewardBoost: 0.9,
    lossProtection: 3,
    desc: "Softer losses, better hints, smaller wins.",
    hintQuality: "strong",
    dropBase: 0.18,
  },
  Normal: {
    rewardBoost: 0.95,
    lossProtection: 0,
    desc: "Balanced standard mode.",
    hintQuality: "medium",
    dropBase: 0.16,
  },
  Hardcore: {
    rewardBoost: 1.0,
    lossProtection: 0,
    desc: "Weaker hints, less forgiveness, full pressure.",
    hintQuality: "light",
    dropBase: 0.14,
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

// AUTH
const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");
const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const registerUsername = document.getElementById("registerUsername");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

// PROFILE
const usernameValue = document.getElementById("usernameValue");
const coinsValue = document.getElementById("coinsValue");
const recordValue = document.getElementById("recordValue");
const gamesValue = document.getElementById("gamesValue");
const winrateValue = document.getElementById("winrateValue");
const adminValue = document.getElementById("adminValue");
const winsValue = document.getElementById("winsValue");
const lossesValue = document.getElementById("lossesValue");
const streakValue = document.getElementById("streakValue");
const bestStreakValue = document.getElementById("bestStreakValue");

// GAME
const modeDesc = document.getElementById("modeDesc");
const betInput = document.getElementById("betInput");
const eventBadge = document.getElementById("eventBadge");
const hintCostBox = document.getElementById("hintCostBox");
const dropPayoutBox = document.getElementById("dropPayoutBox");
const playerValue = document.getElementById("playerValue");
const streakBadge = document.getElementById("streakBadge");
const potValue = document.getElementById("potValue");
const multiplierText = document.getElementById("multiplierText");
const riskText = document.getElementById("riskText");
const riskFill = document.getElementById("riskFill");
const hintText = document.getElementById("hintText");
const statusBox = document.getElementById("statusBox");
const summaryBox = document.getElementById("summaryBox");

const startBtn = document.getElementById("startBtn");
const safeBtn = document.getElementById("safeBtn");
const riskBtn = document.getElementById("riskBtn");
const hintBtn = document.getElementById("hintBtn");
const dropBtn = document.getElementById("dropBtn");

// ADMIN
const adminSection = document.getElementById("adminSection");
const giftUsername = document.getElementById("giftUsername");
const giftAmount = document.getElementById("giftAmount");
const giftMessage = document.getElementById("giftMessage");
const giftBtn = document.getElementById("giftBtn");

// REVEAL
const revealOverlay = document.getElementById("revealOverlay");
const revealCountdown = document.getElementById("revealCountdown");
const shadowNumber = document.getElementById("shadowNumber");
const shadowFlavor = document.getElementById("shadowFlavor");

const modeButtons = [...document.querySelectorAll(".mode-btn")];

let currentUser = null;
let profile = null;
let currentMode = "Normal";

let round = {
  active: false,
  animating: false,
  betLockedIn: false,
  bet: 100,
  playerValue: null,
  startValue: null,
  shadow: null,
  riskCount: 0,
  hintUsed: false,
  hintText: null,
  hintStrength: 0,
  hintCostPaid: 0,
  eventName: "none",
  eventText: "-",
};

function setStatus(text, type = "info") {
  statusBox.textContent = text;
  statusBox.className = `status-box ${type}`;
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

function getCurrentMaxRisks() {
  return round.hintUsed ? HINT_MAX_RISKS : MAX_RISKS;
}

function getMultiplier(riskCount) {
  const table = {
    0: 1.03,
    1: 1.16,
    2: 1.4,
    3: 1.78,
    4: 2.4,
    5: 3.2,
  };
  return table[riskCount] || 3.2;
}

function currentMultiplier() {
  let mult = getMultiplier(round.riskCount) * getMode().rewardBoost;
  if (round.eventName === "hot_round") mult *= 1.08;
  return mult;
}

function safeBonus() {
  const baseTable = [1.03, 1.06, 1.1, 1.16, 1.24, 1.34];
  let bonus = baseTable[round.riskCount] || 1.34;

  if (round.hintUsed) {
    bonus = Math.max(0.84, 1.0 - round.hintStrength * 0.1);
    bonus *= 0.9;
  }

  if (round.eventName === "calm_round" && round.riskCount <= 1) {
    bonus *= 1.03;
  }

  return bonus;
}

function safePayout() {
  if (!round.betLockedIn) return 0;
  return Math.max(1, Math.round(round.bet * currentMultiplier() * safeBonus()));
}

function dropRatio() {
  if (!round.betLockedIn) return 0;
  let ratio = getMode().dropBase + round.riskCount * 0.055;

  if (round.riskCount === 0) ratio -= 0.05;
  else if (round.riskCount === 1) ratio -= 0.02;

  if (round.hintUsed) ratio -= 0.06 + round.hintStrength * 0.18;
  if (round.hintCostPaid > 0) {
    ratio -= Math.min(0.08, round.hintCostPaid / Math.max(1, round.bet * 10));
  }

  if (round.eventName === "lucky_drop") ratio += 0.05;
  else if (round.eventName === "hot_round") ratio -= 0.02;

  if (currentMode === "Hardcore") ratio -= 0.02;
  else if (currentMode === "Easy") ratio += 0.02;

  return Math.max(0.04, Math.min(ratio, 0.46));
}

function dropPayout() {
  if (!round.betLockedIn) return 0;
  return Math.round(round.bet * dropRatio());
}

function hintCost() {
  let base = Math.max(
    12,
    Math.floor(round.bet * (getMultiplier(round.riskCount) * getMode().rewardBoost) * 0.32 + round.riskCount * 8)
  );

  if (round.riskCount >= 4) base += 20;
  else if (round.riskCount >= 2) base += 10;

  if (currentMode === "Hardcore") base += 7;
  else if (currentMode === "Easy") base = Math.max(10, base - 2);

  if (round.eventName === "cheap_hint") base = Math.max(8, base - 6);

  return base;
}

function generateHint(shadow, quality) {
  if (quality === "strong") {
    if (Math.random() < 0.5) {
      if (shadow <= 25) return ["Shadow is likely low (1-25).", 0.9];
      if (shadow <= 50) return ["Shadow is likely low-mid (26-50).", 0.82];
      if (shadow <= 75) return ["Shadow is likely high-mid (51-75).", 0.82];
      return ["Shadow is likely high (76-100).", 0.9];
    }

    const low = Math.max(1, shadow - rand(12, 18));
    const high = Math.min(100, shadow + rand(12, 18));
    const width = high - low + 1;
    const strength = Math.max(0.55, 1.0 - width / 35);
    return [`Shadow is roughly between ${low} and ${high}.`, strength];
  }

  if (quality === "medium") {
    const roll = rand(1, 3);
    if (roll === 1) return [`Shadow is ${shadow % 2 === 0 ? "even" : "odd"}.`, 0.28];
    if (roll === 2) return [`Shadow is ${shadow <= 50 ? "50 or below" : "above 50"}.`, 0.42];
    if (shadow <= 33) return ["Shadow is likely low (1-33).", 0.56];
    if (shadow <= 66) return ["Shadow is in the middle range (34-66).", 0.48];
    return ["Shadow is likely high (67-100).", 0.56];
  }

  if (shadow <= 40) return ["Shadow is probably not high.", 0.22];
  if (shadow <= 61) return ["Shadow is probably not low.", 0.22];
  return ["Shadow is probably in the middle range.", 0.18];
}

function setLoginMode() {
  loginBox.classList.remove("hidden");
  registerBox.classList.add("hidden");
  showLoginBtn.classList.add("active");
  showRegisterBtn.classList.remove("active");
}

function setRegisterMode() {
  loginBox.classList.add("hidden");
  registerBox.classList.remove("hidden");
  showLoginBtn.classList.remove("active");
  showRegisterBtn.classList.add("active");
}

showLoginBtn.addEventListener("click", setLoginMode);
showRegisterBtn.addEventListener("click", setRegisterMode);

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (round.active || round.animating) return;
    currentMode = btn.dataset.mode;
    modeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    refreshUI();
  });
});

async function updateProfile(patch) {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", currentUser.id)
    .select()
    .single();

  if (error) throw error;
  profile = data;
}

async function loadProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return;
  currentUser = user;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    alert("Profil Fehler: " + error.message);
    return;
  }

  profile = data;

  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  if (profile.is_admin) {
    adminSection.classList.remove("hidden");
  } else {
    adminSection.classList.add("hidden");
  }

  refreshUI();
}

function refreshUI() {
  if (!profile) return;

  usernameValue.textContent = profile.username ?? "-";
  coinsValue.textContent = profile.coins ?? 0;
  recordValue.textContent = profile.record ?? 0;
  gamesValue.textContent = profile.games ?? 0;
  adminValue.textContent = profile.is_admin ? "Ja" : "Nein";
  winsValue.textContent = profile.wins ?? 0;
  lossesValue.textContent = profile.losses ?? 0;
  streakValue.textContent = profile.streak ?? 0;
  bestStreakValue.textContent = profile.best_streak ?? 0;

  const winrate = profile.games > 0 ? ((profile.wins / profile.games) * 100).toFixed(1) : "0.0";
  winrateValue.textContent = `${winrate}%`;

  modeDesc.textContent = getMode().desc;
  eventBadge.textContent = round.active ? round.eventText : "-";
  hintCostBox.textContent = round.active && !round.hintUsed ? hintCost() : "-";
  dropPayoutBox.textContent = round.betLockedIn ? dropPayout() : "-";
  playerValue.textContent = round.playerValue ?? "-";
  potValue.textContent = round.betLockedIn ? round.bet : "-";
  multiplierText.textContent = round.active ? `Multiplier: x${currentMultiplier().toFixed(2)}` : "Multiplier: -";
  riskText.textContent = `Risks: ${round.riskCount}/${getCurrentMaxRisks()}`;
  hintText.textContent = round.hintText || "-";
  riskFill.style.width = `${(round.riskCount / Math.max(1, getCurrentMaxRisks())) * 100}%`;

  if (profile.streak >= 5) streakBadge.textContent = "⚡ Massive streak";
  else if (profile.streak >= 3) streakBadge.textContent = "🔥 Hot streak";
  else if (profile.streak >= 1) streakBadge.textContent = "✨ Streak active";
  else streakBadge.textContent = "No active streak";

  const controlsEnabled = round.active && !round.animating;

  startBtn.disabled = round.active || round.animating;
  safeBtn.disabled = !controlsEnabled;
  riskBtn.disabled = !(controlsEnabled && round.riskCount < getCurrentMaxRisks());
  hintBtn.disabled = !(controlsEnabled && !round.hintUsed);
  dropBtn.disabled = !controlsEnabled;
}

function resetRound() {
  round = {
    active: false,
    animating: false,
    betLockedIn: false,
    bet: 100,
    playerValue: null,
    startValue: null,
    shadow: null,
    riskCount: 0,
    hintUsed: false,
    hintText: null,
    hintStrength: 0,
    hintCostPaid: 0,
    eventName: "none",
    eventText: "-",
  };
}

function animatePlayerValue(finalValue, callback) {
  round.animating = true;
  const values = Array.from({ length: 12 }, () => rand(1, 100));
  values.push(finalValue);
  let i = 0;

  const loop = () => {
    round.playerValue = values[i];
    refreshUI();

    if (i < values.length - 1) {
      i++;
      setTimeout(loop, 55 + i * 3);
    } else {
      round.animating = false;
      callback(finalValue);
      refreshUI();
    }
  };

  loop();
}

async function revealShadowSequence(won, onDone) {
  revealOverlay.classList.remove("hidden");
  revealCountdown.classList.remove("hidden");
  shadowNumber.classList.add("hidden");
  shadowFlavor.classList.add("hidden");

  revealCountdown.textContent = "3";
  await new Promise((r) => setTimeout(r, 380));
  revealCountdown.textContent = "2";
  await new Promise((r) => setTimeout(r, 380));
  revealCountdown.textContent = "1";
  await new Promise((r) => setTimeout(r, 380));

  revealCountdown.classList.add("hidden");
  shadowNumber.classList.remove("hidden");
  shadowFlavor.classList.remove("hidden");

  shadowNumber.textContent = round.shadow;
  shadowNumber.style.color = won ? "#ffcb52" : "#ff5d73";
  shadowFlavor.textContent = won ? choice(WIN_FLAVOR) : choice(LOSE_FLAVOR);

  await new Promise((r) => setTimeout(r, 1200));
  revealOverlay.classList.add("hidden");
  onDone();
}

startBtn.addEventListener("click", async () => {
  if (!profile || round.active || round.animating) return;

  const bet = parseInt(betInput.value, 10);

  if (!bet || bet < 1) {
    alert("Bet muss mindestens 1 sein.");
    return;
  }

  if (bet > profile.coins) {
    alert("Nicht genug Coins.");
    return;
  }

  const [eventName, eventText] = choice(EVENT_POOL);

  try {
    await updateProfile({
      coins: profile.coins - bet,
    });

    round.active = true;
    round.betLockedIn = true;
    round.bet = bet;
    round.shadow = rand(1, 100);
    round.riskCount = 0;
    round.hintUsed = false;
    round.hintText = null;
    round.hintStrength = 0;
    round.hintCostPaid = 0;
    round.eventName = eventName;
    round.eventText = eventText;

    setStatus("Round started.\nRolling your value...", "info");
    refreshUI();

    const finalValue = rand(1, 100);
    animatePlayerValue(finalValue, (value) => {
      round.startValue = value;
      round.playerValue = value;
      setStatus("Round started. You can now choose SAFE, RISK, HINT, or DROP.", "info");
      refreshUI();
    });
  } catch (err) {
    alert("Start Fehler: " + err.message);
  }
});

riskBtn.addEventListener("click", () => {
  if (!round.active || round.animating || round.playerValue == null) return;
  if (round.riskCount >= getCurrentMaxRisks()) return;

  const old = round.playerValue;
  round.riskCount += 1;
  setStatus("Risking it...", "danger");
  refreshUI();

  const finalValue = rand(1, 100);
  animatePlayerValue(finalValue, (value) => {
    if (value > old) setStatus(`Nice roll! +${value - old}`, "success");
    else if (value < old) setStatus(`Bad roll... ${value - old}`, "danger");
    else setStatus("No change.", "info");
    refreshUI();
  });
});

hintBtn.addEventListener("click", async () => {
  if (!round.active || round.animating || round.hintUsed || round.shadow == null) return;

  const cost = hintCost();
  if (cost > profile.coins) {
    alert(`Hint kostet ${cost} Coins.`);
    return;
  }

  const [text, strength] = generateHint(round.shadow, getMode().hintQuality);

  try {
    await updateProfile({
      coins: profile.coins - cost,
    });

    round.hintUsed = true;
    round.hintText = text;
    round.hintStrength = strength;
    round.hintCostPaid = cost;

    setStatus(`Intel acquired for ${cost} coins.\nHint active: max ${HINT_MAX_RISKS} risks now.`, "warn");
    refreshUI();
  } catch (err) {
    alert("Hint Fehler: " + err.message);
  }
});

safeBtn.addEventListener("click", async () => {
  if (!round.active || round.animating || round.playerValue == null || round.shadow == null) return;

  round.animating = true;
  const won = round.playerValue > round.shadow;

  await revealShadowSequence(won, async () => {
    try {
      const games = (profile.games || 0) + 1;
      let patch = {
        games,
      };

      if (won) {
        const payout = safePayout();
        const profit = payout - round.bet;
        const wins = (profile.wins || 0) + 1;
        const streak = (profile.streak || 0) + 1;
        const bestStreak = Math.max(profile.best_streak || 0, streak);
        const coins = profile.coins + payout;
        const record = Math.max(profile.record || STARTING_COINS, coins);

        patch = {
          ...patch,
          coins,
          record,
          wins,
          streak,
          best_streak: bestStreak,
        };

        summaryBox.textContent =
          `Start Value: ${round.startValue}\n` +
          `Final Value: ${round.playerValue}\n` +
          `Risks: ${round.riskCount}\n` +
          `Hint Used: ${round.hintUsed ? "Yes" : "No"}\n` +
          `Shadow: ${round.shadow}\n` +
          `Event: ${round.eventText}\n` +
          `Result: WIN | Payout ${payout} | Profit +${profit}`;

        setStatus(`YOU WIN\nShadow ${round.shadow}\nPayout ${payout}\nProfit +${profit}`, "success");
      } else {
        const refund = getMode().lossProtection;
        const losses = (profile.losses || 0) + 1;
        const coins = profile.coins + refund;

        patch = {
          ...patch,
          coins,
          losses,
          streak: 0,
        };

        summaryBox.textContent =
          `Start Value: ${round.startValue}\n` +
          `Final Value: ${round.playerValue}\n` +
          `Risks: ${round.riskCount}\n` +
          `Hint Used: ${round.hintUsed ? "Yes" : "No"}\n` +
          `Shadow: ${round.shadow}\n` +
          `Event: ${round.eventText}\n` +
          `Result: LOSS | Pot lost${refund ? ` | Refund ${refund}` : ""}`;

        setStatus(`YOU LOSE\nShadow ${round.shadow}${refund ? `\nRefund ${refund}` : ""}`, "danger");
      }

      await updateProfile(patch);
      resetRound();
      refreshUI();
    } catch (err) {
      alert("SAFE Fehler: " + err.message);
      resetRound();
      refreshUI();
    }
  });
});

dropBtn.addEventListener("click", async () => {
  if (!round.active || round.animating || round.shadow == null) return;

  round.animating = true;

  const payout = dropPayout();
  const loss = round.bet - payout;
  const wouldHaveWon = round.playerValue > round.shadow;

  await revealShadowSequence(wouldHaveWon, async () => {
    try {
      const games = (profile.games || 0) + 1;
      const coins = profile.coins + payout;
      const record = Math.max(profile.record || STARTING_COINS, coins);

      await updateProfile({
        coins,
        record,
        games,
      });

      summaryBox.textContent =
        `Start Value: ${round.startValue}\n` +
        `Final Value: ${round.playerValue}\n` +
        `Risks: ${round.riskCount}\n` +
        `Hint Used: ${round.hintUsed ? "Yes" : "No"}\n` +
        `Shadow: ${round.shadow}\n` +
        `Would Have Won: ${wouldHaveWon ? "Yes" : "No"}\n` +
        `Event: ${round.eventText}\n` +
        `Result: DROP | Recovered ${payout} | Loss ${loss}`;

      setStatus(
        `You escaped.\nRecovered ${payout}\nLoss -${loss}\nShadow was ${round.shadow}\n${wouldHaveWon ? "You would have won." : "You would have lost."}`,
        "info"
      );

      resetRound();
      refreshUI();
    } catch (err) {
      alert("DROP Fehler: " + err.message);
      resetRound();
      refreshUI();
    }
  });
});

// ADMIN
giftBtn.addEventListener("click", async () => {
  try {
    const username = giftUsername.value.trim();
    const amount = parseInt(giftAmount.value, 10);
    const message = giftMessage.value.trim();

    if (!username || !amount || amount < 1) {
      alert("Bitte Username und Coins korrekt eingeben.");
      return;
    }

    const { error } = await supabase.rpc("admin_gift_coins", {
      target_username: username,
      gift_amount: amount,
      gift_message: message,
    });

    if (error) throw error;

    alert("Coins gesendet!");
  } catch (err) {
    alert("Gift Fehler: " + err.message);
  }
});

// AUTH ACTIONS
loginBtn.addEventListener("click", async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value,
    });

    if (error) throw error;
    await loadProfile();
  } catch (err) {
    alert("Login Fehler: " + err.message);
  }
});

registerBtn.addEventListener("click", async () => {
  try {
    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;

    if (!username || !email || !password) {
      alert("Bitte alles ausfüllen.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) throw error;

    alert("Registrierung erfolgreich. Jetzt einloggen.");
    setLoginMode();
  } catch (err) {
    alert("Registrierung Fehler: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  currentUser = null;
  profile = null;
  resetRound();
  appSection.classList.add("hidden");
  authSection.classList.remove("hidden");
  adminSection.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  setLoginMode();
  setStatus('Press "New Round" to start.', "info");
});

(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    await loadProfile();
  } else {
    setLoginMode();
  }
})();
