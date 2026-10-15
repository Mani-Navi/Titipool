import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useHeadingReveal(options = {}) {
    const containerRef = useRef(null);

    const {
        lineSelector = '.reveal-line',
        eyebrowSelector = '.reveal-eyebrow',
        subtitleSelector = '.reveal-subtitle',
        yPercent = 110,
        stagger = 0.08,
        duration = 0.75,
        ease = 'power3.out',
        start = 'top 88%',
        delay = 0,
        once = true,
    } = options;

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) return;

        // مهار امن خطاهای ارزیابی سلکتور DOM
        const safeQuery = (target, selector) => {
            try {
                return typeof selector === 'string' && selector.trim() ? target.querySelector(selector) : null;
            } catch {
                return null;
            }
        };

        const safeQueryAll = (target, selector) => {
            try {
                return typeof selector === 'string' && selector.trim() ? target.querySelectorAll(selector) : [];
            } catch {
                return [];
            }
        };

        const ctx = gsap.context(() => {
            const eyebrow = safeQuery(el, eyebrowSelector);
            const lines = safeQueryAll(el, lineSelector);
            const subtitle = safeQuery(el, subtitleSelector);

            if (!lines.length && !eyebrow && !subtitle) return;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start,
                    once,
                    toggleActions: 'play none none none',
                },
                delay,
            });

            // انیمیشن‌های بهینه شده بدون فیلتر Blur
            if (eyebrow) {
                tl.fromTo(
                    eyebrow,
                    { yPercent: 100, opacity: 0 },
                    { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
                );
            }

            if (lines.length > 0) {
                tl.fromTo(
                    lines,
                    { yPercent, opacity: 0 },
                    { yPercent: 0, opacity: 1, duration, ease, stagger },
                    eyebrow ? '<0.05' : 0
                );
            }

            if (subtitle) {
                tl.fromTo(
                    subtitle,
                    { y: 16, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
                    '<0.15'
                );
            }
        }, el);

        return () => ctx.revert();
    }, [
        lineSelector,
        eyebrowSelector,
        subtitleSelector,
        yPercent,
        stagger,
        duration,
        ease,
        start,
        delay,
        once,
    ]);

    return containerRef;
}