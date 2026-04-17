const SUPABASE_URL = "https://livqhwbvdxafhrbltnxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_tz53K_v1PwnxAGC1QnZFOw_aeG-NaEE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const adminSection = document.getElementById("adminSection");

const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");

const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");

const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");

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

const giftBtn = document.getElementById("giftBtn");
const giftUsername = document.getElementById("giftUsername");
const giftAmount = document.getElementById("giftAmount");
const giftMessage = document.getElementById("giftMessage");

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

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Bitte E-Mail und Passwort eingeben.");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Login Fehler: " + error.message);
    return;
  }

  await loadProfile();
});

registerBtn.addEventListener("click", async () => {
  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  if (!username || !email || !password) {
    alert("Bitte Username, E-Mail und Passwort eingeben.");
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });

  if (error) {
    alert("Registrierung Fehler: " + error.message);
    return;
  }

  alert("Registrierung erfolgreich. Jetzt einloggen.");
  setLoginMode();
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  adminSection.classList.add("hidden");
  logoutBtn.classList.add("hidden");
});

async function loadProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("User konnte nicht geladen werden.");
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    alert("Profil Fehler: " + error.message);
    return;
  }

  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  usernameValue.innerText = data.username ?? "";
  coinsValue.innerText = data.coins ?? 0;
  recordValue.innerText = data.record ?? 0;
  gamesValue.innerText = data.games ?? 0;
  adminValue.innerText = data.is_admin ? "Ja" : "Nein";
  winsValue.innerText = data.wins ?? 0;
  lossesValue.innerText = data.losses ?? 0;
  streakValue.innerText = data.streak ?? 0;
  bestStreakValue.innerText = data.best_streak ?? 0;

  const winrate = data.games > 0 ? ((data.wins / data.games) * 100).toFixed(1) : "0.0";
  winrateValue.innerText = `${winrate}%`;

  if (data.is_admin) {
    adminSection.classList.remove("hidden");
  } else {
    adminSection.classList.add("hidden");
  }
}

giftBtn.addEventListener("click", async () => {
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

  if (error) {
    alert("Gift Fehler: " + error.message);
    return;
  }

  alert("Coins gesendet!");
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
