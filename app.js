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

  if (userError) {
    throw userError;
  }

  if (!user) {
    profileCard.classList.add("hidden");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  userIdValue.textContent = user.id || "-";
  emailValue.textContent = user.email || "-";
  usernameValue.textContent = profile?.username || "(kein Profil gefunden)";
  coinsValue.textContent = profile?.coins ?? "(kein Profil gefunden)";

  profileCard.classList.remove("hidden");
}

showLoginBtn.addEventListener("click", showLogin);
showRegisterBtn.addEventListener("click", showRegister);

registerBtn.addEventListener("click", async () => {
  try {
    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;

    if (!username || !email || !password) {
      setMessage("Bitte Username, E-Mail und Passwort eingeben.", "error");
      return;
    }

    if (password.length < 6) {
      setMessage("Passwort muss mindestens 6 Zeichen haben.", "error");
      return;
    }

    setMessage("Registrierung läuft...", "info");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    console.log("SIGNUP RESULT:", data, error);

    if (error) {
      throw error;
    }

    if (data.user && !data.session) {
      setMessage("Registrierung erfolgreich. Bitte E-Mail bestätigen.", "success");
      showLogin();
      return;
    }

    setMessage("Registrierung erfolgreich und eingeloggt.", "success");
    await loadProfile();
  } catch (err) {
    console.error("REGISTER ERROR FULL:", err);
    setMessage(`Registrierung Fehler: ${err.message}`, "error");
  }
});

loginBtn.addEventListener("click", async () => {
  try {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      setMessage("Bitte E-Mail und Passwort eingeben.", "error");
      return;
    }

    setMessage("Login läuft...", "info");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log("LOGIN RESULT:", data, error);

    if (error) {
      throw error;
    }

    setMessage("Login erfolgreich.", "success");
    await loadProfile();
  } catch (err) {
    console.error("LOGIN ERROR FULL:", err);
    setMessage(`Login Fehler: ${err.message}`, "error");
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    profileCard.classList.add("hidden");
    setMessage("Erfolgreich ausgeloggt.", "success");
  } catch (err) {
    console.error("LOGOUT ERROR FULL:", err);
    setMessage(`Logout Fehler: ${err.message}`, "error");
  }
});

(async function init() {
  try {
    showLogin();

    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    console.log("INIT SESSION:", session, error);

    if (error) {
      throw error;
    }

    if (session) {
      setMessage("Session gefunden.", "success");
      await loadProfile();
    } else {
      setMessage("Keine Session. Bitte einloggen oder registrieren.", "info");
    }
  } catch (err) {
    console.error("INIT ERROR FULL:", err);
    setMessage(`Init Fehler: ${err.message}`, "error");
  }
})();
