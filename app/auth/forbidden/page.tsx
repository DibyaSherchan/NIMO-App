"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

/**
 * Forbidden component - shown when user doesn't have access to a page
 * Provides options to go to correct dashboard or return home
 */
export default function Forbidden() {
  // Get current user session data
  const { data: session } = useSession();

  // Determine dashboard URL based on user role
  const getRoleBasedRedirect = (role: string) => {
    switch (role) {
      case "Admin":
        return "/dashboard/admin";
      case "Agent":
        return "/dashboard/agent";
      case "ForeignEmployee":
        return "/dashboard/foreign";
      case "MedicalOrg":
        return "/dashboard/medical";
      default:
        return "/"; // Fallback to home
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Access denied icon */}
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          {/* Access denied message */}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
          {/* Show user's current role if available */}
          {session?.user?.role && (
            <p className="mt-1 text-xs text-gray-500">
              Your current role: {session.user.role}
            </p>
          )}
        </div>

        {/* Navigation options */}
        <div className="mt-8 space-y-4">
          {/* Show dashboard link if user has a role */}
          {session?.user?.role && (
            <Link
              href={getRoleBasedRedirect(session.user.role)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to My Dashboard
            </Link>
          )}

          {/* Home link for all users */}
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Home
          </Link>

          {/* Sign out button */}
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard Title</h1>
            <button
              onClick={() => signOut()}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}