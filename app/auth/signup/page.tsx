"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

function SignUpContent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    region: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [labelClickCount, setLabelClickCount] = useState(0);
  const [showAdminOption, setShowAdminOption] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const googleParam = searchParams.get('google');
    const emailParam = searchParams.get('email');
    const nameParam = searchParams.get('name');
    
    if (googleParam === 'true' && emailParam && nameParam) {
      setIsGoogleSignup(true);
      setFormData(prev => ({
        ...prev,
        name: decodeURIComponent(nameParam),
        email: decodeURIComponent(emailParam),
      }));
    }
  }, [searchParams]);

  const handleLabelClick = () => {
    const newCount = labelClickCount + 1;
    setLabelClickCount(newCount);
    
    if (newCount === 5) {
      setShowAdminOption(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    if (!formData.role) {
      setError("Please select an account type");
      setLoading(false);
      return;
    }

    if (!formData.region) {
      setError("Please select a region");
      setLoading(false);
      return;
    }

    if (!isGoogleSignup) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long");
        setLoading(false);
        return;
      }
    }

    if (!formData.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isGoogleSignup ? "/api/auth/google-register" : "/api/auth/register";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase(),
          region: formData.region,
          password: isGoogleSignup ? undefined : formData.password,
          role: formData.role,
          isGoogleSignup,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isGoogleSignup) {
          setSuccess("Account created successfully! Signing you in...");
          setTimeout(async () => {
            await signIn("google", { callbackUrl: "/" });
          }, 1000);
        } else {
          setSuccess("Account created successfully! Redirecting to sign in...");
          setTimeout(() => {
            router.push("/auth/signin");
          }, 2000);
        }
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isGoogleSignup ? "Complete Your Google Account Setup" : "Create NIMO Account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isGoogleSignup 
              ? "Please select your account type to continue" 
              : "Join the Foreign Employment Information Management System"
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                disabled={isGoogleSignup}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  isGoogleSignup ? 'bg-gray-100' : ''
                }`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={isGoogleSignup}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  isGoogleSignup ? 'bg-gray-100' : ''
                }`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                Region *
              </label>
              <select
                id="region"
                name="region"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.region}
                onChange={handleChange}
              >
                <option value="">Select your region</option>
                <option value="Central">Central Region</option>
                <option value="Eastern">Eastern Region</option>
                <option value="Western">Western Region</option>
              </select>
            </div>

            <div>
              <label 
                htmlFor="role" 
                className="block text-sm font-medium text-gray-700 cursor-pointer select-none"
                onClick={handleLabelClick}
              >
                Account Type *
              </label>
              <select
                id="role"
                name="role"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="">Select your account type</option>
                <option value="ForeignEmployee">Foreign Employee</option>
                <option value="MedicalOrganization">Medical Organization</option>
                {showAdminOption && (
                  <option value="Admin">Admin</option>
                )}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {showAdminOption 
                  ? "Select your account type. Admin option unlocked!" 
                  : "Select your account type. Admin accounts are created separately."
                }
              </p>
            </div>

            {!isGoogleSignup && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Create a password (min. 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isGoogleSignup ? "Setting up Account..." : "Creating Account...") 
                : (isGoogleSignup ? "Complete Setup" : "Create Account")
              }
            </button>
          </div>

          {!isGoogleSignup && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign up with Google
                </button>
              </div>
            </>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
export default function SignUp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading signup form...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}