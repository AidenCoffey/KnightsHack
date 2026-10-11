"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface FlightSearchSkyAnimationProps {
  isActive: boolean;
  isReady: boolean;
  onAnimationComplete: () => void;
  originCity?: string;
  originIata?: string;
  destinationCity?: string;
  destinationIata?: string;
  progress?: { checked: number; total: number };
}

// Cute cartoon puffy cloud with multi-bubble curves and soft shadow
function PuffyCloud({
  top,
  scale = 1,
  duration = 14,
  negativeDelay = 0,
  opacity = 0.9,
  zIndex = 10,
}: {
  top: string;
  scale?: number;
  duration?: number;
  negativeDelay?: number;
  opacity?: number;
  zIndex?: number;
}) {
  return (
    <div
      style={{
        top,
        zIndex,
        opacity,
        animation: `skyCloudDrift ${duration}s linear infinite`,
        animationDelay: `-${negativeDelay}s`,
        willChange: "transform",
      }}
      className="absolute pointer-events-none select-none left-0"
    >
      <div style={{ transform: `scale(${scale})` }}>
        <svg
          width="200"
          height="110"
          viewBox="0 0 200 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Soft ambient cloud shadow */}
          <path
            d="M 45 80 Q 20 80 20 62 Q 20 46 38 42 Q 46 20 72 20 Q 90 20 102 32 Q 115 10 148 14 Q 175 18 180 42 Q 195 48 195 64 Q 195 80 172 80 Z"
            fill="#1E40AF"
            opacity="0.12"
            transform="translate(4, 8)"
          />
          {/* Fluffy white cloud body */}
          <path
            d="M 45 80 Q 20 80 20 62 Q 20 46 38 42 Q 46 20 72 20 Q 90 20 102 32 Q 115 10 148 14 Q 175 18 180 42 Q 195 48 195 64 Q 195 80 172 80 Z"
            fill="#FFFFFF"
          />
          {/* Inner highlight puffs */}
          <circle cx="74" cy="40" r="22" fill="#F8FAFC" opacity="0.9" />
          <circle cx="132" cy="36" r="26" fill="#F8FAFC" opacity="0.9" />
          <circle cx="165" cy="54" r="16" fill="#F8FAFC" opacity="0.9" />
        </svg>
      </div>
    </div>
  );
}

// Cute little birds gliding and flapping across the sky
function FlappingBird({
  top,
  scale = 1,
  duration = 10,
  negativeDelay = 0,
}: {
  top: string;
  scale?: number;
  duration?: number;
  negativeDelay?: number;
}) {
  return (
    <div
      style={{
        top,
        animation: `skyBirdDrift ${duration}s linear infinite`,
        animationDelay: `-${negativeDelay}s`,
        willChange: "transform",
      }}
      className="absolute z-15 pointer-events-none select-none left-0"
    >
      <div style={{ transform: `scale(${scale})` }}>
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        >
          <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
            <motion.path
              d="M 2 12 Q 8 2 14 8 Q 20 2 26 12 Q 20 7 14 11 Q 8 7 2 12 Z"
              fill="#0F172A"
              opacity="0.75"
              animate={{
                d: [
                  "M 2 12 Q 8 2 14 8 Q 20 2 26 12 Q 20 7 14 11 Q 8 7 2 12 Z",
                  "M 2 4 Q 8 10 14 8 Q 20 10 26 4 Q 20 8 14 9 Q 8 8 2 4 Z",
                  "M 2 12 Q 8 2 14 8 Q 20 2 26 12 Q 20 7 14 11 Q 8 7 2 12 Z",
                ],
              }}
              transition={{ repeat: Infinity, duration: 0.38, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

// High-speed wind streaks when plane accelerates to exit
function SpeedLines() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-35 pointer-events-none overflow-hidden"
    >
      {[22, 38, 52, 68, 82].map((yPercent, idx) => (
        <motion.div
          key={idx}
          initial={{ x: "100vw", opacity: 0 }}
          animate={{ x: "-60vw", opacity: [0, 0.9, 0] }}
          transition={{
            duration: 0.42,
            delay: idx * 0.04,
            repeat: Infinity,
            ease: "easeIn",
          }}
          style={{ top: `${yPercent}%` }}
          className="absolute h-[2px] w-64 bg-gradient-to-l from-white via-amber-200 to-transparent rounded-full"
        />
      ))}
    </motion.div>
  );
}

// Beautiful, fully-rounded overhead airplane
function RoundedOverheadAirplane({ isExiting }: { isExiting: boolean }) {
  return (
    <div className="relative select-none pointer-events-none">
      {/* Soft Ground/Cloud Shadow with realistic displacement */}
      <motion.div
        animate={
          isExiting
            ? {
                x: 45,
                y: 55,
                opacity: 0.1,
                scale: 1.1,
              }
            : {
                x: [24, 30, 24],
                y: [34, 42, 34],
                scale: [0.93, 0.98, 0.93],
                opacity: [0.18, 0.26, 0.18],
              }
        }
        transition={{
          repeat: isExiting ? 0 : Infinity,
          duration: isExiting ? 0.65 : 2.8,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0"
        style={{ transform: "translate(26px, 36px) scale(0.95)" }}
      >
        <svg width="280" height="200" viewBox="0 0 280 200" fill="none">
          {/* Rounded plane shadow silhouette */}
          <path
            d="M 45 100 
               C 45 92 65 88 100 88 
               L 115 45 C 122 28 142 28 152 45 L 165 88
               L 205 88 C 240 90 245 100 245 100 C 245 100 240 110 205 112
               L 165 112 L 152 155 C 142 172 122 172 115 155 L 100 112
               C 65 112 45 108 45 100 Z"
            fill="#0F172A"
            opacity="0.25"
            style={{ filter: "blur(8px)" }}
          />
        </svg>
      </motion.div>

      {/* Main Rounded Aircraft — Always buoyant, continuously floating */}
      <motion.div
        animate={
          isExiting
            ? {
                rotate: 2.8,
                scale: 1.08,
              }
            : {
                y: [-5, 5, -5],
                rotate: [-1, 1, -1],
                scale: [1, 1.018, 1],
              }
        }
        transition={{
          repeat: isExiting ? 0 : Infinity,
          duration: isExiting ? 0.65 : 2.8,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <svg
          width="280"
          height="200"
          viewBox="0 0 280 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Rich warm amber fuselage gradient */}
            <linearGradient id="planeAmber" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Wing surface gradient */}
            <linearGradient id="planeWing" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="40%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Cockpit glass gloss gradient */}
            <linearGradient id="cockpitGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Rotating propeller disk gradient */}
            <radialGradient id="propDisk" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="65%" stopColor="#CBD5E1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#94A3B8" stopOpacity="0" />
            </radialGradient>

            {/* Aerodynamic vapor contrail trail gradient */}
            <linearGradient id="vaporTrailGrad" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Aerodynamic engine contrail streams */}
          <g opacity={isExiting ? 0.95 : 0.65}>
            <line
              x1="136"
              y1="59.5"
              x2="-60"
              y2="59.5"
              stroke="url(#vaporTrailGrad)"
              strokeWidth={isExiting ? "7" : "4"}
              strokeLinecap="round"
            />
            <line
              x1="136"
              y1="140.5"
              x2="-60"
              y2="140.5"
              stroke="url(#vaporTrailGrad)"
              strokeWidth={isExiting ? "7" : "4"}
              strokeLinecap="round"
            />
          </g>

          {/* Top / Left Rounded Wing with aerodynamic fillets */}
          <path
            d="M 108 88 
               C 112 70 120 40 128 26 
               C 134 16 148 16 154 26 
               C 158 34 162 60 166 88 
               Z"
            fill="url(#planeWing)"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Top Wing Navy Tip Accent */}
          <path
            d="M 129 25 C 134 18 147 18 153 25 L 151 36 L 131 36 Z"
            fill="#0F172A"
          />
          <path d="M 134 38 L 148 38 L 147 44 L 135 44 Z" fill="#0D9488" />

          {/* Bottom / Right Rounded Wing with aerodynamic fillets */}
          <path
            d="M 108 112 
               C 112 130 120 160 128 174 
               C 134 184 148 184 154 174 
               C 158 166 162 140 166 112 
               Z"
            fill="url(#planeWing)"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Bottom Wing Navy Tip Accent */}
          <path
            d="M 129 175 C 134 182 147 182 153 175 L 151 164 L 131 164 Z"
            fill="#0F172A"
          />
          <path d="M 134 162 L 148 162 L 147 156 L 135 156 Z" fill="#0D9488" />

          {/* Rounded Tail Horizontal Stabilizers */}
          <path
            d="M 48 92 C 48 78 56 62 64 62 C 72 62 76 78 78 92 Z"
            fill="#F59E0B"
            stroke="#D97706"
            strokeWidth="1.2"
          />
          <path
            d="M 48 108 C 48 122 56 138 64 138 C 72 138 76 122 78 108 Z"
            fill="#F59E0B"
            stroke="#D97706"
            strokeWidth="1.2"
          />

          {/* Main Fuselage Body (Fully Rounded Capsule & Teardrop) */}
          <path
            d="M 40 100 
               C 40 92 65 84 110 84 
               C 160 84 210 86 230 92 
               C 245 96 245 104 230 108 
               C 210 114 160 116 110 116 
               C 65 116 40 108 40 100 Z"
            fill="url(#planeAmber)"
            stroke="#B45309"
            strokeWidth="1.75"
          />

          {/* Smooth Cream Highlight Stripe along the Fuselage Spine */}
          <path
            d="M 52 98 C 90 96 170 96 220 98 C 224 99 224 101 220 102 C 170 104 90 104 52 102 Z"
            fill="#FEF3C7"
            opacity="0.85"
          />

          {/* Rounded Cockpit Windshield */}
          <path
            d="M 180 94 C 180 94 195 93 205 96 C 212 98 212 102 205 104 C 195 107 180 106 180 106 Z"
            fill="url(#cockpitGlass)"
            stroke="#0F172A"
            strokeWidth="1"
          />
          {/* Cockpit Glass Reflection Glint */}
          <ellipse cx="198" cy="98" rx="8" ry="2.5" fill="#FFFFFF" opacity="0.8" />

          {/* Rounded Vertical Fin Centerline */}
          <path
            d="M 38 100 L 76 100"
            stroke="#0F172A"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 46 100 L 70 100"
            stroke="#FEF3C7"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Rounded Engine Pod (Top Wing) */}
          <g transform="translate(136, 52)">
            <rect x="0" y="0" width="28" height="15" rx="7.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
            <circle cx="28" cy="7.5" r="5" fill="#0D9488" />
            {/* Spinning propeller disk */}
            <ellipse cx="32" cy="7.5" rx="3.5" ry="16" fill="url(#propDisk)" />
            <motion.line
              x1="32"
              y1="-6"
              x2="32"
              y2="21"
              stroke="#FFFFFF"
              strokeWidth="1.75"
              opacity="0.75"
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 0.1, ease: "linear" }}
            />
          </g>

          {/* Rounded Engine Pod (Bottom Wing) */}
          <g transform="translate(136, 133)">
            <rect x="0" y="0" width="28" height="15" rx="7.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
            <circle cx="28" cy="7.5" r="5" fill="#0D9488" />
            {/* Spinning propeller disk */}
            <ellipse cx="32" cy="7.5" rx="3.5" ry="16" fill="url(#propDisk)" />
            <motion.line
              x1="32"
              y1="-6"
              x2="32"
              y2="21"
              stroke="#FFFFFF"
              strokeWidth="1.75"
              opacity="0.75"
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 0.1, ease: "linear" }}
            />
          </g>

          {/* Wingtip glowing navigation lights */}
          <circle cx="142" cy="18" r="3" fill="#EF4444" />
          <circle cx="142" cy="18" r="6" fill="#EF4444" opacity="0.3" />

          <circle cx="142" cy="182" r="3" fill="#10B981" />
          <circle cx="142" cy="182" r="6" fill="#10B981" opacity="0.3" />
        </svg>
      </motion.div>
    </div>
  );
}

export function FlightSearchSkyAnimation({
  isActive,
  isReady,
  onAnimationComplete,
  originCity = "Rome",
  originIata = "FCO",
  destinationCity = "Tokyo",
  destinationIata = "NRT",
  progress = { checked: 0, total: 25 },
}: FlightSearchSkyAnimationProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const [minBufferPassed, setMinBufferPassed] = useState(false);
  const hasTriggeredExitRef = useRef(false);

  const statusMessages = [
    `Charting flight corridors from ${originCity} (${originIata})...`,
    `Scanning 25 regional gateways within your transfer radius...`,
    `Cross-referencing high-speed rail & overland transit...`,
    `Aligning best fares to ${destinationCity} (${destinationIata})...`,
    `Optimal route discovered! Launching expedition deck...`,
  ];

  // Guaranteed 3-second buffer: start on mount
  useEffect(() => {
    if (!isActive) return;
    hasTriggeredExitRef.current = false;
    setMinBufferPassed(false);
    setIsExiting(false);

    // Strictly enforce 3000ms minimum guaranteed cruising buffer
    const bufferTimer = setTimeout(() => {
      setMinBufferPassed(true);
    }, 3000);

    return () => {
      clearTimeout(bufferTimer);
    };
  }, [isActive]);

  // Rotate progress messages
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setStatusMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isActive, statusMessages.length]);

  // When BOTH the 3-second buffer has elapsed AND search is ready, trigger the cinematic fly-off!
  useEffect(() => {
    if (!isActive) return;

    if (minBufferPassed && isReady && !hasTriggeredExitRef.current) {
      hasTriggeredExitRef.current = true;
      setIsExiting(true);

      // Silky exit timing: plane accelerates and completely crosses the right edge before unmount
      const exitTimer = setTimeout(() => {
        onAnimationComplete();
      }, 850);

      return () => clearTimeout(exitTimer);
    }
  }, [minBufferPassed, isReady, isActive, onAnimationComplete]);

  if (!isActive) return null;

  const pct =
    progress.total > 0
      ? Math.min(100, Math.round((progress.checked / progress.total) * 100))
      : 30;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end overflow-hidden select-none h-screen max-h-screen w-screen max-w-full">
      {/* GPU Keyframe definitions for continuous, stutter-free cloud & bird drifts */}
      <style>{`
        @keyframes skyCloudDrift {
          0% { transform: translate3d(115vw, 0, 0); }
          100% { transform: translate3d(-35vw, 0, 0); }
        }
        @keyframes skyBirdDrift {
          0% { transform: translate3d(110vw, 0, 0); }
          100% { transform: translate3d(-25vw, 0, 0); }
        }
      `}</style>

      {/* Dynamic Sky Background with Clouds & Birds (Smoothly dissolves to reveal the map underneath) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isExiting ? 0 : 1,
        }}
        transition={{
          duration: isExiting ? 0.6 : 0.45,
          delay: isExiting ? 0.15 : 0,
          ease: "easeInOut",
        }}
        className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #1E40AF 0%, #2563EB 30%, #3B82F6 65%, #60A5FA 100%)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none w-full h-full">
          {/* Background clouds (distributed across entire screen from frame 0 using negative delays) */}
          <PuffyCloud top="6%" scale={0.75} duration={16} negativeDelay={12} opacity={0.65} zIndex={5} />
          <PuffyCloud top="18%" scale={1.1} duration={12} negativeDelay={7} opacity={0.75} zIndex={5} />
          <PuffyCloud top="36%" scale={0.8} duration={15} negativeDelay={10} opacity={0.6} zIndex={5} />
          <PuffyCloud top="52%" scale={1.2} duration={11} negativeDelay={4} opacity={0.8} zIndex={5} />
          <PuffyCloud top="72%" scale={0.9} duration={14} negativeDelay={1} opacity={0.7} zIndex={5} />

          {/* Foreground fluffy clouds (passing under/around plane) */}
          <PuffyCloud top="12%" scale={1.3} duration={9} negativeDelay={6} opacity={0.95} zIndex={20} />
          <PuffyCloud top="46%" scale={1.4} duration={8} negativeDelay={3} opacity={0.95} zIndex={20} />
          <PuffyCloud top="68%" scale={1.25} duration={10} negativeDelay={1} opacity={0.95} zIndex={20} />

          {/* Flocks of cute flying birds (already populated across sky) */}
          <FlappingBird top="22%" scale={1.1} duration={10} negativeDelay={7} />
          <FlappingBird top="26%" scale={0.85} duration={11} negativeDelay={3} />
          <FlappingBird top="60%" scale={1} duration={9} negativeDelay={5} />
          <FlappingBird top="64%" scale={0.75} duration={9.5} negativeDelay={1} />
          <FlappingBird top="76%" scale={0.9} duration={12} negativeDelay={8} />
        </div>
      </motion.div>

      {/* Center Flight Stage: Overhead Rounded Plane (Full Viewport Width, Zero Side Clipping!) */}
      <div className="absolute inset-0 flex items-center justify-center w-full h-full overflow-hidden z-40 pointer-events-none">
        {/* Speed lines when accelerating during exit */}
        {isExiting && <SpeedLines />}

        <motion.div
          className="relative flex items-center justify-center"
          initial={{ x: "-125vw" }}
          animate={{ x: isExiting ? "125vw" : "0vw" }}
          transition={
            isExiting
              ? {
                  duration: 0.82,
                  ease: [0.35, 0, 0.25, 1], // Jet takeoff acceleration
                }
              : {
                  duration: 0.95,
                  ease: [0.22, 1, 0.36, 1], // Silky, cinematic deceleration into center
                }
          }
        >
          <RoundedOverheadAirplane isExiting={isExiting} />
        </motion.div>
      </div>

      {/* Bottom Status Card: Fades out and slides down cleanly on exit */}
      <motion.footer
        animate={{
          opacity: isExiting ? 0 : 1,
          y: isExiting ? 40 : 0,
        }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative z-30 w-full max-w-md mx-auto px-4 pb-6 sm:pb-8 shrink-0 pointer-events-auto"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-xl shadow-blue-900/15 text-center space-y-3">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="flex items-center gap-2 font-bold text-[#0F172A]">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-ping" />
              <span>Scanning Regional Corridors</span>
            </span>
            <span className="font-mono font-bold text-[#0D9488]">
              {progress.checked > 0 ? `${progress.checked} / ${progress.total || 25}` : "Scanning..."}
            </span>
          </div>

          {/* Smooth Progress Bar with Rounded Capsule */}
          <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden p-0.5 border border-slate-200">
            <motion.div
              className="h-full bg-gradient-to-r from-[#0D9488] via-[#F59E0B] to-[#F59E0B] rounded-full"
              initial={{ width: "20%" }}
              animate={{ width: isReady ? "100%" : `${Math.max(25, pct)}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* Microcopy message */}
          <div className="min-h-[20px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusMessageIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-[#0F172A] font-semibold flex items-center gap-2"
              >
                {minBufferPassed && isReady ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#F59E0B] shrink-0" />
                    <span className="text-[#B45309] font-bold">
                      Route ready — launching interactive map!
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#F59E0B] shrink-0" />
                    <span>{statusMessages[statusMessageIndex]}</span>
                  </>
                )}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
