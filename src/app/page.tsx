"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Basic redirect. The AuthProvider inside login handles intelligent routing 
    // when authenticated, so we can just send everyone to login by default.
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dfe8df] dark:bg-[#09130e] transition-colors">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 rounded-2xl shadow-lg shadow-emerald-900/30 mb-4 flex items-center justify-center"></div>
        <div className="h-4 w-24 bg-stone-300 dark:bg-[#16231b] rounded-full"></div>
      </div>
    </div>
  );
}
