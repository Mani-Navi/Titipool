import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    withCredentials: true, // ضروری جهت ارسال و دریافت کوکی HttpOnly رفرش توکن
    headers: {
        "Content-Type": "application/json",
    },
});

// کش کردن origin سرور داخلی برای اجتناب از بازتولید مکرر آبجکت‌های new URL
let cachedApiOrigin = "";
try {
    if (typeof window !== "undefined") {
        cachedApiOrigin = new URL(API_BASE_URL, window.location.origin).origin;
    }
} catch {
    cachedApiOrigin = "";
}

// بررسی اینکه آیا آدرس مقصد مربوط به API خودمان است یا سرور خارجی (جلوگیری از نشت توکن)
const isInternalApiUrl = (url) => {
    if (!url) return false;
    if (url.startsWith("/")) return true;
    try {
        const targetOrigin = new URL(url, window.location.origin).origin;
        return targetOrigin === cachedApiOrigin;
    } catch {
        return false;
    }
};

// Request Interceptor: خواندن توکن و الصاق به هدر فقط در صورتی که مقصد درخواست داخلی باشد
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("vtt_jwt");
        if (token && isInternalApiUrl(config.url)) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor: مدیریت ۴۰۱ با رفرش توکن و Circuit Breaker
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const url = originalRequest.url || "";
        const isVoiceRequest = url.includes("/voice");
        const isAuthEndpoint =
            url.includes("/auth/login") ||
            url.includes("/auth/register") ||
            url.includes("/auth/google") ||
            url.includes("/auth/refresh");

        if (error.response?.status === 401 && !isVoiceRequest && !isAuthEndpoint) {
            if (originalRequest._retry) {
                localStorage.removeItem("vtt_jwt");
                localStorage.removeItem("vtt_user");
                localStorage.removeItem("token");
                if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const existingToken = localStorage.getItem("vtt_jwt");
                const response = await axios.post(
                    `${API_BASE_URL.replace(/\/+$/, "")}/auth/refresh`,
                    {},
                    {
                        withCredentials: true,
                        headers: existingToken ? { Authorization: `Bearer ${existingToken}` } : {},
                    }
                );

                const newToken = response.data?.accessToken || response.data?.token;

                if (!newToken) {
                    throw new Error("توکن معتبری از پاسخ رفرش دریافت نشد");
                }

                localStorage.setItem("vtt_jwt", newToken);
                if (response.data?.user) {
                    localStorage.setItem("vtt_user", JSON.stringify(response.data.user));
                }

                api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem("vtt_jwt");
                localStorage.removeItem("vtt_user");
                localStorage.removeItem("token");

                if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;