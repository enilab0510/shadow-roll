const SUPABASE_URL = "https://livqhbwvdxafhrbltnxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_tz53K_v1PwnxAGC1QnZFOw_aeG-NaEE";
const STARTING_COINS = 20000;
const MAX_RISKS = 5;

const MODE = {
  name: "Mittel",
  desc: "Balanced standard mode.",
  rewardBoost: 0.95,
  lossProtection: 0,
};

document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const $ = (id) => document.getElementById(id);

  const authCard = $("authCard");
  const appCard = $("appCard");
  const logoutBtn = $("logoutBtn");

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

  const usernameValue = $("usernameValue");
  const coinsValue = $("coinsValue");
  const gamesValue = $("gamesValue");
  const winrateValue = $("winrateValue");

  const modeDesc = $("modeDesc");
  const betInput = $("betInput");
  const potValue = $("potValue");
  const riskCountValue = $("riskCountValue");
  const playerValue = $("playerValue");
  const shadowValue = $("shadowValue");
  const multiplierValue = $("multiplierValue");
  const payoutValue = $("payoutValue");
  const gameMessage = $("gameMessage");
  const summaryBox = $("summaryBox");

  const startBtn = $("startBtn");
  const riskBtn = $("riskBtn");
  const safeBtn = $("safeBtn");

  const modeButtons = [...document.querySelectorAll(".mode-btn")];
  const modeRow = document.querySelector(".mode-row");

  let currentUser = null;
  let profile = null;

  let round = {
    active: false,
    bet: 0,
    playerRoll: 0,
    shadowRoll: 0,
    riskCount: 0,
    startValue: 0,
  };

  function setAuthMessage(text, type = "info") {
    authMessage.textContent = text;
    authMessage.className = `message ${type}`;
    console.log(`[AUTH] ${text}`);
  }

  function setGameMessage(text, type = "info") {
    gameMessage.textContent = text;
    gameMessage.className = `message ${type}`;
    console.log(`[GAME] ${text}`);
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

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

  function safeBonus() {
    const table = [1.03, 1.06, 1.1, 1.16, 1.24, 1.34];
    return table[round.riskCount] || 1.34;
  }

  function currentMultiplier() {
    return getMultiplier(round.riskCount) * MODE.rewardBoost;
  }

  function safePayout() {
    if (!round.active) return 0;
    return Math.max(
      1,
      Math.round(round.bet * currentMultiplier() * safeBonus())
    );
  }

  function refreshProfileUI() {
    if (!profile) return;

    usernameValue.textContent = profile.username ?? "-";
    coinsValue.textContent = profile.coins ?? 0;
    gamesValue.textContent = profile.games ?? 0;

    const rate =
      profile.games > 0
        ? ((profile.wins / profile.games) * 100).toFixed(1)
        : "0.0";

    winrateValue.textContent = `${rate}%`;
  }

  function refreshGameUI() {
    modeDesc.textContent = `${MODE.desc} Difficulty: ${MODE.name}.`;
    potValue.textContent = round.active ? String(round.bet) : "-";
    riskCountValue.textContent = round.active
      ? `${round.riskCount}/${MAX_RISKS}`
      : `0/${MAX_RISKS}`;
    playerValue.textContent = round.active ? String(round.playerRoll) : "-";
    shadowValue.textContent = round.active ? "?" : "?";

    multiplierValue.textContent = round.active
      ? `Multiplier: x${currentMultiplier().toFixed(2)}`
      : "Multiplier: -";

    payoutValue.textContent = round.active
      ? `SAFE Payout: ${safePayout()}`
      : "SAFE Payout: -";

    startBtn.disabled = round.active;
    riskBtn.disabled = !round.active || round.riskCount >= MAX_RISKS;
    safeBtn.disabled = !round.active;
  }

  function resetRound() {
    round = {
      active: false,
      bet: 0,
      playerRoll: 0,
      shadowRoll: 0,
      riskCount: 0,
      startValue: 0,
    };
    refreshGameUI();
  }

  async function loadProfile() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

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

    profile = data;
    refreshProfileUI();
  }

  async function updateProfile(patch) {
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", currentUser.id)
      .select()
      .single();

    if (error) throw error;

    profile = data;
    refreshProfileUI();
  }

  async function enterApp() {
    await loadProfile();
    authCard.classList.add("hidden");
    appCard.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    resetRound();
    setGameMessage("Willkommen. Starte eine neue Runde.", "info");
  }

  function leaveApp() {
    currentUser = null;
    profile = null;
    authCard.classList.remove("hidden");
    appCard.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    showLogin();
    resetRound();
  }

  function hideModeControls() {
    if (modeRow) {
      modeRow.style.display = "none";
    }
    modeButtons.forEach((btn) => {
      btn.style.display = "none";
    });
  }

  showLoginBtn.addEventListener("click", showLogin);
  showRegisterBtn.addEventListener("click", showRegister);

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
        options: {
          data: { username },
          emailRedirectTo: window.location.origin,
        },
      });

      console.log("SIGNUP RESULT:", data, error);

      if (error) throw error;

      if (data.user && !data.session) {
        setAuthMessage("Registriert. Login läuft...", "info");

        const loginResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginResult.error) throw loginResult.error;

        await enterApp();
        setAuthMessage("Erfolgreich registriert & eingeloggt!", "success");
        return;
      }

      await enterApp();
      setAuthMessage("Registrierung erfolgreich.", "success");
    } catch (err) {
      console.error("REGISTER ERROR:", err);
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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await enterApp();
      setAuthMessage("Login erfolgreich.", "success");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setAuthMessage(`Login Fehler: ${err.message}`, "error");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      leaveApp();
      setAuthMessage("Erfolgreich ausgeloggt.", "success");
    } catch (err) {
      console.error("LOGOUT ERROR:", err);
      setAuthMessage(`Logout Fehler: ${err.message}`, "error");
    }
  });

  startBtn.addEventListener("click", async () => {
    try {
      if (!profile) return;

      const bet = parseInt(betInput.value, 10);

      if (!bet || bet < 1) {
        setGameMessage("Bet muss mindestens 1 sein.", "error");
        return;
      }

      if (bet > profile.coins) {
        setGameMessage("Nicht genug Coins.", "error");
        return;
      }

      await updateProfile({
        coins: profile.coins - bet,
      });

      const firstRoll = rand(1, 100);

      round.active = true;
      round.bet = bet;
      round.playerRoll = firstRoll;
      round.shadowRoll = rand(1, 100);
      round.riskCount = 0;
      round.startValue = firstRoll;

      refreshGameUI();
      setGameMessage(`Runde gestartet. Dein Startwert ist ${round.playerRoll}.`, "info");
    } catch (err) {
      console.error("START ERROR:", err);
      setGameMessage(`Start Fehler: ${err.message}`, "error");
    }
  });

  riskBtn.addEventListener("click", () => {
    if (!round.active) return;
    if (round.riskCount >= MAX_RISKS) return;

    const oldValue = round.playerRoll;
    const newValue = rand(1, 100);

    round.playerRoll = newValue;
    round.riskCount += 1;

    refreshGameUI();

    if (newValue > oldValue) {
      setGameMessage(`Nice roll! ${oldValue} → ${newValue}`, "success");
    } else if (newValue < oldValue) {
      setGameMessage(`Bad roll... ${oldValue} → ${newValue}`, "error");
    } else {
      setGameMessage(`No change. Wert bleibt ${newValue}`, "info");
    }
  });

  safeBtn.addEventListener("click", async () => {
    try {
      if (!round.active) return;

      const won = round.playerRoll > round.shadowRoll;
      const newGames = (profile.games || 0) + 1;

      shadowValue.textContent = String(round.shadowRoll);

      if (won) {
        const payout = safePayout();
        const profit = payout - round.bet;
        const newCoins = profile.coins + payout;
        const newWins = (profile.wins || 0) + 1;
        const newRecord = Math.max(profile.record || STARTING_COINS, newCoins);

        await updateProfile({
          coins: newCoins,
          games: newGames,
          wins: newWins,
          record: newRecord,
        });

        summaryBox.textContent =
          `Difficulty: ${MODE.name}\n` +
          `Bet: ${round.bet}\n` +
          `Start Value: ${round.startValue}\n` +
          `Final Value: ${round.playerRoll}\n` +
          `Shadow: ${round.shadowRoll}\n` +
          `Risks: ${round.riskCount}\n` +
          `Result: WIN\n` +
          `Payout: ${payout}\n` +
          `Profit: +${profit}`;

        setGameMessage(`Gewonnen. Shadow war ${round.shadowRoll}. Payout ${payout}`, "success");
      } else {
        const refund = MODE.lossProtection || 0;
        const newLosses = (profile.losses || 0) + 1;
        const newCoins = profile.coins + refund;

        await updateProfile({
          coins: newCoins,
          games: newGames,
          losses: newLosses,
        });

        summaryBox.textContent =
          `Difficulty: ${MODE.name}\n` +
          `Bet: ${round.bet}\n` +
          `Start Value: ${round.startValue}\n` +
          `Final Value: ${round.playerRoll}\n` +
          `Shadow: ${round.shadowRoll}\n` +
          `Risks: ${round.riskCount}\n` +
          `Result: LOSS${refund ? `\nRefund: ${refund}` : ""}`;

        setGameMessage(
          `Verloren. Shadow war ${round.shadowRoll}.${refund ? ` Refund ${refund}.` : ""}`,
          "error"
        );
      }

      resetRound();
    } catch (err) {
      console.error("SAFE ERROR:", err);
      setGameMessage(`Safe Fehler: ${err.message}`, "error");
    }
  });

  (async function init() {
    try {
      hideModeControls();
      showLogin();
      resetRound();

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session) {
        await enterApp();
        setAuthMessage("Session gefunden.", "success");
      } else {
        setAuthMessage("Bitte einloggen oder registrieren.", "info");
      }
    } catch (err) {
      console.error("INIT ERROR:", err);
      setAuthMessage(`Init Fehler: ${err.message}`, "error");
    }
  })();
});
