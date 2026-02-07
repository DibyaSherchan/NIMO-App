// Re-export NextAuth route handlers (GET & POST)
// This file acts as a thin bridge between Next.js App Router
// and the authentication logic defined in /lib/auth
import { handlers } from "@/lib/auth";

// Expose handlers so Next.js can route auth requests correctly
export const { GET, POST } = handlers;
