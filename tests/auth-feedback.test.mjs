import test from "node:test";
import assert from "node:assert/strict";
import { signInDestination, signInFailure } from "../lib/auth-feedback.mjs";
test("OAuth return path is restricted to the library or admin workspace", () => {
  assert.equal(signInDestination("/admin"), "/admin");
  assert.equal(signInDestination("/admin/settings"), "/admin");
  for (const path of [
    "/newsletter",
    "https://evil.invalid",
    "//evil.invalid",
    "/?next=//evil.invalid",
  ])
    assert.equal(signInDestination(path), "/");
});
test("Expired and cancelled sign-in links have safe actionable feedback", () => {
  assert.match(
    signInFailure("#error=access_denied&error_code=otp_expired"),
    /expired or was already used/,
  );
  assert.match(
    signInFailure("#error=access_denied&error_description=private-value"),
    /did not finish/,
  );
  assert(
    !signInFailure(
      "#error=access_denied&error_description=private-value",
    ).includes("private-value"),
  );
  assert.equal(signInFailure("#access_token=sensitive-value"), "");
});
