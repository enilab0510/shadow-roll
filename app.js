const SUPABASE_URL = "https://livqhwbvdxafhrbltnxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_tz53K_v1PwnxAGC1QnZFOw_aeG-NaEE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// UI
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

function showLoginMode() {
  loginBox.classList.remove("hidden");
  registerBox.classList.add("hidden");
  showLoginBtn.classList.add("active");
  showRegisterBtn.classList.remove("active");
}

function showRegisterMode() {
  loginBox.classList.add("hidden");
  registerBox.classList.remove("hidden");
  showLoginBtn.classList.remove("active");
  showRegisterBtn.classList.add("active");
}

showLoginBtn.onclick = showLoginMode;
showRegisterBtn.onclick = showRegisterMode;

// LOGIN
loginBtn.onclick = async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Login Fehler: " + error.message);
    return;
  }

  await loadProfile();
};

// REGISTER
registerBtn.onclick = async () => {
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
      data: { username }
    }
  });

  if (error) {
    alert("Registrierung Fehler: " + error.message);
    return;
  }

  alert("Registrierung erfolgreich. Du kannst dich jetzt einloggen.");
  showLoginMode();
};

// LOGOUT
logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  adminSection.classList.add("hidden");
  logoutBtn.classList.add("hidden");
};

// PROFIL LADEN
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
  adminValue.innerText = data.is_admin ? "Ja" : "Nein";

  if (data.is_admin) {
    adminSection.classList.remove("hidden");
  } else {
    adminSection.classList.add("hidden");
  }
}

// ADMIN GIFT
giftBtn.onclick = async () => {
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
};

// AUTO LOGIN
(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    await loadProfile();
  } else {
    showLoginMode();
  }
})();
