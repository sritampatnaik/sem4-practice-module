import assert from "node:assert/strict";
import { isSupabaseConfigured } from "./supabase";

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

try {
  setEnv("SUPABASE_URL", undefined);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
  setEnv("SUPABASE_SECRET_KEY", undefined);
  setEnv("SUPABASE_ANON_KEY", undefined);
  setEnv("SUPABASE_PUBLISHABLE_KEY", undefined);
  assert.equal(isSupabaseConfigured(), false);

  setEnv("SUPABASE_URL", "https://psjxfthrmqegxotokkdf.supabase.co");
  assert.equal(isSupabaseConfigured(), false);

  setEnv("SUPABASE_SECRET_KEY", "sb_secret_test");
  assert.equal(isSupabaseConfigured(), true);

  setEnv("SUPABASE_SECRET_KEY", undefined);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
  assert.equal(isSupabaseConfigured(), true);

  setEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
  setEnv("SUPABASE_ANON_KEY", "anon-test");
  assert.equal(isSupabaseConfigured(), true);

  setEnv("SUPABASE_ANON_KEY", undefined);
  setEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  assert.equal(isSupabaseConfigured(), true);
} finally {
  restore();
}

console.log("supabase env tests passed");
