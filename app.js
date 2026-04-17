const SUPABASE_URL = "https://livqhbwvdxafhrbltnxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_tz53K_v1PwnxAGC1QnZFOw_aeG-NaEE";
const STARTING_COINS = 20000;

const MODES = {
  Easy: {
    desc: "Softer losses, smaller wins.",
    riskUpMax: 20,
    riskDownMax: 10,
    payoutStep: 0.22,
  },
  Normal: {
    desc: "Balanced standard mode.",
    riskUpMax: 17,
    riskDownMax: 14,
    payoutStep: 0.3,
  },
  Hardcore: {
    desc: "Harder, riskier, more pressure.",
    riskUpMax: 15,
    riskDownMax: 18,
    payoutStep: 0.38,
  },
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

  let currentUser = null;
  let profile = null;
  let currentMode = "Normal";

  let round = {
    active: false,
    bet: 0,
    playerRoll: 0,
    shadowRoll: 0,
    riskCount: 0,
  };

  function setAuthMessage(text, type = "info") {
    authMessage.textContent = text;
    authMessage.className = `message ${type}`;
    console.log(text);
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

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getMode() {
    return MODES[currentMode];
  }

  function getPotentialPayout() {
    if (!round.active) return 0;
    const multi = 1 + round.riskCount * getMode().payoutStep;
    return Math.round(round.bet * multi);
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
    modeDesc.textContent = getMode().desc;
    potValue.textContent = round.active ? String(round.bet) : "-";
    riskCountValue.textContent = round.active ? `${round.riskCount}/5` : "0/5";
    playerValue.textContent = round.active ? String(round.playerRoll) : "-";
    shadowValue.textContent = round.active ? "?" : "?";
    multiplierValue.textContent = round.active
      ? `Multiplier: x${(1 + round.riskCount * getMode().payoutStep).toFixed(2)}`
      : "Multiplier: -";
    payoutValue.textContent = round.active
      ? `SAFE Payout: ${getPotentialPayout()}`
      : "SAFE Payout: -";

    startBtn.disabled = round.active;
    riskBtn.disabled = !round.active;
    safeBtn.disabled = !round.active;
  }

  function resetRound() {
    round = {
      active: false,
      bet: 0,
      playerRoll: 0,
      shadowRoll: 0,
      riskCount: 0,
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
        },
      });

      console.log("SIGNUP RESULT:", data, error);

      if (error) throw error;

      if (data.user && !data.session) {
        setAuthMessage("Registrierung erfolgreich. Bitte E-Mail bestätigen.", "success");
        showLogin();
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("LOGIN RESULT:", data, error);

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

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (round.active) return;
      currentMode = btn.dataset.mode;
      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      refreshGameUI();
    });
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

      round.active = true;
      round.bet = bet;
      round.playerRoll = rand(1, 100);
      round.shadowRoll = rand(1, 100);
      round.riskCount = 0;

      refreshGameUI();
      setGameMessage(`Runde gestartet. Dein Startwert ist ${round.playerRoll}.`, "info");
    } catch (err) {
      console.error("START ERROR:", err);
      setGameMessage(`Start Fehler: ${err.message}`, "error");
    }
  });

  riskBtn.addEventListener("click", () => {
    if (!round.active) return;

    const old = round.playerRoll;
    const up = rand(0, getMode().riskUpMax);
    const down = rand(0, getMode().riskDownMax);

    let next = old + up - down;
    if (next < 1) next = 1;
    if (next > 100) next = 100;

    round.playerRoll = next;
    round.riskCount += 1;

    refreshGameUI();

    if (next > old) setGameMessage(`Risk war gut. Neuer Wert: ${next}`, "success");
    else if (next < old) setGameMessage(`Risk war schlecht. Neuer Wert: ${next}`, "error");
    else setGameMessage(`Kein Unterschied. Wert bleibt ${next}`, "info");
  });

  safeBtn.addEventListener("click", async () => {
    try {
      if (!round.active) return;

      const won = round.playerRoll > round.shadowRoll;
      const newGames = (profile.games || 0) + 1;

      shadowValue.textContent = String(round.shadowRoll);

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
          `Mode: ${currentMode}\n` +
          `Bet: ${round.bet}\n` +
          `Your Value: ${round.playerRoll}\n` +
          `Shadow: ${round.shadowRoll}\n` +
          `Risks: ${round.riskCount}\n` +
          `Result: WIN\n` +
          `Payout: ${payout}`;

        setGameMessage(`Gewonnen. Shadow war ${round.shadowRoll}.`, "success");
      } else {
        const newLosses = (profile.losses || 0) + 1;

        await updateProfile({
          games: newGames,
          losses: newLosses,
        });

        summaryBox.textContent =
          `Mode: ${currentMode}\n` +
          `Bet: ${round.bet}\n` +
          `Your Value: ${round.playerRoll}\n` +
          `Shadow: ${round.shadowRoll}\n` +
          `Risks: ${round.riskCount}\n` +
          `Result: LOSS`;

        setGameMessage(`Verloren. Shadow war ${round.shadowRoll}.`, "error");
      }

      resetRound();
    } catch (err) {
      console.error("SAFE ERROR:", err);
      setGameMessage(`Safe Fehler: ${err.message}`, "error");
    }
  });

  (async function init() {
    try {
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
