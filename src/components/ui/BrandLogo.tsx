"use client";

import React from "react";
import { BookOpen } from "lucide-react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  tagline?: string;
  className?: string;
  align?: "center" | "left";
}

export function BrandLogo({
  size = "md",
  showTagline = true,
  tagline = "Bridging the gap between classrooms and students.",
  className = "",
  align = "center",
}: BrandLogoProps) {
  const isSm = size === "sm";
  const isMd = size === "md";
  const isLg = size === "lg";

  // Icon sizing
  const iconContainerSize = isSm
    ? "w-8 h-8 rounded-xl shadow-xs"
    : isMd
    ? "w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl shadow-sm shadow-emerald-700/20"
    : "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl shadow-xl shadow-emerald-950/25";

  const iconSize = isSm ? 16 : isMd ? 20 : 34;

  // Title sizing
  const titleSize = isSm
    ? "text-lg sm:text-xl"
    : isMd
    ? "text-2xl sm:text-3xl md:text-4xl"
    : "text-3xl sm:text-4xl md:text-5xl";

  const isCenter = align === "center";

  return (
    <div
      className={`select-none ${isCenter ? "flex flex-col items-center justify-center text-center" : "flex items-center gap-3 text-left"} ${className}`}
    >
      <div
        className={`${isCenter ? "inline-flex items-center justify-center gap-2.5 sm:gap-3" : "flex items-center gap-2.5 sm:gap-3"}`}
      >
        {/* Signature Green Logo Icon */}
        <div
          className={`${iconContainerSize} bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 flex items-center justify-center text-white ring-1 ring-emerald-500/25 dark:ring-emerald-400/30 shrink-0 transform transition-transform duration-300 hover:scale-105`}
        >
          <BookOpen
            size={iconSize}
            className="text-white drop-shadow-xs"
            strokeWidth={2.4}
          />
        </div>

        {/* Software Name: Consistent Text Style & Colour Across All Pages */}
        <h1
          className={`${titleSize} font-black tracking-tight leading-none text-stone-900 dark:text-white transition-colors`}
        >
          <span>Class</span>
          <span className="text-emerald-700 dark:text-emerald-400">Sync</span>
        </h1>
      </div>

      {showTagline && tagline && isCenter && (
        <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm font-medium mt-1.5 sm:mt-2 max-w-sm mx-auto tracking-normal">
          {tagline}
        </p>
      )}
    </div>
  );
}
