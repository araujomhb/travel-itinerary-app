"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, Lock, UserCircle, Loader2, Map as MapIcon, Compass, Sparkles } from "lucide-react";

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

  const handleGoogleLogin = async () => {
    setAuthError("");
    setLocalLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/popup-blocked") {
        setAuthError("Popup blocked! Try the 'Sign in with Redirect' button below or check your browser settings.");
      } else {
        setAuthError(error.message || "Google login failed. Please try again.");
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleRedirect = async () => {
    const { signInWithRedirect } = await import("firebase/auth");
    const { auth, googleProvider } = await import("@/lib/firebase");
    setAuthError("");
    setLocalLoading(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      setAuthError("Redirect failed: " + error.message);
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
      setLocalLoading(false);
    }
  };

  if (loading || (localLoading && !authError)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Texture / Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
      
      <div className="w-full max-w-md space-y-10 rounded-[2rem] bg-white p-12 shadow-[0_32px_64px_-16px_rgba(45,55,72,0.1)] border border-stone-200 relative z-10">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-stone-800 text-stone-100 shadow-xl shadow-stone-200 mb-6">
            <Compass className="h-12 w-12" />
          </div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight">
            Explorer
          </h2>
          <p className="mt-3 text-stone-400 font-medium">
            Discover the world, one pin at a time.
          </p>
        </div>

        {authError && (
          <div className="space-y-4">
            <div className="bg-orange-50 text-orange-700 p-4 rounded-xl text-sm font-semibold border border-orange-100 text-center">
              {authError}
            </div>
            {authError.includes("Popup blocked") && (
              <button
                onClick={handleGoogleRedirect}
                className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100"
              >
                Try Redirect Method
              </button>
            )}
          </div>
        )}

        <div className="space-y-6">
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  className="block w-full pl-11 pr-4 py-4 border border-stone-200 rounded-2xl bg-stone-50 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-800 placeholder:text-stone-300 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  required
                  type="password"
                  placeholder="Password"
                  className="block w-full pl-11 pr-4 py-4 border border-stone-200 rounded-2xl bg-stone-50 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-800 placeholder:text-stone-300 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-stone-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-stone-800 transition-all shadow-lg active:scale-[0.98] tracking-tight"
            >
              {isRegistering ? "Start Journey" : "Continue Journey"}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
            >
              {isRegistering ? "Already an explorer? Sign In" : "New here? Create an account"}
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em] text-stone-300 bg-white px-4">
              Or
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            <button
              onClick={handleAnonymousLogin}
              className="flex items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
            >
              <UserCircle className="h-5 w-5 text-stone-400" />
              Guest
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-2 text-stone-400 text-sm font-medium animate-pulse">
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <span>Ready for your next adventure?</span>
      </div>
    </div>
  );
}
