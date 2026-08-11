/* Practice-tenant Admin settings (Associate). Loaded before the console IIFE. */
(function (global) {
  function defaults() {
    return {
      company: { name: "Northwind Retail", supportEmail: "it@exam-demo.example" },
      licenses: {
        assignment: "manual",
        businessPlus: 180,
        enterprise: 0,
        frontline: 0,
        cloudIdentity: 0,
        seatsAdded: false
      },
      storage: { quotaSet: false, quotaGb: 0 },
      dataRegion: { enabled: false, region: "us" },
      export: { takeoutUserId: null, dataExportRequested: false },
      roles: [
        { id: "role_super", name: "Super Admin", users: ["u_fin"], privileges: "All", ouScope: null },
        { id: "role_help", name: "Help Desk Admin", users: [], privileges: "Password reset only", ouScope: null },
        { id: "role_user", name: "User Management Admin", users: [], privileges: "Create / suspend / reset non-admins", ouScope: null }
      ],
      sso: { enabled: false, idp: "Okta", breakGlass: true, scim: false },
      password: { minLength: 8, preventReuse: true, strength: "strong" },
      twoSv: { allow: true, enforce: false, enforceDate: "", graceDays: 0, allowSms: true, requireKeyAdmins: false },
      caa: { enabled: false, requireManaged: true, requireCorpNet: true, app: "drive" },
      session: { webHours: 336, financeHours: null },
      marketplace: {
        allowlistOnly: false,
        apps: [
          { id: "app_pdf", name: "PDF Magic", status: "allowed", connected: true },
          { id: "app_ok", name: "Okta SSO", status: "allowed", connected: true }
        ]
      },
      buildings: [{ id: "b_hq", name: "HQ", city: "Kuala Lumpur" }],
      resources: [{ id: "rm_board", buildingId: "b_hq", name: "Boardroom", type: "Meeting room", capacity: 12 }],
      csvImported: false,
      calendar: { internal: "free_busy", external: "free_busy", eventsTransferred: false },
      meet: { domainOnly: false, knocking: true, hostMustJoin: false, qualityRan: false },
      chat: { historyDefault: true },
      gemini: { enabledOu: {}, pilotGroupId: null, extensions: false, noCodeTool: null },
      sharedDrives: [],
      targetAudiences: { enabled: false, name: "All of Company" },
      trustRules: [{ id: "tr_legal", name: "Legal ↔ outside-counsel.com", enabled: false }],
      labels: [
        { id: "lb_pub", name: "Public" },
        { id: "lb_int", name: "Internal" },
        { id: "lb_conf", name: "Confidential" }
      ],
      gmail: {
        dualDelivery: false,
        splitDelivery: false,
        gateway: false,
        sandbox: false,
        popImap: true,
        forwarding: true,
        complianceBcc: false,
        maxMb: 25,
        delegation: {},
        dmsRan: false
      },
      directorySync: { source: "ad" },
      chrome: {
        enrolled: false,
        token: "CBCM-NW-7F3A",
        policies: {
          ou_root: { forceInstall: [], blockAll: false, safeBrowsing: true },
          ou_sales: { forceInstall: [], blockAll: false, safeBrowsing: true },
          ou_eng: { forceInstall: [], blockAll: false, safeBrowsing: true },
          ou_ctr: { forceInstall: [], blockAll: false, safeBrowsing: true }
        }
      },
      mdm: { level: "basic" },
      alerts: {
        rules: [{ id: "ar_2sv", name: "Notify when 2-step verification is turned off", enabled: false }],
        items: []
      },
      security: { dashboardViewed: false, health: 68 },
      investigation: { lastQuery: null, lastAction: null },
      status: { checked: false, gmail: "ok", drive: "ok", meet: "ok" },
      els: { lastSearch: null },
      toolbox: { headerRan: false },
      reporting: { clocksViewed: false },
      strategy: { picks: {} }
    };
  }

  function ensure(state) {
    if (!state.admin) state.admin = defaults();
    const d = defaults();
    Object.keys(d).forEach(function (k) {
      if (state.admin[k] == null) state.admin[k] = d[k];
    });
    if (!state.admin.chrome.policies) state.admin.chrome.policies = d.chrome.policies;
    (state.groups || []).forEach(function (g) {
      if (!g.kind) g.kind = g.security ? "security" : "distribution";
    });
    (state.users || []).forEach(function (u) {
      (u.devices || []).forEach(function (dev) {
        if (dev.wiped == null) dev.wiped = null;
      });
    });
    return state.admin;
  }

  function attach(ctx) {
    const el = ctx.el;
    const go = ctx.go;
    const audit = ctx.audit;
    const saveState = ctx.saveState;
    const render = ctx.render;
    const toast = ctx.toast;
    const pageHead = ctx.pageHead;
    const tipBox = ctx.tipBox;
    const userById = ctx.userById;
    const ouById = ctx.ouById;

    function S() { return ctx.getState(); }
    function A() { return ensure(S()); }
    function enterprise() { return S().tenant.edition === "enterprise"; }
    function persist(action, target) {
      if (action) audit(action, target || "");
      saveState();
      render();
    }

    function switchEl(on) {
      return el("span", { className: "g-switch" + (on ? " on" : ""), role: "switch", "aria-checked": on ? "true" : "false" });
    }

    function toggleRow(title, desc, on, setOn, extra) {
      const row = el("button", {
        type: "button",
        className: "settings-row",
        onclick: function () {
          setOn(!on);
          persist("Setting changed: " + title, on ? "OFF" : "ON");
        }
      });
      const col = el("div");
      col.appendChild(el("h3", { text: title }));
      if (desc) col.appendChild(el("p", { text: desc }));
      if (extra) col.appendChild(extra);
      row.appendChild(col);
      row.appendChild(switchEl(on));
      return row;
    }

    function selectRow(title, desc, value, options, setVal) {
      const row = el("div", { className: "settings-row" });
      const col = el("div");
      col.appendChild(el("h3", { text: title }));
      if (desc) col.appendChild(el("p", { text: desc }));
      const sel = el("select");
      options.forEach(function (o) {
        const opt = el("option", { value: o.v, text: o.t });
        if (String(o.v) === String(value)) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function () {
        setVal(sel.value);
        persist("Setting changed: " + title, sel.value);
      });
      sel.addEventListener("click", function (e) { e.stopPropagation(); });
      col.appendChild(sel);
      row.appendChild(col);
      return row;
    }

    function editionGate(feature) {
      const box = el("div", { className: "warn" });
      box.appendChild(el("strong", { text: "Edition gate · " }));
      box.appendChild(document.createTextNode(feature + " typically needs Enterprise. Switch Edition in the avatar menu, then come back."));
      box.appendChild(el("button", {
        type: "button", className: "btn primary", text: "Switch to Enterprise",
        style: "margin-left:.5rem",
        onclick: function () {
          S().tenant.edition = "enterprise";
          S().ui.walkthrough._editionTouched = true;
          persist("Edition changed", "enterprise");
          toast("Enterprise selected.");
        }
      }));
      return box;
    }

    function panelAccount() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Account settings"));
      wrap.appendChild(el("p", { className: "lede", text: "Company profile, data regions, and exports — same drawers as Admin console > Account." }));
      const list = el("div", { className: "settings-list" });
      const nameIn = el("input", { type: "text", value: a.company.name });
      nameIn.addEventListener("change", function () {
        a.company.name = nameIn.value.trim() || a.company.name;
        persist("Company profile updated", a.company.name);
      });
      const nameRow = el("div", { className: "settings-row" });
      const nc = el("div");
      nc.appendChild(el("h3", { text: "Company profile" }));
      nc.appendChild(el("p", { text: "Display name for this practice tenant." }));
      nc.appendChild(nameIn);
      nameRow.appendChild(nc);
      list.appendChild(nameRow);
      list.appendChild(selectRow(
        "Data regions (at rest)",
        "Store covered data in a region by OU. Not a backup and not an export. Typically Enterprise.",
        a.dataRegion.enabled ? a.dataRegion.region : "off",
        [
          { v: "off", t: "No region policy" },
          { v: "us", t: "United States" },
          { v: "europe", t: "Europe" }
        ],
        function (v) {
          if (v !== "off" && !enterprise()) { toast("Data regions need Enterprise."); return; }
          a.dataRegion.enabled = v !== "off";
          if (v !== "off") a.dataRegion.region = v;
        }
      ));
      wrap.appendChild(list);
      if (!enterprise() && a.dataRegion.enabled) wrap.appendChild(editionGate("Data regions"));
      const exp = el("div", { className: "card" });
      exp.appendChild(el("h2", { text: "Export tools" }));
      exp.appendChild(el("p", { className: "muted", text: "Takeout = one user. Data Export = whole org (Super Admin, waiting period). Vault export = one matter." }));
      const takeSel = el("select");
      S().users.filter(function (u) { return u.status !== "deleted"; }).forEach(function (u) {
        const o = el("option", { value: u.id, text: u.name + " — Takeout (own data)" });
        if (a.export.takeoutUserId === u.id) o.selected = true;
        takeSel.appendChild(o);
      });
      exp.appendChild(el("div", { className: "row" }, [
        takeSel,
        el("button", {
          type: "button", className: "btn", text: "Start Takeout for this user",
          onclick: function () {
            a.export.takeoutUserId = takeSel.value;
            persist("Takeout started", userById(takeSel.value).email);
            toast("User Takeout started (simulated).");
          }
        })
      ]));
      exp.appendChild(el("button", {
        type: "button", className: "btn primary", text: a.export.dataExportRequested ? "Data Export requested ✓" : "Request Data Export (entire org)",
        onclick: function () {
          a.export.dataExportRequested = true;
          persist("Data Export requested", "entire org");
          toast("Data Export queued — waiting period applies in a real tenant.");
        }
      }));
      wrap.appendChild(exp);
      wrap.appendChild(el("div", { className: "row" }, [
        el("button", { type: "button", className: "btn", text: "Admin roles", onclick: function () { go("roles"); } }),
        el("button", { type: "button", className: "btn", text: "Subscriptions", onclick: function () { go("billing"); } })
      ]));
      wrap.appendChild(tipBox("Cross-check editions / regions / export names on Study Desk after you click these.", "./index.html#m3-export"));
      return wrap;
    }

    function panelRoles() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Admin roles"));
      wrap.appendChild(el("p", { className: "lede", text: "Least privilege: Help Desk for resets, User Management for life-cycle, Super Admin rare. Scope a custom role to an OU for a region." }));
      a.roles.forEach(function (role) {
        const card = el("div", { className: "card" });
        card.appendChild(el("h2", { text: role.name }));
        card.appendChild(el("p", { className: "muted", text: role.privileges + (role.ouScope ? " · scoped to " + (ouById(role.ouScope) || {}).name : " · org-wide") }));
        const assigned = (role.users || []).map(function (id) { return (userById(id) || {}).name || id; }).join(", ") || "— none —";
        card.appendChild(el("p", { text: "Assigned: " + assigned }));
        const sel = el("select");
        sel.appendChild(el("option", { value: "", text: "Assign a user…" }));
        S().users.filter(function (u) { return u.status !== "deleted"; }).forEach(function (u) {
          sel.appendChild(el("option", { value: u.id, text: u.name }));
        });
        sel.addEventListener("change", function () {
          if (!sel.value) return;
          if (role.users.indexOf(sel.value) < 0) role.users.push(sel.value);
          persist("Admin role assigned", role.name + " → " + userById(sel.value).email);
        });
        card.appendChild(sel);
        if (role.id === "role_help") {
          const ou = el("select");
          ou.appendChild(el("option", { value: "", text: "Org-wide" }));
          S().ous.forEach(function (o) {
            const opt = el("option", { value: o.id, text: "Scope to " + o.name });
            if (role.ouScope === o.id) opt.selected = true;
            ou.appendChild(opt);
          });
          ou.addEventListener("change", function () {
            role.ouScope = ou.value || null;
            persist("Role scoped", role.name + " → " + (ou.value || "org"));
          });
          card.appendChild(el("div", { className: "field" }, [el("label", { text: "OU scope (regional admin)" }), ou]));
        }
        wrap.appendChild(card);
      });
      wrap.appendChild(tipBox("Never gift Super Admin for password resets.", "./index.html#m4-roles"));
      return wrap;
    }

    function panelBilling() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Subscriptions"));
      wrap.appendChild(el("p", { className: "lede", text: "Licenses are automatic or manual. Missing Drive is often a missing license — not a Drive policy. Frontline ≠ Cloud Identity." }));
      wrap.appendChild(selectRow(
        "License assignment",
        "Automatic = every new user gets a seat. Manual = you assign.",
        a.licenses.assignment,
        [{ v: "automatic", t: "Automatic" }, { v: "manual", t: "Manual" }],
        function (v) { a.licenses.assignment = v; }
      ));
      const table = el("table", { className: "user-table" });
      const hr = el("tr");
      ["SKU", "Seats", "Use when"].forEach(function (h) { hr.appendChild(el("th", { text: h })); });
      table.appendChild(el("thead", null, [hr]));
      [
        ["Business Plus", "businessPlus", "Full Workspace mid-tier"],
        ["Enterprise", "enterprise", "DLP / CAA / Investigation / regions"],
        ["Frontline", "frontline", "Shift / deskless — light Workspace"],
        ["Cloud Identity", "cloudIdentity", "Users + SSO + 2SV — no Gmail/Drive seat"]
      ].forEach(function (row) {
        const tr = el("tr");
        tr.appendChild(el("td", { text: row[0] }));
        const td = el("td");
        const inp = el("input", { type: "number", min: "0", value: String(a.licenses[row[1]]) });
        inp.style.width = "88px";
        inp.addEventListener("change", function () {
          a.licenses[row[1]] = Math.max(0, parseInt(inp.value, 10) || 0);
          if (row[1] === "frontline" || row[1] === "cloudIdentity" || row[1] === "businessPlus") a.licenses.seatsAdded = true;
          persist("Licenses updated", row[0] + " = " + a.licenses[row[1]]);
        });
        td.appendChild(inp);
        tr.appendChild(td);
        tr.appendChild(el("td", { text: row[2] }));
        table.appendChild(tr);
      });
      wrap.appendChild(el("div", { className: "card" }, [table]));
      wrap.appendChild(el("p", { className: "muted", text: "Low pooled storage → add licenses, set quotas, or free space. Do not “upgrade one mailbox.”" }));
      wrap.appendChild(el("button", {
        type: "button", className: "btn", text: "Add 10 Business Plus seats (pool)",
        onclick: function () {
          a.licenses.businessPlus += 10;
          a.licenses.seatsAdded = true;
          persist("Licenses added", "+10 Business Plus");
        }
      }));
      return wrap;
    }

    function panelPassword() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Password management"));
      wrap.appendChild(el("p", { className: "lede", text: "Security > Authentication > Password management. Reset a single person from their user account page." }));
      const list = el("div", { className: "settings-list" });
      list.appendChild(selectRow("Minimum length", "Org-wide password length.", String(a.password.minLength),
        [8, 10, 12, 16].map(function (n) { return { v: String(n), t: n + " characters" }; }),
        function (v) { a.password.minLength = parseInt(v, 10); }));
      list.appendChild(toggleRow("Prevent password reuse", "Block recently used passwords.", a.password.preventReuse, function (v) { a.password.preventReuse = v; }));
      list.appendChild(selectRow("Strength", "Require stronger passwords for the org.", a.password.strength,
        [{ v: "standard", t: "Standard" }, { v: "strong", t: "Strong" }],
        function (v) { a.password.strength = v; }));
      wrap.appendChild(list);
      wrap.appendChild(el("button", { type: "button", className: "btn", text: "Open a user to reset their password", onclick: function () { go("users"); } }));
      wrap.appendChild(tipBox("Help Desk Admin resets passwords — not Super Admin.", "./index.html#m4-2sv"));
      return wrap;
    }

    function panelAccess() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Access and data control"));
      wrap.appendChild(el("p", { className: "lede", text: "2-Step Verification proves who you are. Context-Aware Access decides if the situation (device, network, country) is allowed." }));

      wrap.appendChild(el("h2", { text: "2-Step Verification", style: "font-size:1.1rem;font-weight:500" }));
      const two = el("div", { className: "settings-list" });
      two.appendChild(toggleRow("Allow users to turn on 2SV", "Step 1 of rollout — allow before you enforce.", a.twoSv.allow, function (v) { a.twoSv.allow = v; }));
      two.appendChild(toggleRow("Enforce 2SV", "Users must enroll. Always set a date + grace period first.", a.twoSv.enforce, function (v) { a.twoSv.enforce = v; }));
      const dateRow = el("div", { className: "settings-row" });
      const dc = el("div");
      dc.appendChild(el("h3", { text: "Enforcement date + grace period" }));
      dc.appendChild(el("p", { text: "Zero window + enforce = lockout. Exam: allow → date → grace." }));
      const date = el("input", { type: "date", value: a.twoSv.enforceDate || "" });
      date.addEventListener("change", function () { a.twoSv.enforceDate = date.value; persist("2SV enforce date", date.value); });
      const grace = el("select");
      [0, 7, 14, 28].forEach(function (d) {
        const o = el("option", { value: String(d), text: d === 0 ? "0 days (lockout risk)" : d + " day grace" });
        if (a.twoSv.graceDays === d) o.selected = true;
        grace.appendChild(o);
      });
      grace.addEventListener("change", function () { a.twoSv.graceDays = parseInt(grace.value, 10); persist("2SV grace", grace.value); });
      dc.appendChild(el("div", { className: "row" }, [date, grace]));
      dateRow.appendChild(dc);
      two.appendChild(dateRow);
      two.appendChild(toggleRow("Allow SMS as a second factor", "Weakest method (SIM-swap). Prefer keys / passkeys for admins.", a.twoSv.allowSms, function (v) { a.twoSv.allowSms = v; }));
      two.appendChild(toggleRow("Require security key / passkey for Super Admins", "Strongest 2SV for privileged accounts.", a.twoSv.requireKeyAdmins, function (v) { a.twoSv.requireKeyAdmins = v; }));
      wrap.appendChild(two);

      wrap.appendChild(el("h2", { text: "Context-Aware Access", style: "font-size:1.1rem;font-weight:500;margin-top:1.2rem" }));
      if (!enterprise()) wrap.appendChild(editionGate("Context-Aware Access"));
      const caa = el("div", { className: "settings-list" });
      caa.appendChild(toggleRow("Turn on Context-Aware Access", "Enterprise. Words like managed device / corp Wi-Fi / country → CAA, not 2SV alone.", a.caa.enabled && enterprise(), function (v) {
        if (v && !enterprise()) { toast("CAA needs Enterprise."); return; }
        a.caa.enabled = v;
      }));
      caa.appendChild(toggleRow("Require company-owned / encrypted device", "Access Access levels check device posture.", a.caa.requireManaged, function (v) { a.caa.requireManaged = v; }));
      caa.appendChild(toggleRow("Require corporate network", "Corp Wi-Fi / IP range.", a.caa.requireCorpNet, function (v) { a.caa.requireCorpNet = v; }));
      caa.appendChild(selectRow("Apply to app", "Finance Drive only from managed laptops on corp Wi-Fi → Drive + both checks.", a.caa.app,
        [{ v: "drive", t: "Drive and Docs" }, { v: "gmail", t: "Gmail" }, { v: "all", t: "All services" }],
        function (v) { a.caa.app = v; }));
      wrap.appendChild(caa);

      wrap.appendChild(el("h2", { text: "Session control", style: "font-size:1.1rem;font-weight:500;margin-top:1.2rem" }));
      const sess = el("div", { className: "settings-list" });
      sess.appendChild(selectRow("Web session length (org)", "How long a browser session lasts.", String(a.session.webHours),
        [{ v: "336", t: "14 days (default)" }, { v: "24", t: "1 day" }, { v: "8", t: "8 hours" }],
        function (v) { a.session.webHours = parseInt(v, 10); }));
      sess.appendChild(selectRow("Finance / sensitive group sessions", "Shorter sessions complement 2SV + CAA.", a.session.financeHours == null ? "inherit" : String(a.session.financeHours),
        [{ v: "inherit", t: "Inherit org default" }, { v: "8", t: "8 hours" }, { v: "4", t: "4 hours" }],
        function (v) { a.session.financeHours = v === "inherit" ? null : parseInt(v, 10); }));
      wrap.appendChild(sess);
      wrap.appendChild(tipBox("2SV = who. CAA = whether this device/network is allowed.", "./index.html#m4-caa"));
      return wrap;
    }

    function panelSso() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("SSO with third-party IdP"));
      wrap.appendChild(el("p", { className: "lede", text: "Security > Authentication > SSO. IdP (Okta/Entra) is the bouncer. Workspace is the service provider. SCIM provisions; SAML signs in." }));
      const list = el("div", { className: "settings-list" });
      list.appendChild(toggleRow("Set up SSO with a third-party identity provider", "SAML. Google trusts the IdP stamp.", a.sso.enabled, function (v) { a.sso.enabled = v; }));
      list.appendChild(selectRow("Identity provider", "Cloud IdP identities also use Directory Sync — not GCDS.", a.sso.idp,
        [{ v: "Okta", t: "Okta" }, { v: "Entra", t: "Microsoft Entra ID" }, { v: "Other", t: "Other SAML IdP" }],
        function (v) { a.sso.idp = v; }));
      list.appendChild(toggleRow("Keep Super Admin break-glass (bypass SSO)", "Never leave every Super Admin behind SSO. IdP outage = lockout.", a.sso.breakGlass, function (v) { a.sso.breakGlass = v; }));
      list.appendChild(toggleRow("SCIM provisioning", "Create / update / disable accounts from the IdP. Not the same as SAML.", a.sso.scim, function (v) { a.sso.scim = v; }));
      wrap.appendChild(list);
      wrap.appendChild(el("button", { type: "button", className: "btn", text: "Check licenses if an app is missing", onclick: function () { go("billing"); } }));
      wrap.appendChild(tipBox("Missing Drive → check license first.", "./index.html#m1-sso"));
      return wrap;
    }

    function panelMarketplace() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("API controls & Marketplace"));
      wrap.appendChild(el("p", { className: "lede", text: "Already-connected shady app → block / Limited + revoke token. Stop future junk → Marketplace allowlist." }));
      wrap.appendChild(el("div", { className: "settings-list" }, [
        toggleRow("Allow only allowlisted Marketplace apps", "New “PDF magic” add-ons cannot install.", a.marketplace.allowlistOnly, function (v) { a.marketplace.allowlistOnly = v; })
      ]));
      const table = el("table", { className: "user-table" });
      const hr = el("tr");
      ["App", "Connected", "Access", "Action"].forEach(function (h) { hr.appendChild(el("th", { text: h })); });
      table.appendChild(el("thead", null, [hr]));
      a.marketplace.apps.forEach(function (app) {
        const tr = el("tr");
        tr.appendChild(el("td", { text: app.name }));
        tr.appendChild(el("td", { text: app.connected ? "Yes — has OAuth token" : "No" }));
        tr.appendChild(el("td", { text: app.status }));
        const act = el("td");
        act.appendChild(el("button", {
          type: "button", className: "btn danger", text: "Block + revoke",
          onclick: function () {
            app.status = "blocked";
            app.connected = false;
            persist("OAuth app blocked", app.name);
            toast(app.name + " blocked and token revoked.");
          }
        }));
        tr.appendChild(act);
        table.appendChild(tr);
      });
      wrap.appendChild(el("div", { className: "card" }, [table]));
      return wrap;
    }

    function panelBuildings() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      const csv = el("button", {
        type: "button", className: "btn primary", text: "Bulk upload CSV (200 rooms)",
        onclick: function () {
          const sites = ["HQ", "Penang", "JB"];
          let n = 0;
          sites.forEach(function (city, i) {
            const bid = "b_csv_" + i;
            if (!a.buildings.some(function (b) { return b.id === bid; })) {
              a.buildings.push({ id: bid, name: city + " Campus", city: city });
            }
            for (let r = 1; r <= 4; r++) {
              a.resources.push({ id: uid("rm"), buildingId: bid, name: city + " Room " + r, type: "Meeting room", capacity: 6 + r });
              n++;
            }
          });
          a.csvImported = true;
          persist("Buildings CSV imported", n + " rooms");
          toast("CSV imported — rooms are now bookable calendars.");
        }
      });
      wrap.appendChild(pageHead("Buildings and resources", csv));
      wrap.appendChild(el("p", { className: "lede", text: "Rooms become resource calendars. 200 rooms across 10 sites → CSV bulk, not one-by-one user accounts." }));
      a.buildings.forEach(function (b) {
        const card = el("div", { className: "card" });
        card.appendChild(el("h2", { text: b.name + " · " + b.city }));
        const rooms = a.resources.filter(function (r) { return r.buildingId === b.id; });
        const table = el("table", { className: "user-table" });
        rooms.forEach(function (r) {
          const tr = el("tr");
          tr.appendChild(el("td", { text: r.name }));
          tr.appendChild(el("td", { text: r.type }));
          tr.appendChild(el("td", { text: r.capacity + " seats" }));
          table.appendChild(tr);
        });
        card.appendChild(table);
        wrap.appendChild(card);
      });
      if (a.csvImported) wrap.appendChild(el("div", { className: "ok-box", text: "Bulk CSV imported. These resources appear on Calendar." }));
      wrap.appendChild(el("button", { type: "button", className: "btn", text: "Open Calendar sharing", onclick: function () { go("calendar"); } }));
      return wrap;
    }

    function panelCalendar() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Calendar"));
      wrap.appendChild(el("p", { className: "lede", text: "Apps > Google Workspace > Calendar. Internal/external sharing defaults. Transfer events when the organizer leaves. Rooms come from Buildings & resources." }));
      const list = el("div", { className: "settings-list" });
      list.appendChild(selectRow("Internal sharing options", "What people in the org see on each other’s calendars.", a.calendar.internal,
        [{ v: "free_busy", t: "Free/busy only" }, { v: "all", t: "See all event details" }],
        function (v) { a.calendar.internal = v; }));
      list.appendChild(selectRow("External sharing options", "What people outside the org can see.", a.calendar.external,
        [{ v: "free_busy", t: "Free/busy only" }, { v: "none", t: "No sharing" }],
        function (v) { a.calendar.external = v; }));
      wrap.appendChild(list);
      wrap.appendChild(el("button", {
        type: "button", className: "btn primary",
        text: a.calendar.eventsTransferred ? "Event ownership transferred ✓" : "Transfer Dan’s events to his manager",
        onclick: function () {
          a.calendar.eventsTransferred = true;
          persist("Calendar events transferred", "Dan → manager");
        }
      }));
      wrap.appendChild(el("button", { type: "button", className: "btn", text: "Manage buildings & rooms", onclick: function () { go("buildings"); } }));
      return wrap;
    }

    function panelMeet() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Google Meet"));
      wrap.appendChild(el("p", { className: "lede", text: "Unwanted guests → Meet safety. Bad audio/video → Meet quality tool (not a safety lock)." }));
      wrap.appendChild(el("h2", { text: "Meet safety", style: "font-size:1.1rem;font-weight:500" }));
      const list = el("div", { className: "settings-list" });
      list.appendChild(toggleRow("Only people in the organization can join", "Org-only meetings — stops random guests.", a.meet.domainOnly, function (v) { a.meet.domainOnly = v; }));
      list.appendChild(toggleRow("Knocking / host must admit guests", "Host controls who enters.", a.meet.knocking, function (v) { a.meet.knocking = v; }));
      list.appendChild(toggleRow("Host must join first", "Meeting waits for the host.", a.meet.hostMustJoin, function (v) { a.meet.hostMustJoin = v; }));
      wrap.appendChild(list);
      const q = el("div", { className: "card" });
      q.appendChild(el("h2", { text: "Meet quality tool" }));
      q.appendChild(el("p", { className: "muted", text: "Choppy warehouse Wi-Fi is a quality / network issue — not Meet safety." }));
      q.appendChild(el("button", {
        type: "button", className: "btn primary",
        text: a.meet.qualityRan ? "Quality report generated ✓" : "Run Meet quality report",
        onclick: function () {
          a.meet.qualityRan = true;
          persist("Meet quality report", "warehouse Wi-Fi sample");
          toast("Quality: packet loss on warehouse AP — not a safety setting.");
        }
      }));
      if (a.meet.qualityRan) q.appendChild(el("div", { className: "ok-box", text: "Sample: 12% packet loss on warehouse SSID. Fix Wi-Fi / bitrate — do not lock the meeting." }));
      wrap.appendChild(q);
      return wrap;
    }

    function panelChat() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Google Chat"));
      wrap.appendChild(el("p", { className: "lede", text: "If Chat history is off, Vault cannot retain what never existed." }));
      wrap.appendChild(el("div", { className: "settings-list" }, [
        toggleRow("Chat history on by default", "History off → nothing for Vault to keep, even with a hold.", a.chat.historyDefault, function (v) { a.chat.historyDefault = v; })
      ]));
      if (!a.chat.historyDefault) wrap.appendChild(el("div", { className: "warn", text: "History is off. A Vault hold cannot invent messages that were never stored." }));
      return wrap;
    }

    function panelGemini() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Gemini"));
      wrap.appendChild(el("p", { className: "lede", text: "Org prompts are not used to train Google’s foundation models. Enable per OU; pilot with a group first." }));
      wrap.appendChild(el("div", { className: "ok-box", text: "Training fact is already true: your prompts do not train Google’s public foundation models." }));
      const list = el("div", { className: "settings-list" });
      S().ous.forEach(function (ou) {
        const on = !!a.gemini.enabledOu[ou.id];
        list.appendChild(toggleRow("Gemini for " + ou.name, "Turn the service on for this OU.", on, function (v) {
          a.gemini.enabledOu[ou.id] = v;
        }));
      });
      list.appendChild(selectRow("Pilot group", "Cross-OU trial without moving people.", a.gemini.pilotGroupId || "",
        [{ v: "", t: "No pilot group" }].concat(S().groups.map(function (g) { return { v: g.id, t: g.name }; })),
        function (v) { a.gemini.pilotGroupId = v || null; }));
      list.appendChild(toggleRow("Gemini extensions (Gmail / Drive)", "Let Gemini act across services.", a.gemini.extensions, function (v) { a.gemini.extensions = v; }));
      wrap.appendChild(list);
      const tools = el("div", { className: "card" });
      tools.appendChild(el("h2", { text: "Build on Workspace" }));
      tools.appendChild(el("p", { className: "muted", text: "No-code app from a Sheet → AppSheet. Custom JavaScript glue → Apps Script." }));
      tools.appendChild(el("div", { className: "row" }, [
        el("button", {
          type: "button", className: "btn" + (a.gemini.noCodeTool === "appsheet" ? " primary" : ""),
          text: "Use AppSheet (no-code)",
          onclick: function () { a.gemini.noCodeTool = "appsheet"; persist("AppSheet selected", "no-code"); }
        }),
        el("button", {
          type: "button", className: "btn" + (a.gemini.noCodeTool === "appsscript" ? " primary" : ""),
          text: "Use Apps Script (JS)",
          onclick: function () { a.gemini.noCodeTool = "appsscript"; persist("Apps Script selected", "JS glue"); }
        })
      ]));
      wrap.appendChild(tools);
      return wrap;
    }

    function panelDriveExtra(wrap) {
      const a = A();
      const sd = el("div", { className: "card" });
      sd.appendChild(el("h2", { text: "Shared drives" }));
      sd.appendChild(el("p", { className: "muted", text: "Team-owned. Survives off-boarding. Manager = members + delete drive. Content manager = files only." }));
      if (!a.sharedDrives.length) {
        sd.appendChild(el("button", {
          type: "button", className: "btn primary", text: "Create Shared drive “Sales Team”",
          onclick: function () {
            a.sharedDrives.push({ id: "sd_sales", name: "Sales Team", members: [{ userId: "u_ada", role: "manager" }] });
            persist("Shared drive created", "Sales Team");
          }
        }));
      } else {
        a.sharedDrives.forEach(function (d) {
          sd.appendChild(el("p", { text: d.name + " — " + d.members.map(function (m) {
            return (userById(m.userId) || {}).name + " (" + m.role + ")";
          }).join(", ") }));
          const roleSel = el("select");
          ["manager", "content_manager", "contributor", "commenter", "viewer"].forEach(function (r) {
            const o = el("option", { value: r, text: "Ada’s role: " + r.replace("_", " ") });
            if ((d.members[0] || {}).role === r) o.selected = true;
            roleSel.appendChild(o);
          });
          roleSel.addEventListener("change", function () {
            if (d.members[0]) d.members[0].role = roleSel.value;
            persist("Shared drive role", "Ada = " + roleSel.value);
          });
          sd.appendChild(roleSel);
        });
      }
      wrap.appendChild(sd);
      wrap.appendChild(el("div", { className: "settings-list" }, [
        toggleRow("Target audience: All of Company", "Safer “share with company” suggestion — not a trust rule.", a.targetAudiences.enabled, function (v) { a.targetAudiences.enabled = v; })
      ]));
      wrap.appendChild(el("div", { className: "row" }, [
        el("button", { type: "button", className: "btn", text: "Trust rules", onclick: function () { go("trust"); } }),
        el("button", { type: "button", className: "btn", text: "Labels", onclick: function () { go("labels"); } })
      ]));
    }

    function panelTrust() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Trust rules"));
      wrap.appendChild(el("p", { className: "lede", text: "Who can share with whom. Legal ↔ outside-counsel.com is a trust rule — not DLP and not a label." }));
      a.trustRules.forEach(function (r) {
        wrap.appendChild(el("div", { className: "settings-list" }, [
          toggleRow(r.name, "Allow only this pair. Labels classify; this rule enforces the relationship.", r.enabled, function (v) { r.enabled = v; })
        ]));
      });
      wrap.appendChild(el("button", {
        type: "button", className: "btn", text: "Add rule: Finance ↔ bank-partner.com",
        onclick: function () {
          a.trustRules.push({ id: uid("tr"), name: "Finance ↔ bank-partner.com", enabled: true });
          persist("Trust rule added", "Finance ↔ bank-partner.com");
        }
      }));
      return wrap;
    }

    function panelLabels() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Labels"));
      wrap.appendChild(el("p", { className: "lede", text: "Labels classify (Public / Internal / Confidential). DLP or trust rules enforce on the label. A label alone does not block a leak." }));
      const table = el("table", { className: "user-table" });
      a.labels.forEach(function (lb) {
        const tr = el("tr");
        tr.appendChild(el("td", { text: lb.name }));
        tr.appendChild(el("td", { text: lb.name === "Confidential" ? "Use with DLP / trust" : "Classification only" }));
        table.appendChild(tr);
      });
      wrap.appendChild(el("div", { className: "card" }, [table]));
      wrap.appendChild(el("button", {
        type: "button", className: "btn primary", text: "Apply Confidential to Finance Shared drive",
        onclick: function () {
          a.labels._confidentialApplied = true;
          persist("Label applied", "Confidential");
          toast("Confidential applied — still need DLP or a trust rule to enforce.");
        }
      }));
      if (a.labels._confidentialApplied) wrap.appendChild(el("div", { className: "ok-box", text: "Confidential applied. Enforcement is DLP (content leaving) or trust rules (who↔whom)." }));
      return wrap;
    }

    function panelEndpoints() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Chrome browsers"));
      wrap.appendChild(el("p", { className: "lede", text: "Chrome Browser Cloud Management. Enroll with a token, then force-install / block extensions by OU — same inheritance as other settings." }));
      const enroll = el("div", { className: "card" });
      enroll.appendChild(el("h2", { text: "Enrollment token" }));
      enroll.appendChild(el("div", { className: "codebox", text: a.chrome.token }));
      enroll.appendChild(el("button", {
        type: "button", className: "btn primary",
        text: a.chrome.enrolled ? "Browsers enrolled ✓" : "Enroll browsers with this token",
        onclick: function () {
          a.chrome.enrolled = true;
          persist("CBCM enrolled", a.chrome.token);
        }
      }));
      wrap.appendChild(enroll);
      const ou = S().ui.selectedOuId || "ou_root";
      if (!a.chrome.policies[ou]) a.chrome.policies[ou] = { forceInstall: [], blockAll: false, safeBrowsing: true };
      const pol = a.chrome.policies[ou];
      wrap.appendChild(el("p", { className: "muted", text: "Policy for OU: " + ((ouById(ou) || {}).name || ou) + " — pick an OU on Organizational units or below." }));
      const ouSel = el("select");
      S().ous.forEach(function (o) {
        const opt = el("option", { value: o.id, text: o.name });
        if (o.id === ou) opt.selected = true;
        ouSel.appendChild(opt);
      });
      ouSel.addEventListener("change", function () {
        S().ui.selectedOuId = ouSel.value;
        persist();
      });
      wrap.appendChild(ouSel);
      const list = el("div", { className: "settings-list" });
      list.appendChild(toggleRow("Force-install Finance extension X", "Users cannot remove it. Scope to Sales (Finance) OU — not org-wide Super Admin.", (pol.forceInstall || []).indexOf("ext_x") >= 0, function (v) {
        pol.forceInstall = v ? ["ext_x"] : [];
      }));
      list.appendChild(toggleRow("Block all extensions except allowlist", "Stop random installs on this OU.", pol.blockAll, function (v) { pol.blockAll = v; }));
      list.appendChild(toggleRow("Safe Browsing", "Recommended with auto-updates.", pol.safeBrowsing, function (v) { pol.safeBrowsing = v; }));
      wrap.appendChild(list);
      wrap.appendChild(el("button", {
        type: "button", className: "btn",
        text: "Also block-all on Root (everyone else)",
        onclick: function () {
          a.chrome.policies.ou_root.blockAll = true;
          persist("CBCM block-all", "Root");
        }
      }));
      return wrap;
    }

    function panelMobileExtra(wrap) {
      const a = A();
      wrap.appendChild(el("div", { className: "settings-list" }, [
        selectRow("Mobile management", "Basic (default, agentless) = lock + account wipe. Advanced = approval, apps, full device wipe.", a.mdm.level,
          [{ v: "basic", t: "Basic MDM" }, { v: "advanced", t: "Advanced MDM" }, { v: "third", t: "Third-party (Intune / Jamf)" }],
          function (v) { a.mdm.level = v; })
      ]));
      const card = wrap.querySelector(".card") || wrap;
      S().users.forEach(function (u) {
        (u.devices || []).forEach(function (d) {
          /* wipe buttons added in HTML panel — we patch via returned helper */
        });
      });
      return a;
    }

    function wipeButtonsFor(u, d) {
      const row = el("div", { className: "row" });
      row.appendChild(el("button", {
        type: "button", className: "btn",
        text: d.wiped === "account" ? "Account wiped ✓" : "Account wipe",
        disabled: d.wiped === "account",
        onclick: function () {
          d.wiped = "account";
          persist("Account wipe", u.email);
          toast("Corporate account removed. Personal photos stay.");
        }
      }));
      row.appendChild(el("button", {
        type: "button", className: "btn danger",
        text: d.wiped === "device" ? "Device wiped ✓" : "Device wipe",
        disabled: d.wiped === "device" || d.ownership === "byod",
        onclick: function () {
          if (d.ownership === "byod") { toast("BYOD → account wipe only. Do not factory-reset a personal phone."); return; }
          d.wiped = "device";
          persist("Device wipe", u.email);
        }
      }));
      if (d.ownership === "byod") row.appendChild(el("span", { className: "muted", text: "BYOD — device wipe disabled on purpose." }));
      return row;
    }

    function panelAlerts() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Alert center"));
      wrap.appendChild(el("p", { className: "lede", text: "Activity rules notify. Investigation remediates. Status Dashboard is “is Google down?” — a different tool." }));
      a.alerts.rules.forEach(function (r) {
        wrap.appendChild(el("div", { className: "settings-list" }, [
          toggleRow(r.name, "Sends to Alert center when the event happens.", r.enabled, function (v) {
            r.enabled = v;
            if (v) a.alerts.items.unshift({ id: uid("al"), title: r.name, at: Date.now() });
          })
        ]));
      });
      const feed = el("div", { className: "card" });
      feed.appendChild(el("h2", { text: "Alerts" }));
      if (!a.alerts.items.length) feed.appendChild(el("p", { className: "muted", text: "No alerts yet. Enable a rule, or wait for a simulated event." }));
      a.alerts.items.forEach(function (item) {
        feed.appendChild(el("p", { text: new Date(item.at).toLocaleString() + " — " + item.title }));
      });
      wrap.appendChild(feed);
      wrap.appendChild(el("button", { type: "button", className: "btn", text: "Open Investigation tool", onclick: function () { go("investigation"); } }));
      return wrap;
    }

    function panelInvestigation() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Investigation tool"));
      wrap.appendChild(el("p", { className: "lede", text: "Investigate + remediate (delete mail from many inboxes, suspend, remove access). Typically Enterprise. Not the Status Dashboard." }));
      if (!enterprise()) wrap.appendChild(editionGate("Investigation tool"));
      const q = el("input", { type: "search", placeholder: "e.g. phishing subject “Invoice 8831”", value: a.investigation.lastQuery || "" });
      wrap.appendChild(q);
      wrap.appendChild(el("div", { className: "row" }, [
        el("button", {
          type: "button", className: "btn primary", text: "Search",
          onclick: function () {
            if (!enterprise()) { toast("Investigation needs Enterprise."); return; }
            a.investigation.lastQuery = q.value || "Invoice 8831";
            persist("Investigation search", a.investigation.lastQuery);
          }
        }),
        el("button", {
          type: "button", className: "btn danger", text: "Delete matching mail from 80 inboxes",
          onclick: function () {
            if (!enterprise()) { toast("Investigation needs Enterprise."); return; }
            a.investigation.lastAction = "delete_mail";
            persist("Investigation remediate", "delete_mail ×80");
            toast("Simulated: message removed from 80 mailboxes.");
          }
        })
      ]));
      if (a.investigation.lastAction === "delete_mail") wrap.appendChild(el("div", { className: "ok-box", text: "Remediation complete — this is Investigation, not Alert center and not Status Dashboard." }));
      return wrap;
    }

    function panelReportingExtra(wrap) {
      const a = A();
      const dash = el("div", { className: "card" });
      dash.appendChild(el("h2", { text: "Security health / dashboard" }));
      dash.appendChild(el("p", { text: "Health score: " + a.security.health + " / 100 — gaps vs best practice. This does not delete phishing mail." }));
      dash.appendChild(el("button", {
        type: "button", className: "btn",
        text: a.security.dashboardViewed ? "Health page viewed ✓" : "Open security health page",
        onclick: function () {
          a.security.dashboardViewed = true;
          persist("Security dashboard viewed", String(a.security.health));
        }
      }));
      wrap.appendChild(dash);

      const status = el("div", { className: "card" });
      status.appendChild(el("h2", { text: "Workspace Status Dashboard" }));
      status.appendChild(el("p", { className: "muted", text: "Is Google down for everyone? Check here first. Not Investigation." }));
      ["gmail", "drive", "meet"].forEach(function (svc) {
        status.appendChild(el("p", { text: svc.toUpperCase() + " — " + (a.status[svc] === "ok" ? "No incident" : a.status[svc]) }));
      });
      status.appendChild(el("button", {
        type: "button", className: "btn primary",
        text: a.status.checked ? "Status checked ✓" : "Check if Google is down",
        onclick: function () {
          a.status.checked = true;
          persist("Status Dashboard checked", "all ok");
        }
      }));
      wrap.appendChild(status);

      const els = el("div", { className: "card" });
      els.appendChild(el("h2", { text: "Email Log Search" }));
      els.appendChild(el("p", { className: "muted", text: "Did this one message deliver? Last ~30 days: delivered / rejected / quarantined / in transit. Not the admin audit log." }));
      const elsIn = el("input", { type: "text", placeholder: "invoice@partner.com or message id" });
      els.appendChild(elsIn);
      els.appendChild(el("button", {
        type: "button", className: "btn primary", text: "Search last 30 days",
        onclick: function () {
          a.els.lastSearch = { q: elsIn.value || "invoice@partner.com", at: Date.now(), result: "DELIVERED 09:14 — accepted by partner MX" };
          persist("Email Log Search", a.els.lastSearch.q);
        }
      }));
      if (a.els.lastSearch) els.appendChild(el("div", { className: "ok-box", text: a.els.lastSearch.result + " (" + a.els.lastSearch.q + ")" }));
      wrap.appendChild(els);

      const tb = el("div", { className: "card" });
      tb.appendChild(el("h2", { text: "Admin Toolbox · Messageheader" }));
      tb.appendChild(el("p", { className: "muted", text: "Paste headers to read SPF / DKIM / DMARC. HAR for Support = Chrome DevTools → Network → Preserve log → reproduce → Save as HAR (sensitive)." }));
      tb.appendChild(el("button", {
        type: "button", className: "btn",
        text: a.toolbox.headerRan ? "Headers decoded ✓" : "Decode sample headers",
        onclick: function () {
          a.toolbox.headerRan = true;
          persist("Messageheader decoded", "SPF pass / DKIM pass");
        }
      }));
      wrap.appendChild(tb);

      const clocks = el("div", { className: "card" });
      clocks.appendChild(el("h2", { text: "Recovery windows" }));
      clocks.appendChild(el("p", { text: "Deleted user account — 20 days. Admin restore Drive/Gmail — ~25 days. Drive Trash — 30 days then purged." }));
      clocks.appendChild(el("button", {
        type: "button", className: "btn",
        text: a.reporting.clocksViewed ? "Clocks reviewed ✓" : "Mark recovery clocks reviewed",
        onclick: function () {
          a.reporting.clocksViewed = true;
          persist("Recovery windows reviewed", "20 / 25 / 30");
        }
      }));
      wrap.appendChild(clocks);
    }

    function gmailRoutingCard() {
      const a = A();
      const wrap = el("div");
      wrap.appendChild(el("div", { className: "settings-list" }, [
        toggleRow("Dual delivery (copy to Exchange)", "Coexistence: Google and legacy both get a copy.", a.gmail.dualDelivery, function (v) { a.gmail.dualDelivery = v; }),
        toggleRow("Split delivery", "Some users Google, some still on legacy during cutover.", a.gmail.splitDelivery, function (v) { a.gmail.splitDelivery = v; }),
        toggleRow("Inbound gateway (third-party filter)", "Relay through another filter first.", a.gmail.gateway, function (v) { a.gmail.gateway = v; }),
        toggleRow("Security Sandbox (detonate attachments)", "Explode attachments in a sandbox.", a.gmail.sandbox, function (v) { a.gmail.sandbox = v; }),
        toggleRow("Allow POP / IMAP", "Turn off to reduce exfil. Disable forwarding too for leavers.", a.gmail.popImap, function (v) { a.gmail.popImap = v; }),
        toggleRow("Allow automatic forwarding", "Another common leak path.", a.gmail.forwarding, function (v) { a.gmail.forwarding = v; }),
        toggleRow("Content compliance: BCC all outbound Finance mail", "Compliance can quarantine, reject, modify, BCC, or add a footer.", a.gmail.complianceBcc, function (v) { a.gmail.complianceBcc = v; })
      ]));
      const del = el("div", { className: "card" });
      del.appendChild(el("h2", { text: "Delegation" }));
      del.appendChild(el("p", { className: "muted", text: "Assistant sends on Ada’s behalf — same mailbox, not a new license." }));
      del.appendChild(el("button", {
        type: "button", className: "btn",
        text: a.gmail.delegation.u_ada ? "Cara can send as Ada ✓" : "Let Cara send as Ada",
        onclick: function () {
          a.gmail.delegation.u_ada = "u_cara";
          persist("Gmail delegation", "Cara → Ada");
        }
      }));
      wrap.appendChild(del);
      const dms = el("div", { className: "card" });
      dms.appendChild(el("h2", { text: "Data Migration Service" }));
      dms.appendChild(el("p", { className: "muted", text: "Moves mail / calendar / contacts from Exchange, M365, IMAP, or another Workspace. Identities stay on GCDS / Directory Sync / SCIM." }));
      dms.appendChild(el("button", {
        type: "button", className: "btn primary",
        text: a.gmail.dmsRan ? "DMS migration started ✓" : "Start DMS (M365 → Gmail)",
        onclick: function () {
          a.gmail.dmsRan = true;
          persist("DMS started", "M365 mailboxes");
        }
      }));
      wrap.appendChild(dms);
      wrap.appendChild(el("p", { className: "muted", text: "Attachments over ~25 MB → send a Drive link. Do not raise a mailbox-size edition for a 40 MB send." }));
      return wrap;
    }

    function panelGcdsExtra(wrap) {
      const a = A();
      wrap.appendChild(el("div", { className: "settings-list" }, [
        selectRow("Identity source", "On-prem AD → GCDS. Cloud IdP (Entra) → Directory Sync. Mail content → DMS.", a.directorySync.source,
          [{ v: "ad", t: "On-prem Active Directory (GCDS)" }, { v: "entra", t: "Microsoft Entra ID (Directory Sync)" }],
          function (v) { a.directorySync.source = v; })
      ]));
      wrap.appendChild(el("button", { type: "button", className: "btn", text: "Open Data Migration Service", onclick: function () { go("gmail", { gmailTab: "routing" }); } }));
    }

    function panelVaultExtra(wrap) {
      const a = A();
      const ret = el("div", { className: "card" });
      ret.appendChild(el("h2", { text: "Retention" }));
      ret.appendChild(el("p", { text: "Default rule: keep Gmail 2 years then purge. A hold in a Matter always beats this delete." }));
      wrap.appendChild(ret);
      const exp = el("div", { className: "card" });
      exp.appendChild(el("h2", { text: "Search & export (this matter)" }));
      exp.appendChild(el("p", { className: "muted", text: "Lawyers need only Acme v. Corp — Vault export, not Data Export and not Takeout." }));
      exp.appendChild(el("button", {
        type: "button", className: "btn",
        text: a.export._vaultExport ? "Matter exported ✓" : "Export this matter",
        onclick: function () {
          a.export._vaultExport = true;
          persist("Vault export", "Acme v. Corp");
        }
      }));
      wrap.appendChild(exp);
    }

    function panelGroupsCreate(wrap) {
      const box = el("div", { className: "card" });
      box.appendChild(el("h2", { text: "Create group" }));
      const name = el("input", { type: "text", placeholder: "support" });
      const kind = el("select");
      [
        ["distribution", "Distribution list — email many people"],
        ["collaborative", "Collaborative Inbox — shared queue"],
        ["dynamic", "Dynamic — membership from a query"],
        ["security", "Security — access / policy target"]
      ].forEach(function (p) { kind.appendChild(el("option", { value: p[0], text: p[1] })); });
      box.appendChild(el("div", { className: "field" }, [el("label", { text: "Name" }), name]));
      box.appendChild(el("div", { className: "field" }, [el("label", { text: "Type" }), kind]));
      const query = el("input", { type: "text", placeholder: "department = Sales", value: "department = Sales" });
      box.appendChild(el("div", { className: "field" }, [el("label", { text: "Dynamic query (if dynamic)" }), query]));
      box.appendChild(el("button", {
        type: "button", className: "btn primary", text: "Create group",
        onclick: function () {
          const n = (name.value || "").trim() || (kind.value === "collaborative" ? "support" : "new-group");
          const id = uid("g");
          S().groups.push({
            id: id,
            name: n,
            kind: kind.value,
            security: kind.value === "security",
            query: kind.value === "dynamic" ? query.value : "",
            note: kind.value
          });
          persist("Group created", n + " (" + kind.value + ")");
          toast("Group created — " + kind.value);
        }
      }));
      wrap.appendChild(box);
    }

    function panelStrategy() {
      const a = A();
      const wrap = el("div", { className: "panel active" });
      wrap.appendChild(pageHead("Pick the narrow tool"));
      wrap.appendChild(el("p", { className: "lede", text: "Configure the answer in this console — then cross-check the heuristics sheet." }));
      const items = [
        { id: "t1", q: "Only Legal may share with counsel.com", opts: ["trust", "dlp", "vault", "caa"], ok: "trust", go: "trust" },
        { id: "t2", q: "Keep an ex-employee’s data cheap for Vault", opts: ["aul", "delete", "takeout", "hold"], ok: "aul", go: "offboard" },
        { id: "t3", q: "Drive only from managed devices on corp Wi-Fi", opts: ["caa", "2sv", "mdm", "dlp"], ok: "caa", go: "access" },
        { id: "t4", q: "On-prem AD is source of accounts", opts: ["gcds", "dms", "scim", "csv"], ok: "gcds", go: "gcds" },
        { id: "t5", q: "Recipients mark you as spam; inbound still works", opts: ["auth", "mx", "safety", "caa"], ok: "auth", go: "gmail" }
      ];
      const labels = {
        trust: "Trust rules", dlp: "DLP", vault: "Vault hold", caa: "Context-Aware Access",
        aul: "Archived User License", delete: "Delete user", takeout: "Takeout", hold: "Vault hold only",
        "2sv": "2SV only", mdm: "MDM wipe", gcds: "GCDS", dms: "DMS", scim: "SCIM only", csv: "CSV users",
        auth: "SPF+DKIM+DMARC", mx: "Change MX", safety: "Meet safety"
      };
      items.forEach(function (it) {
        const card = el("div", { className: "card" });
        card.appendChild(el("h2", { text: it.q }));
        const sel = el("select");
        sel.appendChild(el("option", { value: "", text: "Choose the tool…" }));
        it.opts.forEach(function (o) {
          const opt = el("option", { value: o, text: labels[o] || o });
          if (a.strategy.picks[it.id] === o) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.addEventListener("change", function () {
          a.strategy.picks[it.id] = sel.value;
          persist("Strategy pick", it.q);
        });
        card.appendChild(sel);
        card.appendChild(el("button", { type: "button", className: "btn ghost", text: "Open that setting", onclick: function () { go(it.go); } }));
        wrap.appendChild(card);
      });
      const score = items.filter(function (it) { return a.strategy.picks[it.id] === it.ok; }).length;
      a.strategy.score = score;
      wrap.appendChild(el("p", { text: "Correct: " + score + " / 5" }));
      return wrap;
    }

    function uid(prefix) {
      return prefix + "_" + Math.random().toString(36).slice(2, 9);
    }

    return {
      panelAccount: panelAccount,
      panelRoles: panelRoles,
      panelBilling: panelBilling,
      panelPassword: panelPassword,
      panelAccess: panelAccess,
      panelSso: panelSso,
      panelMarketplace: panelMarketplace,
      panelBuildings: panelBuildings,
      panelCalendar: panelCalendar,
      panelMeet: panelMeet,
      panelChat: panelChat,
      panelGemini: panelGemini,
      panelTrust: panelTrust,
      panelLabels: panelLabels,
      panelEndpoints: panelEndpoints,
      panelAlerts: panelAlerts,
      panelInvestigation: panelInvestigation,
      panelStrategy: panelStrategy,
      panelDriveExtra: panelDriveExtra,
      panelReportingExtra: panelReportingExtra,
      panelMobileExtra: panelMobileExtra,
      wipeButtonsFor: wipeButtonsFor,
      gmailRoutingCard: gmailRoutingCard,
      panelGcdsExtra: panelGcdsExtra,
      panelVaultExtra: panelVaultExtra,
      panelGroupsCreate: panelGroupsCreate
    };
  }

  global.GwsAdminFeatures = { defaults: defaults, ensure: ensure, attach: attach };
})(typeof window !== "undefined" ? window : globalThis);
