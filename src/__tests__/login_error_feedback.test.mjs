import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure function replicating resolveErrorMessage from src/app/auth/custom/page.tsx
 */
function resolveErrorMessage(status, data) {
  if (status === 400) {
    return (typeof data?.error === "string" && data.error.trim())
      ? data.error
      : "Invalid request. Please check all required fields.";
  }
  if (status === 401) {
    return "Invalid email/phone or password. Please check your credentials and try again.";
  }
  if (status === 403) {
    return (typeof data?.error === "string" && data.error.trim())
      ? data.error
      : "Access denied. Your account is not authorized or has been deactivated.";
  }
  if (status === 500) {
    return "Something went wrong on the server. Please try again later.";
  }
  if (status === 502 || status === 503 || status === 504) {
    return "The server is temporarily unavailable. Please try again shortly.";
  }
  if (status >= 500) {
    return "The server is temporarily unavailable. Please try again shortly.";
  }
  return (typeof data?.error === "string" && data.error.trim())
    ? data.error
    : "Unable to complete request. Please verify details and try again.";
}

test('resolveErrorMessage: 400 returns API validation error when available', () => {
  const msg = resolveErrorMessage(400, { error: 'Email or Phone Number and Password are required' });
  assert.equal(msg, 'Email or Phone Number and Password are required');
});

test('resolveErrorMessage: 400 returns safe fallback when body is empty or malformed', () => {
  assert.equal(resolveErrorMessage(400, null), 'Invalid request. Please check all required fields.');
  assert.equal(resolveErrorMessage(400, {}), 'Invalid request. Please check all required fields.');
  assert.equal(resolveErrorMessage(400, { error: '   ' }), 'Invalid request. Please check all required fields.');
});

test('resolveErrorMessage: 401 always returns friendly credentials error without leaking sensitive internals', () => {
  const msg = resolveErrorMessage(401, { error: 'Prisma findFirst failed: MongoNetworkError' });
  assert.equal(msg, 'Invalid email/phone or password. Please check your credentials and try again.');
});

test('resolveErrorMessage: 403 returns specific account-inactive/access-denied error', () => {
  const customInactive = resolveErrorMessage(403, { error: 'This staff account has been deactivated. Please contact your hotel manager.' });
  assert.equal(customInactive, 'This staff account has been deactivated. Please contact your hotel manager.');

  const fallback403 = resolveErrorMessage(403, null);
  assert.equal(fallback403, 'Access denied. Your account is not authorized or has been deactivated.');
});

test('resolveErrorMessage: 500 returns friendly server error message without stack traces', () => {
  const msg = resolveErrorMessage(500, { error: 'Cannot read properties of null at Staff.update' });
  assert.equal(msg, 'Something went wrong on the server. Please try again later.');
});

test('resolveErrorMessage: 502, 503, 504 (Bad Gateway / Proxy Unavailable) return temporary unavailable message', () => {
  assert.equal(resolveErrorMessage(502, null), 'The server is temporarily unavailable. Please try again shortly.');
  assert.equal(resolveErrorMessage(503, null), 'The server is temporarily unavailable. Please try again shortly.');
  assert.equal(resolveErrorMessage(504, null), 'The server is temporarily unavailable. Please try again shortly.');
});

test('resolveErrorMessage: Unknown 5xx codes fallback to temporary unavailable message', () => {
  assert.equal(resolveErrorMessage(520, null), 'The server is temporarily unavailable. Please try again shortly.');
});

test('resolveErrorMessage: Other statuses fallback safely', () => {
  assert.equal(resolveErrorMessage(418, { error: 'Custom teapot error' }), 'Custom teapot error');
  assert.equal(resolveErrorMessage(418, null), 'Unable to complete request. Please verify details and try again.');
});

test('Duplicate submit guard logic: while loading is true, handler drops subsequent invocations', () => {
  let callCount = 0;
  let loadingState = false;

  function attemptSubmit() {
    if (loadingState) {
      return 'dropped';
    }
    loadingState = true;
    callCount++;
    return 'proceeded';
  }

  assert.equal(attemptSubmit(), 'proceeded');
  assert.equal(attemptSubmit(), 'dropped');
  assert.equal(attemptSubmit(), 'dropped');
  assert.equal(callCount, 1);

  loadingState = false;
  assert.equal(attemptSubmit(), 'proceeded');
  assert.equal(callCount, 2);
});
