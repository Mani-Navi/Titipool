import React, { memo } from 'react';
import { motion } from 'motion/react';
import {
    ArrowDown,
    ArrowUpRight,
    Mic,
    Crown,
    EyeOff,
    Ruler,
    Dices,
    Swords,
    Sparkles,
    Heart,
    Zap,
    Grid,
    Key,
} from 'lucide-react';
import { sound } from '../../utils/tableAudio';
import { GsapHeadingReveal } from './GsapHeadingReveal';

export const Hero = memo(({ onStartGame, onExploreMore, onDiceClick, user }) => {
    const currentUserName = user
        ? (user.displayName || user.username || user.name || (user.email ? user.email.split('@')[0] : null))
        : null;

    const paladinLabel = currentUserName ? `${currentUserName} (پالادین) · AC 18` : 'امیر (پالادین) · AC 18';
    const dmLabel = currentUserName ? `${currentUserName} (DM)` : 'مانی (DM)';
    const casterLabel = currentUserName ? `${currentUserName} · طلسم نور` : 'سارا · طلسم نور';

    return (
        <section id="hero" className="relative pt-3 sm:pt-6 pb-8 sm:pb-16 px-3 sm:px-8 text-center w-full" dir="rtl">
            {/* فعال‌سازی انیمیشن شناور فقط روی دسکتاپ جهت آزادسازی ۳۶ ثانیه توان پردازنده موبایل */}
            <style>{`
                @media (min-width: 768px) {
                    .levitate-a {
                        animation: floatLevitateA 4.5s ease-in-out infinite;
                        will-change: transform;
                    }
                    .levitate-b {
                        animation: floatLevitateB 5.0s ease-in-out infinite;
                        will-change: transform;
                    }
                }
                @keyframes floatLevitateA {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-7px) rotate(0.6deg); }
                }
                @keyframes floatLevitateB {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-6px) rotate(-0.6deg); }
                }
            `}</style>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[700px] h-72 sm:h-[450px] bg-amber-100/50 rounded-full blur-3xl pointer-events-none -z-10 transform-gpu" />

            <GsapHeadingReveal
                eyebrow="Persian Virtual Tabletop"
                eyebrowColor="text-neutral-700 font-bold"
                lines={['میز مجازی', 'برای ماجراجویی‌های بزرگ.']}
                gradientLineIndex={1}
                subtitle="یک میز بازی مجازی فارسی برای ساختن، بازی کردن و تجربه کردن ماجراجویی‌ها."
                headingTag="h1"
                headingClassName="text-[34px] sm:text-[54px] md:text-[76px] lg:text-[88px] font-black leading-[1.08] tracking-[-0.035em] text-neutral-950 max-w-4xl mx-auto mt-2"
                subtitleClassName="mt-3 sm:mt-5 text-sm sm:text-base md:text-lg text-neutral-700 max-w-2xl mx-auto font-medium leading-relaxed px-2"
            />

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-5 sm:mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 px-2"
            >
                <button
                    type="button"
                    onClick={() => {
                        sound.playDiceRoll();
                        onStartGame();
                    }}
                    aria-label="شروع فوری بازی روی میز مجازی"
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-black text-xs sm:text-base shadow-md transition-all cursor-pointer group active:scale-[0.96] min-h-[48px]"
                >
                    <span>شروع بازی</span>
                    <ArrowUpRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 text-[#f59e0b]" aria-hidden="true" />
                </button>

                <button
                    type="button"
                    onClick={() => {
                        sound.playTokenClick();
                        onExploreMore();
                    }}
                    aria-label="مشاهده قابلیت‌های میز بازی"
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-7 py-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-900 font-bold text-xs sm:text-base transition-colors cursor-pointer active:scale-[0.96] min-h-[48px]"
                >
                    <span>بیشتر ببینید</span>
                    <ArrowDown className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-neutral-600" aria-hidden="true" />
                </button>
            </motion.div>

            {/* کهکشان چیپ‌ها */}
            <div className="relative mt-7 sm:mt-12 max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-1 sm:p-4 select-none">
                <div
                    onClick={() => { sound.playCritChime(); onDiceClick(); }}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-black text-xs sm:text-base flex items-center gap-1.5 sm:gap-2.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-a"
                >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Nat 20 Critical!</span>
                </div>

                <div
                    onClick={() => sound.playTokenClick()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-950 border sm:border-2 border-emerald-500/60 text-emerald-300 font-bold text-xs sm:text-base flex items-center gap-2 sm:gap-3 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-b"
                >
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-emerald-500/30 flex items-center justify-center text-xs sm:text-sm">🛡️</div>
                    <span>{paladinLabel}</span>
                </div>

                <div
                    onClick={() => sound.playDiceRoll()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-rose-950 border sm:border-2 border-rose-500/60 text-rose-300 font-bold text-xs sm:text-base flex items-center gap-2 sm:gap-3 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-a"
                >
                    <span className="text-base sm:text-xl">🐉</span>
                    <span>اژدهای سرخ · HP 160</span>
                </div>

                <div
                    onClick={() => sound.playPttBeep(true)}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-950 border sm:border-2 border-emerald-400/60 text-emerald-400 font-bold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-b"
                >
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
                    <span>صدای زنده · Space</span>
                </div>

                <div
                    onClick={() => sound.playTokenClick()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-purple-950 border sm:border-2 border-purple-500/60 text-purple-300 font-bold text-xs sm:text-base flex items-center gap-2 sm:gap-3 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-a"
                >
                    <span className="text-base sm:text-xl">🧙‍♂️</span>
                    <span>{dmLabel}</span>
                    <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </div>

                <div
                    onClick={() => sound.playTokenClick()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-950 border sm:border-2 border-amber-500/60 text-amber-300 font-mono font-black text-xs sm:text-base flex items-center gap-1.5 sm:gap-2.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-b"
                >
                    <Key className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400" />
                    <span>ROOM: 75B4EE</span>
                </div>

                <div
                    onClick={() => sound.playTokenClick()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-fuchsia-950 border sm:border-2 border-fuchsia-500/60 text-fuchsia-300 font-bold text-xs sm:text-base flex items-center gap-2 sm:gap-3 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-a"
                >
                    <span className="text-base sm:text-xl">🔮</span>
                    <span>{casterLabel}</span>
                </div>

                <div
                    onClick={() => sound.playTokenClick()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-950 border sm:border-2 border-yellow-500/60 text-yellow-300 font-mono font-bold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-b"
                >
                    <Ruler className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                    <span>30ft (6 سلول)</span>
                </div>

                <div
                    onClick={() => sound.playTokenClick()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-violet-950 border sm:border-2 border-violet-500/60 text-violet-300 font-bold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-a"
                >
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                    <span>برش مه (Fog)</span>
                </div>

                <div
                    onClick={() => sound.playDiceRoll()}
                    className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-amber-600 to-rose-600 border sm:border-2 border-amber-300 shadow-md flex items-center justify-center text-base sm:text-xl text-white cursor-pointer hover:scale-110 active:scale-95 transition-transform font-bold levitate-b"
                    title="تاس مرمر آتشین"
                >
                    🔥
                </div>

                <div
                    onClick={() => sound.playTokenClick()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-950 border sm:border-2 border-rose-500/60 text-rose-300 font-mono font-black text-xs sm:text-base flex items-center gap-1.5 sm:gap-2.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-a"
                >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 fill-rose-500" />
                    <span>HP 42/48</span>
                </div>

                <div
                    onClick={() => sound.playDiceRoll()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-950 border sm:border-2 border-amber-500/60 text-amber-300 font-mono font-black text-xs sm:text-base flex items-center gap-1.5 sm:gap-2.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-b"
                >
                    <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    <span>1d20+6 = 24</span>
                </div>

                <div
                    onClick={() => sound.playDiceRoll()}
                    className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 border sm:border-2 border-purple-300 shadow-md flex items-center justify-center text-base sm:text-xl text-white cursor-pointer hover:scale-110 active:scale-95 transition-transform font-bold levitate-a"
                    title="تاس مرمر آمیتیست"
                >
                    💎
                </div>

                <div
                    onClick={() => sound.playTokenClick()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-cyan-950 border sm:border-2 border-cyan-500/60 text-cyan-300 font-mono font-bold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-b"
                >
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    <span>Live Sync · 32ms</span>
                </div>

                <div
                    onClick={() => sound.playTokenClick()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-sky-950 border sm:border-2 border-sky-400/60 text-sky-300 font-bold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-a"
                >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                    <span>لمس شفا +15 HP</span>
                </div>

                <div
                    onClick={() => sound.playDiceRoll()}
                    className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-500 border sm:border-2 border-emerald-300 shadow-md flex items-center justify-center text-base sm:text-xl text-white cursor-pointer hover:scale-110 active:scale-95 transition-transform font-bold levitate-b"
                    title="تاس مرمر جنگل"
                >
                    🌲
                </div>

                <div
                    onClick={() => sound.playTokenClick()}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-950 border sm:border-2 border-zinc-700 text-zinc-200 font-bold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform levitate-a"
                >
                    <Grid className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    <span>اسنپ گرید D&D 5e</span>
                </div>

                <div
                    onClick={() => { sound.playDiceRoll(); onDiceClick(); }}
                    className="px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-black text-xs sm:text-base flex items-center gap-1.5 sm:gap-2.5 shadow-md cursor-pointer border sm:border border-amber-300 hover:scale-105 active:scale-95 transition-transform levitate-b"
                >
                    <Dices className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>D12 Polyhedral</span>
                </div>
            </div>
        </section>
    );
});

Hero.displayName = "Hero";
export default Hero;