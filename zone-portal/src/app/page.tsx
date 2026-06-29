import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/SignInButton";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "Admin" ? "/admin/approvals" : "/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto mb-6 h-10 w-10 rounded-full bg-ink" aria-hidden />
        <h1 className="text-2xl font-semibold text-ink">Zone Portal</h1>
        <p className="mt-2 text-sm text-muted">
          Distributor data, scoped to your Zone. Sign in with your work account to continue.
        </p>
        <SignInButton />
        <p className="mt-6 text-xs text-muted">
          Access is provisioned by your Admin. If your sign-in is rejected, ask
          them to add your email and Zone.
        </p>
      </div>
    </main>
  );
}
