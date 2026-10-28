import api from "../api/axios";

let errorReportCount = 0;
const MAX_REPORTS_PER_SESSION = 5;

export const reportClientCrash = (component, error) => {
    if (typeof window === "undefined" || errorReportCount >= MAX_REPORTS_PER_SESSION) return;
    errorReportCount += 1;

    const payload = {
        component: String(component || "window").slice(0, 100),
        message: String(error?.message || error || "Unknown client error").slice(0, 500),
        stack: String(error?.stack || "").slice(0, 2000),
        url: String(window.location.pathname).slice(0, 300),
    };

    api.post("/monitoring/client-error", payload).catch(() => {});
};

export const initAnalytics = () => {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
        if (event?.error) {
            reportClientCrash("GlobalErrorHandler", event.error);
        }
    });

    if (import.meta.env.DEV) {
        console.info("[Monitoring] Initialized CSP-safe telemetry & crash reporter.");
    }
};

export const trackEvent = (eventName, props = {}) => {
    if (typeof window === "undefined") return;
    if (import.meta.env.DEV) {
        console.debug(`[Telemetry Event]: ${eventName}`, props);
    }
};

export const trackPageView = (url) => {
    if (typeof window === "undefined") return;
    if (import.meta.env.DEV) {
        console.debug(`[Telemetry PageView]: ${url || window.location.pathname}`);
    }
};