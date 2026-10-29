"use client";
import { SignInOptions } from "./sign-in-options";
export function StudioLogin() {
  return (
    <section className="studio-login workspace-panel">
      <h2>Admin sign-in</h2>
      <p>
        Continue with your admin Google account or get a sign-in link by email.
      </p>
      <SignInOptions />
    </section>
  );
}
