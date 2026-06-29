import { Role } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      // Our signIn callback rejects sign-in when email is missing, so by the
      // time a session exists, email is guaranteed to be a real string.
      email: string;
      image?: string | null;
      role: Role;
      zones: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    zones?: string[];
  }
}
