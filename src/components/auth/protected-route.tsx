"use client";

import { ReactNode } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useRouter } from "next/navigation";
import { GalleryVerticalEnd } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();

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

      <Unauthenticated>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-md text-center p-6">
              <div className="flex items-center gap-2 font-medium justify-center mb-6">
                <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                Fullstack Boilerplate
              </div>
              <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
              <p className="text-muted-foreground mb-6">
                You need to sign in to access this page.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/auth")}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md font-medium"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        )}
      </Unauthenticated>

      <Authenticated>
        {children}
      </Authenticated>
    </>
  );
}