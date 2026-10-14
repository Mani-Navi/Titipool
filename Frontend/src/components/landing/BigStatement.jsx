import React, { memo } from 'react';
import { GsapHeadingReveal } from './GsapHeadingReveal';

export const BigStatement = memo(() => {
    return (
        <section
            id="statement"
            className="py-10 sm:py-14 md:py-16 px-6 md:px-12 text-center overflow-hidden w-full border-y border-neutral-100 bg-neutral-50/40"
            dir="rtl"
        >
            <div className="max-w-4xl mx-auto">
                <GsapHeadingReveal
                    lines={['بازی کردن', 'نباید پیچیده باشد.']}
                    gradientLineIndex={1}
                    gradientClassName="text-neutral-400"
                    subtitle="همه‌چیز برای شروع یک ماجراجویی، در یک میز مجازی ساده جمع شده است."
                    headingClassName="text-[38px] sm:text-[54px] md:text-[68px] lg:text-[76px] font-black leading-[1.08] tracking-[-0.035em] text-neutral-950"
                    subtitleClassName="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-neutral-600 font-normal leading-relaxed max-w-2xl mx-auto"
                />
            </div>
        </section>
    );
});

BigStatement.displayName = "BigStatement";
export default BigStatement;