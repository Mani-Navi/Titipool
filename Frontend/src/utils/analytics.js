/**
 * ماژول آنالیتیکس سبک و امن (Cookieless & GDPR Compliant)
 * هماهنگ با بیانیه حفظ حریم خصوصی کاربران Titipool
 */

const IS_PROD = typeof window !== "undefined" && import.meta.env.PROD;
const ANALYTICS_DOMAIN = typeof window !== "undefined"
    ? (import.meta.env.VITE_ANALYTICS_DOMAIN || window.location.hostname)
    : "";

export const initAnalytics = () => {
    if (typeof window === "undefined" || !IS_PROD) return;

    // بارگذاری اسکریپت سبک تحلیل بدون کوکی (Plausible / Self-hosted)
    try {
        const existingScript = document.querySelector('script[data-analytics="vtt-privacy"]');
        if (existingScript) return;

        const script = document.createElement("script");
        script.defer = true;
        script.dataset.analytics = "vtt-privacy";
        script.dataset.domain = ANALYTICS_DOMAIN;
        script.src = "https://plausible.io/js/script.manual.js";

        script.onerror = () => {
            // در صورت فیلتر بودن یا بلاک توسط ادبلاکر، اپلیکیشن بدون ارور به کار خود ادامه می‌دهد
        };

        document.head.appendChild(script);
    } catch {
        // خاموش‌سازی بی‌صدا در محیط‌های فاقد دسترسی به DOM
    }
};

/**
 * ثبت رخدادهای سفارشی سیستم (مثلاً: ثبت‌نام موفق، ساخت اتاق)
 */
export const trackEvent = (eventName, props = {}) => {
    if (typeof window === "undefined" || !IS_PROD) return;

    try {
        if (typeof window.plausible === "function") {
            window.plausible(eventName, { props });
        }
    } catch {
        // بدون ارور در کنسول
    }
};

/**
 * ثبت بازدید صفحات در ساختار SPA
 */
export const trackPageView = (url) => {
    if (typeof window === "undefined" || !IS_PROD) return;

    try {
        if (typeof window.plausible === "function") {
            window.plausible("pageview", {
                u: url || window.location.href,
            });
        }
    } catch {
        // بدون ارور
    }
};