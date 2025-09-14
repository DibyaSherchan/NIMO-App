import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Log from "@/models/Log";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { NextApiRequest } from "next";
import { AdapterUser } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import { Session, User as NextAuthUser } from "next-auth";

interface SignInParams {
  user: NextAuthUser | AdapterUser;
  account: { provider: string; providerAccountId: string } | null;
  profile?: unknown;
  email?: { verificationRequest?: boolean };
  credentials?: Record<string, unknown>;
  req?: NextApiRequest;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const userAgent = req?.headers?.['user-agent'] || 'unknown';

        if (!credentials?.email || !credentials.password) {
          await Log.create({
            logId: uuidv4(),
            action: "LOGIN_FAILURE",
            userRole: "anonymous",
            userAgent,
            details: {
              reason: "MISSING_CREDENTIALS",
              provider: "credentials"
            }
          });
          return null;
        }

        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user || !user.password) {
          await Log.create({
            logId: uuidv4(),
            action: "LOGIN_FAILURE",
            userRole: "anonymous",
            userAgent,
            details: {
              reason: "USER_NOT_FOUND",
              provider: "credentials",
              attemptedEmail: credentials.email.toLowerCase()
            }
          });
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          await Log.create({
            logId: uuidv4(),
            action: "LOGIN_FAILURE",
            userId: user._id,
            userRole: user.role,
            userAgent,
            details: {
              reason: "INVALID_PASSWORD",
              provider: "credentials",
              attemptedEmail: credentials.email.toLowerCase()
            }
          });
          return null;
        }

        await Log.create({
          logId: uuidv4(),
          action: "LOGIN_SUCCESS",
          userId: user._id,
          userRole: user.role,
          userAgent,
          details: {
            provider: "credentials",
            method: "direct_login"
          }
        });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn(params: SignInParams) {
      const { user, account, req } = params;
      const userAgent = req?.headers?.['user-agent'] || 'unknown';

      if (account?.provider === "google") {
        try {
          await connectDB();
          const existingUser = await User.findOne({
            $or: [
              { email: user.email },
              { googleId: account.providerAccountId },
            ],
          });

          if (existingUser) {
            await Log.create({
              logId: uuidv4(),
              action: "LOGIN_SUCCESS",
              userId: existingUser._id,
              userRole: existingUser.role,
              userAgent,
              details: {
                provider: "google",
                method: "existing_account"
              }
            });
            
            existingUser.lastLogin = new Date();
            if (!existingUser.googleId) {
              existingUser.googleId = account.providerAccountId;
              existingUser.authProvider = "google";
            }
            await existingUser.save();
            // Use type assertion for the role property
            (user as any).role = existingUser.role;
            user.id = existingUser._id.toString();
            return true; 
          } else {
            await Log.create({
              logId: uuidv4(),
              action: "LOGIN_REDIRECT_TO_SIGNUP",
              userRole: "anonymous",
              userAgent,
              details: {
                provider: "google",
                reason: "NEW_USER_REDIRECT",
                email: user.email,
                name: user.name
              }
            });
            
            return `/auth/signup?google=true&email=${encodeURIComponent(
              user.email!
            )}&name=${encodeURIComponent(user.name!)}`;
          }
        } catch (error) {
          await Log.create({
            logId: uuidv4(),
            action: "LOGIN_FAILURE",
            userRole: "anonymous",
            userAgent,
            details: {
              provider: "google",
              reason: "SERVER_ERROR",
              error: error instanceof Error ? error.message : "Unknown error"
            }
          });
          
          console.error("Error during Google sign in:", error);
          return false;
        }
      }
      return true; 
    },

    async jwt({ token, user, account }) {
      if (user) {
        // Use type assertion for the role property
        token.role = (user as any).role;
        token.id = user.id;
      }
      if (account?.provider === "google" && !token.role) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser._id.toString();
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};