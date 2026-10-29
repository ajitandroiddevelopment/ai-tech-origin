export function signInDestination(pathname) {
  return pathname.startsWith("/admin") ? "/admin" : "/";
}
export function signInFailure(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.get("error_code") === "otp_expired")
    return "That email link has expired or was already used. Request a new link below and open only the latest email.";
  if (params.has("error"))
    return "Sign-in did not finish. Please try Google or request a new email link.";
  return "";
}
