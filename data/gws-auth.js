/**
 * GWS Study Desk — username/password profile sync via Supabase Edge API.
 */
(function () {
  const SYNC_KEYS = [
    "gws-study-checks-v1",
    "gws-study-game-v1",
    "gws-study-ui-v1",
    "gws-study-session-v1",
    "gws-study-style-v1",
    "gwsAdminSim.v1"
  ];
  const META_KEY = "gws-profile-sync-meta-v1";
  const TOKEN_KEY = "gws-auth-token-v1";

  const authCfg = window.GWS_AUTH || {};
  const apiBase = (authCfg.apiBase || "").replace(/\/+$/, "");
  const anonKey = authCfg.anonKey || "";
  const configured = !!apiBase && apiBase.indexOf("YOUR_") === -1;

  let session = null;
  let syncTimer = null;
  let syncing = false;
  let ready = false;
  const readyCbs = [];

  function emitReady() {
    ready = true;
    readyCbs.splice(0).forEach((fn) => {
      try { fn(); } catch (e) { /* ignore */ }
    });
  }

  function onReady(fn) {
    if (ready) fn();
    else readyCbs.push(fn);
  }

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* ignore */ }
  }

  function getMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function setMeta(patch) {
    const next = Object.assign(getMeta(), patch);
    try { localStorage.setItem(META_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
  }

  function clearLocalSyncKeys() {
    SYNC_KEYS.forEach((k) => {
      try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
    });
  }

  function buildPayloadFromLocal() {
    const keys = {};
    SYNC_KEYS.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw != null) keys[k] = raw;
    });
    return { keys };
  }

  function localMatchesPayload(payload) {
    const keys = (payload && payload.keys) || {};
    for (let i = 0; i < SYNC_KEYS.length; i += 1) {
      const k = SYNC_KEYS[i];
      const want = typeof keys[k] === "string" ? keys[k] : null;
      let cur = null;
      try { cur = localStorage.getItem(k); } catch (e) { /* ignore */ }
      if (cur !== want) return false;
    }
    return true;
  }

  function applyPayloadToLocal(payload, replaceAll) {
    if (!payload || !payload.keys || typeof payload.keys !== "object") return false;
    if (localMatchesPayload(payload)) return false;

    if (replaceAll) {
      SYNC_KEYS.forEach((k) => {
        try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
      });
    }
    Object.keys(payload.keys).forEach((k) => {
      if (SYNC_KEYS.indexOf(k) === -1) return;
      const val = payload.keys[k];
      if (typeof val === "string") {
        try { localStorage.setItem(k, val); } catch (e) { /* ignore */ }
      }
    });
    return true;
  }

  async function api(path, options) {
    const headers = Object.assign({ "Content-Type": "application/json" }, options && options.headers);
    const token = getToken();
    if (anonKey) headers.apikey = anonKey;
    if (token) headers.Authorization = "Bearer " + token;
    else if (anonKey) headers.Authorization = "Bearer " + anonKey;
    const res = await fetch(apiBase + path, Object.assign({}, options, { headers }));
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      const msg = (data && data.error) || res.statusText || "Request failed";
      throw new Error(msg);
    }
    return data;
  }

  function scheduleSync() {
    if (!session) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(pushProgress, 1800);
  }

  async function pushProgress() {
    if (!session || syncing) return;
    syncing = true;
    paintAccount();
    const payload = buildPayloadFromLocal();
    try {
      await api("/progress", { method: "PUT", body: JSON.stringify({ payload }) });
      setMeta({ lastPush: Date.now(), lastError: null });
      toast("Progress saved to your profile.");
    } catch (e) {
      setMeta({ lastError: String(e.message || e) });
      toast("Could not sync — still saved on this device.");
    } finally {
      syncing = false;
      paintAccount();
    }
  }

  async function pullProgress(userId) {
    const data = await api("/progress", { method: "GET" });
    return { payload: data.payload, updated_at: data.updated_at };
  }

  async function handleSignedIn(user, token, opts) {
    opts = opts || {};
    const prevUserId = getMeta().userId || null;
    const userChanged = prevUserId && prevUserId !== user.id;
    let clearedLocal = false;

    if (opts.isNewAccount || userChanged) {
      clearLocalSyncKeys();
      clearedLocal = true;
    } else if (opts.freshLogin) {
      clearLocalSyncKeys();
      clearedLocal = true;
    }

    if (token) setToken(token);
    session = { user: { id: user.id, username: user.username } };
    setMeta({ userId: user.id });
    paintAccount();
    document.body.classList.remove("auth-gate");
    if (modal) modal.classList.remove("auth-required");

    let pulledChanged = false;
    try {
      const row = await pullProgress(user.id);
      const remoteHas = row && row.payload && row.payload.keys && Object.keys(row.payload.keys).length;
      if (remoteHas) {
        pulledChanged = applyPayloadToLocal(row.payload, true);
        setMeta({ lastPull: Date.now(), remoteAt: row.updated_at });
        if (pulledChanged) toast("Loaded progress from your profile.");
      } else if (opts.isNewAccount) {
        toast("Welcome — pick your learning style to begin.");
      }
    } catch (e) {
      toast("Signed in — sync failed; using device storage.");
    }

    if (opts.reloadAfter) {
      window.location.reload();
      return;
    }
    if (clearedLocal || pulledChanged) {
      window.dispatchEvent(new CustomEvent("gws-profile-loaded", { detail: { changed: pulledChanged } }));
    } else {
      window.dispatchEvent(new CustomEvent("gws-auth-signed-in"));
    }
    scheduleSync();
  }

  function handleSignedOut() {
    session = null;
    setToken(null);
    clearTimeout(syncTimer);
    clearLocalSyncKeys();
    setMeta({ userId: null, lastPull: null, lastPush: null, remoteAt: null });
    paintAccount();
  }

  function toast(msg) {
    const el = document.getElementById("studyToast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2600);
  }

  window.gwsStorage = {
    configured: configured,
    isLoggedIn: () => !!(session && session.user),
    onReady,
    scheduleSync,
    getItem(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem(key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
      if (SYNC_KEYS.indexOf(key) !== -1) scheduleSync();
    },
    removeItem(key) {
      try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
      if (SYNC_KEYS.indexOf(key) !== -1) scheduleSync();
    },
    getJSON(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback();
        const data = JSON.parse(raw);
        return data && typeof data === "object" ? data : fallback();
      } catch (e) {
        try { localStorage.removeItem(key); } catch (e2) {}
        return fallback();
      }
    },
    setJSON(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        if (SYNC_KEYS.indexOf(key) !== -1) scheduleSync();
      } catch (e) { /* ignore */ }
    },
    openAuthModal(mode) {
      openModal(mode || "signin");
    },
    signOut() {
      handleSignedOut();
      if (configured) window.location.reload();
    },
    uploadDeviceToCloud() {
      return pushProgress();
    }
  };

  const modal = document.getElementById("authModal");
  const formSignIn = document.getElementById("authFormSignIn");
  const formSignUp = document.getElementById("authFormSignUp");
  const authErr = document.getElementById("authError");
  const accountBar = document.getElementById("accountBar");
  const accountMobile = document.getElementById("accountMobile");

  function setAuthError(msg) {
    if (!authErr) return;
    authErr.textContent = msg || "";
    authErr.classList.toggle("hidden", !msg);
  }

  function openModal(tab, opts) {
    opts = opts || {};
    if (!configured) {
      toast("Cloud profiles are not configured on this copy.");
      return;
    }
    if (!modal) return;
    modal._required = !!opts.required;
    modal.classList.toggle("auth-required", !!opts.required);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    switchTab(tab || "signin");
    setAuthError("");
    const closeBtn = document.getElementById("authModalClose");
    if (closeBtn) closeBtn.hidden = !!opts.required;
  }

  function closeModal() {
    if (!modal) return;
    if (modal._required) return;
    modal.classList.remove("open", "auth-required");
    modal.setAttribute("aria-hidden", "true");
    modal._required = false;
    setAuthError("");
    const closeBtn = document.getElementById("authModalClose");
    if (closeBtn) closeBtn.hidden = false;
  }

  function switchTab(tab) {
    document.querySelectorAll("[data-auth-tab]").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-auth-tab") === tab);
    });
    if (formSignIn) formSignIn.classList.toggle("hidden", tab !== "signin");
    if (formSignUp) formSignUp.classList.toggle("hidden", tab !== "signup");
  }

  function paintAccount() {
    const logged = session && session.user;
    const name = logged ? (session.user.username || "Account") : "";
    const short = name.length > 22 ? name.slice(0, 20) + "…" : name;
    const syncLabel = syncing ? "Syncing…" : (logged ? "Cloud save on" : "");

    function fill(el) {
      if (!el) return;
      while (el.firstChild) el.removeChild(el.firstChild);
      if (!configured) {
        const p = document.createElement("p");
        p.className = "account-hint";
        p.textContent = "Progress saves on this device. Cloud login is enabled on the live site.";
        el.appendChild(p);
        return;
      }
      if (logged) {
        const head = document.createElement("div");
        head.className = "account-head";
        const av = document.createElement("div");
        av.className = "account-avatar";
        av.setAttribute("aria-hidden", "true");
        av.textContent = (name.charAt(0) || "?").toUpperCase();
        const meta = document.createElement("div");
        meta.className = "account-meta";
        const who = document.createElement("div");
        who.className = "account-email";
        who.textContent = short;
        meta.appendChild(who);
        if (syncLabel) {
          const st = document.createElement("span");
          st.className = "account-sync";
          st.textContent = syncLabel;
          meta.appendChild(st);
        }
        head.appendChild(av);
        head.appendChild(meta);
        el.appendChild(head);
        const actions = document.createElement("div");
        actions.className = "account-actions";
        const up = document.createElement("button");
        up.type = "button";
        up.className = "game-btn";
        up.textContent = "Sync now";
        up.addEventListener("click", () => pushProgress());
        const out = document.createElement("button");
        out.type = "button";
        out.className = "game-btn ghost";
        out.textContent = "Sign out";
        out.addEventListener("click", () => window.gwsStorage.signOut());
        actions.appendChild(up);
        actions.appendChild(out);
        el.appendChild(actions);
      } else {
        const actions = document.createElement("div");
        actions.className = "account-actions";
        const inBtn = document.createElement("button");
        inBtn.type = "button";
        inBtn.className = "game-btn primary";
        inBtn.textContent = "Log in";
        inBtn.addEventListener("click", () => openModal("signin"));
        const upBtn = document.createElement("button");
        upBtn.type = "button";
        upBtn.className = "game-btn";
        upBtn.textContent = "Sign up";
        upBtn.addEventListener("click", () => openModal("signup"));
        actions.appendChild(inBtn);
        actions.appendChild(upBtn);
        el.appendChild(actions);
      }
    }
    fill(accountBar);
    fill(accountMobile);
  }

  document.querySelectorAll("[data-auth-tab]").forEach((b) => {
    b.addEventListener("click", () => switchTab(b.getAttribute("data-auth-tab")));
  });
  document.getElementById("authModalClose")?.addEventListener("click", closeModal);
  document.getElementById("authModalBackdrop")?.addEventListener("click", closeModal);
  document.getElementById("btnAuthMobile")?.addEventListener("click", () => openModal("signin"));

  formSignIn?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!configured) return;
    setAuthError("");
    const username = formSignIn.querySelector('[name="username"]').value.trim();
    const password = formSignIn.querySelector('[name="password"]').value;
    try {
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      closeModal();
      await handleSignedIn(data.user, data.token, { freshLogin: true, reloadAfter: true });
    } catch (err) {
      setAuthError(err.message || "Could not log in.");
    }
  });

  formSignUp?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!configured) return;
    setAuthError("");
    const username = formSignUp.querySelector('[name="username"]').value.trim();
    const password = formSignUp.querySelector('[name="password"]').value;
    try {
      const data = await api("/register", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      closeModal();
      await handleSignedIn(data.user, data.token, { isNewAccount: true, reloadAfter: true });
    } catch (err) {
      setAuthError(err.message || "Could not sign up.");
    }
  });

  function showLoginGate() {
    document.body.classList.add("auth-gate");
    const lede = document.getElementById("authLede");
    if (lede) {
      lede.textContent = "Log in or create an account first. Your progress and learning style save to your profile.";
    }
    openModal("signin", { required: true });
  }

  async function initAuth() {
    paintAccount();
    if (!configured) {
      emitReady();
      return;
    }
    const token = getToken();
    if (token) {
      try {
        const data = await api("/session", { method: "GET" });
        await handleSignedIn(data.user, null);
      } catch (e) {
        setToken(null);
        showLoginGate();
      }
    } else {
      showLoginGate();
    }
    emitReady();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuth);
  } else {
    initAuth();
  }
})();
