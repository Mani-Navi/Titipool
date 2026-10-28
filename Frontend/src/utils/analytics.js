import { ENV } from "../config/validateEnv";

let errorReportCount = 0;
const MAX_REPORTS_PER_SESSION = 3;
const API_BASE = (ENV.API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");

const IGNORED_ERROR_PATTERNS = [
    "ResizeObserver loop",
    "Script error",
    "NetworkError",
    "Failed to fetch",
    "Load failed",
];

export const reportClientCrash = (component, error) => {
    if (typeof window === "undefined" || errorReportCount >= MAX_REPORTS_PER_SESSION) return;

    const msg = String(error?.message || error || "");
    if (!msg || IGNORED_ERROR_PATTERNS.some((pattern) => msg.includes(pattern))) {
        return;
    }

    errorReportCount += 1;

    const token = localStorage.getItem("vtt_jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const payload = JSON.stringify({
        component: String(component || "window").slice(0, 100),
        message: msg.slice(0, 500),
        stack: String(error?.stack || "").slice(0, 1500),
        url: String(window.location.pathname).slice(0, 300),
    });

    try {
        fetch(`${API_BASE}/monitoring/client-error`, {
            method: "POST",
            headers,
            body: payload,
            keepalive: true,
        }).catch(() => {});
    } catch {
        // Silent fail-safe
    }
};

export const initAnalytics = () => {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
        if (event?.error) {
            reportClientCrash("GlobalErrorHandler", event.error);
        }
    });

    if (import.meta.env.DEV) {
        console.info("[Monitoring] Initialized lightweight telemetry.");
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