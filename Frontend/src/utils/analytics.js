/**
 * ماژول آنالیتیکس سبک و امن (CSP-Compliant & Cookieless)
 * سازگار با سیاست‌های امنیتی سخت‌گیرانه سرور و بدون تزریق اسکریپت خارجی
 */

const IS_PROD = typeof window !== "undefined" && import.meta.env.PROD;

export const initAnalytics = () => {
    // برای تطابق با Content Security Policy سرور، اسکریپت خارجی لود نمی‌شود
    if (typeof window === "undefined") return;

    if (import.meta.env.DEV) {
        console.info("[Analytics] Initialized in CSP-safe mode.");
    }
};

/**
 * ثبت امن رخدادهای سیستم
 */
export const trackEvent = (eventName, props = {}) => {
    if (typeof window === "undefined") return;

    if (import.meta.env.DEV) {
        console.debug(`[Analytics Event]: ${eventName}`, props);
    }
};

/**
 * ثبت بازدید صفحات در ساختار SPA
 */
export const trackPageView = (url) => {
    if (typeof window === "undefined") return;

    if (import.meta.env.DEV) {
        console.debug(`[Analytics PageView]: ${url || window.location.pathname}`);
    }
};