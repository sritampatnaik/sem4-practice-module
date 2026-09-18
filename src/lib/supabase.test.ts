import assert from "node:assert/strict";
import { isSupabaseConfigured } from "./supabase";

const previous = {
  url: process.env.SUPABASE_URL,
  serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
  secret: process.env.SUPABASE_SECRET_KEY,
};

function restore() {
  setEnv("SUPABASE_URL", previous.url);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", previous.serviceRole);
  setEnv("SUPABASE_SECRET_KEY", previous.secret);
}

function setEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

try {
  setEnv("SUPABASE_URL", undefined);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
  setEnv("SUPABASE_SECRET_KEY", undefined);
  assert.equal(isSupabaseConfigured(), false);

  setEnv("SUPABASE_URL", "https://psjxfthrmqegxotokkdf.supabase.co");
  assert.equal(isSupabaseConfigured(), false);

  setEnv("SUPABASE_SECRET_KEY", "sb_secret_test");
  assert.equal(isSupabaseConfigured(), true);

  setEnv("SUPABASE_SECRET_KEY", undefined);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
  assert.equal(isSupabaseConfigured(), true);
} finally {
  restore();
}

console.log("supabase env tests passed");
