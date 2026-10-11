"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface SuitcaseTransitionOverlayProps {
  isActive: boolean;
  targetIata?: string;
  targetCity?: string;
  onComplete: () => void;
}

export function SuitcaseTransitionOverlay({
  isActive,
  targetIata = "ZRH",
  targetCity = "Zurich",
  onComplete,
}: SuitcaseTransitionOverlayProps) {
  const [stage, setStage] = useState<"enter" | "settle" | "fly">("enter");

  useEffect(() => {
    if (!isActive) {
      setStage("enter");
      return;
    }

    setStage("enter");

    // After coming up from bottom, shake in place
    const settleTimer = setTimeout(() => {
      setStage("settle");
    }, 450);

    // After shake, launch straight up (no fade)
    const flyTimer = setTimeout(() => {
      setStage("fly");
    }, 1050);

    // When suitcase has flown off top, trigger page navigation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1450);

    return () => {
      clearTimeout(settleTimer);
      clearTimeout(flyTimer);
      clearTimeout(completeTimer);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div
      key="suitcase-portal-overlay"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1C1917]/80 backdrop-blur-md overflow-hidden pointer-events-auto select-none"
    >
        {/* Soft Ambient Radial Glow */}
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-black/35 pointer-events-none" />

        {/* Speed Wind Streaks & Trail (Appears as it rockets up) */}
        {stage === "fly" && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.85, 0], y: 140 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute top-1/2 -translate-y-1/2 flex items-center gap-6 pointer-events-none z-10"
          >
            <div className="w-1 h-32 bg-gradient-to-t from-transparent via-amber-400 to-transparent rounded-full opacity-70" />
            <div className="w-1.5 h-44 bg-gradient-to-t from-transparent via-amber-300 to-transparent rounded-full opacity-90 -translate-y-4" />
            <div className="w-1 h-28 bg-gradient-to-t from-transparent via-orange-400 to-transparent rounded-full opacity-60" />
          </motion.div>
        )}

        {/* The Cute Suitcase Character — enter → shake → fly up (stay opaque) */}
        <motion.div
          animate={
            stage === "enter"
              ? { y: 0, x: 0, scale: 1, rotate: -2, opacity: 1 }
              : stage === "settle"
              ? {
                  x: [0, -10, 10, -8, 8, -4, 4, 0],
                  rotate: [-2, -8, 8, -6, 6, -3, 3, 0],
                  y: 0,
                  scale: 1,
                  opacity: 1,
                }
              : {
                  y: "-130vh",
                  x: 0,
                  scale: 1.05,
                  rotate: -8,
                  opacity: 1,
                }
          }
          initial={{ y: "110vh", x: 0, scale: 0.75, rotate: 6, opacity: 0 }}
          transition={
            stage === "enter"
              ? { type: "spring", damping: 18, stiffness: 140, duration: 0.45 }
              : stage === "settle"
              ? { duration: 0.55, ease: "easeInOut" }
              : { duration: 0.4, ease: [0.55, 0.0, 0.9, 0.35] }
          }
          className="relative z-20 flex flex-col items-center cursor-default"
        >
          {/* Custom Illustrated Cute Suitcase SVG */}
          <div className="relative filter drop-shadow-2xl">
            <svg
              width="230"
              height="180"
              viewBox="0 0 230 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible"
            >
              <defs>
                {/* Vintage Leather Gradient */}
                <linearGradient id="leatherGrad" x1="0" y1="36" x2="230" y2="160" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="45%" stopColor="#B45309" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>

                {/* Strap Leather Gradient */}
                <linearGradient id="strapGrad" x1="0" y1="36" x2="0" y2="160" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#78350F" />
                  <stop offset="100%" stopColor="#451A03" />
                </linearGradient>

                {/* Brass Hardware Gradient */}
                <linearGradient id="brassGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>

              {/* 1. Leather Top Handle */}
              <g className="transition-transform duration-300">
                {/* Left Brass Bracket */}
                <rect x="78" y="24" width="12" height="14" rx="3" fill="url(#brassGrad)" stroke="#78350F" strokeWidth="1" />
                {/* Right Brass Bracket */}
                <rect x="140" y="24" width="12" height="14" rx="3" fill="url(#brassGrad)" stroke="#78350F" strokeWidth="1" />

                {/* Arched Leather Handle */}
                <path
                  d="M 84 28 C 84 6, 146 6, 146 28"
                  fill="none"
                  stroke="#451A03"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                {/* Handle Inset Stitch Highlight */}
                <path
                  d="M 86 28 C 86 11, 144 11, 144 28"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
              </g>

              {/* 2. Main Suitcase Trunk Body */}
              <rect
                x="20"
                y="36"
                width="190"
                height="124"
                rx="24"
                fill="url(#leatherGrad)"
                stroke="#451A03"
                strokeWidth="2.5"
              />

              {/* Top Embossed Highlight Rim */}
              <rect
                x="24"
                y="40"
                width="182"
                height="116"
                rx="20"
                fill="none"
                stroke="#FDE68A"
                strokeWidth="1"
                opacity="0.3"
              />

              {/* Decorative Inset Stitch Line */}
              <rect
                x="28"
                y="44"
                width="174"
                height="108"
                rx="16"
                fill="none"
                stroke="#FEF3C7"
                strokeWidth="1.5"
                strokeDasharray="4 3.5"
                opacity="0.75"
              />

              {/* Center Seam / Trunk Opening Line */}
              <line x1="20" y1="98" x2="210" y2="98" stroke="#451A03" strokeWidth="3" />
              <line x1="20" y1="98" x2="210" y2="98" stroke="#FDE68A" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />

              {/* Center Brass Trunk Keylock */}
              <rect x="108" y="92" width="14" height="13" rx="3" fill="url(#brassGrad)" stroke="#78350F" strokeWidth="1" />
              <circle cx="115" cy="98" r="2" fill="#451A03" />

              {/* 3. Dual Vertical Leather Harness Straps */}
              {/* Left Harness Strap */}
              <g>
                <rect x="62" y="36" width="18" height="124" fill="url(#strapGrad)" />
                <line x1="64" y1="36" x2="64" y2="160" stroke="#FDE68A" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
                <line x1="78" y1="36" x2="78" y2="160" stroke="#FDE68A" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
                {/* Buckle */}
                <rect x="59" y="91" width="24" height="14" rx="3" fill="url(#brassGrad)" stroke="#451A03" strokeWidth="1.2" />
                <rect x="65" y="95" width="12" height="6" rx="1.5" fill="#451A03" />
              </g>

              {/* Right Harness Strap */}
              <g>
                <rect x="150" y="36" width="18" height="124" fill="url(#strapGrad)" />
                <line x1="152" y1="36" x2="152" y2="160" stroke="#FDE68A" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
                <line x1="166" y1="36" x2="166" y2="160" stroke="#FDE68A" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
                {/* Buckle */}
                <rect x="147" y="91" width="24" height="14" rx="3" fill="url(#brassGrad)" stroke="#451A03" strokeWidth="1.2" />
                <rect x="153" y="95" width="12" height="6" rx="1.5" fill="#451A03" />
              </g>

              {/* 4. Reinforced Leather Corner Guards with Brass Studs */}
              {/* Top Left */}
              <path d="M 20 58 L 20 44 C 20 39.5, 23.5 36, 28 36 L 42 36 Z" fill="#451A03" />
              <circle cx="28" cy="44" r="2.2" fill="url(#brassGrad)" />
              {/* Top Right */}
              <path d="M 210 58 L 210 44 C 210 39.5, 206.5 36, 202 36 L 188 36 Z" fill="#451A03" />
              <circle cx="202" cy="44" r="2.2" fill="url(#brassGrad)" />
              {/* Bottom Left */}
              <path d="M 20 138 L 20 152 C 20 156.5, 23.5 160, 28 160 L 42 160 Z" fill="#451A03" />
              <circle cx="28" cy="152" r="2.2" fill="url(#brassGrad)" />
              {/* Bottom Right */}
              <path d="M 210 138 L 210 152 C 210 156.5, 206.5 160, 202 160 L 188 160 Z" fill="#451A03" />
              <circle cx="202" cy="152" r="2.2" fill="url(#brassGrad)" />

              {/* 5. Cute Travel Stickers on Trunk */}
              {/* Sticker 1: Circular Compass Stamp */}
              <g transform="translate(90, 52) rotate(-8)">
                <circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 2" />
                <circle cx="16" cy="16" r="12" fill="#DBEAFE" />
                <polygon points="16,6 20,16 16,14 12,16" fill="#2563EB" />
                <polygon points="16,26 20,16 16,18 12,16" fill="#93C5FD" />
              </g>

              {/* Sticker 2: Verified Stamp Badge */}
              <g transform="translate(108, 120) rotate(6)">
                <rect x="0" y="0" width="34" height="18" rx="4" fill="#2D5A46" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="17" y="12" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                  READY
                </text>
              </g>

              {/* 6. Cute Little Bottom Wheels */}
              {/* Left Wheel */}
              <rect x="42" y="156" width="15" height="11" rx="4" fill="#1C1917" stroke="#451A03" strokeWidth="1" />
              <circle cx="49.5" cy="161.5" r="3" fill="#94A3B8" />
              {/* Right Wheel */}
              <rect x="172" y="156" width="15" height="11" rx="4" fill="#1C1917" stroke="#451A03" strokeWidth="1" />
              <circle cx="179.5" cy="161.5" r="3" fill="#94A3B8" />

              {/* 7. Swinging Luggage Destination Tag */}
              <g className="origin-top animate-pulse">
                {/* Twine String from Handle */}
                <path d="M 86 28 C 76 34, 48 46, 44 66" fill="none" stroke="#FEF3C7" strokeWidth="1.8" />
                {/* Hanging Kraft Paper Tag */}
                <g transform="translate(32, 64) rotate(-14)">
                  <polygon points="0,6 6,0 32,0 38,6 38,24 0,24" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.5" />
                  <circle cx="6" cy="12" r="2" fill="#78350F" />
                  <text x="21" y="16" textAnchor="middle" fill="#78350F" fontSize="9" fontWeight="900" fontFamily="monospace">
                    {(targetIata || "ZRH").slice(0, 4).toUpperCase()}
                  </text>
                </g>
              </g>
            </svg>
          </div>

          {/* Under Suitcase Ground Shadow (Animates in sync) */}
          <motion.div
            animate={
              stage === "settle"
                ? { scaleX: [1, 1.15, 0.95, 1.05, 1], opacity: [0.35, 0.25, 0.4, 0.3, 0.35] }
                : stage === "fly"
                ? { scaleX: 0.1, opacity: 0 }
                : { scaleX: 0.8, opacity: 0.2 }
            }
            transition={{ duration: 0.5 }}
            className="w-36 h-3 bg-black/35 rounded-full blur-sm -mt-1"
          />

          {/* Label rides up with the suitcase (no fade-out) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E8E2D5] shadow-sm text-xs sm:text-sm font-bold text-[#1C1917]">
              <Sparkles className="h-3.5 w-3.5 text-[#B45309]" />
              <span>Let&apos;s go{targetCity && targetCity !== "Destination" ? ` to ${targetCity}` : ""}!</span>
            </div>
          </motion.div>
        </motion.div>
    </div>
  );
}
