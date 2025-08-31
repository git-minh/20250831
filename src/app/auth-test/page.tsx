"use client";

import { useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { api } from "../../../convex/_generated/api";

export default function AuthTest() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="mb-8 text-3xl font-bold">Better Auth Test</h1>
      <AuthLoading>
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </div>
  );
}

function Dashboard() {
  const user = useQuery(api.auth.getCurrentUser);

  return (
    <div className="space-y-4">
      <div className="rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
        ✅ Authentication successful!
      </div>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Welcome!</h2>
        <div className="space-y-2">
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Name:</strong> {user?.name || "Not set"}
          </p>
          <p>
            <strong>User ID:</strong> {user?.userId}
          </p>
          {user?.preferences && (
            <div>
              <p>
                <strong>Theme:</strong> {user.preferences.theme}
              </p>
              <p>
                <strong>Notifications:</strong>{" "}
                {user.preferences.notifications ? "Enabled" : "Disabled"}
              </p>
              <p>
                <strong>Language:</strong> {user.preferences.language}
              </p>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => authClient.signOut()}
        className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
      >
        Sign out
      </button>
    </div>
  );
}

function SignIn() {
  const [showSignIn, setShowSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      if (showSignIn) {
        await authClient.signIn.email(
          {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
          },
          {
            onError: ctx => {
              setError(ctx.error.message);
            },
          }
        );
      } else {
        await authClient.signUp.email(
          {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
          },
          {
            onError: ctx => {
              setError(ctx.error.message);
            },
          }
        );
      }
    } catch (err) {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-center text-2xl font-bold">{showSignIn ? "Sign In" : "Sign Up"}</h2>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!showSignIn && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              type="text"
              placeholder="Your name"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          {loading ? "Please wait..." : showSignIn ? "Sign in" : "Sign up"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <span className="text-sm text-gray-600">
          {showSignIn ? "Don't have an account? " : "Already have an account? "}
        </span>
        <button
          onClick={() => setShowSignIn(!showSignIn)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {showSignIn ? "Sign up" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
