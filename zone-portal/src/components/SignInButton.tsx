"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("microsoft-entra-id")}
      className="mt-8 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-accent"
    >
      Sign in with Microsoft
    </button>
  );
}
