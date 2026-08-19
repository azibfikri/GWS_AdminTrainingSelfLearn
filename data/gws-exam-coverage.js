/* Official Associate exam-guide map → Study Desk notes / lab / prove quiz.
   Source: associate_google_workspace_administrator_exam_guide_english.pdf */
(function (global) {
  const ITEMS = [
    { id: "1.1-lifecycle", section: "1 · Directory ~20%", obj: "1.1", title: "User life cycle: create, suspend, delete, archive, restore", notes: "#m1-lifecycle", lab: "lab-offboard", quiz: ["m1-sus-01", "m1-del-01", "m1-aul-01", "m1-multi-01"] },
    { id: "1.1-provision", section: "1 · Directory ~20%", obj: "1.1", title: "Provisioning: manual/CSV vs GCDS vs Directory Sync vs SCIM", notes: "#m1-provision", lab: "lab-gcds", quiz: ["m1-gcds-01", "m1-dirsync-01"] },
    { id: "1.1-migrate", section: "1 · Directory ~20%", obj: "1.1", title: "Identity sync vs content migration (DMS)", notes: "#m1-provision", lab: "lab-routing", quiz: ["m1-mig-01"] },
    { id: "1.1-sso", section: "1 · Directory ~20%", obj: "1.1", title: "SAML SSO + break-glass Super Admin", notes: "#m1-sso", lab: "lab-sso", quiz: ["m1-sso-01"] },
    { id: "1.1-attrs", section: "1 · Directory ~20%", obj: "1.1", title: "Aliases, rename, passwords, licenses", notes: "#m1-aliases", lab: "lab-users", quiz: ["m1-alias-01"] },
    { id: "1.1-transfer", section: "1 · Directory ~20%", obj: "1.1", title: "Transfer My Drive before delete", notes: "#m1-offboard", lab: "lab-offboard", quiz: ["m1-xfer-01"] },
    { id: "1.2-ou", section: "1 · Directory ~20%", obj: "1.2", title: "Design OUs for policy, not the org chart", notes: "#m1-ou-design", lab: "lab-ou", quiz: ["m0-ou-01", "m0-oneou-01"] },
    { id: "1.3-groups", section: "1 · Directory ~20%", obj: "1.3", title: "DL vs Collaborative Inbox vs dynamic vs security groups", notes: "#m1-groups", lab: "lab-groups", quiz: ["m1-collab-01", "m1-dyn-01", "m1-secg-01"] },
    { id: "1.4-domains", section: "1 · Directory ~20%", obj: "1.4", title: "Primary vs secondary vs domain alias; verify then MX", notes: "#m1-domains", lab: "lab-mail", quiz: ["m1-alias-01"] },
    { id: "1.5-buildings", section: "1 · Directory ~20%", obj: "1.5", title: "Buildings, rooms, features, booking, CSV bulk", notes: "#m1-buildings", lab: "lab-resources", quiz: ["m1-rooms-01", "m1-feat-01"] },

    { id: "2.1-mx", section: "2 · Core services ~23%", obj: "2.1", title: "MX = inbound routing only", notes: "#m2-gmail", lab: "lab-mail", quiz: ["m2-mx-01"] },
    { id: "2.1-auth", section: "2 · Core services ~23%", obj: "2.1", title: "SPF, DKIM, DMARC (start p=none)", notes: "#m2-gmail", lab: "lab-mail", quiz: ["m2-spam-01", "m2-dmarc-01", "m2-multi-01"] },
    { id: "2.1-routing", section: "2 · Core services ~23%", obj: "2.1", title: "Dual/split delivery, compliance, BCC, footer", notes: "#m2-routing", lab: "lab-routing", quiz: ["m2-dual-01"] },
    { id: "2.1-gateway", section: "2 · Core services ~23%", obj: "2.1", title: "Inbound gateway, sandbox, quarantine, POP/IMAP, forwarding", notes: "#m2-routing", lab: "lab-gmail-gate", quiz: ["m2-pop-01", "m2-gate-01", "m2-quar-01"] },
    { id: "2.1-attach", section: "2 · Core services ~23%", obj: "2.1", title: "Attachment size ~25 MB and blocked types", notes: "#m2-routing", lab: "lab-routing", quiz: ["m2-att-01"] },
    { id: "2.1-delegate", section: "2 · Core services ~23%", obj: "2.1", title: "Gmail delegation (assistant sends as user)", notes: "#m2-routing", lab: "lab-routing", quiz: ["m2-delg-01"] },
    { id: "2.1-dms", section: "2 · Core services ~23%", obj: "2.1", title: "Migrate mail with DMS, not GCDS", notes: "#m2-migration", lab: "lab-routing", quiz: ["m1-mig-01"] },
    { id: "2.2-drive", section: "2 · Core services ~23%", obj: "2.2", title: "My Drive vs Shared Drive roles; sharing defaults", notes: "#m2-drive", lab: "lab-drive", quiz: ["m2-sd-01"] },
    { id: "2.2-audiences", section: "2 · Core services ~23%", obj: "2.2", title: "Target audiences vs trust rules; quotas; labels", notes: "#m2-drive", lab: "lab-drive", quiz: ["m3-trust-01"] },
    { id: "2.2-clients", section: "2 · Core services ~23%", obj: "2.2", title: "Drive for desktop, offline, custom templates", notes: "#m2-clients", lab: "lab-drive-clients", quiz: ["m2-desk-01", "m2-off-01"] },
    { id: "2.3-cal", section: "2 · Core services ~23%", obj: "2.3", title: "Calendar sharing, unknown senders, delegation, transfer", notes: "#m2-calendar", lab: "lab-calendar", quiz: ["m2-cal-01", "m2-unk-01", "m2-caldel-01"] },
    { id: "2.3-book", section: "2 · Core services ~23%", obj: "2.3", title: "Resource calendars, booking policy, features", notes: "#m2-calendar", lab: "lab-resources", quiz: ["m1-feat-01", "m2-book-01"] },
    { id: "2.4-meet", section: "2 · Core services ~23%", obj: "2.4", title: "Meet safety vs quality; recordings / transcripts", notes: "#m2-meet", lab: "lab-meet", quiz: ["m2-meet-01", "m2-meetq-01", "m2-rec-01"] },
    { id: "2.5-chat", section: "2 · Core services ~23%", obj: "2.5", title: "Chat history, external spaces, moderation, bots", notes: "#m2-chat", lab: "lab-chat", quiz: ["m3-chat-01", "m2-chatx-01"] },
    { id: "2.6-gemini", section: "2 · Core services ~23%", obj: "2.6", title: "Gemini privacy, OU/group pilot, extensions, usage reports", notes: "#m2-gemini", lab: "lab-gemini", quiz: ["m2-gem-01", "m2-gemu-01"] },
    { id: "2.7-dev", section: "2 · Core services ~23%", obj: "2.7", title: "AppSheet (no-code) vs Apps Script (JS)", notes: "#m2-appsheet", lab: "lab-gemini", quiz: ["m2-appsheet-01"] },

    { id: "3.1-vault", section: "3 · Governance ~15%", obj: "3.1", title: "Vault: retention, holds, Matter, search/export, AUL", notes: "#m3-vault", lab: "lab-vault", quiz: ["m3-hold-01", "m3-vault-01"] },
    { id: "3.2-dlp", section: "3 · Governance ~15%", obj: "3.2", title: "DLP detectors and actions (Gmail / Drive / Chat)", notes: "#m3-dlp", lab: "lab-dlp", quiz: ["m3-dlp-01"] },
    { id: "3.3-trust", section: "3 · Governance ~15%", obj: "3.3", title: "Drive trust rules (who may share with whom)", notes: "#m3-trust", lab: "lab-drive", quiz: ["m3-trust-01"] },
    { id: "3.4-export", section: "3 · Governance ~15%", obj: "3.4", title: "Takeout vs Data Export vs Vault export; data regions", notes: "#m3-export", lab: "lab-export", quiz: ["m3-export-01", "m3-region-01"] },
    { id: "3.5-labels", section: "3 · Governance ~15%", obj: "3.5", title: "Classification labels then DLP/trust enforce", notes: "#m3-labels", lab: "lab-dlp", quiz: ["m3-label-01"] },

    { id: "4.1-2sv", section: "4 · Security ~20%", obj: "4.1", title: "Password policy + 2SV rollout (allow → date → grace)", notes: "#m4-2sv", lab: "lab-caa", quiz: ["m4-2sv-01", "m4-key-01"] },
    { id: "4.1-caa", section: "4 · Security ~20%", obj: "4.1", title: "Context-Aware Access vs 2SV", notes: "#m4-caa", lab: "lab-caa", quiz: ["m4-caa-01"] },
    { id: "4.1-roles", section: "4 · Security ~20%", obj: "4.1", title: "Least-privilege admin roles and OU scope", notes: "#m4-roles", lab: "lab-roles", quiz: ["m4-role-01", "m4-ourole-01"] },
    { id: "4.1-session", section: "4 · Security ~20%", obj: "4.1", title: "Session control (web session length)", notes: "#m4-session", lab: "lab-caa", quiz: ["m4-sess-01"] },
    { id: "4.2-sec", section: "4 · Security ~20%", obj: "4.2", title: "Security health, Investigation, activity rules / alerts", notes: "#m4-seccenter", lab: "lab-seccenter", quiz: ["m4-inv-01"] },
    { id: "4.3-apps", section: "4 · Security ~20%", obj: "4.3", title: "Marketplace allowlist, API controls, extra Google services", notes: "#m4-api", lab: "lab-seccenter", quiz: ["m4-oauth-01", "m4-multi-01"] },

    { id: "5.1-mdm", section: "5 · Endpoints ~10%", obj: "5.1", title: "Basic vs Advanced vs third-party MDM; BYOD vs company wipe", notes: "#m5-mdm", lab: "lab-wipe", quiz: ["m5-wipe-01", "m5-basic-01"] },
    { id: "5.1-level", section: "5 · Endpoints ~10%", obj: "5.1", title: "Turn on Advanced MDM; company-owned vs BYOD visibility", notes: "#m5-mdm", lab: "lab-mdm-level", quiz: ["m5-adv-01"] },
    { id: "5.2-cbcm", section: "5 · Endpoints ~10%", obj: "5.2", title: "Enroll Chrome, force-install / block extensions, updates", notes: "#m5-cbcm", lab: "lab-cbcm", quiz: ["m5-ext-01", "m5-block-01"] },
    { id: "5.2-pol", section: "5 · Endpoints ~10%", obj: "5.2", title: "Chrome policies: auto-update, offline, Safe Browsing", notes: "#m5-cbcm", lab: "lab-mdm-level", quiz: ["m5-upd-01"] },

    { id: "6.1-logs", section: "6 · Monitor ~13%", obj: "6.1", title: "Pick the right log (admin / login / Drive / Groups / OAuth / devices)", notes: "#m6-logs", lab: "lab-audit", quiz: ["m6-admin-01"] },
    { id: "6.1-status", section: "6 · Monitor ~13%", obj: "6.1", title: "Status Dashboard before you assume it is just you", notes: "#m6-logs", lab: "lab-els", quiz: ["m6-status-01"] },
    { id: "6.2-mail", section: "6 · Monitor ~13%", obj: "6.2", title: "Email Log Search + Toolbox headers (SPF/DKIM/DMARC)", notes: "#m6-email", lab: "lab-els", quiz: ["m6-els-01", "m6-multi-01"] },
    { id: "6.2-fix", section: "6 · Monitor ~13%", obj: "6.2", title: "Calendar / Drive / Meet / 2SV user issues; recovery windows", notes: "#m6-issues", lab: "lab-audit", quiz: ["m6-win-01", "m6-calfix-01", "m6-drvoff-01"] },
    { id: "6.3-reports", section: "6 · Monitor ~13%", obj: "6.3", title: "Usage, storage, device, and audit reports", notes: "#m6-reports", lab: "lab-audit", quiz: ["m6-rep-01"] },
    { id: "6.4-support", section: "6 · Monitor ~13%", obj: "6.4", title: "HAR files, Updates blog, release calendar, open a case", notes: "#m6-reports", lab: "lab-els", quiz: ["m6-har-01"] }
  ];

  const LAB_HREF = {
    "lab-offboard": "./gws-admin-console.html#labs",
    "lab-gcds": "./gws-admin-console.html#labs",
    "lab-routing": "./gws-admin-console.html#labs",
    "lab-sso": "./gws-admin-console.html#labs",
    "lab-users": "./gws-admin-console.html#labs",
    "lab-ou": "./gws-admin-console.html#labs",
    "lab-groups": "./gws-admin-console.html#labs",
    "lab-mail": "./gws-domain-setup.html",
    "lab-resources": "./gws-admin-console.html#labs",
    "lab-gmail-gate": "./gws-admin-console.html#labs",
    "lab-drive": "./gws-admin-console.html#labs",
    "lab-drive-clients": "./gws-admin-console.html#labs",
    "lab-calendar": "./gws-admin-console.html#labs",
    "lab-meet": "./gws-admin-console.html#labs",
    "lab-chat": "./gws-admin-console.html#labs",
    "lab-gemini": "./gws-admin-console.html#labs",
    "lab-vault": "./gws-admin-console.html#labs",
    "lab-dlp": "./gws-admin-console.html#labs",
    "lab-export": "./gws-admin-console.html#labs",
    "lab-caa": "./gws-admin-console.html#labs",
    "lab-roles": "./gws-admin-console.html#labs",
    "lab-seccenter": "./gws-admin-console.html#labs",
    "lab-wipe": "./gws-admin-console.html#labs",
    "lab-mdm-level": "./gws-admin-console.html#labs",
    "lab-cbcm": "./gws-admin-console.html#labs",
    "lab-audit": "./gws-admin-console.html#labs",
    "lab-els": "./gws-admin-console.html#labs"
  };

  global.GWS_EXAM_COVERAGE = { items: ITEMS, labHref: LAB_HREF };
})(typeof window !== "undefined" ? window : globalThis);
