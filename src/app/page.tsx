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
    <div className="min-h-screen flex items-center justify-center bg-[#dfe8df]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-emerald-200 rounded-full mb-4"></div>
        <div className="h-4 w-24 bg-stone-300 rounded"></div>
      </div>
    </div>
  );
}
