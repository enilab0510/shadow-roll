const SUPABASE_URL = "https://livqhbwvdxafhrbltnxn.supabase.co";
const SUPABASE_KEY = "sb_publishable_tz53K_v1PwnxAGC1QnZFOw_aeG-NaEE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function $(id) {
  return document.getElementById(id);
}

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

const messageBox = $("messageBox");

const profileCard = $("profileCard");
const userIdValue = $("userIdValue");
const emailValue = $("emailValue");
const usernameValue = $("usernameValue");
const coinsValue = $("coinsValue");
const logoutBtn = $("logoutBtn");

function setMessage(text, type = "info") {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  console.log(`[${type.toUpperCase()}] ${text}`);
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

async function loadProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    profileCard.classList.add("hidden");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  userIdValue.textContent = user.id || "-";
  emailValue.textContent = user.email || "-";
  usernameValue.textContent = profile?.username || "(kein Profil)";
  coinsValue.textContent = profile?.coins ?? 0;

  profileCard.classList.remove("hidden");
}

showLoginBtn.addEventListener("click", showLogin);
showRegisterBtn.addEventListener("click", showRegister);


// =========================
// 🔥 REGISTER FIX (WICHTIG)
// =========================

registerBtn.addEventListener("click", async () => {
  try {
    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;

    if (!username || !email || !password) {
      setMessage("Bitte alles ausfüllen.", "error");
      return;
    }

    if (password.length < 6) {
      setMessage("Passwort mindestens 6 Zeichen.", "error");
      return;
    }

    setMessage("Registrierung läuft...", "info");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin
      }
    });

    console.log("SIGNUP:", data, error);

    if (error) throw error;

    // 🔥 AUTO LOGIN (FIX für Email Confirm Problem)
    if (data.user && !data.session) {
      setMessage("Registriert (kein Mail nötig). Login läuft...", "info");

      const loginResult = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginResult.error) throw loginResult.error;

      setMessage("Erfolgreich registriert & eingeloggt!", "success");
      await loadProfile();
      return;
    }

    setMessage("Registrierung erfolgreich!", "success");
    await loadProfile();

  } catch (err) {
    console.error(err);
    setMessage(`Fehler: ${err.message}`, "error");
  }
});


// =========================
// LOGIN
// =========================

loginBtn.addEventListener("click", async () => {
  try {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      setMessage("Bitte E-Mail & Passwort eingeben.", "error");
      return;
    }

    setMessage("Login läuft...", "info");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log("LOGIN:", data, error);

    if (error) throw error;

    setMessage("Login erfolgreich!", "success");
    await loadProfile();

  } catch (err) {
    console.error(err);
    setMessage(`Login Fehler: ${err.message}`, "error");
  }
});


// =========================
// LOGOUT
// =========================

logoutBtn.addEventListener("click", async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    profileCard.classList.add("hidden");
    setMessage("Logout erfolgreich.", "success");

  } catch (err) {
    console.error(err);
    setMessage(`Logout Fehler: ${err.message}`, "error");
  }
});


// =========================
// INIT
// =========================

(async function init() {
  try {
    showLogin();

    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) throw error;

    if (session) {
      setMessage("Session gefunden.", "success");
      await loadProfile();
    } else {
      setMessage("Bitte einloggen oder registrieren.", "info");
    }

  } catch (err) {
    console.error(err);
    setMessage(`Init Fehler: ${err.message}`, "error");
  }
})();
