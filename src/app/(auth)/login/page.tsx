"use client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { login, userData, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && userData) {
      if (userData.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/student");
      }
    }
  }, [user, userData, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-transparent relative overflow-hidden">
        {/* Animated Background for Loading */}
        <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-indigo-100 opacity-70"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-screen overflow-hidden px-4">
      
      {/* Dynamic Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-teal-300/20 blur-[80px] animate-pulse" style={{ animationDelay: '4s' }}></div>

      <div className="w-full max-w-lg z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-10 animate-in slide-in-from-bottom-6 fade-in duration-700">
          <div className="relative mb-6 group cursor-default">
            <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 transform group-hover:scale-105 transition-transform duration-500 ring-1 ring-white/50">
              <LogIn size={36} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 drop-shadow-sm">
            ClassSync
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-sm mx-auto">
            The next-generation workspace for teachers and students.
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/60 bg-white/40 backdrop-blur-xl animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-150 fill-mode-both">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-800">Welcome Back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to continue to your dashboard</p>
          </div>
          
          <button
            onClick={login}
            className="group relative w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md overflow-hidden"
          >
            {/* Hover shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-100/50 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
            
            <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="relative z-10">Continue with Google</span>
          </button>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium max-w-[250px] mx-auto leading-relaxed">
              By securely logging in, you agree to ClassSync's Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
