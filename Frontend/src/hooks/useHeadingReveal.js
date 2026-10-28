import { useEffect, useRef } from 'react';

export function useHeadingReveal(options = {}) {
    const containerRef = useRef(null);

    const {
        lineSelector = '.reveal-line',
        eyebrowSelector = '.reveal-eyebrow',
        subtitleSelector = '.reveal-subtitle',
        stagger = 0.08,
        duration = 0.65,
        delay = 0,
        once = true,
    } = options;

    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof window === 'undefined') return;

        const prefersReducedMotion =
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) return;

        const eyebrow = el.querySelector(eyebrowSelector);
        const lines = Array.from(el.querySelectorAll(lineSelector));
        const subtitle = el.querySelector(subtitleSelector);
        const allTargets = [eyebrow, ...lines, subtitle].filter(Boolean);

        if (allTargets.length === 0) return;

        const baseTransition = `transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1), opacity ${duration}s ease-out`;

        allTargets.forEach((node) => {
            node.style.opacity = '0';
            node.style.transform = 'translate3d(0, 28px, 0)';
        });

        const reveal = () => {
            if (eyebrow) {
                eyebrow.style.transition = baseTransition;
                eyebrow.style.transitionDelay = `${delay}s`;
                eyebrow.style.opacity = '1';
                eyebrow.style.transform = 'translate3d(0, 0, 0)';
            }

            lines.forEach((line, idx) => {
                const lineDelay = delay + (eyebrow ? 0.05 : 0) + idx * stagger;
                line.style.transition = baseTransition;
                line.style.transitionDelay = `${lineDelay}s`;
                line.style.opacity = '1';
                line.style.transform = 'translate3d(0, 0, 0)';
            });

            if (subtitle) {
                const subDelay = delay + (lines.length * stagger) + 0.12;
                subtitle.style.transition = baseTransition;
                subtitle.style.transitionDelay = `${subDelay}s`;
                subtitle.style.opacity = '1';
                subtitle.style.transform = 'translate3d(0, 0, 0)';
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    window.requestAnimationFrame(reveal);
                    if (once) observer.disconnect();
                }
            },
            { threshold: 0.12 }
        );

        observer.observe(el);

        return () => {
            observer.disconnect();
        };
    }, [lineSelector, eyebrowSelector, subtitleSelector, stagger, duration, delay, once]);

    return containerRef;
}