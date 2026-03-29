import { prisma } from "./prisma"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      avatar?: string | null;
    }
  }

  interface User {
    id: string;
    avatar?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    dbId?: string;
    avatar?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  // No adapter — we use JWT sessions and handle user creation manually.
  // PrismaAdapter caused OAuthAccountNotLinked errors due to version incompatibility.
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email", required: true },
        password: { label: "Password", type: "password", required: true },
        mode: { label: "Mode", type: "text" }, // signup | signin
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        if (credentials.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // ---------- SIGN IN ----------
        if (credentials.mode === "signin") {
          if (!user) {
            throw new Error("User not found");
          }

          // Handle Google-only users properly
          if (!user.password) {
            throw new Error("This account was created using Google. Please sign in with Google.");
          }

          const valid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!valid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email ?? undefined,
          };
        }

        // ---------- SIGN UP ----------
        if (credentials.mode === "signup") {
          if (!credentials.name) return null;
          if (user) {
            throw new Error("User already exists with this email");
          }

          const hashedPassword = await bcrypt.hash(
            credentials.password,
            10
          );

          const newUser = await prisma.user.create({
            data: {
              name: credentials.name,
              email: credentials.email,
              password: hashedPassword,
            },
          });

          return {
            id: newUser.id.toString(),
            name: newUser.name,
            email: newUser.email ?? undefined,
          };
        }

        return null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }: any) {
      console.log("DEBUG: signIn callback called", { email: user.email, provider: account?.provider });
      // For Google OAuth: find or create the user in our DB
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          console.log("DEBUG: Creating new user for Google sign-in", user.email);
          // Create new user for Google sign-in
          await prisma.user.create({
            data: {
              name: user.name ?? "Google User",
              email: user.email,
              image: user.image,
              avatar: user.image,
            },
          });
        } else {
          console.log("DEBUG: User already exists for Google sign-in", user.email);
        }
      }
      return true;
    },

    async jwt({ token, user, account }: any) {
      console.log("DEBUG: jwt callback called", { tokenId: token.dbId, userId: user?.id, provider: account?.provider });
      // On initial sign-in, resolve the DB user ID
      if (user && account) {
        if (account.provider === "credentials") {
          // Credentials provider: user.id is already the DB ID
          token.dbId = user.id.toString();
        }

        if (account.provider === "google") {
          // Google provider: look up (or just-created) DB user by email
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          if (dbUser) {
            token.dbId = dbUser.id.toString();
            console.log("DEBUG: Resolved Google user dbId", token.dbId);
          }
        }
      }

      // Fetch avatar from DB if not present in token
      if (token.dbId && !token.avatar) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.dbId },
          select: { avatar: true, image: true }
        })
        token.avatar = dbUser?.avatar || dbUser?.image
      }
      return token;
    },

    async session({ session, token }: any) {
      if (session.user && token.dbId) {
        session.user.id = token.dbId;
        session.user.avatar = token.avatar;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/Signin",
  }
};
