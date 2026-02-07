import NextAuth, { DefaultSession } from "next-auth";
import type { NextAuthConfig, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Log from "@/models/Log";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// Extend NextAuth types to include custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;      // Add user ID to session
      role?: string;    // Add role to session
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;      // Add role to JWT token
    id?: string;        // Add user ID to JWT token
  }
}

// Custom user type with role property
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

// Main NextAuth configuration
export const authConfig: NextAuthConfig = {
  providers: [
    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Email/password credentials provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate that credentials are provided
        if (!credentials?.email || !credentials.password) {
          await Log.create({
            logId: uuidv4(),
            action: "LOGIN_FAILURE",
            userRole: "anonymous",
            details: {
              reason: "MISSING_CREDENTIALS",
              provider: "credentials"
            }
          });
          return null;
        }

        // Connect to database and find user
        await connectDB();
        const user = await User.findOne({ 
          email: (credentials.email as string).toLowerCase() 
        });

        // Handle user not found
        if (!user || !user.password) {
          await Log.create({
            logId: uuidv4(),
            action: "LOGIN_FAILURE",
            userRole: "anonymous",
            details: {
              reason: "USER_NOT_FOUND",
              provider: "credentials",
              attemptedEmail: (credentials.email as string).toLowerCase()
            }
          });
          return null;
        }

        // Validate password
        const isValid = await bcrypt.compare(
          credentials.password as string, 
          user.password
        );
        if (!isValid) {
          await Log.create({
            logId: uuidv4(),
            action: "LOGIN_FAILURE",
            userId: user._id,
            userRole: user.role,
            details: {
              reason: "INVALID_PASSWORD",
              provider: "credentials",
              attemptedEmail: (credentials.email as string).toLowerCase()
            }
          });
          return null;
        }

        // Log successful login
        await Log.create({
          logId: uuidv4(),
          action: "LOGIN_SUCCESS",
          userId: user._id,
          userRole: user.role,
          details: {
            provider: "credentials",
            method: "direct_login"
          }
        });

        // Return user object with required fields
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  // Use JWT for session management
  session: { strategy: "jwt" },

  // Callbacks for customizing authentication flow
  callbacks: {
    // Handle sign-in logic
    async signIn({ user, account }) {
      // Special handling for Google OAuth
      if (account?.provider === "google") {
        try {
          await connectDB();
          
          // Check if user exists by email or Google ID
          const existingUser = await User.findOne({
            $or: [
              { email: user.email },
              { googleId: account.providerAccountId },
            ],
          });

          if (existingUser) {
            // Log successful login for existing user
            await Log.create({
              logId: uuidv4(),
              action: "LOGIN_SUCCESS",
              userId: existingUser._id,
              userRole: existingUser.role,
              details: {
                provider: "google",
                method: "existing_account"
              }
            });
            
            // Update user's last login and link Google account if needed
            existingUser.lastLogin = new Date();
            if (!existingUser.googleId) {
              existingUser.googleId = account.providerAccountId;
              existingUser.authProvider = "google";
            }
            await existingUser.save();
            
            // Add role and ID to user object
            (user as ExtendedUser).role = existingUser.role;
            user.id = existingUser._id.toString();
            return true; // Allow sign-in
          } else {
            // New Google user - redirect to sign-up page
            await Log.create({
              logId: uuidv4(),
              action: "LOGIN_REDIRECT_TO_SIGNUP",
              userRole: "anonymous",
              details: {
                provider: "google",
                reason: "NEW_USER_REDIRECT",
                email: user.email,
                name: user.name
              }
            });
            
            // Redirect to sign-up with pre-filled Google data
            return `/auth/signup?google=true&email=${encodeURIComponent(
              user.email || ""
            )}&name=${encodeURIComponent(user.name || "")}`;
          }
        } catch (error) {
          // Log and handle errors during Google sign-in
          await Log.create({
            logId: uuidv4(),
            action: "LOGIN_FAILURE",
            userRole: "anonymous",
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
      return true; // Allow other providers
    },

    // Add custom data to JWT token
    async jwt({ token, user, account }) {
      // Add role and ID from user object to token
      if (user) {
        token.role = (user as ExtendedUser).role;
        token.id = user.id;
      }
      // For Google users, fetch role from database if not in token
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

    // Add custom data to session from token
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  // Custom page paths
  pages: {
    signIn: "/auth/signin", // Custom sign-in page
  },
};

// Export NextAuth functions for use in the app
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);