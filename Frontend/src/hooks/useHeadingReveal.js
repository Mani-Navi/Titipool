import { useEffect, useRef } from 'react';

export function useHeadingReveal(options = {}) {
    const containerRef = useRef(null);
    const { once = true } = options;

    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof window === 'undefined') return;

        if (
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            el.setAttribute('data-revealed', 'true');
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    el.setAttribute('data-revealed', 'true');
                    if (once) observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);

        return () => {
            observer.disconnect();
        };
    }, [once]);

    return containerRef;
}