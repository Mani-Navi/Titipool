import React, { memo } from 'react';
import { useHeadingReveal } from '../../hooks/useHeadingReveal';

export const GsapHeadingReveal = memo(({
                                           lines = [],
                                           eyebrow,
                                           subtitle,
                                           eyebrowColor = 'text-[#c2410c]',
                                           align = 'center',
                                           headingTag: HeadingTag = 'h2',
                                           headingClassName = 'text-3xl sm:text-5xl md:text-6xl font-black text-neutral-950 mt-2 tracking-tight leading-tight',
                                           containerClassName = '',
                                           subtitleClassName = 'text-base sm:text-lg text-neutral-600 mt-4 leading-relaxed',
                                           gradientLineIndex,
                                           gradientClassName = 'bg-gradient-to-l from-neutral-950 via-neutral-800 to-neutral-700 bg-clip-text text-transparent',
                                           delay = 0,
                                       }) => {
    const containerRef = useHeadingReveal({
        lineSelector: '.reveal-line',
        eyebrowSelector: '.reveal-eyebrow',
        subtitleSelector: '.reveal-subtitle',
        delay,
        yPercent: 130,
        stagger: 0.14,
        duration: 1.05,
        ease: 'power4.out',
        rotateX: 30,
        blur: true,
    });

    const alignmentClass = align === 'center' ? 'text-center mx-auto' : 'text-right';

    return (
        <div
            ref={containerRef}
            className={`relative select-none ${alignmentClass} ${containerClassName}`}
            dir="rtl"
        >
            {eyebrow && (
                <div className="overflow-hidden inline-flex mb-1.5 py-0.5">
                    <span
                        className={`reveal-eyebrow inline-block text-xs font-mono font-bold tracking-widest uppercase ${eyebrowColor} will-change-transform`}
                    >
                        {eyebrow}
                    </span>
                </div>
            )}

            <HeadingTag className={headingClassName}>
                {lines.map((line, index) => {
                    const isGradient = gradientLineIndex === index;
                    return (
                        <span
                            key={index}
                            className="block overflow-hidden py-1 -my-1 [transform-style:preserve-3d] [perspective:1500px]"
                        >
                            <span
                                className={`reveal-line inline-block will-change-transform ${
                                    isGradient ? gradientClassName : ''
                                }`}
                                style={{ textWrap: 'balance' }}
                            >
                                {line}
                            </span>
                        </span>
                    );
                })}
            </HeadingTag>

            {subtitle && (
                <p
                    className={`reveal-subtitle ${subtitleClassName} will-change-transform`}
                    style={{ textWrap: 'balance' }}
                >
                    {subtitle}
                </p>
            )}
        </div>
    );
});

GsapHeadingReveal.displayName = "GsapHeadingReveal";
export default GsapHeadingReveal;