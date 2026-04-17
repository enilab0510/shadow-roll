const SUPABASE_URL = "https://livqhbwvdxafhrbltnxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_tz53K_v1PwnxAGC1QnZFOw_aeG-NaEE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const STARTING_COINS = 20000;

const MODES = {
  easy: { name: "Easy", riskBonus: 8, safeMultiplier: 1.15 },
  normal: { name: "Normal", riskBonus: 12, safeMultiplier: 1.3 },
  hard: { name: "Hard", riskBonus: 16, safeMultiplier: 1.45 },
};

function $(id) {
  return document.getElementById(id);
}

const authCard = $("authCard");
const appCard = $("appCard");
const logoutBtn = $("logoutBtn");

const tabLogin = $("tabLogin");
const tabRegister = $("tabRegister");
const loginPane = $("loginPane");
const registerPane = $("registerPane");
const authMessage = $("authMessage");

const loginEmail = $("loginEmail");
const loginPassword = $("loginPassword");
const loginBtn = $("loginBtn");

const registerUsername = $("registerUsername");
const registerEmail = $("registerEmail");
const registerPassword = $("registerPassword");
const registerBtn = $("registerBtn");

const usernameValue = $("usernameValue");
const coinsValue = $("coinsValue");
const gamesValue = $("gamesValue");
const winsValue = $("winsValue");
const lossesValue = $("lossesValue");
const winrateValue = $("winrateValue");

const betInput = $("betInput");
const modeSelect = $("modeSelect");
const playerRollValue = $("playerRollValue");
const shadowRevealValue = $("shadowRevealValue");
const riskCountValue = $("riskCountValue");
const potentialValue = $("potentialValue");
const gameMessage = $("gameMessage");
const summaryBox = $("summaryBox");

const startBtn = $("startBtn");
const riskBtn = $("riskBtn");
const safeBtn = $("safeBtn");

let currentUser = null;
let profile = null;

let round = {
  active: false,
  bet: 0,
  playerRoll: 0,
  shadowRoll: 0,
  riskCount: 0,
  mode: "normal",
};

function showAuthMessage(text, type = "info") {
  authMessage.textContent = text;
  authMessage.className = `message ${type}`;
}

function showGameMessage(text, type = "info") {
  gameMessage.textContent = text;
  gameMessage.className = `message ${type}`;
}

function switchToLogin() {
  loginPane.classList.remove("hidden");
  registerPane.classList.add("hidden");
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
}

function switchToRegister() {
  loginPane.classList.add("hidden");
  registerPane.classList.remove("hidden");
  tabLogin.classList.remove("active");
  tabRegister.classList.add("active");
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resetRound() {
  round = {
    active: false,
    bet: 0,
    playerRoll: 0,
    shadowRoll: 0,
    riskCount: 0,
    mode: modeSelect.value,
  };

  playerRollValue.textContent = "-";
  shadowRevealValue.textContent = "?";
  riskCountValue.textContent = "0";
  potentialValue.textContent = "-";

  startBtn.disabled = false;
  riskBtn.disabled = true;
  safeBtn.disabled = true;
}

function updateProfileUI() {
  if (!profile) return;

  usernameValue.textContent = profile.username ?? "-";
  coinsValue.textContent = profile.coins ?? 0;
  gamesValue.textContent = profile.games ?? 0;
  winsValue.textContent = profile.wins ?? 0;
  lossesValue.textContent = profile.losses ?? 0;

  const games = profile.games ?? 0;
  const wins = profile.wins ?? 0;
  const rate = games > 0 ? ((wins / games) * 100).toFixed(1) : "0.0";
  winrateValue.textContent = `${rate}%`;
}

async function ensureProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) return data;

  const username =
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "Player";

  const insertResult = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username,
      coins: STARTING_COINS,
      record: STARTING_COINS,
      games: 0,
      wins: 0,
      losses: 0,
      streak: 0,
      best_streak: 0,
      is_admin: false,
    })
    .select()
    .single();

  if (insertResult.error) {
    throw insertResult.error;
  }

  return insertResult.data;
}

async function loadAppForCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(error?.message || "Kein User gefunden.");
  }

  currentUser = user;
  profile = await ensureProfile(user);

  authCard.classList.add("hidden");
  appCard.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  updateProfileUI();
  resetRound();
  showGameMessage("Willkommen. Starte eine neue Runde.", "info");
}

async function updateProfile(patch) {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", currentUser.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  profile = data;
  updateProfileUI();
}

function getPotentialPayout() {
  if (!round.active) return 0;
  const mode = MODES[round.mode];
  const bonus = 1 + round.riskCount * (mode.safeMultiplier - 1) * 0.35;
  return Math.round(round.bet * bonus);
}

tabLogin.addEventListener("click", switchToLogin);
tabRegister.addEventListener("click", switchToRegister);

loginBtn.addEventListener("click", async () => {
  try {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showAuthMessage("Bitte E-Mail und Passwort eingeben.", "error");
      return;
    }

    showAuthMessage("Login läuft...", "info");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await loadAppForCurrentUser();
    showAuthMessage("Login erfolgreich.", "success");
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    showAuthMessage(`Login Fehler: ${err.message}`, "error");
  }
});

registerBtn.addEventListener("click", async () => {
  try {
    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;

    if (!username || !email || !password) {
      showAuthMessage("Bitte Username, E-Mail und Passwort eingeben.", "error");
      return;
    }

    if (password.length < 6) {
      showAuthMessage("Passwort muss mindestens 6 Zeichen haben.", "error");
      return;
    }

    showAuthMessage("Registrierung läuft...", "info");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) throw error;

    if (data.user && !data.session) {
      showAuthMessage("Registrierung erfolgreich. Bitte bestätige deine E-Mail.", "success");
      switchToLogin();
      return;
    }

    await loadAppForCurrentUser();
    showAuthMessage("Registrierung erfolgreich.", "success");
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    showAuthMessage(`Registrierung Fehler: ${err.message}`, "error");
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await supabase.auth.signOut();

    currentUser = null;
    profile = null;

    appCard.classList.add("hidden");
    authCard.classList.remove("hidden");
    logoutBtn.classList.add("hidden");

    switchToLogin();
    showAuthMessage("Erfolgreich ausgeloggt.", "info");
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    showAuthMessage(`Logout Fehler: ${err.message}`, "error");
  }
});

startBtn.addEventListener("click", async () => {
  try {
    if (!profile) return;

    const bet = parseInt(betInput.value, 10);
    const mode = modeSelect.value;

    if (!bet || bet < 1) {
      showGameMessage("Bet muss mindestens 1 sein.", "error");
      return;
    }

    if (bet > profile.coins) {
      showGameMessage("Nicht genug Coins.", "error");
      return;
    }

    await updateProfile({
      coins: profile.coins - bet,
    });

    round.active = true;
    round.bet = bet;
    round.playerRoll = rand(1, 100);
    round.shadowRoll = rand(1, 100);
    round.riskCount = 0;
    round.mode = mode;

    playerRollValue.textContent = String(round.playerRoll);
    shadowRevealValue.textContent = "?";
    riskCountValue.textContent = "0";
    potentialValue.textContent = String(getPotentialPayout());

    startBtn.disabled = true;
    riskBtn.disabled = false;
    safeBtn.disabled = false;

    showGameMessage(`Runde gestartet. Dein Startwert ist ${round.playerRoll}.`, "info");
  } catch (err) {
    console.error("START ERROR:", err);
    showGameMessage(`Start Fehler: ${err.message}`, "error");
  }
});

riskBtn.addEventListener("click", () => {
  if (!round.active) return;

  const mode = MODES[round.mode];
  const oldRoll = round.playerRoll;
  const delta = rand(-18, mode.riskBonus);
  let nextRoll = oldRoll + delta;

  if (nextRoll < 1) nextRoll = 1;
  if (nextRoll > 100) nextRoll = 100;

  round.playerRoll = nextRoll;
  round.riskCount += 1;

  playerRollValue.textContent = String(round.playerRoll);
  riskCountValue.textContent = String(round.riskCount);
  potentialValue.textContent = String(getPotentialPayout());

  if (nextRoll > oldRoll) {
    showGameMessage(`Risk war gut. Neuer Wert: ${nextRoll}`, "success");
  } else if (nextRoll < oldRoll) {
    showGameMessage(`Risk war schlecht. Neuer Wert: ${nextRoll}`, "error");
  } else {
    showGameMessage(`Kein Unterschied. Wert bleibt ${nextRoll}`, "info");
  }
});

safeBtn.addEventListener("click", async () => {
  try {
    if (!round.active) return;

    const won = round.playerRoll > round.shadowRoll;
    const newGames = (profile.games || 0) + 1;

    shadowRevealValue.textContent = String(round.shadowRoll);

    if (won) {
      const payout = getPotentialPayout();
      const newCoins = profile.coins + payout;
      const newWins = (profile.wins || 0) + 1;

      await updateProfile({
        coins: newCoins,
        games: newGames,
        wins: newWins,
        record: Math.max(profile.record || STARTING_COINS, newCoins),
      });

      summaryBox.textContent =
        `Mode: ${MODES[round.mode].name}\n` +
        `Bet: ${round.bet}\n` +
        `Your Value: ${round.playerRoll}\n` +
        `Shadow: ${round.shadowRoll}\n` +
        `Risks: ${round.riskCount}\n` +
        `Result: WIN\n` +
        `Payout: ${getPotentialPayout()}`;

      showGameMessage(`Gewonnen. Shadow war ${round.shadowRoll}.`, "success");
    } else {
      const newLosses = (profile.losses || 0) + 1;

      await updateProfile({
        games: newGames,
        losses: newLosses,
      });

      summaryBox.textContent =
        `Mode: ${MODES[round.mode].name}\n` +
        `Bet: ${round.bet}\n` +
        `Your Value: ${round.playerRoll}\n` +
        `Shadow: ${round.shadowRoll}\n` +
        `Risks: ${round.riskCount}\n` +
        `Result: LOSS`;

      showGameMessage(`Verloren. Shadow war ${round.shadowRoll}.`, "error");
    }

    resetRound();
  } catch (err) {
    console.error("SAFE ERROR:", err);
    showGameMessage(`Safe Fehler: ${err.message}`, "error");
  }
});

(async function init() {
  try {
    switchToLogin();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      await loadAppForCurrentUser();
    } else {
      showAuthMessage("Bitte einloggen oder registrieren.", "info");
    }
  } catch (err) {
    console.error("INIT ERROR:", err);
    showAuthMessage(`Initialisierungsfehler: ${err.message}`, "error");
  }
})();
