const SUPABASE_URL = "https://livqhwbvdxafhrbltnxn.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_tz53K_v1PwnxAGC1QnZFOw_aeG-NaEE";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const adminSection = document.getElementById("adminSection");

const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");

const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const giftBtn = document.getElementById("giftBtn");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerUsername = document.getElementById("registerUsername");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

const usernameValue = document.getElementById("usernameValue");
const coinsValue = document.getElementById("coinsValue");
const adminValue = document.getElementById("adminValue");

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
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    alert("Bitte E-Mail und Passwort eingeben.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
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
  const username = registerUsername.value.trim();
  const email = registerEmail.value.trim();
  const password = registerPassword.value;

  if (!username || !email || !password) {
    alert("Bitte Username, E-Mail und Passwort eingeben.");
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
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
  await supabaseClient.auth.signOut();
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  adminSection.classList.add("hidden");
  logoutBtn.classList.add("hidden");
});

async function loadProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    alert("User konnte nicht geladen werden.");
    return;
  }

  const { data, error } = await supabaseClient
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
  adminValue.innerText = data.is_admin ? "Ja" : "Nein";

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

  const { error } = await supabaseClient.rpc("admin_gift_coins", {
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
  } = await supabaseClient.auth.getSession();

  if (session) {
    await loadProfile();
  } else {
    setLoginMode();
  }
})();
