import React, { useState, useEffect, memo } from "react";
import { ArrowUpRight, LogIn } from "lucide-react";
import { sound } from "../../utils/tableAudio";

export const StickyMobileCTA = memo(({ isSessionValid, onStartGame, onLogin }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setIsVisible(window.scrollY > 300);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (isSessionValid || !isVisible) return null;

    return (
        <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/92 backdrop-blur-xl border-t border-zinc-800/90 px-3.5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-fade-in-up"
            dir="rtl"
        >
            <button
                type="button"
                onClick={() => {
                    sound.playTokenClick();
                    onLogin();
                }}
                aria-label="ورود به حساب کاربری"
                className="flex-1 min-h-[48px] py-3 px-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
                <LogIn className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                <span>ورود</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    sound.playDiceRoll();
                    onStartGame();
                }}
                aria-label="شروع رایگان بازی رومیزی"
                className="flex-[2] min-h-[48px] py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/25 border border-amber-400"
            >
                <span>شروع بازی رایگان</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-950 stroke-[2.5]" aria-hidden="true" />
            </button>
        </div>
    );
});

StickyMobileCTA.displayName = "StickyMobileCTA";
export default StickyMobileCTA;