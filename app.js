const SUPABASE_URL = "https://livqhbwvdxafhrbltnxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_tz53K_v1PwnxAGC1QnZFOw_aeG-NaEE";
const STARTING_COINS = 20000;
const MAX_RISKS = 5;
const HINT_MAX_RISKS = 3;
const HINT_ALLOWED_UNTIL_RISK = 2; // Hint nur bei 0,1,2 Risks erlaubt

const MODE = {
  name: "Mittel",
  desc: "Balanced standard mode.",
  rewardBoost: 0.95,
  lossProtection: 0,
  hintQuality: "medium",
  dropBase: 0.16,
};

document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;

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
  const winsValue = $("winsValue");
  const lossesValue = $("lossesValue");
  const streakValue = $("streakValue");
  const bestStreakValue = $("bestStreakValue");
  const hintsValue = $("hintsValue");
  const dropsValue = $("dropsValue");
  const recordValue = $("recordValue");
  const totalProfitValue = $("totalProfitValue");

  const modeDesc = $("modeDesc");
  const betInput = $("betInput");
  const potValue = $("potValue");
  const riskCountValue = $("riskCountValue");
  const hintCostValue = $("hintCostValue");
  const playerValue = $("playerValue");
  const shadowValue = $("shadowValue");
  const hintText = $("hintText");
  const multiplierValue = $("multiplierValue");
  const payoutValue = $("payoutValue");
  const dropValue = $("dropValue");
  const gameMessage = $("gameMessage");
  const summaryBox = $("summaryBox");

  const startBtn = $("startBtn");
  const riskBtn = $("riskBtn");
  const hintBtn = $("hintBtn");
  const dropBtn = $("dropBtn");
  const safeBtn = $("safeBtn");

  let currentUser = null;
  let profile = null;

  let round = {
    active: false,
    bet: 0,
    playerRoll: 0,
    shadowRoll: 0,
    riskCount: 0,
    startValue: 0,
    animating: false,
    hintUsed: false,
    hintText: null,
    hintStrength: 0,
    hintCostPaid: 0,
  };

  function beep(freq = 440, duration = 80, type = "sine", gain = 0.03) {
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = gain;

    osc.connect(amp);
    amp.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  function soundStart() {
    beep(650, 70);
  }

  function soundTick() {
    beep(880, 30);
  }

  function soundHint() {
    beep(760, 90);
  }

  function soundDrop() {
    beep(520, 80);
    setTimeout(() => beep(660, 80), 90);
  }

  function soundWin() {
    beep(900, 100);
    setTimeout(() => beep(1120, 120), 120);
  }

  function soundLose() {
    beep(300, 180, "sawtooth");
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

  function currentMaxRisks() {
    return round.hintUsed ? HINT_MAX_RISKS : MAX_RISKS;
  }

  function canUseHintNow() {
    return round.active &&
      !round.animating &&
      !round.hintUsed &&
      round.riskCount <= HINT_ALLOWED_UNTIL_RISK;
  }

  function safeBonus() {
    const table = [1.03, 1.06, 1.1, 1.16, 1.24, 1.34];
    let bonus = table[round.riskCount] || 1.34;

    if (round.hintUsed) {
      bonus = Math.max(0.84, 1.0 - round.hintStrength * 0.1);
      bonus *= 0.9;
    }

    return bonus;
  }

  function currentMultiplier() {
    return getMultiplier(round.riskCount) * MODE.rewardBoost;
  }

  function safePayout() {
    if (!round.active) return 0;
    return Math.max(1, Math.round(round.bet * currentMultiplier() * safeBonus()));
  }

  function hintCost() {
    let base = Math.max(
      12,
      Math.floor(
        round.bet * (getMultiplier(round.riskCount) * MODE.rewardBoost) * 0.32 +
        round.riskCount * 8
      )
    );

    if (round.riskCount >= 4) base += 20;
    else if (round.riskCount >= 2) base += 10;

    return base;
  }

  function dropRatio() {
    if (!round.active) return 0;

    let ratio = MODE.dropBase + round.riskCount * 0.055;

    if (round.riskCount === 0) ratio -= 0.05;
    else if (round.riskCount === 1) ratio -= 0.02;

    if (round.hintUsed) ratio -= 0.06 + round.hintStrength * 0.18;

    if (round.hintCostPaid > 0) {
      ratio -= Math.min(0.08, round.hintCostPaid / Math.max(1, round.bet * 10));
    }

    return Math.max(0.04, Math.min(ratio, 0.46));
  }

  function dropPayout() {
    if (!round.active) return 0;
    return Math.round(round.bet * dropRatio());
  }

  function generateHint(shadow) {
    const roll = rand(1, 3);

    if (roll === 1) {
      return [`Shadow is ${shadow % 2 === 0 ? "even" : "odd"}.`, 0.28];
    }

    if (roll === 2) {
      return [`Shadow is ${shadow <= 50 ? "50 or below" : "above 50"}.`, 0.42];
    }

    if (shadow <= 33) return ["Shadow is likely low (1-33).", 0.56];
    if (shadow <= 66) return ["Shadow is in the middle range (34-66).", 0.48];
    return ["Shadow is likely high (67-100).", 0.56];
  }

  function refreshProfileUI() {
    if (!profile) return;

    usernameValue.textContent = profile.username ?? "-";
    coinsValue.textContent = profile.coins ?? 0;
    gamesValue.textContent = profile.games ?? 0;
    winsValue.textContent = profile.wins ?? 0;
    lossesValue.textContent = profile.losses ?? 0;
    streakValue.textContent = profile.streak ?? 0;
    bestStreakValue.textContent = profile.best_streak ?? 0;
    hintsValue.textContent = profile.hints ?? 0;
    dropsValue.textContent = profile.drops ?? 0;
    recordValue.textContent = profile.record ?? 0;
    totalProfitValue.textContent = profile.total_profit ?? 0;

    const rate =
      profile.games > 0 ? ((profile.wins / profile.games) * 100).toFixed(1) : "0.0";
    winrateValue.textContent = `${rate}%`;
  }

  function refreshGameUI() {
    modeDesc.textContent = `${MODE.desc} Difficulty: ${MODE.name}.`;
    potValue.textContent = round.active ? String(round.bet) : "-";
    riskCountValue.textContent = round.active
      ? `${round.riskCount}/${currentMaxRisks()}`
      : `0/${MAX_RISKS}`;

    hintCostValue.textContent =
      round.active && !round.hintUsed && round.riskCount <= HINT_ALLOWED_UNTIL_RISK
        ? String(hintCost())
        : "-";

    playerValue.textContent = round.active ? String(round.playerRoll) : "-";
    multiplierValue.textContent = round.active
      ? `Multiplier: x${currentMultiplier().toFixed(2)}`
      : "Multiplier: -";
    payoutValue.textContent = round.active
      ? `SAFE Payout: ${safePayout()}`
      : "SAFE Payout: -";
    dropValue.textContent = round.active
      ? `DROP Payout: ${dropPayout()}`
      : "DROP Payout: -";
    hintText.textContent = `Hint: ${round.hintText || "-"}`;

    startBtn.disabled = round.active || round.animating;
    riskBtn.disabled =
      !round.active || round.animating || round.riskCount >= currentMaxRisks();
    hintBtn.disabled = !canUseHintNow();
    dropBtn.disabled = !round.active || round.animating;
    safeBtn.disabled = !round.active || round.animating;
  }

  function resetRound() {
    round = {
      active: false,
      bet: 0,
      playerRoll: 0,
      shadowRoll: 0,
      riskCount: 0,
      startValue: 0,
      animating: false,
      hintUsed: false,
      hintText: null,
      hintStrength: 0,
      hintCostPaid: 0,
    };

    shadowValue.textContent = "?";
    hintText.textContent = "Hint: -";
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

    let profileData = null;
    let profileError = null;

    for (let i = 0; i < 10; i++) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      profileData = data;
      profileError = error;

      if (profileError) throw profileError;
      if (profileData) break;

      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    if (!profileData) {
      throw new Error("Kein Profil gefunden. Bitte kurz warten und dann einloggen.");
    }

    profile = {
      wins: 0,
      losses: 0,
      streak: 0,
      best_streak: 0,
      hints: 0,
      drops: 0,
      total_profit: 0,
      ...profileData,
    };

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

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function animateNumber(element, finalValue, done) {
    const values = Array.from({ length: 12 }, () => rand(1, 100));
    values.push(finalValue);
    let i = 0;

    round.animating = true;
    refreshGameUI();

    const run = () => {
      soundTick();
      element.classList.add("roll");
      element.textContent = String(values[i]);
      setTimeout(() => element.classList.remove("roll"), 70);

      if (i < values.length - 1) {
        i += 1;
        setTimeout(run, 50 + i * 4);
      } else {
        round.animating = false;
        refreshGameUI();
        if (done) done();
      }
    };

    run();
  }

  async function revealShadowAnimated(finalShadow) {
    shadowValue.textContent = "?";
    round.animating = true;
    refreshGameUI();

    for (const v of ["3", "2", "1"]) {
      soundTick();
      shadowValue.classList.add("roll");
      shadowValue.textContent = v;
      await wait(320);
      shadowValue.classList.remove("roll");
    }

    shadowValue.textContent = String(finalShadow);
    round.animating = false;
    refreshGameUI();
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

      if (error) throw error;

      if (data.user && !data.session) {
        const loginResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginResult.error) throw loginResult.error;
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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await enterApp();
      setAuthMessage("Login erfolgreich.", "success");
    } catch (err) {
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

      soundStart();

      await updateProfile({
        coins: profile.coins - bet,
        total_profit: (profile.total_profit || 0) - bet,
      });

      const firstRoll = rand(1, 100);

      round.active = true;
      round.bet = bet;
      round.playerRoll = 0;
      round.shadowRoll = rand(1, 100);
      round.riskCount = 0;
      round.startValue = firstRoll;
      shadowValue.textContent = "?";

      refreshGameUI();
      setGameMessage("Runde gestartet. Startwert wird gewürfelt...", "info");

      animateNumber(playerValue, firstRoll, () => {
        round.playerRoll = firstRoll;
        refreshGameUI();
        setGameMessage(`Runde gestartet. Dein Startwert ist ${round.playerRoll}.`, "info");
      });
    } catch (err) {
      setGameMessage(`Start Fehler: ${err.message}`, "error");
    }
  });

  riskBtn.addEventListener("click", () => {
    if (!round.active || round.animating || round.riskCount >= currentMaxRisks()) return;

    const oldValue = round.playerRoll;
    const newValue = rand(1, 100);

    round.riskCount += 1;
    round.playerRoll = 0;
    refreshGameUI();
    setGameMessage("Risking it...", "info");

    animateNumber(playerValue, newValue, () => {
      round.playerRoll = newValue;
      refreshGameUI();

      if (newValue > oldValue) {
        setGameMessage(`Nice roll! ${oldValue} → ${newValue}`, "success");
      } else if (newValue < oldValue) {
        setGameMessage(`Bad roll... ${oldValue} → ${newValue}`, "error");
      } else {
        setGameMessage(`No change. Wert bleibt ${newValue}`, "info");
      }
    });
  });

  hintBtn.addEventListener("click", async () => {
    try {
      if (!canUseHintNow()) return;

      const cost = hintCost();
      if (cost > profile.coins) {
        setGameMessage(`Nicht genug Coins für Hint (${cost}).`, "error");
        return;
      }

      const [text, strength] = generateHint(round.shadowRoll);
      soundHint();

      round.hintUsed = true;
      round.hintText = text;
      round.hintStrength = strength;
      round.hintCostPaid = cost;

      await updateProfile({
        coins: profile.coins - cost,
        hints: (profile.hints || 0) + 1,
        total_profit: (profile.total_profit || 0) - cost,
      });

      setGameMessage(
        `Hint gekauft für ${cost} Coins. Hint ist nur bis Risk 3 erlaubt. Max Risks jetzt ${HINT_MAX_RISKS}.`,
        "info"
      );
      refreshGameUI();
    } catch (err) {
      setGameMessage(`Hint Fehler: ${err.message}`, "error");
    }
  });

  dropBtn.addEventListener("click", async () => {
    try {
      if (!round.active || round.animating) return;

      const payout = dropPayout();
      const loss = round.bet - payout;
      const wouldHaveWon = round.playerRoll > round.shadowRoll;

      soundDrop();
      await revealShadowAnimated(round.shadowRoll);

      await updateProfile({
        coins: profile.coins + payout,
        games: (profile.games || 0) + 1,
        drops: (profile.drops || 0) + 1,
        total_profit: (profile.total_profit || 0) + payout,
        record: Math.max(profile.record || STARTING_COINS, profile.coins + payout),
      });

      summaryBox.textContent =
        `Difficulty: ${MODE.name}\n` +
        `Bet: ${round.bet}\n` +
        `Start Value: ${round.startValue}\n` +
        `Final Value: ${round.playerRoll}\n` +
        `Shadow: ${round.shadowRoll}\n` +
        `Risks: ${round.riskCount}\n` +
        `Hint Used: ${round.hintUsed ? "Yes" : "No"}\n` +
        `Result: DROP\n` +
        `Recovered: ${payout}\n` +
        `Loss: ${loss}\n` +
        `Would have won: ${wouldHaveWon ? "Yes" : "No"}`;

      setGameMessage(
        `DROP benutzt. Recovered ${payout}. Verlust ${loss}. ${wouldHaveWon ? "Du hättest gewonnen." : "Du hättest verloren."}`,
        "info"
      );

      resetRound();
    } catch (err) {
      setGameMessage(`Drop Fehler: ${err.message}`, "error");
    }
  });

  safeBtn.addEventListener("click", async () => {
    try {
      if (!round.active || round.animating) return;

      await revealShadowAnimated(round.shadowRoll);

      const won = round.playerRoll > round.shadowRoll;
      const newGames = (profile.games || 0) + 1;

      if (won) {
        const payout = safePayout();
        const profit = payout - round.bet;
        const newCoins = profile.coins + payout;
        const newWins = (profile.wins || 0) + 1;
        const newStreak = (profile.streak || 0) + 1;
        const newBestStreak = Math.max(profile.best_streak || 0, newStreak);
        const newRecord = Math.max(profile.record || STARTING_COINS, newCoins);

        soundWin();

        await updateProfile({
          coins: newCoins,
          games: newGames,
          wins: newWins,
          streak: newStreak,
          best_streak: newBestStreak,
          record: newRecord,
          total_profit: (profile.total_profit || 0) + payout,
        });

        summaryBox.textContent =
          `Difficulty: ${MODE.name}\n` +
          `Bet: ${round.bet}\n` +
          `Start Value: ${round.startValue}\n` +
          `Final Value: ${round.playerRoll}\n` +
          `Shadow: ${round.shadowRoll}\n` +
          `Risks: ${round.riskCount}\n` +
          `Hint Used: ${round.hintUsed ? "Yes" : "No"}\n` +
          `Result: WIN\n` +
          `Payout: ${payout}\n` +
          `Profit: +${profit}`;

        setGameMessage(`Gewonnen. Shadow war ${round.shadowRoll}. Payout ${payout}`, "success");
      } else {
        const refund = MODE.lossProtection || 0;
        const newLosses = (profile.losses || 0) + 1;
        const newCoins = profile.coins + refund;

        soundLose();

        await updateProfile({
          coins: newCoins,
          games: newGames,
          losses: newLosses,
          streak: 0,
        });

        summaryBox.textContent =
          `Difficulty: ${MODE.name}\n` +
          `Bet: ${round.bet}\n` +
          `Start Value: ${round.startValue}\n` +
          `Final Value: ${round.playerRoll}\n` +
          `Shadow: ${round.shadowRoll}\n` +
          `Risks: ${round.riskCount}\n` +
          `Hint Used: ${round.hintUsed ? "Yes" : "No"}\n` +
          `Result: LOSS${refund ? `\nRefund: ${refund}` : ""}`;

        setGameMessage(
          `Verloren. Shadow war ${round.shadowRoll}.${refund ? ` Refund ${refund}.` : ""}`,
          "error"
        );
      }

      setTimeout(() => resetRound(), 700);
    } catch (err) {
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
      setAuthMessage(`Init Fehler: ${err.message}`, "error");
    }
  })();
});
