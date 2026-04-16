// 🔥 SUPABASE (HIER EINTRAGEN)
const SUPABASE_URL = "https://livqhwbvdxafhrbltnxn.supabase.co";
const SUPABASE_KEY = "HIER_DEIN_ANON_KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// UI ELEMENTE
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");

const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");

const usernameValue = document.getElementById("usernameValue");
const coinsValue = document.getElementById("coinsValue");
const adminValue = document.getElementById("adminValue");


// 🔐 LOGIN
loginBtn.onclick = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value,
  });

  if (error) {
    alert(error.message);
  } else {
    loadProfile();
  }
};


// 📝 REGISTER
registerBtn.onclick = async () => {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const username = document.getElementById("registerUsername").value;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Registriert! Jetzt einloggen.");
};


// 🚪 LOGOUT
logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  location.reload();
};


// 👤 PROFIL LADEN
async function loadProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  // UI wechseln
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  // Daten anzeigen
  usernameValue.innerText = data.username;
  coinsValue.innerText = data.coins;
  adminValue.innerText = data.is_admin;

  // 👑 Admin Panel anzeigen
  if (data.is_admin) {
    document.getElementById("adminSection").classList.remove("hidden");
  }
}


// 🎁 ADMIN COINS GIFT
document.getElementById("giftBtn").onclick = async () => {
  const username = document.getElementById("giftUsername").value;
  const amount = parseInt(document.getElementById("giftAmount").value);
  const message = document.getElementById("giftMessage").value;

  const { error } = await supabase.rpc("admin_gift_coins", {
    target_username: username,
    gift_amount: amount,
    gift_message: message,
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Coins gesendet!");
  }
};


// 🔁 AUTO LOGIN CHECK (SEHR WICHTIG)
(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    loadProfile();
  }
})();
