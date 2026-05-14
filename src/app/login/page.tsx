"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Globe, Mail, Lock, UserCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { 
    user, 
    loading, 
    signInWithGoogle, 
    loginAnonymously, 
    loginWithEmail, 
    registerWithEmail 
  } = useAuth();
  
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLocalLoading(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (error: any) {
      setAuthError(error.message || "Authentication failed");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setAuthError("");
    setLocalLoading(true);
    try {
      await loginAnonymously();
    } catch (error: any) {
      setAuthError(error.message || "Guest login failed");
    } finally {
      setLocalLoading(false);
    }
  };

  if (loading || (localLoading && !authError)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Globe className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-4xl font-black text-gray-900 tracking-tight">
            Travel Planner
          </h2>
          <p className="mt-2 text-gray-500 font-medium">
            Plan your adventures and track every penny.
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
            {authError}
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                required
                type="email"
                placeholder="Email address"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                required
                type="password"
                placeholder="Password"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all shadow-md active:scale-95"
            >
              {isRegistering ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-blue-600 font-semibold hover:underline"
            >
              {isRegistering ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Google Sign In */}
            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            {/* Anonymous Sign In */}
            <button
              onClick={handleAnonymousLogin}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              <UserCircle className="h-5 w-5 text-gray-400" />
              Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
