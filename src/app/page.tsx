"use client";

import { useState } from "react";
import { GalleryVerticalEnd, Zap, Database, Shield, Palette } from "lucide-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useRouter } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { SigninForm } from "@/components/auth/signin-form";

export default function HomePage() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuthSuccess = () => {
    setShowAuth(false);
    router.push("/dashboard");
  };

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="flex h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              Fullstack Boilerplate
            </div>
            
            <div className="flex gap-2">
              <Unauthenticated>
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setShowAuth(true);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Sign In
                </button>
              </Unauthenticated>
              
              <Authenticated>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Dashboard
                </button>
              </Authenticated>
            </div>
          </header>

          {/* Hero Section */}
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Modern Fullstack
              <br />
              <span className="text-primary">Boilerplate</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Everything you need to build production-ready web applications. 
              Authentication, database, UI components, and deployment ready.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Unauthenticated>
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setShowAuth(true);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
                >
                  Get Started
                </button>
              </Unauthenticated>
              
              <Authenticated>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </Authenticated>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Modern Stack</h3>
              <p className="text-muted-foreground">
                Next.js 15, React 19, TypeScript, and Tailwind CSS for cutting-edge development.
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Database Ready</h3>
              <p className="text-muted-foreground">
                Convex backend with real-time data sync and serverless functions out of the box.
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Auth & Security</h3>
              <p className="text-muted-foreground">
                Complete authentication system with secure user management and session handling.
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Beautiful UI</h3>
              <p className="text-muted-foreground">
                Shadcn/ui components with responsive design and dark mode support.
              </p>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center mt-20 pt-8 border-t border-white/20">
            <p className="text-muted-foreground">
              Built with modern web technologies for developers who want to ship fast.
            </p>
          </footer>
        </div>
      </div>

      {/* Auth Modal Overlay */}
      {showAuth && (
        <Unauthenticated>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-8 w-full max-w-md relative">
              <button
                onClick={() => setShowAuth(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
              
              {isSignUp ? (
                <SignupForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToSignIn={() => setIsSignUp(false)}
                />
              ) : (
                <SigninForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToSignUp={() => setIsSignUp(true)}
                />
              )}
            </div>
          </div>
        </Unauthenticated>
      )}
    </>
  );
}