import React, { useState, memo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UserPlus, Castle, Play } from 'lucide-react';
import { sound } from '../../utils/tableAudio';
import { HOW_IT_WORKS_STEPS } from '../../data/landingData';
import { GsapHeadingReveal } from './GsapHeadingReveal';

const STEP_ICONS = Object.freeze([UserPlus, Castle, Play]);

export const HowItWorks = memo(({ onStartGame }) => {
    const [activeStep, setActiveStep] = useState(0);

    return (
        <section id="how-it-works" className="py-20 sm:py-32 px-4 sm:px-8 overflow-hidden" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <GsapHeadingReveal
                    eyebrow="شروع سریع · GETTING STARTED"
                    lines={['شروع بازی،', 'ساده است.']}
                    subtitle="بدون نصب کلاینت سنگین، بدون تنظیمات پورت شبکه. فقط مرورگر را باز کنید."
                    containerClassName="max-w-2xl mx-auto mb-14 sm:mb-20"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {HOW_IT_WORKS_STEPS.map((step, idx) => {
                        const Icon = STEP_ICONS[idx];
                        const isSelected = activeStep === idx;

                        return (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                                onClick={() => {
                                    sound.playTokenClick();
                                    setActiveStep(idx);
                                }}
                                className={`relative rounded-3xl p-6 sm:p-8 transition-all duration-300 cursor-pointer text-right flex flex-col justify-between min-h-[320px] ${
                                    isSelected
                                        ? 'bg-neutral-950 text-white shadow-[0_25px_60px_rgba(0,0,0,0.18)] scale-[1.02]'
                                        : 'bg-white hover:bg-neutral-50/80 border border-neutral-200 text-neutral-900 shadow-sm'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                    <span
                        className={`font-mono text-3xl sm:text-4xl font-black ${
                            isSelected ? 'text-[#f59e0b]' : 'text-neutral-300'
                        }`}
                    >
                      {step.number}
                    </span>

                                        <div
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                                isSelected
                                                    ? 'bg-[#1e1709] border border-[#f59e0b]/50 text-[#f59e0b]'
                                                    : 'bg-neutral-100 text-neutral-700'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <h3
                                        className={`text-xl sm:text-2xl font-black tracking-tight ${
                                            isSelected ? 'text-white' : 'text-neutral-950'
                                        }`}
                                    >
                                        {step.title}
                                    </h3>
                                    <div
                                        className={`text-sm font-semibold mt-1 ${
                                            isSelected ? 'text-[#f59e0b]' : 'text-neutral-500'
                                        }`}
                                    >
                                        "{step.short}"
                                    </div>

                                    <p
                                        className={`text-xs sm:text-sm mt-3 leading-relaxed ${
                                            isSelected ? 'text-neutral-300' : 'text-neutral-600'
                                        }`}
                                    >
                                        {step.description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-neutral-200/20 flex items-center justify-between text-xs">
                  <span
                      className={`font-medium ${
                          isSelected ? 'text-neutral-400' : 'text-neutral-500'
                      }`}
                  >
                    {step.tag}
                  </span>
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                            isSelected ? 'bg-white/10 text-white' : 'bg-neutral-100 text-neutral-700'
                                        }`}
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => {
                            sound.playDiceRoll();
                            onStartGame();
                        }}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#fbbf24] hover:to-[#f59e0b] text-neutral-950 font-black text-sm shadow-[0_10px_30px_rgba(245,158,11,0.25)] transition-all cursor-pointer active:scale-95"
                    >
                        <span>همین حالا شروع کنید — بدون نیاز به نصب</span>
                        <span>←</span>
                    </button>
                </div>
            </div>
        </section>
    );
});

HowItWorks.displayName = "HowItWorks";
export default HowItWorks;
