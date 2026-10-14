import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Star, Quote, CheckCircle2, Sparkles, Shield } from 'lucide-react';
import { TESTIMONIALS } from '../../data/landingData';
import { RpgAvatar } from '../profile/RpgAvatar';
import { GsapHeadingReveal } from './GsapHeadingReveal';

export const TestimonialsSection = memo(() => {
    return (
        <section id="testimonials" className="py-20 sm:py-32 px-4 sm:px-8 overflow-hidden w-full relative" dir="rtl">
            {/* هاله نور طلایی محیطی */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[650px] h-96 sm:h-[450px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none transform-gpu" />

            <div className="max-w-6xl mx-auto relative z-10">
                <GsapHeadingReveal
                    eyebrow="تجربه جامعه قهرمانان · ADVENTURERS' GUILD"
                    lines={['روایت ماجراجویانی که', 'دور این میز نشسته‌اند.']}
                    subtitle="نظرات واقعی دانجن‌مسترها و قهرمانانی که جلسات هفتگی نقش‌آفرینی خود را به میز مجازی Titipool منتقل کرده‌اند."
                    containerClassName="max-w-3xl mx-auto mb-12 sm:mb-18 text-center"
                />

                {/* شبکه ۴ ستونه کارت‌های شیشه‌ای */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    {TESTIMONIALS.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="group relative rounded-3xl p-6 sm:p-7 bg-[#0b0d14]/90 hover:bg-[#0f121a] border border-[#202334] hover:border-amber-500/40 transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.08)] flex flex-col justify-between select-none"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            <div className="relative z-10 space-y-4">
                                {/* ردیف بالا: ستاره‌ها و بج موضوعی */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1" aria-label={`امتیاز ۵ از ۵`}>
                                        {Array.from({ length: item.rating }).map((_, sIdx) => (
                                            <Star
                                                key={sIdx}
                                                className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                                                aria-hidden="true"
                                            />
                                        ))}
                                    </div>

                                    <span className="text-[10px] sm:text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25">
                                        {item.tag}
                                    </span>
                                </div>

                                {/* متن نقل‌قول */}
                                <div className="relative">
                                    <Quote className="w-6 h-6 text-amber-500/20 absolute -top-1 -right-2 rotate-180 pointer-events-none" aria-hidden="true" />
                                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal pt-2 pr-4">
                                        «{item.quote}»
                                    </p>
                                </div>
                            </div>

                            {/* فوتر کارت: آواتار RPG، نام کاراکتر فانتزی و عنوان */}
                            <div className="relative z-10 pt-5 mt-4 border-t border-[#1c1f2e] flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-500 shadow-md group-hover:scale-105 transition-transform duration-200">
                                            <RpgAvatar
                                                avatarId={item.avatarId}
                                                className="w-full h-full border border-zinc-950"
                                            />
                                        </div>
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0b0d14] absolute -bottom-0.5 -right-0.5 shadow-sm" aria-hidden="true" />
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                            {item.name}
                                        </h3>
                                        <div className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                                            {item.role} · <span className="text-zinc-500">{item.experience}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-lg shrink-0">
                                    <Shield className="w-3 h-3 text-amber-400" aria-hidden="true" />
                                    <span>{item.badge}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* بنر آمار میزهای ماجراجویی */}
                <div className="mt-10 sm:mt-14 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 shadow-inner">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                        <span>بیش از ۱,۴۰۰ ساعت جلسه ماجراجویی موفق در سراسر کشور</span>
                    </div>
                </div>
            </div>
        </section>
    );
});

TestimonialsSection.displayName = "TestimonialsSection";
export default TestimonialsSection;