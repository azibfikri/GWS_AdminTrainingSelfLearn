#!/usr/bin/env node
/** Writes config.js for deploy (username/password cloud API). */
const fs = require("fs");
const path = require("path");

const defaultBase =
  "https://ypbzmarhpdiaakodgfue.supabase.co/functions/v1/gws-study-api";
const defaultAnon =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwYnptYXJocGRpYWFrb2RnZnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODU1MjcsImV4cCI6MjEwMTY2MTUyN30.HWOcrhkH5ZFIR1E4SosxVYyxrlYpEprhfqPX0V_6ipY";
const apiBase = (process.env.GWS_AUTH_API_BASE || defaultBase).replace(/\/+$/, "");
const anonKey = process.env.GWS_SUPABASE_ANON_KEY || defaultAnon;

const out = `window.GWS_AUTH = {
  apiBase: ${JSON.stringify(apiBase)},
  anonKey: ${JSON.stringify(anonKey)}
};
`;

fs.writeFileSync(path.join(__dirname, "..", "config.js"), out, "utf8");
console.log("write-config: wrote config.js (GWS_AUTH.apiBase)");
