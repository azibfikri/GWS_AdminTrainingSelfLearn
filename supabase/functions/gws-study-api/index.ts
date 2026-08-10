import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as jose from "npm:jose@5";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const TOKEN_TTL = "30d";
const ALLOWED_ORIGINS = new Set([
  "https://gws-admin-study-guide.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
]);

type JwtPayload = { sub: string; username: string };

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://gws-admin-study-guide.vercel.app";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

async function jwtKey() {
  const raw = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!raw) throw new Error("Missing service role");
  return new TextEncoder().encode(raw);
}

async function signToken(payload: JwtPayload) {
  const key = await jwtKey();
  return new jose.SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(key);
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const key = await jwtKey();
    const { payload } = await jose.jwtVerify(token, key);
    const sub = payload.sub;
    const username = payload.username;
    if (typeof sub !== "string" || typeof username !== "string") return null;
    return { sub, username };
  } catch {
    return null;
  }
}

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;
  const salt = new Uint8Array(parts[1].match(/.{1,2}/g)!.map((h) => parseInt(h, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const hashHex = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === parts[2];
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function bearer(req: Request): string | null {
  const h = req.headers.get("Authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "");
  const route = path.endsWith("/gws-study-api") ? "" : path.split("/gws-study-api").pop() ?? "";

  try {
    if (req.method === "POST" && (route === "" || route === "/register")) {
      const body = await req.json();
      const username = String(body.username ?? "").trim();
      const password = String(body.password ?? "");
      if (!USERNAME_RE.test(username)) {
        return json(req, 400, { error: "Username must be 3–32 characters: letters, numbers, underscore." });
      }
      if (password.length < 6) {
        return json(req, 400, { error: "Password must be at least 6 characters." });
      }
      const password_hash = await hashPassword(password);
      const db = adminClient();
      const { data, error } = await db
        .from("gws_study_users")
        .insert({ username, password_hash })
        .select("id, username")
        .single();
      if (error) {
        if (error.code === "23505") return json(req, 409, { error: "That username is taken." });
        throw error;
      }
      const token = await signToken({ sub: data.id, username: data.username });
      return json(req, 200, { token, user: { id: data.id, username: data.username } });
    }

    if (req.method === "POST" && route === "/login") {
      const body = await req.json();
      const username = String(body.username ?? "").trim();
      const password = String(body.password ?? "");
      if (!username || !password) return json(req, 400, { error: "Username and password required." });
      const db = adminClient();
      const { data: user, error } = await db
        .from("gws_study_users")
        .select("id, username, password_hash")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      if (!user || !(await verifyPassword(password, user.password_hash))) {
        return json(req, 401, { error: "Wrong username or password." });
      }
      const token = await signToken({ sub: user.id, username: user.username });
      return json(req, 200, { token, user: { id: user.id, username: user.username } });
    }

    if (req.method === "GET" && route === "/session") {
      const token = bearer(req);
      if (!token) return json(req, 401, { error: "Not signed in." });
      const sess = await verifyToken(token);
      if (!sess) return json(req, 401, { error: "Session expired." });
      return json(req, 200, { user: { id: sess.sub, username: sess.username } });
    }

    if (req.method === "GET" && route === "/progress") {
      const token = bearer(req);
      if (!token) return json(req, 401, { error: "Not signed in." });
      const sess = await verifyToken(token);
      if (!sess) return json(req, 401, { error: "Session expired." });
      const db = adminClient();
      const { data, error } = await db
        .from("gws_study_progress")
        .select("payload, updated_at")
        .eq("user_id", sess.sub)
        .maybeSingle();
      if (error) throw error;
      return json(req, 200, { payload: data?.payload ?? null, updated_at: data?.updated_at ?? null });
    }

    if (req.method === "PUT" && route === "/progress") {
      const token = bearer(req);
      if (!token) return json(req, 401, { error: "Not signed in." });
      const sess = await verifyToken(token);
      if (!sess) return json(req, 401, { error: "Session expired." });
      const body = await req.json();
      const payload = body.payload;
      if (!payload || typeof payload !== "object") {
        return json(req, 400, { error: "Invalid payload." });
      }
      const db = adminClient();
      const { error } = await db.from("gws_study_progress").upsert({
        user_id: sess.sub,
        payload,
      });
      if (error) throw error;
      return json(req, 200, { ok: true });
    }

    return json(req, 404, { error: "Not found." });
  } catch (e) {
    console.error(e);
    return json(req, 500, { error: "Server error." });
  }
});
