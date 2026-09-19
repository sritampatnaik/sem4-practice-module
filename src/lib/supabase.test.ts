import assert from "node:assert/strict";
import {
  classifySupabaseKey,
  getSupabaseAdmin,
  getSupabaseAuth,
  isSupabaseAuthConfigured,
  isSupabaseConfigured,
} from "./supabase";

const previous = {
  url: process.env.SUPABASE_URL,
  serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
  secret: process.env.SUPABASE_SECRET_KEY,
  anon: process.env.SUPABASE_ANON_KEY,
  publishable: process.env.SUPABASE_PUBLISHABLE_KEY,
};

function restore() {
  setEnv("SUPABASE_URL", previous.url);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", previous.serviceRole);
  setEnv("SUPABASE_SECRET_KEY", previous.secret);
  setEnv("SUPABASE_ANON_KEY", previous.anon);
  setEnv("SUPABASE_PUBLISHABLE_KEY", previous.publishable);
}

function setEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function jwt(role: "anon" | "service_role") {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  );
  const payload = Buffer.from(JSON.stringify({ role, iss: "supabase" })).toString(
    "base64url",
  );
  return `${header}.${payload}.sig`;
}

function clearKeys() {
  setEnv("SUPABASE_URL", undefined);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
  setEnv("SUPABASE_SECRET_KEY", undefined);
  setEnv("SUPABASE_ANON_KEY", undefined);
  setEnv("SUPABASE_PUBLISHABLE_KEY", undefined);
}

try {
  assert.equal(classifySupabaseKey("sb_publishable_abc"), "publishable");
  assert.equal(classifySupabaseKey("sb_secret_abc"), "secret");
  assert.equal(classifySupabaseKey(jwt("anon")), "anon");
  assert.equal(classifySupabaseKey(jwt("service_role")), "service_role");
  assert.equal(classifySupabaseKey("service-role-test"), "unknown");

  clearKeys();
  assert.equal(isSupabaseConfigured(), false);
  assert.equal(isSupabaseAuthConfigured(), false);

  setEnv("SUPABASE_URL", "https://psjxfthrmqegxotokkdf.supabase.co");
  assert.equal(isSupabaseConfigured(), false);
  assert.equal(isSupabaseAuthConfigured(), false);

  setEnv("SUPABASE_SECRET_KEY", "sb_secret_test");
  assert.equal(isSupabaseConfigured(), true);
  assert.equal(isSupabaseAuthConfigured(), false);
  assert.ok(getSupabaseAdmin());
  assert.equal(getSupabaseAuth(), null);

  setEnv("SUPABASE_SECRET_KEY", undefined);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", jwt("service_role"));
  assert.equal(isSupabaseConfigured(), true);
  assert.equal(isSupabaseAuthConfigured(), false);
  assert.ok(getSupabaseAdmin());
  assert.equal(getSupabaseAuth(), null);

  setEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
  setEnv("SUPABASE_ANON_KEY", jwt("anon"));
  assert.equal(isSupabaseConfigured(), true);
  assert.equal(isSupabaseAuthConfigured(), true);
  assert.equal(getSupabaseAdmin(), null);
  assert.ok(getSupabaseAuth());

  setEnv("SUPABASE_ANON_KEY", undefined);
  setEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  assert.equal(isSupabaseConfigured(), true);
  assert.equal(isSupabaseAuthConfigured(), true);
  assert.equal(getSupabaseAdmin(), null);
  assert.ok(getSupabaseAuth());

  // Production bug: a publishable or secret key pasted into SERVICE_ROLE_KEY.
  setEnv("SUPABASE_PUBLISHABLE_KEY", undefined);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_publishable_pasted_into_service_role");
  assert.equal(classifySupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""), "publishable");
  assert.equal(isSupabaseAuthConfigured(), true);
  assert.equal(getSupabaseAdmin(), null, "publishable must not be treated as Auth Admin");
  assert.ok(getSupabaseAuth(), "publishable in SERVICE_ROLE_KEY still signs students up");

  setEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_pasted_as_service_role");
  setEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_for_auth");
  assert.ok(getSupabaseAdmin());
  assert.ok(getSupabaseAuth());
  assert.equal(isSupabaseAuthConfigured(), true);
} finally {
  restore();
}

console.log("supabase env tests passed");
