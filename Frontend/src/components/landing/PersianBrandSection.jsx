import React, { memo } from 'react';
import { motion } from 'motion/react';
import { BRAND_PILLARS } from '../../data/landingData';
import { GsapHeadingReveal } from './GsapHeadingReveal';

export const PersianBrandSection = memo(() => {
    return (
        <section className="py-24 sm:py-36 px-4 sm:px-8 overflow-hidden bg-neutral-950 text-white rounded-3xl mx-3 sm:mx-6 my-12" dir="rtl">
            <div className="max-w-5xl mx-auto text-right">
                <GsapHeadingReveal
                    align="right"
                    eyebrow="هویت و زبان مادری · FIRST PERSIAN VTT"
                    eyebrowColor="text-[#f59e0b]"
                    lines={['بالاخره،', 'یک VTT برای فارسی‌زبان‌ها.']}
                    subtitle="رابط فارسی، تجربه ساده و فضایی ساخته‌شده برای بازی‌های نقش‌آفرینی."
                    headingClassName="text-4xl sm:text-6xl md:text-7xl font-black mt-3 tracking-tight leading-[1.1] text-white"
                    subtitleClassName="text-base sm:text-xl text-neutral-400 mt-6 max-w-2xl leading-relaxed"
                />

                <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-14 border-t border-neutral-800 pt-12 sm:pt-16">
                    {BRAND_PILLARS.map((pillar, idx) => (
                        <motion.div
                            key={pillar.id}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-3"
                        >
                            <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-[#f59e0b] font-bold">
                  {`0${idx + 1}.`}
                </span>
                                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                    {pillar.title}
                                </h3>
                            </div>
                            <div className="text-xs font-semibold text-neutral-400">{pillar.subtitle}</div>
                            <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
                                {pillar.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
});

PersianBrandSection.displayName = "PersianBrandSection";
export default PersianBrandSection;