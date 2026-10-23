import test from 'node:test';
import assert from 'node:assert/strict';

// Helper replicating the isSecureCookie and getAuthCookieOptions logic from auth-utils.ts
function isSecureCookie(req, env = process.env) {
  if (env.COOKIE_SECURE === "false") {
    return false;
  }
  if (env.COOKIE_SECURE === "true") {
    return true;
  }
  if (env.NODE_ENV !== "production") {
    return false;
  }
  if (req?.headers) {
    const proto = typeof req.headers.get === "function" ? req.headers.get("x-forwarded-proto") : req.headers["x-forwarded-proto"];
    if (proto) {
      return String(proto).split(",")[0].trim().toLowerCase() === "https";
    }
  }
  const appUrl = env.NEXTAUTH_URL || env.NEXT_PUBLIC_APP_URL || env.APP_URL;
  if (appUrl && appUrl.startsWith("http://")) {
    return false;
  }
  return false;
}

function getAuthCookieOptions(req, maxAgeSeconds = 90 * 24 * 60 * 60, env = process.env) {
  return {
    httpOnly: true,
    secure: isSecureCookie(req, env),
    sameSite: "lax",
    maxAge: maxAgeSeconds,
    path: "/"
  };
}

test('Cookie Security: In development, secure is always false', () => {
  const env = { NODE_ENV: 'development' };
  assert.equal(isSecureCookie(undefined, env), false);
  assert.equal(isSecureCookie({ headers: { 'x-forwarded-proto': 'https' } }, env), false);
});

test('Cookie Security: In production over plain HTTP (EC2 IP), secure is false by default', () => {
  const env = { NODE_ENV: 'production' };
  // No x-forwarded-proto header (plain HTTP request directly or forwarded via HTTP Nginx)
  const req = { headers: { get: (name) => null } };
  assert.equal(isSecureCookie(req, env), false);

  const opts = getAuthCookieOptions(req, 7776000, env);
  assert.equal(opts.secure, false);
  assert.equal(opts.httpOnly, true);
  assert.equal(opts.sameSite, 'lax');
  assert.equal(opts.path, '/');
});

test('Cookie Security: In production over HTTPS (Nginx SSL / ALB), secure is true', () => {
  const env = { NODE_ENV: 'production' };
  const req = { headers: { get: (name) => name === 'x-forwarded-proto' ? 'https' : null } };
  assert.equal(isSecureCookie(req, env), true);

  const opts = getAuthCookieOptions(req, 7776000, env);
  assert.equal(opts.secure, true);
});

test('Cookie Security: In production over multi-proxy HTTPS, secure is true', () => {
  const env = { NODE_ENV: 'production' };
  const req = { headers: { get: (name) => name === 'x-forwarded-proto' ? 'https, http' : null } };
  assert.equal(isSecureCookie(req, env), true);
});

test('Cookie Security: Explicit COOKIE_SECURE=false overrides everything', () => {
  const env = { NODE_ENV: 'production', COOKIE_SECURE: 'false' };
  const req = { headers: { get: (name) => 'https' } };
  assert.equal(isSecureCookie(req, env), false);
});

test('Cookie Security: Explicit COOKIE_SECURE=true overrides everything', () => {
  const env = { NODE_ENV: 'development', COOKIE_SECURE: 'true' };
  assert.equal(isSecureCookie(undefined, env), true);
});

test('Cookie Security: APP_URL=http://... forces secure=false in production', () => {
  const env = { NODE_ENV: 'production', APP_URL: 'http://13.206.229.179' };
  const req = { headers: { get: (name) => null } };
  assert.equal(isSecureCookie(req, env), false);
});
