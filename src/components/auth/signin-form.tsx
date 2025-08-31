"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

interface SigninFormProps extends React.ComponentProps<"form"> {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export function SigninForm({ className, onSuccess, onSwitchToSignUp, ...props }: SigninFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await authClient.signIn.email(
        { email, password },
        {
          onError: (ctx) => {
            setError(ctx.error.message || "Invalid email or password");
          },
        }
      );

      onSuccess?.();

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your credentials to access your account
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            id="signin-email"
            name="email"
            type="email"
            placeholder="john@example.com"
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="signin-password">Password</Label>
            <button
              type="button"
              className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-primary"
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="signin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              disabled={loading}
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </div>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don&apos;t have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="underline underline-offset-4 hover:text-primary"
          disabled={loading}
        >
          Sign up
        </button>
      </div>
    </form>
  );
}