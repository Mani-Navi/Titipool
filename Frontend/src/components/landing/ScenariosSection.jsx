import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, ChevronLeft, ChevronRight, X, ArrowUpRight } from 'lucide-react';
import { sound } from '../../utils/tableAudio';
import { SCENARIOS } from '../../data/landingData';
import { GsapHeadingReveal } from './GsapHeadingReveal';

export const ScenariosSection = memo(({ onSelectScenario }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [inspectedScenario, setInspectedScenario] = useState(null);

    const handleNext = () => {
        sound.playTokenClick();
        setActiveIndex((prev) => (prev + 1) % SCENARIOS.length);
    };

    const handlePrev = () => {
        sound.playTokenClick();
        setActiveIndex((prev) => (prev - 1 + SCENARIOS.length) % SCENARIOS.length);
    };

    return (
        <section id="scenarios" className="py-20 sm:py-32 px-4 sm:px-8 overflow-hidden w-full" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
                    <GsapHeadingReveal
                        align="right"
                        eyebrow="ماجراجویی‌های از پیش‌آماده · PRE-BUILT CAMPAIGNS"
                        lines={['هر ماجراجویی،', 'یک جهان جدید.']}
                        containerClassName="flex-1"
                    />

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="w-12 h-12 rounded-full border border-neutral-300 hover:border-neutral-900 bg-white flex items-center justify-center text-neutral-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            aria-label="مشاهده سناریوی قبلی"
                            title="سناریوی قبلی"
                        >
                            <ChevronRight className="w-5 h-5" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="w-12 h-12 rounded-full border border-neutral-300 hover:border-neutral-900 bg-white flex items-center justify-center text-neutral-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            aria-label="مشاهده سناریوی بعدی"
                            title="سناریوی بعدی"
                        >
                            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <div className="relative min-h-[460px] sm:min-h-[520px] flex items-center justify-center">
                    <div className="flex items-center justify-center gap-4 sm:gap-6 w-full overflow-visible">
                        {SCENARIOS.map((scenario, index) => {
                            const offset = index - activeIndex;
                            const isCenter = offset === 0;

                            return (
                                <motion.div
                                    key={scenario.id}
                                    animate={{
                                        scale: isCenter ? 1.05 : 0.88,
                                        opacity: Math.abs(offset) > 1 ? 0.3 : isCenter ? 1 : 0.65,
                                        y: isCenter ? 0 : 20,
                                    }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    onClick={() => {
                                        sound.playTokenClick();
                                        if (isCenter) {
                                            setInspectedScenario(scenario);
                                        } else {
                                            setActiveIndex(index);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`انتخاب سناریوی ${scenario.title}`}
                                    className={`relative rounded-3xl overflow-hidden cursor-pointer shadow-xl transition-shadow select-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                                        isCenter
                                            ? 'w-[300px] sm:w-[420px] md:w-[480px] h-[440px] sm:h-[480px] ring-2 ring-[#f59e0b]/80 shadow-[0_30px_70px_rgba(0,0,0,0.2)] z-20'
                                            : 'w-[240px] sm:w-[320px] h-[360px] sm:h-[400px] z-10'
                                    }`}
                                >
                                    <img
                                        src={scenario.image}
                                        alt={scenario.title ? `پوستر سناریوی ماجراجویی ${scenario.title}` : "پوستر سناریوی ماجراجویی"}
                                        referrerPolicy="no-referrer"
                                        crossOrigin="anonymous"
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                                    <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-between text-right">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-mono font-bold text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                                {scenario.tag}
                                            </span>
                                            <span className="text-xs font-semibold text-[#f59e0b]">
                                                {scenario.suggestedLevel}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-xs font-medium text-neutral-300">
                                                {scenario.genre}
                                            </span>
                                            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                                                {scenario.title}
                                            </h3>
                                            {isCenter && (
                                                <p className="text-xs sm:text-sm text-neutral-300 mt-2 line-clamp-2 leading-relaxed">
                                                    {scenario.description}
                                                </p>
                                            )}

                                            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                                                <span className="text-xs text-neutral-200">مشاهده مشخصات سناریو</span>
                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white" aria-hidden="true">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {inspectedScenario && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl" role="dialog" aria-modal="true">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setInspectedScenario(null)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
                            aria-hidden="true"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl rounded-3xl bg-[#0d0e14] border border-[#232635] shadow-2xl overflow-hidden z-10 text-right"
                        >
                            <button
                                type="button"
                                onClick={() => setInspectedScenario(null)}
                                className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                aria-label="بستن جزئیات سناریو"
                            >
                                <X className="w-4 h-4" aria-hidden="true" />
                            </button>

                            <div className="relative h-64 sm:h-72">
                                <img
                                    src={inspectedScenario.image}
                                    alt={inspectedScenario.title ? `تصویر تفصیلی سناریوی ${inspectedScenario.title}` : "تصویر سناریوی ماجراجویی"}
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e14] via-transparent to-transparent" />
                                <div className="absolute bottom-4 right-6 text-white">
                                    <span className="text-xs text-[#f59e0b] font-bold">
                                        {inspectedScenario.genre} · {inspectedScenario.suggestedLevel}
                                    </span>
                                    <h3 className="text-2xl sm:text-3xl font-black mt-1">
                                        {inspectedScenario.title}
                                    </h3>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-neutral-400 uppercase">خلاصه ماجرا</h4>
                                    <p className="text-sm text-neutral-200 mt-1 leading-relaxed">
                                        {inspectedScenario.description}
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#141622] border border-[#232738]">
                                    <h4 className="text-xs font-bold text-[#f59e0b]">نکات دانجن‌مستر (DM Notes)</h4>
                                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                                        {inspectedScenario.dmNotes}
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            sound.playDiceRoll();
                                            onSelectScenario(inspectedScenario);
                                            setInspectedScenario(null);
                                        }}
                                        className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#fbbf24] hover:to-[#f59e0b] text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-transform"
                                    >
                                        <Compass className="w-4 h-4" aria-hidden="true" />
                                        <span>بارگذاری این سناریو در اتاق</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
});

ScenariosSection.displayName = "ScenariosSection";
export default ScenariosSection;