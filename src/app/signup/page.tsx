"use client";

import { useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignupForm } from "@/components/auth/signup-form";
import { SigninForm } from "@/components/auth/signin-form";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CheckCircle, LogOut, User } from "lucide-react";

export default function SignupPage() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Authentication Demo</h1>
          <p className="text-muted-foreground mt-2">Minimalist signup & signin experience</p>
        </div>

        <AuthLoading>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        </AuthLoading>

        <Unauthenticated>
          <div className="mx-auto max-w-md">
            <div className="rounded-lg border bg-card p-8 shadow-sm">
              {showSignIn ? (
                <SigninForm 
                  onSuccess={() => {
                    // Authentication successful - Convex handles the state change
                  }}
                  onSwitchToSignUp={() => setShowSignIn(false)}
                />
              ) : (
                <SignupForm 
                  onSuccess={() => {
                    // Registration successful - Convex handles the state change
                  }}
                  onSwitchToSignIn={() => setShowSignIn(true)}
                />
              )}
            </div>

            {/* Features showcase */}
            <div className="mt-8 rounded-lg bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">UI/UX Features</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Minimalist design with clear visual hierarchy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Real-time validation and error handling</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Password visibility toggle for better UX</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Loading states and success animations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Proper accessibility with labels and autocomplete</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Responsive design for all screen sizes</span>
                </div>
              </div>
            </div>
          </div>
        </Unauthenticated>

        <Authenticated>
          <div className="mx-auto max-w-md">
            <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <User className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <h2 className="mb-2 text-2xl font-bold">You&apos;re signed in!</h2>
              <p className="mb-6 text-muted-foreground">
                The authentication flow completed successfully.
              </p>

              <div className="space-y-4">
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                  ✨ Authentication state is managed by Convex + Better Auth
                </div>

                <Button 
                  onClick={() => authClient.signOut()}
                  variant="outline" 
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>

            {/* Demo actions */}
            <div className="mt-6 rounded-lg bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">Test the Flow</h3>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Try signing out and creating a new account, or signing in with existing credentials 
                  to test the complete authentication experience.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.location.href = '/auth-test'}
                    variant="secondary"
                    size="sm"
                  >
                    View Auth Test Page
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/dashboard'}
                    variant="secondary"
                    size="sm"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Authenticated>
      </div>
    </div>
  );
}