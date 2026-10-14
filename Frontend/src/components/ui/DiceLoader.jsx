import React, { memo } from 'react';

export const DiceLoader = memo(({ text = "در حال آماده‌سازی میز بازی..." }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 select-none" dir="rtl">
            {/* ظرف تاس انیمیشنی با هاله نور بیرونی */}
            <div className="relative w-20 h-20 flex items-center justify-center">
                {/* هاله نور طلایی پشت تاس */}
                <div className="absolute inset-0 bg-amber-500/25 rounded-full blur-xl animate-pulse" />

                {/* وکتور دقیق تاس D20 */}
                <svg
                    viewBox="0 0 100 115"
                    className="w-16 h-16 relative z-10 drop-shadow-[0_0_12px_rgba(245,158,11,0.65)] animate-[diceRollCycle_2.4s_cubic-bezier(0.45,0.05,0.55,0.95)_infinite]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <polygon
                        points="50,4 96,28 96,86 50,110 4,86 4,28"
                        className="fill-[#14151c] stroke-[#f59e0b] stroke-[4]"
                        strokeLinejoin="round"
                    />

                    <line x1="50" y1="4" x2="50" y2="40" className="stroke-[#f59e0b] stroke-[3]" />
                    <line x1="4" y1="28" x2="25" y2="78" className="stroke-[#f59e0b] stroke-[3]" />
                    <line x1="96" y1="28" x2="75" y2="78" className="stroke-[#f59e0b] stroke-[3]" />
                    <line x1="4" y1="86" x2="25" y2="78" className="stroke-[#f59e0b] stroke-[3]" />
                    <line x1="96" y1="86" x2="75" y2="78" className="stroke-[#f59e0b] stroke-[3]" />
                    <line x1="50" y1="110" x2="50" y2="78" className="stroke-[#f59e0b] stroke-[3]" />

                    <polygon
                        points="50,40 75,78 25,78"
                        className="fill-[#21232e] stroke-[#f59e0b] stroke-[3.5] animate-[facetGlow_2.4s_ease-in-out_infinite]"
                        strokeLinejoin="round"
                    />

                    <circle
                        cx="50"
                        cy="60"
                        r="8"
                        className="fill-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                    />

                    <circle
                        cx="50"
                        cy="60"
                        r="4"
                        className="fill-[#f59e0b]"
                    />
                </svg>
            </div>

            {text && (
                <span className="text-xs font-bold text-zinc-300 font-fa tracking-wide animate-pulse">
                    {text}
                </span>
            )}
        </div>
    );
});

DiceLoader.displayName = "DiceLoader";
export default DiceLoader;