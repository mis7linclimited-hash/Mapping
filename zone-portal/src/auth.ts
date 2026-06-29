import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { getUserRecord } from "./lib/data";
import { logAudit } from "./lib/audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
  callbacks: {
    // Gate sign-in on the email being provisioned in UsersTable & Active.
    async signIn({ user }) {
      if (!user.email) return false;
      const record = await getUserRecord(user.email);
      if (!record || record.Status !== "Active") {
        await logAudit({
          actorEmail: user.email,
          actorRole: "Unknown",
          action: "LOGIN_DENIED",
          details: record ? "User is Disabled" : "Email not provisioned",
        });
        return false;
      }
      await logAudit({
        actorEmail: user.email,
        actorRole: record.Role,
        action: "LOGIN",
        details: "Signed in",
      });
      return true;
    },
    // Attach role + zones to the JWT right after a successful sign-in.
    async jwt({ token, user }) {
      if (user?.email) {
        const record = await getUserRecord(user.email);
        if (record) {
          token.role = record.Role;
          token.zones = record.Zones.split(",").map((z) => z.trim()).filter(Boolean);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "Admin" | "User";
        session.user.zones = (token.zones as string[]) ?? [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // our own landing page renders the "Sign in" button
  },
});
