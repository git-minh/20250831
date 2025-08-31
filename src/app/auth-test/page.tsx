"use client";

import { useState } from "react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
} from "convex/react";
import { authClient } from "@/lib/auth-client";
import { api } from "../../../convex/_generated/api";

export default function AuthTest() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Better Auth Test</h1>
      <AuthLoading>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        ✅ Authentication successful!
      </div>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome!</h2>
        <div className="space-y-2">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {user?.name || "Not set"}</p>
          <p><strong>User ID:</strong> {user?.userId}</p>
          {user?.preferences && (
            <div>
              <p><strong>Theme:</strong> {user.preferences.theme}</p>
              <p><strong>Notifications:</strong> {user.preferences.notifications ? "Enabled" : "Disabled"}</p>
              <p><strong>Language:</strong> {user.preferences.language}</p>
            </div>
          )}
        </div>
      </div>
      <button 
        onClick={() => authClient.signOut()}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
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
            onError: (ctx) => {
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
            onError: (ctx) => {
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
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {showSignIn ? "Sign In" : "Sign Up"}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Please wait..." : (showSignIn ? "Sign in" : "Sign up")}
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