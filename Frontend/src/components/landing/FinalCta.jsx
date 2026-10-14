import React, { memo } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import { sound } from '../../utils/tableAudio';
import { GsapHeadingReveal } from './GsapHeadingReveal';

export const FinalCta = memo(({ onStartGame, onOpenAuth }) => {
    return (
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 text-center w-full relative overflow-hidden" dir="rtl">
            <div className="max-w-4xl mx-auto rounded-3xl bg-neutral-50/80 border border-neutral-200/80 p-8 sm:p-14 shadow-sm relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

                <GsapHeadingReveal
                    eyebrow="شروع آنی بازی"
                    lines={['ماجراجویی بعدی تو،', 'از همین‌جا شروع می‌شود.']}
                    subtitle="بدون پیچیدگی. فقط بازی."
                    headingClassName="text-[34px] sm:text-[50px] md:text-[64px] lg:text-[72px] font-black leading-[1.1] tracking-[-0.03em] text-neutral-950"
                    subtitleClassName="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-600 font-medium"
                />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3.5"
                >
                    <button
                        onClick={() => {
                            sound.playDiceRoll();
                            onStartGame();
                        }}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-black text-sm sm:text-base shadow-[0_10px_25px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.22)] transition-all cursor-pointer group active:scale-95"
                    >
                        <span>شروع بازی</span>
                        <ArrowUpRight className="w-4.5 h-4.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 text-[#f59e0b]" />
                    </button>

                    <button
                        onClick={() => {
                            sound.playTokenClick();
                            onOpenAuth();
                        }}
                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 font-bold text-sm sm:text-base transition-colors cursor-pointer shadow-sm"
                    >
                        <span>ورود به حساب</span>
                        <ArrowLeft className="w-4 h-4 text-neutral-500" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
});

FinalCta.displayName = "FinalCta";
export default FinalCta;